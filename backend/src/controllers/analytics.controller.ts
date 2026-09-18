import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/db';

export const getAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const projectId = String(req.params.projectId);
    const userId = req.user?.id;

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const totalLogs = await prisma.notificationLog.count({ where: { projectId } });
    const sentLogs = await prisma.notificationLog.count({ where: { projectId, status: 'sent' } });
    const completedLogs = await prisma.notificationLog.count({ where: { projectId, status: 'completed' } });
    const failedLogs = await prisma.notificationLog.count({ where: { projectId, status: { in: ['failed', 'dead_lettered'] } } });
    const queuedLogs = await prisma.notificationLog.count({ where: { projectId, status: 'queued' } });

    const totalSuccess = sentLogs + completedLogs;
    const successRate = totalLogs > 0 ? ((totalSuccess / totalLogs) * 100).toFixed(1) : '100.0';

    // Channel breakdown
    const emailCount = await prisma.notificationLog.count({ where: { projectId, channel: 'email' } });
    const smsCount = await prisma.notificationLog.count({ where: { projectId, channel: 'sms' } });
    const webhookCount = await prisma.notificationLog.count({ where: { projectId, channel: 'webhook' } });

    return res.json({
      analytics: {
        total: totalLogs,
        sent: totalSuccess,
        failed: failedLogs,
        queued: queuedLogs,
        successRate: parseFloat(successRate),
        channels: {
          email: emailCount,
          sms: smsCount,
          webhook: webhookCount,
        },
      },
    });
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
