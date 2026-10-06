import { Router } from 'express';
import { CatalogController } from '../controllers/catalog.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate';
import { createCategorySchema, createBrandSchema } from '../validators/product.validator';

const router = Router();

router.use(authenticate);

// Categories
router.get('/categories', CatalogController.getCategories);
router.post(
  '/categories',
  authorize(['ADMIN', 'INVENTORY_MANAGER']),
  validate(createCategorySchema),
  CatalogController.createCategory
);
router.put('/categories/:id', authorize(['ADMIN', 'INVENTORY_MANAGER']), CatalogController.updateCategory);

// Brands
router.get('/brands', CatalogController.getBrands);
router.post(
  '/brands',
  authorize(['ADMIN', 'INVENTORY_MANAGER']),
  validate(createBrandSchema),
  CatalogController.createBrand
);
router.put('/brands/:id', authorize(['ADMIN', 'INVENTORY_MANAGER']), CatalogController.updateBrand);

export default router;
