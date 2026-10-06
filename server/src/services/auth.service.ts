import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
import { signToken, TokenPayload } from '../utils/jwt';
import { logAudit } from './audit.service';

export class AuthService {
  static async login(email: string, password: string, ipAddress?: string, userAgent?: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw { statusCode: 401, message: 'Invalid email or password', isOperational: true };
    }

    if (!user.isActive) {
      throw { statusCode: 403, message: 'Your account has been deactivated. Please contact administrator.', isOperational: true };
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw { statusCode: 401, message: 'Invalid email or password', isOperational: true };
    }

    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    };

    const token = signToken(tokenPayload);

    await logAudit({
      userId: user.id,
      userName: user.fullName,
      userRole: user.role,
      action: 'LOGIN',
      entity: 'User',
      entityId: user.id,
      ipAddress,
      userAgent,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        phone: user.phone,
      },
    };
  }

  static async verifyManagerPin(pin: string, requesterUserId?: string) {
    // Find admins who have a managerPin
    const managers = await prisma.user.findMany({
      where: {
        role: 'ADMIN',
        isActive: true,
        managerPin: { not: null },
      },
    });

    for (const manager of managers) {
      if (manager.managerPin && (await bcrypt.compare(pin, manager.managerPin))) {
        await logAudit({
          userId: manager.id,
          userName: manager.fullName,
          userRole: manager.role,
          action: 'MANAGER_PIN_VERIFIED',
          entity: 'Security',
          entityId: requesterUserId,
        });

        return {
          verified: true,
          managerId: manager.id,
          managerName: manager.fullName,
        };
      }
    }

    throw { statusCode: 401, message: 'Invalid manager PIN', isOperational: true };
  }
}
