import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { setAuthCookie, clearAuthCookie } from '../utils/jwt';
import { prisma } from '../config/prisma';

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const result = await AuthService.login(email, password, ipAddress, userAgent);
      setAuthCookie(res, result.token);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: result.user,
          token: result.token, // Also returned in body for convenience/tests
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response): Promise<void> {
    clearAuthCookie(res);
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  }

  static async getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          phone: true,
          isActive: true,
          createdAt: true,
        },
      });

      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  static async verifyPin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { pin } = req.body;
      const result = await AuthService.verifyManagerPin(pin, req.user?.userId);

      res.status(200).json({
        success: true,
        message: 'PIN verified successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
