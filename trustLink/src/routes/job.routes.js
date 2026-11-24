import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { createJob, getCustomerActiveJob, getAvailableJobsForTechnician, cancelJob } from '../controllers/job.controller.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 4 }
});

const router = Router();

router.post('/create', verifyToken, upload.array('images', 4), createJob);
router.post('/cancel', verifyToken, requireRole('CUSTOMER'), cancelJob);
router.get('/customer-active', verifyToken, requireRole('CUSTOMER'), getCustomerActiveJob);
router.get('/available-for-tech', verifyToken, requireRole('TECHNICIAN'), getAvailableJobsForTechnician);

export default router;
