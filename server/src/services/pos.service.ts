import { prisma } from '../config/prisma';
import { calculateRoundOff, round } from '../utils/decimal';
import { logAudit } from './audit.service';
import bcrypt from 'bcryptjs';

export class POSService {
  static async holdSale(data: {
    referenceNote?: string;
    customerId?: string;
    items: any[];
    subtotal: number;
    discount?: number;
    tax?: number;
    total: number;
    cashierId: string;
  }) {
    return prisma.heldSale.create({
      data: {
        referenceNote: data.referenceNote || `Held-${new Date().toLocaleTimeString()}`,
        cashierId: data.cashierId,
        customerId: data.customerId || null,
        itemsJson: JSON.stringify(data.items),
        subtotal: data.subtotal,
        discount: data.discount || 0,
        tax: data.tax || 0,
        total: data.total,
        status: 'HELD',
      },
    });
  }

  static async getHeldSales(cashierId?: string) {
    const where: any = { status: 'HELD' };
    if (cashierId) {
      where.cashierId = cashierId;
    }

    const held = await prisma.heldSale.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        cashier: { select: { id: true, fullName: true } },
      },
      orderBy: { heldAt: 'desc' },
    });

    return held.map((h) => ({
      ...h,
      items: JSON.parse(h.itemsJson),
    }));
  }

  static async deleteHeldSale(id: string) {
    return prisma.heldSale.delete({ where: { id } });
  }

  static async checkout(data: {
    idempotencyKey?: string;
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    items: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
      costPrice: number;
      discountType?: string;
      discountValue?: number;
      discountAmount?: number;
      taxRate?: number;
      taxAmount?: number;
      cgstAmount?: number;
      sgstAmount?: number;
      igstAmount?: number;
      lineTotal: number;
      batchNumber?: string;
    }>;
    subtotal: number;
    itemDiscountTotal?: number;
    invoiceDiscountTotal?: number;
    invoiceDiscountType?: string;
    discountTotal?: number;
    taxTotal?: number;
    cgstTotal?: number;
    sgstTotal?: number;
    igstTotal?: number;
    roundOff?: number;
    grandTotal: number;
    amountPaid: number;
    balanceDue?: number;
    changeReturned?: number;
    payments: Array<{
      amount: number;
      paymentMethod: string;
      transactionRef?: string;
      notes?: string;
    }>;
    notes?: string;
    heldSaleId?: string;
    managerPin?: string;
    cashierId: string;
    cashierName: string;
    cashierRole: string;
  }) {
    // 1. Check idempotency key to prevent double checkout
    if (data.idempotencyKey) {
      const existingInvoice = await prisma.invoice.findUnique({
        where: { idempotencyKey: data.idempotencyKey },
        include: { items: true, payments: true },
      });
      if (existingInvoice) {
        return existingInvoice;
      }
    }

    // 2. Fetch Store settings
    const store = await prisma.store.findFirst();
    const allowNegativeStock = store?.allowNegativeStock ?? false;
    const maxCashierDiscount = store?.maxCashierDiscount ? Number(store.maxCashierDiscount) : 10;

    // 3. Check discount permission if invoice discount exceeds allowed limit
    const invoiceDiscountPercent =
      data.subtotal > 0 && (data.discountTotal || 0) > 0
        ? ((data.discountTotal || 0) / data.subtotal) * 100
        : 0;

    if (invoiceDiscountPercent > maxCashierDiscount && data.cashierRole !== 'ADMIN') {
      if (!data.managerPin) {
        throw {
          statusCode: 403,
          message: `Discount of ${round(invoiceDiscountPercent, 1)}% exceeds cashier limit of ${maxCashierDiscount}%. Manager PIN required.`,
          isOperational: true,
        };
      }

      // Verify manager PIN
      const managers = await prisma.user.findMany({
        where: { role: 'ADMIN', isActive: true, managerPin: { not: null } },
      });
      let verified = false;
      for (const m of managers) {
        if (m.managerPin && (await bcrypt.compare(data.managerPin, m.managerPin))) {
          verified = true;
          break;
        }
      }
      if (!verified) {
        throw { statusCode: 401, message: 'Invalid manager PIN for discount approval', isOperational: true };
      }
    }

    // 4. Generate unique invoice number: SM-YYYYMMDD-XXXX
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const countToday = await prisma.invoice.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    });
    const seq = (countToday + 1).toString().padStart(4, '0');
    const invoiceNumber = `${store?.invoicePrefix || 'SM-'}${todayStr}-${seq}`;

    // 5. Execute atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      // Step A: Stock validation & product snapshot loading
      const productMap: Record<string, any> = {};

      for (const item of data.items) {
        const prod = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!prod || prod.isDeleted || !prod.isActive) {
          throw {
            statusCode: 400,
            message: `Product ${prod?.name || item.productId} is unavailable or discontinued`,
            isOperational: true,
          };
        }

        if (!allowNegativeStock && prod.currentStock < item.quantity) {
          throw {
            statusCode: 400,
            message: `Insufficient stock for '${prod.name}'. In stock: ${prod.currentStock}, Requested: ${item.quantity}`,
            isOperational: true,
          };
        }

        productMap[item.productId] = prod;
      }

      // Step B: Calculate accurate round-off
      const { roundedTotal, roundOffAmount } = calculateRoundOff(data.grandTotal);

      // Step C: Create Invoice
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          cashierId: data.cashierId,
          customerId: data.customerId || null,
          customerName: data.customerName || (data.customerId ? undefined : 'Walk-in Customer'),
          customerPhone: data.customerPhone || null,
          subtotal: data.subtotal,
          itemDiscountTotal: data.itemDiscountTotal || 0,
          invoiceDiscountTotal: data.invoiceDiscountTotal || 0,
          invoiceDiscountType: data.invoiceDiscountType || 'NONE',
          discountTotal: data.discountTotal || 0,
          taxTotal: data.taxTotal || 0,
          cgstTotal: data.cgstTotal || 0,
          sgstTotal: data.sgstTotal || 0,
          igstTotal: data.igstTotal || 0,
          roundOff: roundOffAmount,
          grandTotal: roundedTotal,
          amountPaid: data.amountPaid,
          balanceDue: data.balanceDue || 0,
          changeReturned: data.changeReturned || 0,
          paymentStatus: (data.balanceDue || 0) > 0 ? 'PARTIALLY_PAID' : 'PAID',
          pricingMode: store?.pricingMode || 'INCLUSIVE',
          notes: data.notes || null,
          idempotencyKey: data.idempotencyKey || null,
          status: 'COMPLETED',
        },
      });

      // Step D: Create Invoice Items & Atomic Stock Reduction with Ledger Movements
      let totalCashReceived = 0;

      for (const item of data.items) {
        const prod = productMap[item.productId];

        await tx.invoiceItem.create({
          data: {
            invoiceId: invoice.id,
            productId: item.productId,
            productName: prod.name, // Snapshot
            sku: prod.sku, // Snapshot
            barcode: prod.barcode, // Snapshot
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            costPrice: prod.costPrice, // Snapshot
            discountType: item.discountType || 'NONE',
            discountValue: item.discountValue || 0,
            discountAmount: item.discountAmount || 0,
            taxRate: item.taxRate || prod.taxRate,
            taxAmount: item.taxAmount || 0,
            cgstAmount: item.cgstAmount || 0,
            sgstAmount: item.sgstAmount || 0,
            igstAmount: item.igstAmount || 0,
            lineTotal: item.lineTotal,
            batchNumber: item.batchNumber || prod.batchNumber || null,
          },
        });

        // Atomic stock decrement
        const previousQuantity = prod.currentStock;
        const newQuantity = previousQuantity - item.quantity;

        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: newQuantity },
        });

        // Record stock movement
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            previousQuantity,
            quantityChanged: -item.quantity,
            newQuantity,
            movementType: 'SALE',
            reason: `POS Sale Invoice ${invoiceNumber}`,
            referenceId: invoice.id,
            referenceType: 'INVOICE',
            userId: data.cashierId,
          },
        });
      }

      // Step E: Create Payments
      for (const pay of data.payments) {
        await tx.payment.create({
          data: {
            invoiceId: invoice.id,
            amount: pay.amount,
            paymentMethod: pay.paymentMethod,
            transactionRef: pay.transactionRef || null,
            notes: pay.notes || null,
          },
        });

        if (pay.paymentMethod === 'CASH') {
          totalCashReceived += (pay.amount - (data.changeReturned || 0));
        }

        // If Credit sale, update customer outstanding balance
        if (pay.paymentMethod === 'CREDIT' && data.customerId) {
          await tx.customer.update({
            where: { id: data.customerId },
            data: {
              outstandingBalance: {
                increment: pay.amount,
              },
            },
          });
        }
      }

      // Step F: Update Cashier Shift if one is open
      const activeShift = await tx.cashierShift.findFirst({
        where: { cashierId: data.cashierId, status: 'OPEN' },
      });

      if (activeShift && totalCashReceived > 0) {
        await tx.cashierShift.update({
          where: { id: activeShift.id },
          data: {
            totalCashSales: { increment: totalCashReceived },
            expectedCash: { increment: totalCashReceived },
          },
        });
      }

      // Step G: Remove held sale if this sale was resumed
      if (data.heldSaleId) {
        await tx.heldSale.delete({
          where: { id: data.heldSaleId },
        }).catch(() => null);
      }

      // Return fully hydrated invoice
      return tx.invoice.findUnique({
        where: { id: invoice.id },
        include: {
          items: true,
          payments: true,
          cashier: { select: { id: true, fullName: true } },
          customer: { select: { id: true, name: true, phone: true } },
        },
      });
    }, { timeout: 20000, maxWait: 10000 });

    // Non-blocking Audit Log outside transaction
    logAudit({
      userId: data.cashierId,
      userName: data.cashierName,
      userRole: data.cashierRole,
      action: 'CHECKOUT_COMPLETED',
      entity: 'Invoice',
      entityId: result?.id,
      newValues: { invoiceNumber: result?.invoiceNumber, total: result?.grandTotal, items: data.items.length },
    }).catch(() => null);

    return result;
  }
}
