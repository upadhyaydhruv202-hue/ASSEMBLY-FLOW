import { Router } from 'express';
import * as ctrl from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);
router.get('/stats', ctrl.getStats);

export default router;
