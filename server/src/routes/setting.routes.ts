import { Router } from 'express';
import { SettingController } from '../controllers/setting.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';

const router = Router();

router.use(authenticate);

// Store details viewable by all authenticated users (needed for POS receipt, store name, etc.)
router.get('/', SettingController.getSettings);

// Store details updateable only by ADMIN
router.put('/store', authorize(['ADMIN']), SettingController.updateStoreSettings);
router.post('/taxes', authorize(['ADMIN']), SettingController.createTaxSetting);

export default router;
