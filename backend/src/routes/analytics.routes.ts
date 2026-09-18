import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { getAnalytics } from '../controllers/analytics.controller';

const router = Router();

router.get('/projects/:projectId/analytics', requireAuth, getAnalytics);

export default router;
