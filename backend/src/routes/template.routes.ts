import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from '../controllers/template.controller';

const router = Router();

router.get('/projects/:projectId/templates', requireAuth, getTemplates);
router.post('/projects/:projectId/templates', requireAuth, createTemplate);
router.put('/templates/:id', requireAuth, updateTemplate);
router.delete('/templates/:id', requireAuth, deleteTemplate);

export default router;
