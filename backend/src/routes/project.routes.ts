import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { createProject, getProjects, getProjectLogs } from '../controllers/project.controller';

const router = Router();

router.use(requireAuth);

router.post('/', createProject);
router.get('/', getProjects);
router.get('/:projectId/logs', getProjectLogs);

export default router;
