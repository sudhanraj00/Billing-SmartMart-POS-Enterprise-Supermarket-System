import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate';
import { createProductSchema, updateProductSchema } from '../validators/product.validator';

const router = Router();

router.use(authenticate);

// Barcode lookup & Read product endpoints (Accessible to ADMIN, CASHIER, INVENTORY_MANAGER)
router.get('/barcode/:barcode', ProductController.getProductByBarcode);
router.get('/export', authorize(['ADMIN', 'INVENTORY_MANAGER']), ProductController.exportCsv);
router.post('/bulk-import', authorize(['ADMIN', 'INVENTORY_MANAGER']), ProductController.bulkImport);
router.get('/:id', ProductController.getProductById);
router.get('/', ProductController.getProducts);

// Mutation endpoints (ADMIN and INVENTORY_MANAGER)
router.post(
  '/',
  authorize(['ADMIN', 'INVENTORY_MANAGER']),
  validate(createProductSchema),
  ProductController.createProduct
);

router.put(
  '/:id',
  authorize(['ADMIN', 'INVENTORY_MANAGER']),
  validate(updateProductSchema),
  ProductController.updateProduct
);

// Delete endpoint (ADMIN only)
router.delete('/:id', authorize(['ADMIN']), ProductController.deleteProduct);

export default router;
