import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from './store/cartStore';
import { Product } from './types';

const mockProduct: Product = {
  id: 'prod-test-01',
  name: 'Aashirvaad Atta 5kg',
  barcode: '8901030383792',
  sku: 'GROC-ATT-001',
  unitType: 'PACKET',
  sellingPrice: 255.0,
  costPrice: 210.0,
  taxRate: 5.0,
  isDiscountEligible: true,
  currentStock: 50.0,
  minStockLevel: 10.0,
  categoryId: 'cat-01',
  isActive: true,
  isDeleted: false,
};

describe('POS Cart Store & Calculations', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it('adds product to cart and updates line totals', () => {
    const store = useCartStore.getState();
    const res = store.addItem(mockProduct, 2);

    expect(res.success).toBe(true);
    const updated = useCartStore.getState();
    expect(updated.items.length).toBe(1);
    expect(updated.items[0].quantity).toBe(2);
    expect(updated.items[0].unitPrice).toBe(255.0);
    expect(updated.items[0].lineTotal).toBe(510.0);
  });

  it('prevents adding quantity exceeding available stock', () => {
    const store = useCartStore.getState();
    const res = store.addItem(mockProduct, 100); // Only 50 in stock

    expect(res.success).toBe(false);
    expect(res.message).toContain('Only 50 units available');
  });

  it('calculates invoice level percentage discount accurately', () => {
    const store = useCartStore.getState();
    store.addItem(mockProduct, 2); // 510.00
    store.setInvoiceDiscount('PERCENTAGE', 10); // 10% discount = 51.00

    const totals = useCartStore.getState().getTotals();
    expect(totals.subtotal).toBe(510.0);
    expect(totals.invoiceDiscountTotal).toBe(51.0);
    expect(totals.grandTotal).toBe(459.0);
  });

  it('calculates round-off accurately to nearest rupee', () => {
    const oddProduct: Product = {
      ...mockProduct,
      id: 'odd-prod',
      sellingPrice: 49.33,
      taxRate: 0,
      currentStock: 10,
    };

    const store = useCartStore.getState();
    store.addItem(oddProduct, 1);

    const totals = useCartStore.getState().getTotals();
    expect(totals.subtotal).toBe(49.33);
    expect(totals.grandTotal).toBe(49.0); // Rounded to 49
    expect(totals.roundOff).toBe(-0.33);
  });
});
