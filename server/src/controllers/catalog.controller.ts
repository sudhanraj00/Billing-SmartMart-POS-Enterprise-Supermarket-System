import { Request, Response, NextFunction } from 'express';
import { CatalogService } from '../services/catalog.service';

export class CatalogController {
  static async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await CatalogService.getCategories();
      res.status(200).json({ success: true, data: categories });
    } catch (error) {
      next(error);
    }
  }

  static async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await CatalogService.createCategory(req.body);
      res.status(201).json({ success: true, message: 'Category created', data: category });
    } catch (error) {
      next(error);
    }
  }

  static async updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await CatalogService.updateCategory(req.params.id, req.body);
      res.status(200).json({ success: true, message: 'Category updated', data: category });
    } catch (error) {
      next(error);
    }
  }

  static async getBrands(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const brands = await CatalogService.getBrands();
      res.status(200).json({ success: true, data: brands });
    } catch (error) {
      next(error);
    }
  }

  static async createBrand(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const brand = await CatalogService.createBrand(req.body);
      res.status(201).json({ success: true, message: 'Brand created', data: brand });
    } catch (error) {
      next(error);
    }
  }

  static async updateBrand(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const brand = await CatalogService.updateBrand(req.params.id, req.body);
      res.status(200).json({ success: true, message: 'Brand updated', data: brand });
    } catch (error) {
      next(error);
    }
  }
}
