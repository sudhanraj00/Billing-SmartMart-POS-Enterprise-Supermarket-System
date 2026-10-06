export type RoleType = 'ADMIN' | 'CASHIER' | 'INVENTORY_MANAGER';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: RoleType;
  isActive: boolean;
  createdAt: string;
}

export interface Store {
  id: string;
  name: string;
  legalName?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  gstin?: string;
  currencySymbol: string;
  currencyCode: string;
  invoicePrefix: string;
  receiptHeader?: string;
  receiptFooter?: string;
  logoUrl?: string;
  pricingMode: 'INCLUSIVE' | 'EXCLUSIVE';
  allowNegativeStock: boolean;
  maxCashierDiscount: number;
}

export interface Category {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  _count?: { products: number };
}

export interface Brand {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  _count?: { products: number };
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  address?: string;
  gstin?: string;
  paymentTermsDays: number;
  isActive: boolean;
  _count?: { products: number; purchases: number };
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  gstin?: string;
  outstandingBalance: number;
  creditLimit: number;
  isActive: boolean;
  invoices?: Invoice[];
}

export type UnitType = 'PIECE' | 'KG' | 'GRAM' | 'LITRE' | 'ML' | 'PACKET' | 'BOX';

export interface Product {
  id: string;
  name: string;
  barcode: string;
  sku: string;
  description?: string;
  unitType: UnitType;
  sellingPrice: number;
  costPrice: number;
  taxRate: number;
  isDiscountEligible: boolean;
  currentStock: number;
  minStockLevel: number;
  imageUrl?: string;
  batchNumber?: string;
  mfgDate?: string;
  expiryDate?: string;
  categoryId: string;
  brandId?: string;
  supplierId?: string;
  isActive: boolean;
  isDeleted: boolean;
  category?: Category;
  brand?: Brand;
  supplier?: Supplier;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  discountType: 'NONE' | 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  lineTotal: number;
}

export interface PaymentItem {
  amount: number;
  paymentMethod: 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'CREDIT';
  transactionRef?: string;
  notes?: string;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  productId: string;
  productName: string;
  sku: string;
  barcode: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  discountType: string;
  discountValue: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  lineTotal: number;
  batchNumber?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  cashierId: string;
  cashier: { id: string; fullName: string; email?: string };
  customerId?: string;
  customer?: Customer;
  customerName?: string;
  customerPhone?: string;
  subtotal: number;
  itemDiscountTotal: number;
  invoiceDiscountTotal: number;
  invoiceDiscountType: string;
  discountTotal: number;
  taxTotal: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  roundOff: number;
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;
  changeReturned: number;
  paymentStatus: 'PAID' | 'PARTIALLY_PAID' | 'DUE';
  pricingMode: 'INCLUSIVE' | 'EXCLUSIVE';
  notes?: string;
  status: 'COMPLETED' | 'REFUNDED' | 'PARTIALLY_REFUNDED' | 'VOIDED';
  voidReason?: string;
  voidApprovedBy?: { id: string; fullName: string };
  items: InvoiceItem[];
  payments: PaymentItem[];
  createdAt: string;
}

export interface CashierShift {
  id: string;
  cashierId: string;
  cashier: { id: string; fullName: string; email: string };
  openedAt: string;
  closedAt?: string;
  openingCash: number;
  totalCashSales: number;
  totalCashRefunds: number;
  expectedCash: number;
  actualCash?: number;
  cashDifference?: number;
  differenceReason?: string;
  status: 'OPEN' | 'CLOSED';
  notes?: string;
  approvedBy?: { id: string; fullName: string };
}

export interface StockMovement {
  id: string;
  productId: string;
  product: { id: string; name: string; barcode: string; sku: string };
  previousQuantity: number;
  quantityChanged: number;
  newQuantity: number;
  movementType: string;
  reason?: string;
  referenceId?: string;
  referenceType?: string;
  userId: string;
  user: { id: string; fullName: string; role: string };
  timestamp: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  userName: string;
  userRole: string;
  action: string;
  entity: string;
  entityId?: string;
  oldValuesJson?: string;
  newValuesJson?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  user?: { id: string; fullName: string; email: string };
}
