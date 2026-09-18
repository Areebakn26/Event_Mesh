import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import prisma from '../config/db';
import { NotificationJobData, dlqQueue } from '../services/queue.service';
import { sendEmail } from '../services/email.service';
import { sendSms } from '../services/sms.service';
import { sendWebhook } from '../services/webhook.service';
import { compileTemplate } from '../utils/templateCompiler';
import { emitLogUpdate } from '../utils/eventBus';
import { broadcastInAppMessage } from '../services/inappSse.service';
import { dispatchNotificationWithFailover } from '../services/dispatcher.service';
import dotenv from 'dotenv';

dotenv.config();

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const processJob = async (job: Job<NotificationJobData>) => {
  const { logId, templateId, channels, recipient, data, projectId } = job.data;
  
  console.log(`[Worker] Processing Job ${job.id} for Log ${logId}`);

  // Broadcast "processing" status via SSE
  const existingLog = await prisma.notificationLog.findUnique({ where: { id: logId } });
  if (existingLog) {
    await prisma.notificationLog.update({
      where: { id: logId },
      data: { status: 'processing' },
    });
    emitLogUpdate({
      id: existingLog.id,
      projectId,
      jobId: job.id?.toString(),
      channel: existingLog.channel,
      status: 'processing',
      recipient: existingLog.recipient,
      createdAt: existingLog.createdAt.toISOString(),
      payload: existingLog.payload,
    });
  }

  try {
    // 1. Fetch project provider config (custom credentials or fallback)
    const providerConfig = await prisma.providerConfig.findUnique({
      where: { projectId },
    });

    // 2. Fetch template if templateId provided
    let subjectTemplate = 'Notification';
    let bodyTemplate = 'You have a new notification from EventMesh.';

    if (templateId) {
      const dbTemplate = await prisma.template.findFirst({
        where: {
          projectId,
          OR: [{ id: templateId }, { name: templateId }],
        },
      });

      if (dbTemplate) {
        if (dbTemplate.subject) subjectTemplate = dbTemplate.subject;
        bodyTemplate = dbTemplate.body;
      }
    }

    // Compile templates using Handlebars and payload data
    const compiledSubject = compileTemplate(subjectTemplate, data || {});
    const compiledBody = compileTemplate(bodyTemplate, data || {});

    const dispatchPromises = channels.map((ch) =>
      dispatchNotificationWithFailover({
        projectId,
        channel: ch,
        recipient,
        subject: compiledSubject,
        body: compiledBody,
        data: data || {},
      })
    );

    if (dispatchPromises.length === 0) {
      throw new Error('No valid channels specified.');
    }

    // Await all channel dispatches
    await Promise.all(dispatchPromises);

    // Success! Update database log to completed
    const updatedLog = await prisma.notificationLog.update({
      where: { id: logId },
      data: { status: 'sent', error: null },
    });

    console.log(`[Worker] Job ${job.id} completed across channels: ${channels.join(', ')}`);

    // Broadcast SSE completion
    emitLogUpdate({
      id: updatedLog.id,
      projectId,
      jobId: job.id?.toString(),
      channel: updatedLog.channel,
      status: 'sent',
      recipient: updatedLog.recipient,
      createdAt: updatedLog.createdAt.toISOString(),
      payload: updatedLog.payload,
    });
    
  } catch (error: any) {
    console.error(`[Worker] Job ${job.id} failed:`, error.message);
    
    // Update log to failed
    const updatedLog = await prisma.notificationLog.update({
      where: { id: logId },
      data: { status: 'failed', error: error.message },
    });

    // Broadcast SSE failure
    emitLogUpdate({
      id: updatedLog.id,
      projectId,
      jobId: job.id?.toString(),
      channel: updatedLog.channel,
      status: 'failed',
      error: error.message,
      recipient: updatedLog.recipient,
      createdAt: updatedLog.createdAt.toISOString(),
      payload: updatedLog.payload,
    });
    
    throw error;
  }
};

export const notificationWorker = new Worker('notifications', processJob, {
  connection,
  concurrency: 5,
});

// DLQ Event Listener
notificationWorker.on('failed', async (job, err) => {
  if (job) {
    console.log(`[Worker] Job ${job.id} failed. Attempts made: ${job.attemptsMade}`);
    
    if (job.attemptsMade >= (job.opts.attempts || 3)) {
      console.log(`[Worker] Moving Job ${job.id} to Dead-Letter Queue!`);
      
      await dlqQueue.add('dlq_fallback', job.data);
      
      const updatedLog = await prisma.notificationLog.update({
        where: { id: job.data.logId },
        data: { status: 'dead_lettered', error: `Max retries reached: ${err.message}` },
      });

      // Broadcast SSE dead-lettered event
      emitLogUpdate({
        id: updatedLog.id,
        projectId: job.data.projectId,
        jobId: job.id?.toString(),
        channel: updatedLog.channel,
        status: 'dead_lettered',
        error: updatedLog.error || undefined,
        recipient: updatedLog.recipient,
        createdAt: updatedLog.createdAt.toISOString(),
        payload: updatedLog.payload,
      });
    }
  }
});
