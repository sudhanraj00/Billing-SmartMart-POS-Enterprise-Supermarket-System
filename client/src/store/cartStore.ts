import { create } from 'zustand';
import { Product, Customer, CartItem } from '../types';

interface CartState {
  items: CartItem[];
  customer: Customer | null;
  pricingMode: 'INCLUSIVE' | 'EXCLUSIVE';
  invoiceDiscountType: 'NONE' | 'PERCENTAGE' | 'FIXED';
  invoiceDiscountValue: number;
  heldSaleId: string | null;

  // Actions
  addItem: (product: Product, quantity?: number) => { success: boolean; message?: string };
  updateItemQuantity: (productId: string, quantity: number) => { success: boolean; message?: string };
  updateItemDiscount: (productId: string, discountType: 'NONE' | 'PERCENTAGE' | 'FIXED', value: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  setCustomer: (customer: Customer | null) => void;
  setInvoiceDiscount: (type: 'NONE' | 'PERCENTAGE' | 'FIXED', value: number) => void;
  setPricingMode: (mode: 'INCLUSIVE' | 'EXCLUSIVE') => void;
  loadHeldCart: (heldCart: { id: string; items: CartItem[]; customer?: Customer | null }) => void;

  // Computed totals
  getTotals: () => {
    subtotal: number;
    itemDiscountTotal: number;
    invoiceDiscountTotal: number;
    discountTotal: number;
    taxTotal: number;
    cgstTotal: number;
    sgstTotal: number;
    igstTotal: number;
    roundOff: number;
    grandTotal: number;
    itemCount: number;
  };
}

function calculateItemAmounts(
  product: Product,
  quantity: number,
  discountType: 'NONE' | 'PERCENTAGE' | 'FIXED',
  discountValue: number,
  pricingMode: 'INCLUSIVE' | 'EXCLUSIVE'
) {
  const gross = product.sellingPrice * quantity;
  let discountAmount = 0;

  if (discountType === 'PERCENTAGE') {
    discountAmount = Math.round((gross * (discountValue / 100)) * 100) / 100;
  } else if (discountType === 'FIXED') {
    discountAmount = Math.min(gross, discountValue);
  }

  const net = Math.max(0, gross - discountAmount);
  const rate = product.taxRate || 0;

  let taxAmount = 0;
  let lineTotal = 0;

  if (pricingMode === 'INCLUSIVE') {
    if (rate > 0) {
      const taxable = net / (1 + rate / 100);
      taxAmount = Math.round((net - taxable) * 100) / 100;
    }
    lineTotal = Math.round(net * 100) / 100;
  } else {
    taxAmount = Math.round((net * (rate / 100)) * 100) / 100;
    lineTotal = Math.round((net + taxAmount) * 100) / 100;
  }

  const cgstAmount = Math.round((taxAmount / 2) * 100) / 100;
  const sgstAmount = Math.round((taxAmount - cgstAmount) * 100) / 100;

  return {
    discountAmount,
    taxAmount,
    cgstAmount,
    sgstAmount,
    igstAmount: 0,
    lineTotal,
  };
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customer: null,
  pricingMode: 'INCLUSIVE',
  invoiceDiscountType: 'NONE',
  invoiceDiscountValue: 0,
  heldSaleId: null,

  addItem: (product: Product, quantity = 1) => {
    const { items, pricingMode } = get();
    const existingIndex = items.findIndex((i) => i.product.id === product.id);

    const currentQtyInCart = existingIndex >= 0 ? items[existingIndex].quantity : 0;
    const requestedTotalQty = currentQtyInCart + quantity;

    if (product.currentStock < requestedTotalQty) {
      return {
        success: false,
        message: `Only ${product.currentStock} units available for '${product.name}'`,
      };
    }

    if (existingIndex >= 0) {
      const updated = [...items];
      const existing = updated[existingIndex];
      const newQty = existing.quantity + quantity;
      const amounts = calculateItemAmounts(
        product,
        newQty,
        existing.discountType,
        existing.discountValue,
        pricingMode
      );

      updated[existingIndex] = {
        ...existing,
        quantity: newQty,
        ...amounts,
      };
      set({ items: updated });
    } else {
      const amounts = calculateItemAmounts(product, quantity, 'NONE', 0, pricingMode);
      const newItem: CartItem = {
        product,
        quantity,
        unitPrice: product.sellingPrice,
        discountType: 'NONE',
        discountValue: 0,
        taxRate: product.taxRate || 0,
        ...amounts,
      };
      set({ items: [newItem, ...items] });
    }

    return { success: true };
  },

  updateItemQuantity: (productId: string, quantity: number) => {
    const { items, pricingMode } = get();
    const item = items.find((i) => i.product.id === productId);
    if (!item) return { success: false, message: 'Item not found in cart' };

    if (quantity <= 0) {
      set({ items: items.filter((i) => i.product.id !== productId) });
      return { success: true };
    }

    if (item.product.currentStock < quantity) {
      return {
        success: false,
        message: `Available stock is ${item.product.currentStock}`,
      };
    }

    const updated = items.map((i) => {
      if (i.product.id === productId) {
        const amounts = calculateItemAmounts(
          i.product,
          quantity,
          i.discountType,
          i.discountValue,
          pricingMode
        );
        return { ...i, quantity, ...amounts };
      }
      return i;
    });

    set({ items: updated });
    return { success: true };
  },

  updateItemDiscount: (productId: string, discountType: 'NONE' | 'PERCENTAGE' | 'FIXED', value: number) => {
    const { items, pricingMode } = get();
    const updated = items.map((i) => {
      if (i.product.id === productId) {
        const amounts = calculateItemAmounts(i.product, i.quantity, discountType, value, pricingMode);
        return {
          ...i,
          discountType,
          discountValue: value,
          ...amounts,
        };
      }
      return i;
    });
    set({ items: updated });
  },

  removeItem: (productId: string) => {
    set({ items: get().items.filter((i) => i.product.id !== productId) });
  },

  clearCart: () => {
    set({
      items: [],
      customer: null,
      invoiceDiscountType: 'NONE',
      invoiceDiscountValue: 0,
      heldSaleId: null,
    });
  },

  setCustomer: (customer: Customer | null) => {
    set({ customer });
  },

  setInvoiceDiscount: (type: 'NONE' | 'PERCENTAGE' | 'FIXED', value: number) => {
    set({ invoiceDiscountType: type, invoiceDiscountValue: value });
  },

  setPricingMode: (mode: 'INCLUSIVE' | 'EXCLUSIVE') => {
    set({ pricingMode: mode });
  },

  loadHeldCart: (heldCart) => {
    set({
      items: heldCart.items,
      customer: heldCart.customer || null,
      heldSaleId: heldCart.id,
    });
  },

  getTotals: () => {
    const { items, invoiceDiscountType, invoiceDiscountValue } = get();

    let subtotal = 0;
    let itemDiscountTotal = 0;
    let taxTotal = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let itemCount = 0;

    for (const item of items) {
      subtotal += item.unitPrice * item.quantity;
      itemDiscountTotal += item.discountAmount;
      taxTotal += item.taxAmount;
      cgstTotal += item.cgstAmount;
      sgstTotal += item.sgstAmount;
      itemCount += item.quantity;
    }

    let invoiceDiscountTotal = 0;
    const netAfterItemDiscounts = Math.max(0, subtotal - itemDiscountTotal);

    if (invoiceDiscountType === 'PERCENTAGE') {
      invoiceDiscountTotal = Math.round((netAfterItemDiscounts * (invoiceDiscountValue / 100)) * 100) / 100;
    } else if (invoiceDiscountType === 'FIXED') {
      invoiceDiscountTotal = Math.min(netAfterItemDiscounts, invoiceDiscountValue);
    }

    const discountTotal = Math.round((itemDiscountTotal + invoiceDiscountTotal) * 100) / 100;
    const rawTotal = Math.max(0, subtotal - discountTotal + (get().pricingMode === 'EXCLUSIVE' ? taxTotal : 0));
    const roundedGrandTotal = Math.round(rawTotal);
    const roundOff = Math.round((roundedGrandTotal - rawTotal) * 100) / 100;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      itemDiscountTotal: Math.round(itemDiscountTotal * 100) / 100,
      invoiceDiscountTotal: Math.round(invoiceDiscountTotal * 100) / 100,
      discountTotal,
      taxTotal: Math.round(taxTotal * 100) / 100,
      cgstTotal: Math.round(cgstTotal * 100) / 100,
      sgstTotal: Math.round(sgstTotal * 100) / 100,
      igstTotal: 0,
      roundOff,
      grandTotal: roundedGrandTotal,
      itemCount,
    };
  },
}));
