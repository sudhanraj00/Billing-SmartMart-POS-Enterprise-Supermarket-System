import { Router } from 'express';
import { AuditController } from '../controllers/audit.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';

const router = Router();

router.use(authenticate);
router.use(authorize(['ADMIN']));

router.get('/', AuditController.getLogs);

export default router;
