import { Router } from 'express';
import * as ctrl from '../controllers/siteController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { siteSchema, siteDoorStatusSchema, paginationSchema, idParamSchema } from '../utils/validators.js';

const router = Router();
router.use(authenticate);

router.get('/doors', validate(paginationSchema), ctrl.listDoors);
router.patch('/doors/status', validate(siteDoorStatusSchema), ctrl.updateStatus);
router.get('/', ctrl.list);
router.post('/', validate(siteSchema), ctrl.create);
router.patch('/:id', validate(idParamSchema), ctrl.update);

export default router;
