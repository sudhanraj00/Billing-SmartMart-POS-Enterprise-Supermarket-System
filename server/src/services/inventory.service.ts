import { prisma } from '../config/prisma';
import { logAudit } from './audit.service';

export class InventoryService {
  static async getStockList(query?: string, categoryId?: string) {
    const where: any = { isDeleted: false };
    if (query) {
      const q = query.trim();
      where.OR = [
        { name: { contains: q } },
        { barcode: { contains: q } },
        { sku: { contains: q } },
      ];
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }

    return prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        barcode: true,
        sku: true,
        unitType: true,
        sellingPrice: true,
        costPrice: true,
        taxRate: true,
        currentStock: true,
        minStockLevel: true,
        batchNumber: true,
        expiryDate: true,
        category: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  static async getLowStockProducts() {
    // Get active products where currentStock <= minStockLevel
    const products = await prisma.product.findMany({
      where: {
        isDeleted: false,
        isActive: true,
      },
      include: {
        category: { select: { name: true } },
        supplier: { select: { name: true, phone: true } },
      },
      orderBy: { currentStock: 'asc' },
    });

    return products.filter((p) => p.currentStock <= p.minStockLevel);
  }

  static async getExpiringProducts(daysAhead: number = 30) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysAhead);

    return prisma.product.findMany({
      where: {
        isDeleted: false,
        isActive: true,
        expiryDate: {
          not: null,
          lte: targetDate,
        },
      },
      include: {
        category: { select: { name: true } },
      },
      orderBy: { expiryDate: 'asc' },
    });
  }

  static async getStockMovements(productId?: string, limit: number = 100) {
    const where: any = {};
    if (productId) {
      where.productId = productId;
    }

    return prisma.stockMovement.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, barcode: true, sku: true } },
        user: { select: { id: true, fullName: true, role: true } },
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  static async adjustStock(data: {
    productId: string;
    quantityChanged: number;
    movementType: string;
    reason: string;
    userId: string;
    userName: string;
    userRole: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: data.productId },
      });

      if (!product || product.isDeleted) {
        throw { statusCode: 404, message: 'Product not found', isOperational: true };
      }

      const previousQuantity = product.currentStock;
      const newQuantity = previousQuantity + data.quantityChanged;

      if (newQuantity < 0) {
        throw {
          statusCode: 400,
          message: `Stock reduction cannot result in negative stock. Current stock: ${previousQuantity}`,
          isOperational: true,
        };
      }

      // Update product current stock
      const updatedProduct = await tx.product.update({
        where: { id: data.productId },
        data: { currentStock: newQuantity },
      });

      // Record immutable stock movement
      const movement = await tx.stockMovement.create({
        data: {
          productId: data.productId,
          previousQuantity,
          quantityChanged: data.quantityChanged,
          newQuantity,
          movementType: data.movementType,
          reason: data.reason,
          referenceType: 'MANUAL_ADJUSTMENT',
          userId: data.userId,
        },
      });

      await logAudit({
        userId: data.userId,
        userName: data.userName,
        userRole: data.userRole,
        action: 'STOCK_ADJUSTMENT',
        entity: 'Product',
        entityId: data.productId,
        oldValues: { stock: previousQuantity },
        newValues: { stock: newQuantity, change: data.quantityChanged, reason: data.reason },
      });

      return { product: updatedProduct, movement };
    });
  }

  static async getPurchases() {
    return prisma.purchase.findMany({
      include: {
        supplier: { select: { id: true, name: true, phone: true } },
        createdBy: { select: { id: true, fullName: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, barcode: true, sku: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  static async recordPurchase(data: {
    supplierId: string;
    invoiceNumber?: string;
    invoiceDate?: string;
    notes?: string;
    items: Array<{
      productId: string;
      quantity: number;
      unitCost: number;
      taxRate: number;
      batchNumber?: string;
      expiryDate?: string;
    }>;
    userId: string;
    userName: string;
    userRole: string;
  }) {
    const purchaseNumber = `PO-${Date.now()}`;

    return prisma.$transaction(async (tx) => {
      let subtotal = 0;
      let taxTotal = 0;

      for (const item of data.items) {
        const itemCost = item.quantity * item.unitCost;
        const itemTax = itemCost * (item.taxRate / 100);
        subtotal += itemCost;
        taxTotal += itemTax;
      }

      const grandTotal = subtotal + taxTotal;

      const purchase = await tx.purchase.create({
        data: {
          purchaseNumber,
          supplierId: data.supplierId,
          invoiceNumber: data.invoiceNumber || null,
          invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : new Date(),
          subtotal,
          taxTotal,
          grandTotal,
          paymentStatus: 'PAID',
          notes: data.notes || null,
          createdById: data.userId,
        },
      });

      for (const item of data.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) {
          throw { statusCode: 404, message: `Product ${item.productId} not found`, isOperational: true };
        }

        const lineTax = (item.quantity * item.unitCost) * (item.taxRate / 100);
        const lineTotal = item.quantity * item.unitCost + lineTax;

        await tx.purchaseItem.create({
          data: {
            purchaseId: purchase.id,
            productId: item.productId,
            batchNumber: item.batchNumber || null,
            quantity: item.quantity,
            unitCost: item.unitCost,
            taxRate: item.taxRate,
            taxAmount: lineTax,
            lineTotal,
            expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
          },
        });

        // Atomically increment product current stock
        const previousQuantity = product.currentStock;
        const newQuantity = previousQuantity + item.quantity;

        await tx.product.update({
          where: { id: item.productId },
          data: {
            currentStock: newQuantity,
            costPrice: item.unitCost, // Update latest cost price
          },
        });

        // Record stock movement ledger
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            previousQuantity,
            quantityChanged: item.quantity,
            newQuantity,
            movementType: 'PURCHASE',
            reason: `Purchase stock-in entry ${purchaseNumber}`,
            referenceId: purchase.id,
            referenceType: 'PURCHASE',
            userId: data.userId,
          },
        });
      }

      await logAudit({
        userId: data.userId,
        userName: data.userName,
        userRole: data.userRole,
        action: 'PURCHASE_ENTRY',
        entity: 'Purchase',
        entityId: purchase.id,
        newValues: { purchaseNumber, total: grandTotal, itemCount: data.items.length },
      });

      return purchase;
    });
  }
}
