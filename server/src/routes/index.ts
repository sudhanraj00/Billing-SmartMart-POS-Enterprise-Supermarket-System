import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import productRoutes from './product.routes';
import catalogRoutes from './catalog.routes';
import supplierRoutes from './supplier.routes';
import customerRoutes from './customer.routes';
import inventoryRoutes from './inventory.routes';
import posRoutes from './pos.routes';
import invoiceRoutes from './invoice.routes';
import returnRoutes from './return.routes';
import shiftRoutes from './shift.routes';
import reportRoutes from './report.routes';
import settingRoutes from './setting.routes';
import auditRoutes from './audit.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/catalog', catalogRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/customers', customerRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/pos', posRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/returns', returnRoutes);
router.use('/shifts', shiftRoutes);
router.use('/reports', reportRoutes);
router.use('/settings', settingRoutes);
router.use('/audit-logs', auditRoutes);

export default router;
