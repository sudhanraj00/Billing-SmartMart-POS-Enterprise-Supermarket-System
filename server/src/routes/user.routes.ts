import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate';
import { createUserSchema } from '../validators/auth.validator';

const router = Router();

router.use(authenticate);
router.use(authorize(['ADMIN']));

router.get('/', UserController.getUsers);
router.post('/', validate(createUserSchema), UserController.createUser);
router.put('/:id', UserController.updateUser);
router.delete('/:id', UserController.deleteUser);

export default router;
