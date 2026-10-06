import { describe, it, expect, beforeAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/prisma';

let adminToken: string;
let cashierToken: string;
let testProduct: any;

describe('SmartMart POS Core API & Workflows', () => {
  beforeAll(async () => {
    // 1. Admin login
    const adminRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@smartmart.com', password: 'Password@123' });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.data.token;

    // 2. Cashier login
    const cashierRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'cashier@smartmart.com', password: 'Password@123' });
    expect(cashierRes.status).toBe(200);
    cashierToken = cashierRes.body.data.token;

    // 3. Find test product (Atta or Oil)
    testProduct = await prisma.product.findFirst({
      where: { barcode: '8901030383792' },
    });
  });

  it('enforces RBAC: Cashier cannot access admin user management routes', async () => {
    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${cashierToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Forbidden');
  });

  it('allows Admin to access user management', async () => {
    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('allows fast barcode search for POS scanner', async () => {
    const res = await request(app)
      .get(`/api/v1/products/barcode/${testProduct.barcode}`)
      .set('Authorization', `Bearer ${cashierToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe(testProduct.name);
    expect(res.body.data.barcode).toBe(testProduct.barcode);
  });

  it('executes atomic checkout and decrements stock exactly once', async () => {
    const initialStock = testProduct.currentStock;
    const checkoutQty = 2;
    const lineTotal = testProduct.sellingPrice * checkoutQty;

    const checkoutPayload = {
      items: [
        {
          productId: testProduct.id,
          quantity: checkoutQty,
          unitPrice: testProduct.sellingPrice,
          costPrice: testProduct.costPrice,
          taxRate: testProduct.taxRate,
          lineTotal,
        },
      ],
      subtotal: lineTotal,
      discountTotal: 0,
      taxTotal: 0,
      grandTotal: lineTotal,
      amountPaid: lineTotal,
      balanceDue: 0,
      changeReturned: 0,
      payments: [
        {
          amount: lineTotal,
          paymentMethod: 'CASH',
        },
      ],
    };

    const res = await request(app)
      .post('/api/v1/pos/checkout')
      .set('Authorization', `Bearer ${cashierToken}`)
      .send(checkoutPayload);

    expect(res.status).toBe(201);
    expect(res.body.data.invoiceNumber).toBeDefined();

    // Verify stock in database was reduced exactly by checkoutQty
    const updatedProd = await prisma.product.findUnique({ where: { id: testProduct.id } });
    expect(updatedProd?.currentStock).toBe(initialStock - checkoutQty);

    // Verify stock movement ledger entry exists
    const movement = await prisma.stockMovement.findFirst({
      where: {
        productId: testProduct.id,
        referenceId: res.body.data.id,
      },
    });
    expect(movement).toBeDefined();
    expect(movement?.movementType).toBe('SALE');
    expect(movement?.quantityChanged).toBe(-checkoutQty);
  });

  it('prevents checkout when requested quantity exceeds available stock', async () => {
    const currentProd = await prisma.product.findUnique({ where: { id: testProduct.id } });
    const excessiveQty = (currentProd?.currentStock || 0) + 1000;

    const payload = {
      items: [
        {
          productId: testProduct.id,
          quantity: excessiveQty,
          unitPrice: testProduct.sellingPrice,
          costPrice: testProduct.costPrice,
          taxRate: 0,
          lineTotal: testProduct.sellingPrice * excessiveQty,
        },
      ],
      subtotal: testProduct.sellingPrice * excessiveQty,
      grandTotal: testProduct.sellingPrice * excessiveQty,
      amountPaid: testProduct.sellingPrice * excessiveQty,
      payments: [{ amount: testProduct.sellingPrice * excessiveQty, paymentMethod: 'CASH' }],
    };

    const res = await request(app)
      .post('/api/v1/pos/checkout')
      .set('Authorization', `Bearer ${cashierToken}`)
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Insufficient stock');
  });

  it('handles split payment (e.g. Cash + UPI)', async () => {
    const payload = {
      items: [
        {
          productId: testProduct.id,
          quantity: 1,
          unitPrice: testProduct.sellingPrice,
          costPrice: testProduct.costPrice,
          taxRate: 0,
          lineTotal: testProduct.sellingPrice,
        },
      ],
      subtotal: testProduct.sellingPrice,
      grandTotal: testProduct.sellingPrice,
      amountPaid: testProduct.sellingPrice,
      payments: [
        { amount: 100, paymentMethod: 'CASH' },
        { amount: testProduct.sellingPrice - 100, paymentMethod: 'UPI', transactionRef: 'UPI12345678' },
      ],
    };

    const res = await request(app)
      .post('/api/v1/pos/checkout')
      .set('Authorization', `Bearer ${cashierToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.data.payments.length).toBe(2);
  });

  it('enforces idempotency key: duplicate checkout request returns existing invoice without deducting stock again', async () => {
    const prodBefore = await prisma.product.findUnique({ where: { id: testProduct.id } });
    const stockBefore = prodBefore!.currentStock;
    const idempotencyKey = randomUUID();

    const payload = {
      idempotencyKey,
      items: [
        {
          productId: testProduct.id,
          quantity: 1,
          unitPrice: testProduct.sellingPrice,
          costPrice: testProduct.costPrice,
          taxRate: 0,
          lineTotal: testProduct.sellingPrice,
        },
      ],
      subtotal: testProduct.sellingPrice,
      grandTotal: testProduct.sellingPrice,
      amountPaid: testProduct.sellingPrice,
      payments: [{ amount: testProduct.sellingPrice, paymentMethod: 'CASH' }],
    };

    // First request
    const res1 = await request(app)
      .post('/api/v1/pos/checkout')
      .set('Authorization', `Bearer ${cashierToken}`)
      .send(payload);

    expect(res1.status).toBe(201);
    const invoiceNumber = res1.body.data.invoiceNumber;

    // Second request with exact same idempotency key
    const res2 = await request(app)
      .post('/api/v1/pos/checkout')
      .set('Authorization', `Bearer ${cashierToken}`)
      .send(payload);

    expect(res2.status).toBe(201);
    expect(res2.body.data.invoiceNumber).toBe(invoiceNumber);

    // Stock should be reduced only ONCE (by 1, not 2)
    const prodAfter = await prisma.product.findUnique({ where: { id: testProduct.id } });
    expect(prodAfter!.currentStock).toBe(stockBefore - 1);
  });

  it('preserves historical invoice snapshot when product price is updated later', async () => {
    // 1. Create a sale at current price
    const originalPrice = testProduct.sellingPrice;
    const payload = {
      items: [
        {
          productId: testProduct.id,
          quantity: 1,
          unitPrice: originalPrice,
          costPrice: testProduct.costPrice,
          taxRate: 0,
          lineTotal: originalPrice,
        },
      ],
      subtotal: originalPrice,
      grandTotal: originalPrice,
      amountPaid: originalPrice,
      payments: [{ amount: originalPrice, paymentMethod: 'CASH' }],
    };

    const checkoutRes = await request(app)
      .post('/api/v1/pos/checkout')
      .set('Authorization', `Bearer ${cashierToken}`)
      .send(payload);

    const invoiceId = checkoutRes.body.data.id;

    // 2. Admin later edits the product price
    const newPrice = originalPrice + 100;
    await request(app)
      .put(`/api/v1/products/${testProduct.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ sellingPrice: newPrice });

    // 3. Fetch past invoice and verify its line price and total are UNTOUCHED
    const invoiceRes = await request(app)
      .get(`/api/v1/invoices/${invoiceId}`)
      .set('Authorization', `Bearer ${cashierToken}`);

    expect(invoiceRes.status).toBe(200);
    const pastItem = invoiceRes.body.data.invoice.items[0];
    expect(pastItem.unitPrice).toBe(originalPrice);
    expect(invoiceRes.body.data.invoice.grandTotal).toBe(originalPrice);
  });
});
