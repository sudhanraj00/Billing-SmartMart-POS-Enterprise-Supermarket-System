import { Router } from 'express';
import { POSController } from '../controllers/pos.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate';
import { checkoutSchema, holdSaleSchema } from '../validators/pos.validator';

const router = Router();

router.use(authenticate);
router.use(authorize(['ADMIN', 'CASHIER']));

router.post('/checkout', validate(checkoutSchema), POSController.checkout);
router.post('/hold', validate(holdSaleSchema), POSController.holdSale);
router.get('/held', POSController.getHeldSales);
router.delete('/held/:id', POSController.deleteHeldSale);

export default router;
