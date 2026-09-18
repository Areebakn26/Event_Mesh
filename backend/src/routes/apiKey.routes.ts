import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { generateKey, listKeys, revokeKey } from '../controllers/apiKey.controller';

const router = Router();

router.use(requireAuth); // Protect all API Key dashboard routes

router.post('/', generateKey);
router.get('/project/:projectId', listKeys);
router.delete('/:keyId', revokeKey);

export default router;
