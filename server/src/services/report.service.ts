import { prisma } from '../config/prisma';
import { round } from '../utils/decimal';

export class ReportService {
  static async getDashboardMetrics() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

    const [
      todayInvoices,
      allProducts,
      pendingCustomerDues,
      recentInvoices,
      recentAdjustments,
    ] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          createdAt: { gte: todayStart },
          status: { in: ['COMPLETED', 'PARTIALLY_REFUNDED'] },
        },
        include: { items: true },
      }),
      prisma.product.findMany({
        where: { isDeleted: false, isActive: true },
        select: {
          id: true,
          name: true,
          currentStock: true,
          minStockLevel: true,
          costPrice: true,
          sellingPrice: true,
          expiryDate: true,
          category: { select: { name: true } },
        },
      }),
      prisma.customer.aggregate({
        where: { isActive: true },
        _sum: { outstandingBalance: true },
      }),
      prisma.invoice.findMany({
        include: {
          cashier: { select: { fullName: true } },
          customer: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
      prisma.stockMovement.findMany({
        include: {
          product: { select: { name: true, barcode: true } },
          user: { select: { fullName: true } },
        },
        orderBy: { timestamp: 'desc' },
        take: 6,
      }),
    ]);

    // Calculate today metrics
    let todaySales = 0;
    let todayCost = 0;
    let totalItemsSold = 0;

    for (const inv of todayInvoices) {
      todaySales += inv.grandTotal;
      for (const item of inv.items) {
        todayCost += (item.costPrice * item.quantity);
        totalItemsSold += item.quantity;
      }
    }

    const todayProfit = round(todaySales - todayCost, 2);

    // Stock metrics
    const lowStockCount = allProducts.filter((p) => p.currentStock > 0 && p.currentStock <= p.minStockLevel).length;
    const outOfStockCount = allProducts.filter((p) => p.currentStock <= 0).length;
    const expiringCount = allProducts.filter((p) => p.expiryDate && new Date(p.expiryDate) <= thirtyDaysLater).length;

    // 7-day Sales Trend
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const pastWeekInvoices = await prisma.invoice.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
        status: { in: ['COMPLETED', 'PARTIALLY_REFUNDED'] },
      },
      select: {
        createdAt: true,
        grandTotal: true,
      },
    });

    const salesTrendMap: Record<string, { date: string; sales: number; invoices: number }> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      salesTrendMap[key] = {
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sales: 0,
        invoices: 0,
      };
    }

    for (const inv of pastWeekInvoices) {
      const key = inv.createdAt.toISOString().slice(0, 10);
      if (salesTrendMap[key]) {
        salesTrendMap[key].sales = round(salesTrendMap[key].sales + inv.grandTotal, 2);
        salesTrendMap[key].invoices += 1;
      }
    }

    // Top selling products & categories
    const invoiceItems = await prisma.invoiceItem.findMany({
      where: {
        invoice: {
          status: { in: ['COMPLETED', 'PARTIALLY_REFUNDED'] },
        },
      },
      select: {
        productName: true,
        quantity: true,
        lineTotal: true,
        product: { select: { category: { select: { name: true } } } },
      },
    });

    const productSalesMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
    const categorySalesMap: Record<string, { name: string; revenue: number }> = {};

    for (const item of invoiceItems) {
      if (!productSalesMap[item.productName]) {
        productSalesMap[item.productName] = { name: item.productName, quantity: 0, revenue: 0 };
      }
      productSalesMap[item.productName].quantity += item.quantity;
      productSalesMap[item.productName].revenue = round(productSalesMap[item.productName].revenue + item.lineTotal, 2);

      const catName = item.product?.category?.name || 'Uncategorized';
      if (!categorySalesMap[catName]) {
        categorySalesMap[catName] = { name: catName, revenue: 0 };
      }
      categorySalesMap[catName].revenue = round(categorySalesMap[catName].revenue + item.lineTotal, 2);
    }

    const topProducts = Object.values(productSalesMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    const topCategories = Object.values(categorySalesMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      metrics: {
        todaySales: round(todaySales, 2),
        todayInvoices: todayInvoices.length,
        todayProfit,
        totalItemsSold,
        lowStockCount,
        outOfStockCount,
        expiringCount,
        pendingCustomerDues: round(pendingCustomerDues._sum.outstandingBalance || 0, 2),
      },
      salesTrend: Object.values(salesTrendMap),
      topProducts,
      topCategories,
      recentInvoices,
      recentAdjustments,
    };
  }

  static async getSalesReport(startDate?: string, endDate?: string) {
    const where: any = {
      status: { in: ['COMPLETED', 'PARTIALLY_REFUNDED'] },
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        cashier: { select: { fullName: true } },
        payments: true,
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    let totalRevenue = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    let totalCost = 0;

    const cashierMap: Record<string, { cashier: string; sales: number; count: number }> = {};
    const paymentMap: Record<string, { method: string; amount: number; count: number }> = {};

    for (const inv of invoices) {
      totalRevenue += inv.grandTotal;
      totalDiscount += inv.discountTotal;
      totalTax += inv.taxTotal;

      const cName = inv.cashier.fullName;
      if (!cashierMap[cName]) cashierMap[cName] = { cashier: cName, sales: 0, count: 0 };
      cashierMap[cName].sales = round(cashierMap[cName].sales + inv.grandTotal, 2);
      cashierMap[cName].count += 1;

      for (const p of inv.payments) {
        if (!paymentMap[p.paymentMethod]) paymentMap[p.paymentMethod] = { method: p.paymentMethod, amount: 0, count: 0 };
        paymentMap[p.paymentMethod].amount = round(paymentMap[p.paymentMethod].amount + p.amount, 2);
        paymentMap[p.paymentMethod].count += 1;
      }

      for (const item of inv.items) {
        totalCost += (item.costPrice * item.quantity);
      }
    }

    const netProfit = round(totalRevenue - totalCost, 2);

    return {
      summary: {
        totalInvoices: invoices.length,
        totalRevenue: round(totalRevenue, 2),
        totalDiscount: round(totalDiscount, 2),
        totalTax: round(totalTax, 2),
        totalCost: round(totalCost, 2),
        netProfit,
      },
      byCashier: Object.values(cashierMap),
      byPaymentMethod: Object.values(paymentMap),
      invoices,
    };
  }

  static async getTaxReport() {
    const invoices = await prisma.invoice.findMany({
      where: { status: { in: ['COMPLETED', 'PARTIALLY_REFUNDED'] } },
      select: {
        invoiceNumber: true,
        invoiceDate: true,
        subtotal: true,
        taxTotal: true,
        cgstTotal: true,
        sgstTotal: true,
        igstTotal: true,
        grandTotal: true,
      },
    });

    let totalTaxable = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;
    let totalTax = 0;

    for (const inv of invoices) {
      totalTaxable += inv.subtotal;
      totalCGST += inv.cgstTotal;
      totalSGST += inv.sgstTotal;
      totalIGST += inv.igstTotal;
      totalTax += inv.taxTotal;
    }

    return {
      summary: {
        totalTaxable: round(totalTaxable, 2),
        totalCGST: round(totalCGST, 2),
        totalSGST: round(totalSGST, 2),
        totalIGST: round(totalIGST, 2),
        totalTax: round(totalTax, 2),
      },
      invoices,
    };
  }

  static async getInventoryValuation() {
    const products = await prisma.product.findMany({
      where: { isDeleted: false, isActive: true },
      include: { category: true },
    });

    let totalUnits = 0;
    let totalValuationAtCost = 0;
    let totalValuationAtRetail = 0;

    const breakdown = products.map((p) => {
      const valCost = round(p.currentStock * p.costPrice, 2);
      const valRetail = round(p.currentStock * p.sellingPrice, 2);
      totalUnits += p.currentStock;
      totalValuationAtCost += valCost;
      totalValuationAtRetail += valRetail;

      return {
        id: p.id,
        name: p.name,
        barcode: p.barcode,
        sku: p.sku,
        category: p.category.name,
        stock: p.currentStock,
        unitCost: p.costPrice,
        unitSelling: p.sellingPrice,
        totalCost: valCost,
        totalRetail: valRetail,
        potentialMargin: round(valRetail - valCost, 2),
      };
    });

    return {
      summary: {
        totalProducts: products.length,
        totalUnits,
        totalValuationAtCost: round(totalValuationAtCost, 2),
        totalValuationAtRetail: round(totalValuationAtRetail, 2),
        potentialProfit: round(totalValuationAtRetail - totalValuationAtCost, 2),
      },
      breakdown,
    };
  }
}
