import { prisma } from '../config/prisma';
import { logAudit } from './audit.service';
import bcrypt from 'bcryptjs';

export interface InvoiceQueryOptions {
  search?: string;
  startDate?: string;
  endDate?: string;
  cashierId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export class InvoiceService {
  static async getInvoices(options: InvoiceQueryOptions) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (options.search) {
      const q = options.search.trim();
      where.OR = [
        { invoiceNumber: { contains: q } },
        { customerPhone: { contains: q } },
        { customerName: { contains: q } },
      ];
    }

    if (options.cashierId) {
      where.cashierId = options.cashierId;
    }

    if (options.status) {
      where.status = options.status;
    }

    if (options.startDate || options.endDate) {
      where.createdAt = {};
      if (options.startDate) {
        where.createdAt.gte = new Date(options.startDate);
      }
      if (options.endDate) {
        const end = new Date(options.endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const [total, invoices] = await Promise.all([
      prisma.invoice.count({ where }),
      prisma.invoice.findMany({
        where,
        include: {
          cashier: { select: { id: true, fullName: true } },
          customer: { select: { id: true, name: true, phone: true } },
          payments: { select: { paymentMethod: true, amount: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      invoices,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getInvoiceById(id: string) {
    const [invoice, store] = await Promise.all([
      prisma.invoice.findUnique({
        where: { id },
        include: {
          items: true,
          payments: true,
          returns: {
            include: {
              items: true,
            },
          },
          cashier: { select: { id: true, fullName: true, email: true } },
          customer: { select: { id: true, name: true, phone: true, address: true, gstin: true } },
          voidApprovedBy: { select: { id: true, fullName: true } },
        },
      }),
      prisma.store.findFirst(),
    ]);

    if (!invoice) {
      throw { statusCode: 404, message: 'Invoice not found', isOperational: true };
    }

    return {
      invoice,
      store,
    };
  }

  static async voidInvoice(data: {
    invoiceId: string;
    reason: string;
    managerPin?: string;
    userId: string;
    userName: string;
    userRole: string;
  }) {
    // Check permission: Admin or valid Manager PIN required
    let approverId = data.userId;

    if (data.userRole !== 'ADMIN') {
      if (!data.managerPin) {
        throw { statusCode: 403, message: 'Voiding an invoice requires Manager PIN authorization', isOperational: true };
      }

      const managers = await prisma.user.findMany({
        where: { role: 'ADMIN', isActive: true, managerPin: { not: null } },
      });
      let verified = false;
      for (const m of managers) {
        if (m.managerPin && (await bcrypt.compare(data.managerPin, m.managerPin))) {
          verified = true;
          approverId = m.id;
          break;
        }
      }
      if (!verified) {
        throw { statusCode: 401, message: 'Invalid manager PIN', isOperational: true };
      }
    }

    return prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id: data.invoiceId },
        include: { items: true, payments: true },
      });

      if (!invoice) {
        throw { statusCode: 404, message: 'Invoice not found', isOperational: true };
      }

      if (invoice.status === 'VOIDED') {
        throw { statusCode: 400, message: 'Invoice is already voided', isOperational: true };
      }

      // Restock items
      for (const item of invoice.items) {
        const prod = await tx.product.findUnique({ where: { id: item.productId } });
        if (prod) {
          const previousQuantity = prod.currentStock;
          const newQuantity = previousQuantity + item.quantity;

          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: newQuantity },
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              previousQuantity,
              quantityChanged: item.quantity,
              newQuantity,
              movementType: 'RETURN_RESTOCK',
              reason: `Invoice ${invoice.invoiceNumber} voided: ${data.reason}`,
              referenceId: invoice.id,
              referenceType: 'INVOICE_VOID',
              userId: data.userId,
            },
          });
        }
      }

      // Adjust customer balance if credit sale
      const creditPayment = invoice.payments.find((p) => p.paymentMethod === 'CREDIT');
      if (creditPayment && invoice.customerId) {
        await tx.customer.update({
          where: { id: invoice.customerId },
          data: {
            outstandingBalance: {
              decrement: creditPayment.amount,
            },
          },
        });
      }

      // Mark invoice voided
      const updatedInvoice = await tx.invoice.update({
        where: { id: data.invoiceId },
        data: {
          status: 'VOIDED',
          voidReason: data.reason,
          voidApprovedById: approverId,
        },
      });

      await logAudit({
        userId: data.userId,
        userName: data.userName,
        userRole: data.userRole,
        action: 'INVOICE_VOIDED',
        entity: 'Invoice',
        entityId: data.invoiceId,
        newValues: { reason: data.reason, approverId },
      });

      return updatedInvoice;
    });
  }
}
