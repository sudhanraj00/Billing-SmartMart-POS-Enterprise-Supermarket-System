import { Router } from 'express';
import { ShiftController } from '../controllers/shift.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate';
import { openShiftSchema, closeShiftSchema } from '../validators/pos.validator';

const router = Router();

router.use(authenticate);

router.get('/current', ShiftController.getCurrentShift);
router.post('/open', validate(openShiftSchema), ShiftController.openShift);
router.post('/close', validate(closeShiftSchema), ShiftController.closeShift);

// Admin-only review endpoints
router.get('/', authorize(['ADMIN']), ShiftController.getShifts);
router.post('/:id/approve', authorize(['ADMIN']), ShiftController.approveShift);

export default router;
