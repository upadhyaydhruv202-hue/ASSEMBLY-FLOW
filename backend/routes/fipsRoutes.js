import { Router } from 'express';
import * as ctrl from '../controllers/fipsController.js';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import { fipsUpdateSchema, paginationSchema, idParamSchema } from '../utils/validators.js';

const router = Router();
router.use(authenticate);

router.get('/', validate(paginationSchema), ctrl.list);
router.patch('/:id', validate(fipsUpdateSchema), ctrl.update);
router.get('/:id/documents', validate(idParamSchema), ctrl.listDocuments);
router.post('/:id/documents', validate(idParamSchema), upload.single('file'), ctrl.uploadDocument);
router.get('/:fipsId/documents/:docId/download', ctrl.downloadDocument);
router.delete('/documents/:docId', ctrl.deleteDocument);

export default router;
