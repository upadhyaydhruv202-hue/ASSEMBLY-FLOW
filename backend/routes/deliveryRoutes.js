import { Router } from 'express';
import * as ctrl from '../controllers/deliveryController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { deliverySchema, paginationSchema, idParamSchema } from '../utils/validators.js';

const router = Router();
router.use(authenticate);

router.get('/', validate(paginationSchema), ctrl.list);
router.post('/', validate(deliverySchema), ctrl.create);
router.get('/:id', validate(idParamSchema), ctrl.getById);
router.get('/:id/note', validate(idParamSchema), ctrl.getNote);

export default router;
