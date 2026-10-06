import { Request, Response, NextFunction } from 'express';
import { ReturnService } from '../services/return.service';

export class ReturnController {
  static async processReturn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ReturnService.processReturn({
        ...req.body,
        cashierId: req.user!.userId,
        cashierName: req.user!.fullName,
        cashierRole: req.user!.role,
      });

      res.status(201).json({
        success: true,
        message: 'Return processed and credit note generated',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getReturns(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const returns = await ReturnService.getReturns();
      res.status(200).json({ success: true, data: returns });
    } catch (error) {
      next(error);
    }
  }
}
