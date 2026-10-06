import { prisma } from '../config/prisma';
import { logAudit } from './audit.service';

export interface ProductQueryOptions {
  search?: string;
  categoryId?: string;
  brandId?: string;
  lowStockOnly?: boolean;
  expiringSoonOnly?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class ProductService {
  static async getProducts(options: ProductQueryOptions) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {
      isDeleted: false,
    };

    if (options.search) {
      const q = options.search.trim();
      where.OR = [
        { name: { contains: q } },
        { barcode: { contains: q } },
        { sku: { contains: q } },
        { category: { name: { contains: q } } },
        { brand: { name: { contains: q } } },
      ];
    }

    if (options.categoryId) {
      where.categoryId = options.categoryId;
    }

    if (options.brandId) {
      where.brandId = options.brandId;
    }

    if (options.expiringSoonOnly) {
      const thirtyDaysLater = new Date();
      thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
      where.expiryDate = {
        lte: thirtyDaysLater,
      };
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, code: true } },
          brand: { select: { id: true, name: true } },
          supplier: { select: { id: true, name: true } },
        },
        orderBy: {
          [options.sortBy || 'createdAt']: options.sortOrder || 'desc',
        },
        skip,
        take: limit,
      }),
    ]);

    // If lowStockOnly filter is requested, filter products where currentStock <= minStockLevel
    const filteredProducts = options.lowStockOnly
      ? products.filter((p) => p.currentStock <= p.minStockLevel)
      : products;

    return {
      products: filteredProducts,
      pagination: {
        total: options.lowStockOnly ? filteredProducts.length : total,
        page,
        limit,
        totalPages: Math.ceil((options.lowStockOnly ? filteredProducts.length : total) / limit),
      },
    };
  }

  static async getProductByBarcode(barcode: string) {
    const product = await prisma.product.findFirst({
      where: {
        barcode: barcode.trim(),
        isDeleted: false,
        isActive: true,
      },
      include: {
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
      },
    });

    if (!product) {
      throw { statusCode: 404, message: `Product with barcode '${barcode}' not found or inactive`, isOperational: true };
    }

    return product;
  }

  static async getProductById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        brand: true,
        supplier: true,
        batches: true,
      },
    });

    if (!product || product.isDeleted) {
      throw { statusCode: 404, message: 'Product not found', isOperational: true };
    }

    return product;
  }

  static async createProduct(data: any, userId: string, userName: string, userRole: string) {
    // Generate barcode if not provided or generate SKU
    const barcode = data.barcode?.trim() || `SM${Date.now()}`;
    const sku = data.sku?.trim() || `SKU-${Date.now().toString().slice(-6)}`;

    // Check unique barcode/sku
    const existing = await prisma.product.findFirst({
      where: {
        OR: [{ barcode }, { sku }],
      },
    });

    if (existing) {
      throw { statusCode: 400, message: 'Product with this barcode or SKU already exists', isOperational: true };
    }

    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          name: data.name.trim(),
          barcode,
          sku,
          description: data.description,
          unitType: data.unitType || 'PIECE',
          sellingPrice: data.sellingPrice,
          costPrice: data.costPrice,
          taxRate: data.taxRate || 0,
          isDiscountEligible: data.isDiscountEligible ?? true,
          currentStock: data.currentStock || 0,
          minStockLevel: data.minStockLevel || 10,
          imageUrl: data.imageUrl,
          batchNumber: data.batchNumber,
          mfgDate: data.mfgDate ? new Date(data.mfgDate) : null,
          expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
          categoryId: data.categoryId,
          brandId: data.brandId || null,
          supplierId: data.supplierId || null,
          isActive: data.isActive ?? true,
        },
        include: {
          category: true,
          brand: true,
          supplier: true,
        },
      });

      // Audit stock ledger rule: Never silently overwrite stock
      if (created.currentStock > 0) {
        await tx.stockMovement.create({
          data: {
            productId: created.id,
            previousQuantity: 0,
            quantityChanged: created.currentStock,
            newQuantity: created.currentStock,
            movementType: 'INITIAL',
            reason: 'Initial stock on product creation',
            referenceType: 'PRODUCT_CREATION',
            userId,
          },
        });
      }

      return created;
    });

    await logAudit({
      userId,
      userName,
      userRole,
      action: 'PRODUCT_CREATED',
      entity: 'Product',
      entityId: product.id,
      newValues: { name: product.name, barcode: product.barcode, stock: product.currentStock },
    });

    return product;
  }

  static async updateProduct(id: string, data: any, userId: string, userName: string, userRole: string) {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing || existing.isDeleted) {
      throw { statusCode: 404, message: 'Product not found', isOperational: true };
    }

    const updateData: any = { ...data };
    delete updateData.currentStock; // Stock can only be changed via StockMovement / Adjustments / Purchase / Checkout

    if (data.mfgDate !== undefined) {
      updateData.mfgDate = data.mfgDate ? new Date(data.mfgDate) : null;
    }
    if (data.expiryDate !== undefined) {
      updateData.expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;
    }

    const updated = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        brand: true,
        supplier: true,
      },
    });

    await logAudit({
      userId,
      userName,
      userRole,
      action: 'PRODUCT_UPDATED',
      entity: 'Product',
      entityId: id,
      oldValues: { name: existing.name, sellingPrice: existing.sellingPrice, taxRate: existing.taxRate },
      newValues: { name: updated.name, sellingPrice: updated.sellingPrice, taxRate: updated.taxRate },
    });

    return updated;
  }

  static async deleteProduct(id: string, userId: string, userName: string, userRole: string) {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing || existing.isDeleted) {
      throw { statusCode: 404, message: 'Product not found', isOperational: true };
    }

    const updated = await prisma.product.update({
      where: { id },
      data: { isDeleted: true, isActive: false },
    });

    await logAudit({
      userId,
      userName,
      userRole,
      action: 'PRODUCT_DELETED',
      entity: 'Product',
      entityId: id,
    });

    return updated;
  }

  static async exportToCsv(): Promise<string> {
    const products = await prisma.product.findMany({
      where: { isDeleted: false },
      include: { category: true, brand: true, supplier: true },
      orderBy: { name: 'asc' },
    });

    const headers = [
      'Name',
      'Barcode',
      'SKU',
      'Category',
      'Brand',
      'Selling Price',
      'Cost Price',
      'Tax Rate',
      'Current Stock',
      'Min Stock Level',
      'Unit',
      'Supplier',
    ];

    const rows = products.map((p) => [
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.barcode}"`,
      `"${p.sku}"`,
      `"${p.category?.name || ''}"`,
      `"${p.brand?.name || ''}"`,
      p.sellingPrice,
      p.costPrice,
      p.taxRate,
      p.currentStock,
      p.minStockLevel,
      p.unitType,
      `"${p.supplier?.name || ''}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  static async importFromCsv(csvText: string, userId: string, userName: string, userRole: string) {
    const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length <= 1) {
      throw { statusCode: 400, message: 'CSV file is empty or missing data rows', isOperational: true };
    }

    const defaultCategory = await prisma.category.findFirst();
    if (!defaultCategory) {
      throw { statusCode: 500, message: 'No category found to assign imported products', isOperational: true };
    }

    let importedCount = 0;
    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.replace(/^"|"$/g, '').trim());
      if (parts.length < 5) continue;

      const [name, barcode, sku, sellingPriceStr, costPriceStr, taxRateStr, stockStr] = parts;
      if (!name) continue;

      const cleanBarcode = barcode || `SM${Date.now()}${i}`;
      const cleanSku = sku || `SKU${Date.now()}${i}`;
      const sellingPrice = parseFloat(sellingPriceStr) || 0;
      const costPrice = parseFloat(costPriceStr) || 0;
      const taxRate = parseFloat(taxRateStr) || 0;
      const stock = parseFloat(stockStr) || 0;

      // Check if product exists by barcode or SKU
      const existing = await prisma.product.findFirst({
        where: { OR: [{ barcode: cleanBarcode }, { sku: cleanSku }] },
      });

      if (!existing) {
        await prisma.product.create({
          data: {
            name,
            barcode: cleanBarcode,
            sku: cleanSku,
            sellingPrice,
            costPrice,
            taxRate,
            currentStock: stock,
            categoryId: defaultCategory.id,
          },
        });
        importedCount++;
      }
    }

    await logAudit({
      userId,
      userName,
      userRole,
      action: 'PRODUCTS_BULK_IMPORTED',
      entity: 'Product',
      newValues: { count: importedCount },
    });

    return { importedCount };
  }
}
