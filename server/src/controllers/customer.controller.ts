import { Request, Response, NextFunction } from 'express';
import { CustomerService } from '../services/customer.service';

export class CustomerController {
  static async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customers = await CustomerService.searchCustomers(req.query.q as string);
      res.status(200).json({ success: true, data: customers });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customer = await CustomerService.getCustomerById(req.params.id);
      res.status(200).json({ success: true, data: customer });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customer = await CustomerService.createCustomer(req.body);
      res.status(201).json({ success: true, message: 'Customer created', data: customer });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customer = await CustomerService.updateCustomer(req.params.id, req.body);
      res.status(200).json({ success: true, message: 'Customer updated', data: customer });
    } catch (error) {
      next(error);
    }
  }
}
