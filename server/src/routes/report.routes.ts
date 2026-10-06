import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';

const router = Router();

router.use(authenticate);
router.use(authorize(['ADMIN', 'INVENTORY_MANAGER']));

router.get('/dashboard', ReportController.getDashboard);
router.get('/sales', ReportController.getSalesReport);
router.get('/tax', ReportController.getTaxReport);
router.get('/inventory-valuation', ReportController.getInventoryValuation);

export default router;
