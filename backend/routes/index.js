import { Router } from 'express';
import authRoutes from './authRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import readyForAssemblyRoutes from './readyForAssemblyRoutes.js';
import assemblyRoutes from './assemblyRoutes.js';
import fipsRoutes from './fipsRoutes.js';
import qualityCheckRoutes from './qualityCheckRoutes.js';
import storageRoutes from './storageRoutes.js';
import deliveryRoutes from './deliveryRoutes.js';
import siteRoutes from './siteRoutes.js';
import returnRoutes from './returnRoutes.js';
import movementRoutes from './movementRoutes.js';
import reportRoutes from './reportRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/ready-for-assembly', readyForAssemblyRoutes);
router.use('/assemblies', assemblyRoutes);
router.use('/fips', fipsRoutes);
router.use('/quality-checks', qualityCheckRoutes);
router.use('/storage', storageRoutes);
router.use('/deliveries', deliveryRoutes);
router.use('/sites', siteRoutes);
router.use('/returns', returnRoutes);
router.use('/movements', movementRoutes);
router.use('/reports', reportRoutes);

router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'AssemblyFlow ERP API is running' });
});

export default router;
