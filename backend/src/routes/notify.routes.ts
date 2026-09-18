import { Router } from 'express';
import { requireApiKey } from '../middleware/apiKey.middleware';
import { rateLimiter } from '../middleware/rateLimiter';
import { sendNotification } from '../controllers/notify.controller';

const router = Router();

// Apply the API Key authentication and then the rate limiter
router.post('/', requireApiKey, rateLimiter, sendNotification);

export default router;
