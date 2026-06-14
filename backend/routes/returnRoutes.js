import { Router } from 'express';
import * as ctrl from '../controllers/returnController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { returnSchema, paginationSchema } from '../utils/validators.js';

const router = Router();
router.use(authenticate);

router.get('/reasons', ctrl.listReasons);
router.get('/', validate(paginationSchema), ctrl.list);
router.post('/', validate(returnSchema), ctrl.process);
router.post('/from-site', ctrl.bulkReturnFromSite);

export default router;
