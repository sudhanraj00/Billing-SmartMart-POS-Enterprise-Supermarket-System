import { Request, Response, NextFunction } from 'express';
import { POSService } from '../services/pos.service';

export class POSController {
  static async checkout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const invoice = await POSService.checkout({
        ...req.body,
        cashierId: req.user!.userId,
        cashierName: req.user!.fullName,
        cashierRole: req.user!.role,
      });

      res.status(201).json({
        success: true,
        message: 'Checkout completed successfully',
        data: invoice,
      });
    } catch (error) {
      next(error);
    }
  }

  static async holdSale(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const held = await POSService.holdSale({
        ...req.body,
        cashierId: req.user!.userId,
      });

      res.status(201).json({
        success: true,
        message: 'Cart held successfully',
        data: held,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getHeldSales(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Cashiers can see their own held sales; admins can see all
      const cashierId = req.user?.role === 'ADMIN' ? undefined : req.user?.userId;
      const heldSales = await POSService.getHeldSales(cashierId);
      res.status(200).json({ success: true, data: heldSales });
    } catch (error) {
      next(error);
    }
  }

  static async deleteHeldSale(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await POSService.deleteHeldSale(req.params.id);
      res.status(200).json({ success: true, message: 'Held cart removed' });
    } catch (error) {
      next(error);
    }
  }
}
