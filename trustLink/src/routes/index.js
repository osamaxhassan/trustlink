import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import adminRoutes from './admin.routes.js';
import jobRoutes from './job.routes.js';
import bidRoutes from './bid.routes.js';
import contractRoutes from './contract.routes.js';
import safetyRoutes from './safety.routes.js';

const router = Router();
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);
router.use('/jobs', jobRoutes);
router.use('/bids', bidRoutes);
router.use('/contracts', contractRoutes);
router.use('/safety', safetyRoutes);

export default router;
