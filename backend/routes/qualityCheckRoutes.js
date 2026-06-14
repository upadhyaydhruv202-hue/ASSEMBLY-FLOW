import { Router } from 'express';
import * as ctrl from '../controllers/qualityCheckController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { qcUpdateSchema, paginationSchema, idParamSchema } from '../utils/validators.js';

const router = Router();
router.use(authenticate);

router.get('/', validate(paginationSchema), ctrl.list);
router.patch('/:id', validate(qcUpdateSchema), ctrl.update);
router.get('/:id/label', validate(idParamSchema), ctrl.getLabel);

export default router;
