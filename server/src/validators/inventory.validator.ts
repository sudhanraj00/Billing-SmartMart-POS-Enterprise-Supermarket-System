import { z } from 'zod';

export const stockAdjustmentSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantityChanged: z.number().refine((val) => val !== 0, 'Quantity changed cannot be zero'),
  movementType: z.enum([
    'ADJUSTMENT_DAMAGE',
    'ADJUSTMENT_EXPIRED',
    'ADJUSTMENT_WASTAGE',
    'ADJUSTMENT_MANUAL',
    'INITIAL',
  ]),
  reason: z.string().min(3, 'Adjustment reason is required'),
});

export const purchaseEntrySchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  invoiceNumber: z.string().optional(),
  invoiceDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.string().min(1, 'Product is required'),
      quantity: z.number().positive('Quantity must be greater than 0'),
      unitCost: z.number().positive('Unit cost must be greater than 0'),
      taxRate: z.number().min(0).default(0),
      batchNumber: z.string().optional(),
      expiryDate: z.string().datetime().optional().nullable(),
    })
  ).min(1, 'At least one item is required'),
});
