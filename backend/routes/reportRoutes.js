import { Router } from 'express';
import * as ctrl from '../controllers/reportController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/:type', ctrl.generate);
router.get('/:type/export', ctrl.exportReport);

export default router;
