import { Router } from 'express';
import { requireApiKey } from '../middleware/apiKey.middleware';
import {
  upsertSubscriber,
  listSubscribers,
  getSubscriber,
  deleteSubscriber,
  getSubscriberPreferences,
  updateSubscriberPreferences,
  listTopics,
  createTopic,
} from '../controllers/subscriber.controller';

const router = Router();

// All routes require API key authentication (or project context)
router.use(requireApiKey);

// Subscriber Directory Endpoints
router.post('/subscribers', upsertSubscriber);
router.get('/subscribers', listSubscribers);
router.get('/subscribers/:subscriberId', getSubscriber);
router.delete('/subscribers/:subscriberId', deleteSubscriber);

// Preference Center Endpoints
router.get('/subscribers/:subscriberId/preferences', getSubscriberPreferences);
router.patch('/subscribers/:subscriberId/preferences', updateSubscriberPreferences);

// Notification Topics Endpoints
router.get('/topics', listTopics);
router.post('/topics', createTopic);

export default router;
