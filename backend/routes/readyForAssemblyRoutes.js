import { Router } from 'express';
import * as ctrl from '../controllers/readyForAssemblyController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  readyForAssemblySchema,
  bulkReadySchema,
  paginationSchema,
  idParamSchema,
} from '../utils/validators.js';

const router = Router();
router.use(authenticate);

router.get('/', validate(paginationSchema), ctrl.list);
router.post('/', validate(readyForAssemblySchema), ctrl.create);
router.post('/bulk', validate(bulkReadySchema), ctrl.bulkCreate);
router.delete('/bulk', ctrl.bulkRemove);
router.delete('/:id', validate(idParamSchema), ctrl.remove);

export default router;
