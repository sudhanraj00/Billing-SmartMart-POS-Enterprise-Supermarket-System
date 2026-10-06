import { prisma } from '../config/prisma';
import { logAudit } from './audit.service';
import bcrypt from 'bcryptjs';

export class ReturnService {
  static async processReturn(data: {
    invoiceId: string;
    reason: string;
    refundMethod: string;
    managerPin?: string;
    items: Array<{
      invoiceItemId: string;
      productId: string;
      quantity: number;
      condition: string; // RESTOCKABLE or DAMAGED
    }>;
    cashierId: string;
    cashierName: string;
    cashierRole: string;
  }) {
    // Returns require Admin or Manager PIN authorization
    let approvedById = data.cashierId;

    if (data.cashierRole !== 'ADMIN') {
      if (!data.managerPin) {
        throw { statusCode: 403, message: 'Processing returns requires Manager PIN authorization', isOperational: true };
      }

      const managers = await prisma.user.findMany({
        where: { role: 'ADMIN', isActive: true, managerPin: { not: null } },
      });
      let verified = false;
      for (const m of managers) {
        if (m.managerPin && (await bcrypt.compare(data.managerPin, m.managerPin))) {
          verified = true;
          approvedById = m.id;
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
        include: { items: true, customer: true },
      });

      if (!invoice) {
        throw { statusCode: 404, message: 'Invoice not found', isOperational: true };
      }

      if (invoice.status === 'VOIDED') {
        throw { statusCode: 400, message: 'Cannot process return on a voided invoice', isOperational: true };
      }

      const returnNumber = `RET-${Date.now()}`;
      const creditNoteNumber = `CN-${Date.now().toString().slice(-6)}`;
      let totalRefundAmount = 0;

      const createdReturn = await tx.return.create({
        data: {
          returnNumber,
          invoiceId: data.invoiceId,
          customerId: invoice.customerId || null,
          cashierId: data.cashierId,
          approvedById,
          reason: data.reason,
          refundAmount: 0, // updated below
          refundMethod: data.refundMethod,
          returnStatus: 'COMPLETED',
          creditNoteNumber,
        },
      });

      for (const returnItem of data.items) {
        const invItem = invoice.items.find((i) => i.id === returnItem.invoiceItemId);
        if (!invItem) {
          throw { statusCode: 400, message: `Invoice item ${returnItem.invoiceItemId} not found on this invoice`, isOperational: true };
        }

        const refundAmountForItem = (invItem.lineTotal / invItem.quantity) * returnItem.quantity;
        totalRefundAmount += refundAmountForItem;

        const isRestockable = returnItem.condition === 'RESTOCKABLE';

        await tx.returnItem.create({
          data: {
            returnId: createdReturn.id,
            invoiceItemId: returnItem.invoiceItemId,
            productId: returnItem.productId,
            quantity: returnItem.quantity,
            unitPrice: invItem.unitPrice,
            refundAmount: refundAmountForItem,
            condition: returnItem.condition,
            restocked: isRestockable,
          },
        });

        // If item is restockable, restore stock atomically
        if (isRestockable) {
          const product = await tx.product.findUnique({ where: { id: returnItem.productId } });
          if (product) {
            const previousQuantity = product.currentStock;
            const newQuantity = previousQuantity + returnItem.quantity;

            await tx.product.update({
              where: { id: returnItem.productId },
              data: { currentStock: newQuantity },
            });

            await tx.stockMovement.create({
              data: {
                productId: returnItem.productId,
                previousQuantity,
                quantityChanged: returnItem.quantity,
                newQuantity,
                movementType: 'RETURN_RESTOCK',
                reason: `Sales return ${returnNumber}: ${data.reason}`,
                referenceId: createdReturn.id,
                referenceType: 'RETURN',
                userId: data.cashierId,
              },
            });
          }
        }
      }

      // Update return total refund amount
      const updatedReturn = await tx.return.update({
        where: { id: createdReturn.id },
        data: { refundAmount: totalRefundAmount },
        include: { items: true },
      });

      // Update invoice status to PARTIALLY_REFUNDED or REFUNDED
      await tx.invoice.update({
        where: { id: data.invoiceId },
        data: {
          status: totalRefundAmount >= invoice.grandTotal ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
        },
      });

      // If refunded in CASH, update active shift cash
      if (data.refundMethod === 'CASH') {
        const activeShift = await tx.cashierShift.findFirst({
          where: { cashierId: data.cashierId, status: 'OPEN' },
        });

        if (activeShift) {
          await tx.cashierShift.update({
            where: { id: activeShift.id },
            data: {
              totalCashRefunds: { increment: totalRefundAmount },
              expectedCash: { decrement: totalRefundAmount },
            },
          });
        }
      }

      await logAudit({
        userId: data.cashierId,
        userName: data.cashierName,
        userRole: data.cashierRole,
        action: 'RETURN_PROCESSED',
        entity: 'Return',
        entityId: createdReturn.id,
        newValues: { returnNumber, refundAmount: totalRefundAmount, invoiceId: data.invoiceId },
      });

      return updatedReturn;
    });
  }

  static async getReturns() {
    return prisma.return.findMany({
      include: {
        invoice: { select: { invoiceNumber: true, invoiceDate: true, grandTotal: true } },
        cashier: { select: { fullName: true } },
        customer: { select: { name: true, phone: true } },
        approvedBy: { select: { fullName: true } },
        items: {
          include: {
            product: { select: { name: true, barcode: true, sku: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
