import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/db';

export const createProject = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { name } = req.body;
    
    if (!name) return res.status(400).json({ error: 'Project name is required' });

    const project = await prisma.project.create({
      data: {
        name,
        userId: req.user.id
      }
    });

    return res.status(201).json({ project });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getProjects = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const projects = await prisma.project.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({ projects });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getProjectLogs = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const projectId = String(req.params.projectId);
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '15', 10);
    const status = req.query.status as string;
    const channel = req.query.channel as string;
    const search = req.query.search as string;

    // Verify ownership
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.userId !== req.user.id) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const whereClause: any = { projectId };

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    if (channel && channel !== 'all') {
      whereClause.channel = channel;
    }

    if (search) {
      whereClause.OR = [
        { recipient: { contains: search, mode: 'insensitive' } },
        { jobId: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.notificationLog.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notificationLog.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return res.status(200).json({
      logs,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    console.error('Failed to fetch project logs:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
