import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { register, login, toggleOnlineStatus } from '../controllers/auth.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'cnic-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const router = Router();

router.post('/register', upload.fields([
  { name: 'cnicFront', maxCount: 1 },
  { name: 'cnicBack', maxCount: 1 }
]), register);

router.post('/login', login);
router.post('/toggle-online', verifyToken, toggleOnlineStatus);

export default router;
