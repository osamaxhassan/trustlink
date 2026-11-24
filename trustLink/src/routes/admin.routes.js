import { Router } from 'express';
import { getPendingTechnicians, getRejectedTechnicians, verifyTechnician, rejectTechnician, getPlatformStats } from '../controllers/admin.controller.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';

const router = Router();
router.use(verifyToken, requireRole('ADMIN'));

router.get('/pending-technicians', getPendingTechnicians);
router.get('/rejected-technicians', getRejectedTechnicians);
router.patch('/verify-technician/:technicianId', verifyTechnician);
router.patch('/reject-technician/:technicianId', rejectTechnician);
router.get('/stats', getPlatformStats);

export default router;
