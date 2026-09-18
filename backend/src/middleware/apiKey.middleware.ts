import { Request, Response, NextFunction } from 'express';
import { hashApiKey } from '../utils/hash';
import { verifyToken } from '../utils/jwt';
import prisma from '../config/db';

export interface ApiRequest extends Request {
  project?: any; // The authenticated project
}

export const requireApiKey = async (req: ApiRequest, res: Response, next: NextFunction): Promise<any> => {
  const authHeader = req.headers.authorization;
  const projectIdHeader = (req.headers['x-project-id'] as string) || (req.query.projectId as string);

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];

    try {
      // 1. Try API Key lookup
      const hashedKey = hashApiKey(token);
      const keyRecord = await prisma.apiKey.findUnique({
        where: { hash: hashedKey },
        include: { project: true },
      });

      if (keyRecord) {
        prisma.apiKey.update({
          where: { id: keyRecord.id },
          data: { lastUsed: new Date() }
        }).catch(console.error);

        req.project = keyRecord.project;
        return next();
      }

      // 2. Try JWT lookup for Dashboard calls
      const decoded = verifyToken(token);
      if (decoded) {
        let project = null;
        if (projectIdHeader) {
          project = await prisma.project.findFirst({
            where: { id: projectIdHeader, userId: decoded.userId }
          });
        }
        if (!project) {
          project = await prisma.project.findFirst({
            where: { userId: decoded.userId }
          });
        }

        if (project) {
          req.project = project;
          return next();
        }
      }
    } catch (error) {
      console.error('API Key validation error:', error);
    }
  }

  // 3. Fallback for public preference center requests with project ID
  if (projectIdHeader) {
    try {
      const project = await prisma.project.findUnique({
        where: { id: projectIdHeader }
      });
      if (project) {
        req.project = project;
        return next();
      }
    } catch (error) {
      console.error('Public project lookup error:', error);
    }
  }

  return res.status(401).json({ error: 'Unauthorized: Missing or invalid API Key or Project Context' });
};

