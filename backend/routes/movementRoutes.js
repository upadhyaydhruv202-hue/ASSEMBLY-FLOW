import { Router } from 'express';
import * as ctrl from '../controllers/movementController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { paginationSchema, movementSearchSchema } from '../utils/validators.js';

const router = Router();
router.use(authenticate);

router.get('/', validate(paginationSchema), ctrl.list);
router.get('/search', ctrl.search);
router.get('/timeline/:jobNumber/:serialNumber', ctrl.timeline);

export default router;
