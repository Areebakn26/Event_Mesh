import { Request, Response } from 'express';
import { verifyToken } from '../utils/jwt';
import prisma from '../config/db';
import { eventBus, NotificationLogEvent } from '../utils/eventBus';

export const streamEvents = async (req: Request, res: Response) => {
  const projectId = String(req.params.projectId);
  const token = (req.query.token as string) || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token missing' });
  }

  try {
    const decoded = verifyToken(token);
    const userId = decoded?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Invalid token payload' });
    }

    // Verify user owns the project or project exists
    let project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });
    if (!project) {
      project = await prisma.project.findUnique({
        where: { id: projectId },
      });
    }

    if (!project) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Set headers for SSE
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering if any

    res.write(`data: ${JSON.stringify({ type: 'connected', message: 'SSE connection established' })}\n\n`);

    const logListener = (event: NotificationLogEvent) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    const channelName = `project:${projectId}`;
    eventBus.on(channelName, logListener);

    // Heartbeat ping every 15s to keep connection alive
    const heartbeat = setInterval(() => {
      res.write(`: ping\n\n`);
    }, 15000);

    req.on('close', () => {
      clearInterval(heartbeat);
      eventBus.removeListener(channelName, logListener);
      res.end();
    });
  } catch (error) {
    console.error('SSE auth failed:', error);
    return res.status(401).json({ error: 'Invalid authentication token' });
  }
};
