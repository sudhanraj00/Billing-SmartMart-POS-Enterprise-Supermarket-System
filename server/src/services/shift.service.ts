import { prisma } from '../config/prisma';
import { round } from '../utils/decimal';
import { logAudit } from './audit.service';

export class ShiftService {
  static async getCurrentShift(cashierId: string) {
    return prisma.cashierShift.findFirst({
      where: {
        cashierId,
        status: 'OPEN',
      },
      include: {
        cashier: { select: { id: true, fullName: true, email: true } },
      },
    });
  }

  static async openShift(cashierId: string, openingCash: number, notes?: string) {
    const existing = await prisma.cashierShift.findFirst({
      where: { cashierId, status: 'OPEN' },
    });

    if (existing) {
      throw { statusCode: 400, message: 'You already have an active open shift', isOperational: true };
    }

    const shift = await prisma.cashierShift.create({
      data: {
        cashierId,
        openingCash,
        expectedCash: openingCash,
        status: 'OPEN',
        notes: notes || 'Shift opened',
      },
    });

    const user = await prisma.user.findUnique({ where: { id: cashierId } });

    await logAudit({
      userId: cashierId,
      userName: user?.fullName || 'Cashier',
      userRole: user?.role || 'CASHIER',
      action: 'SHIFT_OPENED',
      entity: 'CashierShift',
      entityId: shift.id,
      newValues: { openingCash },
    });

    return shift;
  }

  static async closeShift(
    cashierId: string,
    actualCash: number,
    differenceReason?: string,
    notes?: string
  ) {
    const shift = await prisma.cashierShift.findFirst({
      where: { cashierId, status: 'OPEN' },
    });

    if (!shift) {
      throw { statusCode: 400, message: 'No active open shift found for this cashier', isOperational: true };
    }

    const cashDifference = round(actualCash - shift.expectedCash, 2);

    if (Math.abs(cashDifference) > 0.01 && !differenceReason) {
      throw {
        statusCode: 400,
        message: `Cash variance of ${cashDifference} detected. A reason is required.`,
        isOperational: true,
      };
    }

    const closedShift = await prisma.cashierShift.update({
      where: { id: shift.id },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
        actualCash,
        cashDifference,
        differenceReason: differenceReason || null,
        notes: notes ? `${shift.notes || ''} | ${notes}` : shift.notes,
      },
    });

    const user = await prisma.user.findUnique({ where: { id: cashierId } });

    await logAudit({
      userId: cashierId,
      userName: user?.fullName || 'Cashier',
      userRole: user?.role || 'CASHIER',
      action: 'SHIFT_CLOSED',
      entity: 'CashierShift',
      entityId: shift.id,
      newValues: {
        expectedCash: shift.expectedCash,
        actualCash,
        variance: cashDifference,
        reason: differenceReason,
      },
    });

    return closedShift;
  }

  static async getShifts(limit: number = 50) {
    return prisma.cashierShift.findMany({
      include: {
        cashier: { select: { id: true, fullName: true, email: true } },
        approvedBy: { select: { id: true, fullName: true } },
      },
      orderBy: { openedAt: 'desc' },
      take: limit,
    });
  }

  static async approveShift(shiftId: string, adminUserId: string) {
    return prisma.cashierShift.update({
      where: { id: shiftId },
      data: {
        approvedById: adminUserId,
      },
    });
  }
}
