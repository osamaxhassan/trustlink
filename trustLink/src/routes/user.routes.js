import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { getProfile, updateProfile } from '../controllers/user.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 4 * 1024 * 1024 } });

const router = Router();
router.use(verifyToken);

router.get('/profile', getProfile);
router.patch('/profile', upload.single('avatar'), updateProfile);

export default router;
