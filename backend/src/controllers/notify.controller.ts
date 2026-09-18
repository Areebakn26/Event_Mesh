import { Response } from 'express';
import { ApiRequest } from '../middleware/apiKey.middleware';
import prisma from '../config/db';
import { enqueueNotification, NotificationJobData } from '../services/queue.service';
import { validatePlaceholders } from '../utils/templateCompiler';
import { emitLogUpdate } from '../utils/eventBus';

export const sendNotification = async (req: ApiRequest, res: Response): Promise<any> => {
  try {
    const { templateId, topicKey, subscriberId, subscriber: inlineSubscriber, recipient: rawRecipient, channels: inputChannels, data } = req.body;

    let channels: string[] = inputChannels;
    let recipient = rawRecipient || {};
    let subscriber: any = null;

    // --- 1. RESOLVE SUBSCRIBER DETAILS ---
    const targetSubscriberId = subscriberId || (inlineSubscriber && inlineSubscriber.subscriberId);

    if (targetSubscriberId) {
      // Find existing subscriber or auto-upsert if inline subscriber details provided
      if (inlineSubscriber) {
        subscriber = await prisma.subscriber.upsert({
          where: {
            projectId_subscriberId: {
              projectId: req.project.id,
              subscriberId: targetSubscriberId.toString(),
            },
          },
          update: {
            email: inlineSubscriber.email || undefined,
            phone: inlineSubscriber.phone || undefined,
            firstName: inlineSubscriber.firstName || undefined,
            lastName: inlineSubscriber.lastName || undefined,
            data: inlineSubscriber.data || undefined,
          },
          create: {
            projectId: req.project.id,
            subscriberId: targetSubscriberId.toString(),
            email: inlineSubscriber.email,
            phone: inlineSubscriber.phone,
            firstName: inlineSubscriber.firstName,
            lastName: inlineSubscriber.lastName,
            data: inlineSubscriber.data,
          },
          include: { preferences: true },
        });
      } else {
        subscriber = await prisma.subscriber.findUnique({
          where: {
            projectId_subscriberId: {
              projectId: req.project.id,
              subscriberId: targetSubscriberId.toString(),
            },
          },
          include: { preferences: true },
        });
      }

      // Auto-populate missing recipient contacts from subscriber profile
      if (subscriber) {
        recipient = {
          email: recipient.email || subscriber.email,
          phone: recipient.phone || subscriber.phone,
          firstName: subscriber.firstName,
          lastName: subscriber.lastName,
          ...recipient,
        };
      }
    }

    if (!recipient || (!recipient.email && !recipient.phone && !recipient.webhookUrl)) {
      return res.status(400).json({ error: 'Missing or unresolvable recipient contact information' });
    }

    if (!channels || !Array.isArray(channels) || channels.length === 0) {
      return res.status(400).json({ error: 'Missing or invalid channels array' });
    }

    // --- 2. SUBSCRIBER PREFERENCE CHECK ---
    let activeChannels = [...channels];
    let topicId: string | null = null;

    if (topicKey) {
      const topic = await prisma.notificationTopic.findUnique({
        where: { projectId_key: { projectId: req.project.id, key: topicKey } },
      });
      if (topic) topicId = topic.id;
    }

    if (subscriber && subscriber.preferences && subscriber.preferences.length > 0) {
      activeChannels = channels.filter(ch => {
        // Find topic-specific or global preference for this channel
        const pref = subscriber.preferences.find(
          (p: any) => p.channel === ch && (topicId ? p.topicId === topicId : p.topicId === null)
        );
        // If preference explicitly set to false, filter channel out
        return pref ? pref.enabled : true;
      });
    }

    // If ALL target channels were disabled by subscriber preferences
    if (activeChannels.length === 0) {
      const recipientString = recipient.email || recipient.phone || recipient.webhookUrl || JSON.stringify(recipient);
      
      const logEntry = await prisma.notificationLog.create({
        data: {
          projectId: req.project.id,
          channel: channels.join(','),
          status: 'preference_filtered',
          recipient: recipientString,
          payload: { templateId, topicKey, subscriberId: targetSubscriberId, channels, recipient, data, reason: 'Disabled in subscriber preferences' },
          error: 'All dispatches filtered out by subscriber channel preferences',
        },
      });

      emitLogUpdate({
        id: logEntry.id,
        projectId: logEntry.projectId,
        channel: logEntry.channel,
        status: logEntry.status,
        recipient: logEntry.recipient,
        createdAt: logEntry.createdAt.toISOString(),
        payload: logEntry.payload,
      });

      return res.status(200).json({
        message: 'Notification skipped due to subscriber channel preferences',
        status: 'preference_filtered',
        filteredChannels: channels,
        logId: logEntry.id,
      });
    }

    // --- 3. TEMPLATE LOOKUP & PLACEHOLDER VALIDATION ---
    let resolvedTemplate: any = null;

    if (templateId) {
      resolvedTemplate = await prisma.template.findFirst({
        where: { id: templateId, projectId: req.project.id },
      });

      if (!resolvedTemplate) {
        resolvedTemplate = await prisma.template.findFirst({
          where: { name: templateId, projectId: req.project.id },
        });
      }

      if (resolvedTemplate && resolvedTemplate.placeholders && resolvedTemplate.placeholders.length > 0) {
        const missingKeys = validatePlaceholders(resolvedTemplate.placeholders, data || {});
        if (missingKeys.length > 0) {
          return res.status(400).json({
            error: 'Missing required template placeholders in data payload',
            missingPlaceholders: missingKeys,
          });
        }
      }
    }

    const recipientString = recipient.email || recipient.phone || recipient.webhookUrl || JSON.stringify(recipient);
    const fullPayload = {
      templateId,
      topicKey,
      subscriberId: targetSubscriberId,
      channels: activeChannels,
      recipient,
      data,
      template: resolvedTemplate ? { subject: resolvedTemplate.subject, body: resolvedTemplate.body } : null,
    };

    // --- 4. CREATE LOG & ENQUEUE TO BULLMQ ---
    const logEntry = await prisma.notificationLog.create({
      data: {
        projectId: req.project.id,
        channel: activeChannels.join(','),
        status: 'queued',
        recipient: recipientString,
        payload: fullPayload,
      },
    });

    const jobData: NotificationJobData = {
      projectId: req.project.id,
      templateId,
      recipient,
      channels: activeChannels,
      data,
      logId: logEntry.id,
    };

    const job = await enqueueNotification(jobData);

    const updatedLog = await prisma.notificationLog.update({
      where: { id: logEntry.id },
      data: { jobId: job.id?.toString() },
    });

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

    return res.status(202).json({
      message: 'Notification queued successfully',
      jobId: job.id,
      status: 'queued',
      subscriberId: targetSubscriberId,
      activeChannels,
      logId: logEntry.id,
    });
  } catch (error) {
    console.error('Notify Error:', error);
    return res.status(500).json({ error: 'Failed to queue notification' });
  }
};
