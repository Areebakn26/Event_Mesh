import { Router } from 'express';
import { streamEvents } from '../controllers/sse.controller';

const router = Router();

router.get('/projects/:projectId/events/stream', streamEvents);

export default router;
