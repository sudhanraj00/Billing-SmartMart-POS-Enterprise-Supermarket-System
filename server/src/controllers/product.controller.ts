import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/product.service';

export class ProductController {
  static async getProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const options = {
        search: req.query.search as string,
        categoryId: req.query.categoryId as string,
        brandId: req.query.brandId as string,
        lowStockOnly: req.query.lowStock === 'true',
        expiringSoonOnly: req.query.expiringSoon === 'true',
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await ProductService.getProducts(options);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getProductByBarcode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await ProductService.getProductByBarcode(req.params.barcode);
      res.status(200).json({ success: true, data: product });
    } catch (error) {
      next(error);
    }
  }

  static async getProductById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await ProductService.getProductById(req.params.id);
      res.status(200).json({ success: true, data: product });
    } catch (error) {
      next(error);
    }
  }

  static async createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await ProductService.createProduct(
        req.body,
        req.user!.userId,
        req.user!.fullName,
        req.user!.role
      );
      res.status(201).json({ success: true, message: 'Product created successfully', data: product });
    } catch (error) {
      next(error);
    }
  }

  static async updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await ProductService.updateProduct(
        req.params.id,
        req.body,
        req.user!.userId,
        req.user!.fullName,
        req.user!.role
      );
      res.status(200).json({ success: true, message: 'Product updated successfully', data: product });
    } catch (error) {
      next(error);
    }
  }

  static async deleteProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await ProductService.deleteProduct(
        req.params.id,
        req.user!.userId,
        req.user!.fullName,
        req.user!.role
      );
      res.status(200).json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async exportCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const csv = await ProductService.exportToCsv();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="smartmart-products.csv"');
      res.status(200).send(csv);
    } catch (error) {
      next(error);
    }
  }

  static async bulkImport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { csvText } = req.body;
      if (!csvText) {
        res.status(400).json({ success: false, message: 'csvText payload is required' });
        return;
      }
      const result = await ProductService.importFromCsv(
        csvText,
        req.user!.userId,
        req.user!.fullName,
        req.user!.role
      );
      res.status(200).json({ success: true, message: `Imported ${result.importedCount} products`, data: result });
    } catch (error) {
      next(error);
    }
  }
}
