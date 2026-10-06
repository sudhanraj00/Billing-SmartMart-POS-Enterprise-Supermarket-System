import { Router } from 'express';
import { SupplierController } from '../controllers/supplier.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate';
import { createSupplierSchema } from '../validators/product.validator';

const router = Router();

router.use(authenticate);

router.get('/', SupplierController.getSuppliers);
router.post(
  '/',
  authorize(['ADMIN', 'INVENTORY_MANAGER']),
  validate(createSupplierSchema),
  SupplierController.createSupplier
);
router.put('/:id', authorize(['ADMIN', 'INVENTORY_MANAGER']), SupplierController.updateSupplier);

export default router;
