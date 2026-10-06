import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const createUserSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().optional(),
  role: z.enum(['ADMIN', 'CASHIER', 'INVENTORY_MANAGER']).default('CASHIER'),
  managerPin: z.string().regex(/^\d{4,6}$/, 'PIN must be 4 to 6 digits').optional(),
});

export const verifyPinSchema = z.object({
  pin: z.string().min(4, 'PIN is required'),
});
