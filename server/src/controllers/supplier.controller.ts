import { Request, Response, NextFunction } from 'express';
import { SupplierService } from '../services/supplier.service';

export class SupplierController {
  static async getSuppliers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const suppliers = await SupplierService.getSuppliers();
      res.status(200).json({ success: true, data: suppliers });
    } catch (error) {
      next(error);
    }
  }

  static async createSupplier(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const supplier = await SupplierService.createSupplier(req.body);
      res.status(201).json({ success: true, message: 'Supplier created', data: supplier });
    } catch (error) {
      next(error);
    }
  }

  static async updateSupplier(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const supplier = await SupplierService.updateSupplier(req.params.id, req.body);
      res.status(200).json({ success: true, message: 'Supplier updated', data: supplier });
    } catch (error) {
      next(error);
    }
  }
}
