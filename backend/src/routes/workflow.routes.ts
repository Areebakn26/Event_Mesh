import { Router } from 'express';
import { requireApiKey } from '../middleware/apiKey.middleware';
import {
  createWorkflow,
  listWorkflows,
  getWorkflow,
  updateWorkflow,
  deleteWorkflow,
  triggerWorkflow,
  getWorkflowRun,
} from '../controllers/workflow.controller';

const router = Router();

// All routes require API key authentication (or project context)
router.use(requireApiKey);

// Workflow CRUD
router.post('/workflows', createWorkflow);
router.get('/workflows', listWorkflows);
router.get('/workflows/runs/:runId', getWorkflowRun);
router.get('/workflows/:id', getWorkflow);
router.put('/workflows/:id', updateWorkflow);
router.delete('/workflows/:id', deleteWorkflow);

// Workflow Trigger Endpoint
router.post('/workflows/:triggerIdentifier/trigger', triggerWorkflow);

export default router;
