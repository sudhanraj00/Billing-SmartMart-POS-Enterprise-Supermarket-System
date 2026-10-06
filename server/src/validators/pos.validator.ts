import { z } from 'zod';

export const checkoutItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().positive(),
  costPrice: z.number().nonnegative(),
  discountType: z.enum(['NONE', 'PERCENTAGE', 'FIXED']).default('NONE'),
  discountValue: z.number().min(0).default(0),
  discountAmount: z.number().min(0).default(0),
  taxRate: z.number().min(0).default(0),
  taxAmount: z.number().min(0).default(0),
  cgstAmount: z.number().min(0).default(0),
  sgstAmount: z.number().min(0).default(0),
  igstAmount: z.number().min(0).default(0),
  lineTotal: z.number().positive(),
  batchNumber: z.string().optional(),
});

export const paymentEntrySchema = z.object({
  amount: z.number().positive(),
  paymentMethod: z.enum(['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'CREDIT']),
  transactionRef: z.string().optional(),
  notes: z.string().optional(),
});

export const checkoutSchema = z.object({
  idempotencyKey: z.string().uuid().optional(),
  customerId: z.string().optional().nullable(),
  customerName: z.string().optional().nullable(),
  customerPhone: z.string().optional().nullable(),
  items: z.array(checkoutItemSchema).min(1, 'Cart cannot be empty'),
  subtotal: z.number().nonnegative(),
  itemDiscountTotal: z.number().min(0).default(0),
  invoiceDiscountTotal: z.number().min(0).default(0),
  invoiceDiscountType: z.enum(['NONE', 'PERCENTAGE', 'FIXED']).default('NONE'),
  discountTotal: z.number().min(0).default(0),
  taxTotal: z.number().min(0).default(0),
  cgstTotal: z.number().min(0).default(0),
  sgstTotal: z.number().min(0).default(0),
  igstTotal: z.number().min(0).default(0),
  roundOff: z.number().default(0),
  grandTotal: z.number().positive('Grand total must be greater than 0'),
  amountPaid: z.number().nonnegative(),
  balanceDue: z.number().min(0).default(0),
  changeReturned: z.number().min(0).default(0),
  payments: z.array(paymentEntrySchema).min(1, 'At least one payment entry is required'),
  notes: z.string().optional(),
  heldSaleId: z.string().optional().nullable(),
  managerPin: z.string().optional(), // If high discount or override
});

export const holdSaleSchema = z.object({
  referenceNote: z.string().optional(),
  customerId: z.string().optional().nullable(),
  items: z.array(z.any()).min(1, 'Cart items required'),
  subtotal: z.number(),
  discount: z.number().default(0),
  tax: z.number().default(0),
  total: z.number(),
});

export const returnSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),
  reason: z.string().min(3, 'Return reason is required'),
  refundMethod: z.enum(['CASH', 'UPI', 'CARD', 'CREDIT_NOTE', 'ORIGINAL']).default('CASH'),
  managerPin: z.string().optional(),
  items: z.array(
    z.object({
      invoiceItemId: z.string().min(1),
      productId: z.string().min(1),
      quantity: z.number().positive(),
      condition: z.enum(['RESTOCKABLE', 'DAMAGED']).default('RESTOCKABLE'),
    })
  ).min(1, 'At least one item to return'),
});

export const openShiftSchema = z.object({
  openingCash: z.number().nonnegative('Opening cash must be non-negative'),
  notes: z.string().optional(),
});

export const closeShiftSchema = z.object({
  actualCash: z.number().nonnegative('Actual cash must be non-negative'),
  differenceReason: z.string().optional(),
  notes: z.string().optional(),
});
