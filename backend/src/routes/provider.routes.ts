import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { requireApiKey } from '../middleware/apiKey.middleware';
import {
  getProviderConfig,
  updateProviderConfig,
  createChannelProvider,
  listChannelProviders,
  updateChannelProvider,
  deleteChannelProvider,
  reorderChannelProviders,
} from '../controllers/provider.controller';

const router = Router();

// Legacy Project Credentials (JWT Auth)
router.get('/projects/:projectId/provider', requireAuth, getProviderConfig);
router.post('/projects/:projectId/provider', requireAuth, updateProviderConfig);

// Phase 4 Channel Provider Abstraction & Failover (/v1/providers)
router.post('/providers', requireApiKey, createChannelProvider);
router.get('/providers', requireApiKey, listChannelProviders);
router.patch('/providers/reorder', requireApiKey, reorderChannelProviders);
router.put('/providers/:id', requireApiKey, updateChannelProvider);
router.delete('/providers/:id', requireApiKey, deleteChannelProvider);

export default router;
