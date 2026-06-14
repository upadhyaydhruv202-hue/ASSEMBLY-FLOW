import { Router } from 'express';
import * as ctrl from '../controllers/assemblyController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  assemblyCreateSchema,
  assemblyUpdateSchema,
  paginationSchema,
  idParamSchema,
} from '../utils/validators.js';

const router = Router();
router.use(authenticate);

router.get('/', validate(paginationSchema), ctrl.list);
router.get('/scan/:barcode', ctrl.scanBarcode);
router.get('/:id', validate(idParamSchema), ctrl.getById);
router.post('/', validate(assemblyCreateSchema), ctrl.create);
router.patch('/:id', validate(assemblyUpdateSchema), ctrl.update);
router.post('/:id/barcode', validate(idParamSchema), ctrl.generateBarcode);
router.get('/:id/barcode/download', validate(idParamSchema), ctrl.downloadBarcode);

export default router;
