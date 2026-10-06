import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { logAudit } from '../services/audit.service';

export class SettingController {
  static async getSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const [store, taxSettings] = await Promise.all([
        prisma.store.findFirst(),
        prisma.taxSetting.findMany({ where: { isActive: true } }),
      ]);
      res.status(200).json({ success: true, data: { store, taxSettings } });
    } catch (error) {
      next(error);
    }
  }

  static async updateStoreSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const store = await prisma.store.findFirst();
      if (!store) {
        res.status(404).json({ success: false, message: 'Store not configured' });
        return;
      }

      const updated = await prisma.store.update({
        where: { id: store.id },
        data: req.body,
      });

      await logAudit({
        userId: req.user!.userId,
        userName: req.user!.fullName,
        userRole: req.user!.role,
        action: 'STORE_SETTINGS_UPDATED',
        entity: 'Store',
        entityId: store.id,
        newValues: req.body,
      });

      res.status(200).json({ success: true, message: 'Store settings updated', data: updated });
    } catch (error) {
      next(error);
    }
  }

  static async createTaxSetting(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const created = await prisma.taxSetting.create({ data: req.body });
      res.status(201).json({ success: true, message: 'Tax setting created', data: created });
    } catch (error) {
      next(error);
    }
  }
}
