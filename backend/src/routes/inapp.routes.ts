import { Router } from 'express';
import {
  listInAppMessages,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  streamInAppMessages,
} from '../controllers/inapp.controller';

const router = Router();

// Public / End-user facing In-App notification endpoints
router.get('/inapp/stream', streamInAppMessages);
router.get('/inapp', listInAppMessages);
router.get('/inapp/unread-count', getUnreadCount);
router.patch('/inapp/read-all', markAllAsRead);
router.patch('/inapp/:messageId/read', markAsRead);

export default router;
