import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/db';
import { enqueueNotification } from '../services/queue.service';
import { emitLogUpdate } from '../utils/eventBus';

export const getDlqLogs = async (req: AuthRequest, res: Response) => {
  try {
    const projectId = String(req.params.projectId);
    const userId = req.user?.id;

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const dlqLogs = await prisma.notificationLog.findMany({
      where: {
        projectId,
        status: { in: ['failed', 'dead_lettered'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ logs: dlqLogs });
  } catch (error) {
    console.error('Failed to fetch DLQ logs:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const retryDlqJob = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const userId = req.user?.id;

    const logEntry = await prisma.notificationLog.findFirst({
      where: { id, project: { userId } },
    });

    if (!logEntry) {
      return res.status(404).json({ error: 'DLQ record not found' });
    }

    const payload = (typeof logEntry.payload === 'string' ? JSON.parse(logEntry.payload) : logEntry.payload) as any || {};

    // Re-enqueue job into BullMQ
    const job = await enqueueNotification({
      logId: logEntry.id,
      projectId: logEntry.projectId,
      templateId: payload.templateId || '',
      channels: payload.channels || [logEntry.channel],
      recipient: payload.recipient || { email: logEntry.recipient, phone: logEntry.recipient, webhookUrl: logEntry.recipient },
      data: payload.data || {},
    });

    // Update log status back to queued
    const updatedLog = await prisma.notificationLog.update({
      where: { id: logEntry.id },
      data: {
        jobId: job.id?.toString(),
        status: 'queued',
        error: null,
        attempts: { increment: 1 },
      },
    });

    // Broadcast SSE update
    emitLogUpdate({
      id: updatedLog.id,
      projectId: updatedLog.projectId,
      jobId: updatedLog.jobId || undefined,
      channel: updatedLog.channel,
      status: updatedLog.status,
      recipient: updatedLog.recipient,
      createdAt: updatedLog.createdAt.toISOString(),
      payload: updatedLog.payload,
    });

    return res.json({ message: 'Job re-enqueued successfully', logId: updatedLog.id, jobId: job.id });
  } catch (error) {
    console.error('Failed to retry DLQ job:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const purgeDlqJob = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const userId = req.user?.id;

    const logEntry = await prisma.notificationLog.findFirst({
      where: { id, project: { userId } },
    });

    if (!logEntry) {
      return res.status(404).json({ error: 'DLQ record not found' });
    }

    await prisma.notificationLog.delete({ where: { id } });

    return res.json({ message: 'DLQ log purged successfully' });
  } catch (error) {
    console.error('Failed to purge DLQ job:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
