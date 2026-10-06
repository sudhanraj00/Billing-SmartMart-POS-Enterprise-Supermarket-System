import { Request, Response, NextFunction } from 'express';
import { InvoiceService } from '../services/invoice.service';

export class InvoiceController {
  static async getInvoices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Cashiers can only view their own sales history unless they are ADMIN
      const cashierId =
        req.user?.role === 'CASHIER'
          ? req.user.userId
          : (req.query.cashierId as string);

      const options = {
        search: req.query.search as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        cashierId,
        status: req.query.status as string,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
      };

      const result = await InvoiceService.getInvoices(options);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getInvoiceById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await InvoiceService.getInvoiceById(req.params.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async voidInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reason, managerPin } = req.body;
      if (!reason) {
        res.status(400).json({ success: false, message: 'Reason for voiding is required' });
        return;
      }

      const invoice = await InvoiceService.voidInvoice({
        invoiceId: req.params.id,
        reason,
        managerPin,
        userId: req.user!.userId,
        userName: req.user!.fullName,
        userRole: req.user!.role,
      });

      res.status(200).json({
        success: true,
        message: 'Invoice voided successfully and items restocked',
        data: invoice,
      });
    } catch (error) {
      next(error);
    }
  }
}
