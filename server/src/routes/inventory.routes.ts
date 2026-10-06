import { Router } from 'express';
import { InventoryController } from '../controllers/inventory.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate';
import { stockAdjustmentSchema, purchaseEntrySchema } from '../validators/inventory.validator';

const router = Router();

router.use(authenticate);

// Stock & Movements reading (ADMIN & INVENTORY_MANAGER)
router.get('/stock', authorize(['ADMIN', 'INVENTORY_MANAGER']), InventoryController.getStock);
router.get('/low-stock', authorize(['ADMIN', 'INVENTORY_MANAGER']), InventoryController.getLowStock);
router.get('/expiring', authorize(['ADMIN', 'INVENTORY_MANAGER']), InventoryController.getExpiring);
router.get('/movements', authorize(['ADMIN', 'INVENTORY_MANAGER']), InventoryController.getMovements);

// Manual stock adjustment (ADMIN & INVENTORY_MANAGER)
router.post(
  '/adjust',
  authorize(['ADMIN', 'INVENTORY_MANAGER']),
  validate(stockAdjustmentSchema),
  InventoryController.adjustStock
);

// Purchases
router.get('/purchases', authorize(['ADMIN', 'INVENTORY_MANAGER']), InventoryController.getPurchases);
router.post(
  '/purchases',
  authorize(['ADMIN', 'INVENTORY_MANAGER']),
  validate(purchaseEntrySchema),
  InventoryController.recordPurchase
);

export default router;
