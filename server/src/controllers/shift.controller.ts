import { Request, Response, NextFunction } from 'express';
import { ShiftService } from '../services/shift.service';

export class ShiftController {
  static async getCurrentShift(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const shift = await ShiftService.getCurrentShift(req.user!.userId);
      res.status(200).json({ success: true, data: shift });
    } catch (error) {
      next(error);
    }
  }

  static async openShift(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const shift = await ShiftService.openShift(
        req.user!.userId,
        req.body.openingCash,
        req.body.notes
      );
      res.status(201).json({ success: true, message: 'Shift opened successfully', data: shift });
    } catch (error) {
      next(error);
    }
  }

  static async closeShift(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const shift = await ShiftService.closeShift(
        req.user!.userId,
        req.body.actualCash,
        req.body.differenceReason,
        req.body.notes
      );
      res.status(200).json({ success: true, message: 'Shift closed successfully', data: shift });
    } catch (error) {
      next(error);
    }
  }

  static async getShifts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const shifts = await ShiftService.getShifts();
      res.status(200).json({ success: true, data: shifts });
    } catch (error) {
      next(error);
    }
  }

  static async approveShift(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const shift = await ShiftService.approveShift(req.params.id, req.user!.userId);
      res.status(200).json({ success: true, message: 'Shift approved', data: shift });
    } catch (error) {
      next(error);
    }
  }
}
