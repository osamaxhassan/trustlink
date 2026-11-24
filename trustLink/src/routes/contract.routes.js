import { Router } from 'express';
import { lockStage1, approveStage2, getTechnicianActiveContract, markArrived, completeJob, get30DayHistory } from '../controllers/contract.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = Router();
router.use(verifyToken);

router.post('/lock-stage1', lockStage1);
router.post('/approve-stage2', approveStage2);
router.post('/mark-arrived', markArrived);
router.post('/complete', completeJob);
router.get('/technician-active', getTechnicianActiveContract);
router.get('/history', get30DayHistory);

export default router;
