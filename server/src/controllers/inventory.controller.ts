import { Request, Response, NextFunction } from 'express';
import { InventoryService } from '../services/inventory.service';

export class InventoryController {
  static async getStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stock = await InventoryService.getStockList(
        req.query.q as string,
        req.query.categoryId as string
      );
      res.status(200).json({ success: true, data: stock });
    } catch (error) {
      next(error);
    }
  }

  static async getLowStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const lowStock = await InventoryService.getLowStockProducts();
      res.status(200).json({ success: true, data: lowStock });
    } catch (error) {
      next(error);
    }
  }

  static async getExpiring(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
      const expiring = await InventoryService.getExpiringProducts(days);
      res.status(200).json({ success: true, data: expiring });
    } catch (error) {
      next(error);
    }
  }

  static async getMovements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const movements = await InventoryService.getStockMovements(
        req.query.productId as string,
        req.query.limit ? parseInt(req.query.limit as string, 10) : 100
      );
      res.status(200).json({ success: true, data: movements });
    } catch (error) {
      next(error);
    }
  }

  static async adjustStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await InventoryService.adjustStock({
        productId: req.body.productId,
        quantityChanged: req.body.quantityChanged,
        movementType: req.body.movementType,
        reason: req.body.reason,
        userId: req.user!.userId,
        userName: req.user!.fullName,
        userRole: req.user!.role,
      });
      res.status(200).json({ success: true, message: 'Stock adjusted successfully', data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getPurchases(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const purchases = await InventoryService.getPurchases();
      res.status(200).json({ success: true, data: purchases });
    } catch (error) {
      next(error);
    }
  }

  static async recordPurchase(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const purchase = await InventoryService.recordPurchase({
        ...req.body,
        userId: req.user!.userId,
        userName: req.user!.fullName,
        userRole: req.user!.role,
      });
      res.status(201).json({ success: true, message: 'Purchase recorded and stock updated', data: purchase });
    } catch (error) {
      next(error);
    }
  }
}
