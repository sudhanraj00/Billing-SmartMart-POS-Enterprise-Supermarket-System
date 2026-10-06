import { Router } from 'express';
import { ReturnController } from '../controllers/return.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { returnSchema } from '../validators/pos.validator';

const router = Router();

router.use(authenticate);

router.post('/', validate(returnSchema), ReturnController.processReturn);
router.get('/', ReturnController.getReturns);

export default router;
