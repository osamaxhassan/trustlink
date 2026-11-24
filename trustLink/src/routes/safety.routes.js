import { Router } from 'express';
import { getTrustedContacts, addTrustedContact, deleteTrustedContact } from '../controllers/safety.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = Router();
router.use(verifyToken);

router.get('/contacts', getTrustedContacts);
router.post('/contacts', addTrustedContact);
router.delete('/contacts/:id', deleteTrustedContact);

export default router;
