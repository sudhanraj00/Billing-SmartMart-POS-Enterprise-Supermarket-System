import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';

export class AuditController {
  static async getLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, req.query.page ? parseInt(req.query.page as string, 10) : 1);
      const limit = Math.min(100, Math.max(1, req.query.limit ? parseInt(req.query.limit as string, 10) : 50));
      const skip = (page - 1) * limit;

      const where: any = {};
      if (req.query.action) where.action = req.query.action as string;
      if (req.query.userId) where.userId = req.query.userId as string;
      if (req.query.entity) where.entity = req.query.entity as string;

      const [total, logs] = await Promise.all([
        prisma.auditLog.count({ where }),
        prisma.auditLog.findMany({
          where,
          include: {
            user: { select: { id: true, fullName: true, email: true } },
          },
          orderBy: { timestamp: 'desc' },
          skip,
          take: limit,
        }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          logs,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
