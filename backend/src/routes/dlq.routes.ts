import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { getDlqLogs, retryDlqJob, purgeDlqJob } from '../controllers/dlq.controller';

const router = Router();

router.get('/projects/:projectId/dlq', requireAuth, getDlqLogs);
router.post('/dlq/:id/retry', requireAuth, retryDlqJob);
router.delete('/dlq/:id', requireAuth, purgeDlqJob);

export default router;
