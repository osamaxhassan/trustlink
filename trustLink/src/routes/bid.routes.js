import { Router } from 'express';
import { placeBid } from '../controllers/bid.controller.js';

const router = Router();
router.post('/submit', placeBid);

export default router;