import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
import { logAudit } from './audit.service';

export class UserService {
  static async getAllUsers() {
    return prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async createUser(data: any, createdByUserId: string, createdByRole: string) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existing) {
      throw { statusCode: 400, message: 'Email address already registered', isOperational: true };
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const managerPinHash = data.managerPin ? await bcrypt.hash(data.managerPin, 10) : null;

    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        fullName: data.fullName,
        phone: data.phone,
        role: data.role,
        managerPin: managerPinHash,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    await logAudit({
      userId: createdByUserId,
      userName: 'Admin',
      userRole: createdByRole,
      action: 'USER_CREATED',
      entity: 'User',
      entityId: user.id,
      newValues: { email: user.email, role: user.role, fullName: user.fullName },
    });

    return user;
  }

  static async updateUser(id: string, data: any, updatedByUserId: string, updatedByRole: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw { statusCode: 404, message: 'User not found', isOperational: true };
    }

    const updateData: any = {};
    if (data.fullName !== undefined) updateData.fullName = data.fullName;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }
    if (data.managerPin) {
      updateData.managerPin = await bcrypt.hash(data.managerPin, 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    await logAudit({
      userId: updatedByUserId,
      userName: 'Admin',
      userRole: updatedByRole,
      action: 'USER_UPDATED',
      entity: 'User',
      entityId: id,
      oldValues: { email: user.email, role: user.role, isActive: user.isActive },
      newValues: { role: updated.role, isActive: updated.isActive },
    });

    return updated;
  }

  static async deleteUser(id: string, deletedByUserId: string) {
    if (id === deletedByUserId) {
      throw { statusCode: 400, message: 'You cannot delete your own account', isOperational: true };
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    await logAudit({
      userId: deletedByUserId,
      userName: 'Admin',
      userRole: 'ADMIN',
      action: 'USER_DEACTIVATED',
      entity: 'User',
      entityId: id,
    });

    return updated;
  }
}
