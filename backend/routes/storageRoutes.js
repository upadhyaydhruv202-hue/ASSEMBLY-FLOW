import { Router } from 'express';
import * as ctrl from '../controllers/storageController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  storageMoveSchema,
  bulkStorageMoveSchema,
  storageLocationSchema,
  paginationSchema,
} from '../utils/validators.js';

const router = Router();
router.use(authenticate);

router.get('/locations', ctrl.listLocations);
router.post('/locations', validate(storageLocationSchema), ctrl.createLocation);
router.get('/summary', ctrl.summary);
router.get('/movements', validate(paginationSchema), ctrl.movements);
router.get('/:code', validate(paginationSchema), ctrl.listByLocation);
router.post('/move', validate(storageMoveSchema), ctrl.move);
router.post('/bulk-move', validate(bulkStorageMoveSchema), ctrl.bulkMove);

export default router;
