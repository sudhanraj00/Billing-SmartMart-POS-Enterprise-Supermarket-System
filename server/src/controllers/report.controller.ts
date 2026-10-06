import { Request, Response, NextFunction } from 'express';
import { ReportService } from '../services/report.service';

export class ReportController {
  static async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await ReportService.getDashboardMetrics();
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getSalesReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { startDate, endDate } = req.query;
      const data = await ReportService.getSalesReport(startDate as string, endDate as string);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getTaxReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await ReportService.getTaxReport();
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getInventoryValuation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await ReportService.getInventoryValuation();
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
