import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(2, 'Product name is required'),
  barcode: z.string().min(2, 'Barcode is required'),
  sku: z.string().min(2, 'SKU is required'),
  description: z.string().optional(),
  unitType: z.enum(['PIECE', 'KG', 'GRAM', 'LITRE', 'ML', 'PACKET', 'BOX']).default('PIECE'),
  sellingPrice: z.number().positive('Selling price must be greater than 0'),
  costPrice: z.number().nonnegative('Cost price cannot be negative'),
  taxRate: z.number().min(0, 'Tax rate cannot be negative').default(0),
  isDiscountEligible: z.boolean().default(true),
  currentStock: z.number().default(0),
  minStockLevel: z.number().min(0).default(10),
  imageUrl: z.string().url().optional().or(z.literal('')),
  batchNumber: z.string().optional(),
  mfgDate: z.string().datetime().optional().nullable(),
  expiryDate: z.string().datetime().optional().nullable(),
  categoryId: z.string().min(1, 'Category is required'),
  brandId: z.string().optional().nullable(),
  supplierId: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const updateProductSchema = createProductSchema.partial();

export const createCategorySchema = z.object({
  name: z.string().min(2, 'Category name is required'),
  code: z.string().min(2, 'Category code is required'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const createBrandSchema = z.object({
  name: z.string().min(2, 'Brand name is required'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const createSupplierSchema = z.object({
  name: z.string().min(2, 'Supplier name is required'),
  contactPerson: z.string().optional(),
  phone: z.string().min(7, 'Phone number is required'),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  gstin: z.string().optional(),
  paymentTermsDays: z.number().int().min(0).default(30),
  isActive: z.boolean().default(true),
});
