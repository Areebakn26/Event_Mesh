import { Request, Response } from 'express';
import prisma from '../config/db';
import {
  addSubscriberSseClient,
  removeSubscriberSseClient,
} from '../services/inappSse.service';

/**
 * Extract target subscriberId from query string, headers, or body
 */
const getTargetSubscriberId = (req: Request): string | null => {
  const subId =
    (req.query.subscriberId as string) ||
    (req.headers['x-subscriber-id'] as string) ||
    (req.body && req.body.subscriberId);
  return subId ? subId.toString().trim() : null;
};

// --- 1. LIST IN-APP MESSAGES (GET /v1/inapp) ---
export const listInAppMessages = async (req: Request, res: Response): Promise<any> => {
  try {
    const subscriberId = getTargetSubscriberId(req);

    if (!subscriberId) {
      return res.status(400).json({
        error: 'Missing subscriberId parameter. Please provide ?subscriberId=xyz or x-subscriber-id header.',
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const readParam = req.query.read as string;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      subscriber: {
        subscriberId,
      },
      ...(readParam !== undefined && { read: readParam === 'true' }),
    };

    const [messages, total, unreadCount] = await Promise.all([
      prisma.inAppMessage.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.inAppMessage.count({ where: whereClause }),
      prisma.inAppMessage.count({
        where: {
          subscriber: { subscriberId },
          read: false,
        },
      }),
    ]);

    return res.status(200).json({
      messages,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
        unreadCount,
      },
    });
  } catch (error) {
    console.error('List In-App Messages Error:', error);
    return res.status(500).json({ error: 'Failed to fetch in-app messages' });
  }
};

// --- 2. GET UNREAD MESSAGE COUNT (GET /v1/inapp/unread-count) ---
export const getUnreadCount = async (req: Request, res: Response): Promise<any> => {
  try {
    const subscriberId = getTargetSubscriberId(req);

    if (!subscriberId) {
      return res.status(400).json({
        error: 'Missing subscriberId parameter. Please provide ?subscriberId=xyz or x-subscriber-id header.',
      });
    }

    const unreadCount = await prisma.inAppMessage.count({
      where: {
        subscriber: { subscriberId },
        read: false,
      },
    });

    return res.status(200).json({
      subscriberId,
      unreadCount,
    });
  } catch (error) {
    console.error('Get Unread Count Error:', error);
    return res.status(500).json({ error: 'Failed to fetch unread message count' });
  }
};

// --- 3. MARK SINGLE MESSAGE AS READ (PATCH /v1/inapp/:messageId/read) ---
export const markAsRead = async (req: Request, res: Response): Promise<any> => {
  try {
    const messageId = req.params.messageId as string;

    const existing = await prisma.inAppMessage.findUnique({
      where: { id: messageId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'In-app message not found' });
    }

    const updatedMessage = await prisma.inAppMessage.update({
      where: { id: messageId },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return res.status(200).json({
      message: 'Message marked as read',
      inAppMessage: updatedMessage,
    });
  } catch (error) {
    console.error('Mark as Read Error:', error);
    return res.status(500).json({ error: 'Failed to update message status' });
  }
};

// --- 4. MARK ALL MESSAGES AS READ FOR SUBSCRIBER (PATCH /v1/inapp/read-all) ---
export const markAllAsRead = async (req: Request, res: Response): Promise<any> => {
  try {
    const subscriberId = getTargetSubscriberId(req);

    if (!subscriberId) {
      return res.status(400).json({
        error: 'Missing subscriberId parameter. Please provide subscriberId in body, query, or x-subscriber-id header.',
      });
    }

    const subscribers = await prisma.subscriber.findMany({
      where: { subscriberId },
      select: { id: true },
    });

    if (subscribers.length === 0) {
      return res.status(200).json({ message: 'No subscriber found', updatedCount: 0 });
    }

    const subscriberIds = subscribers.map((s) => s.id);

    const result = await prisma.inAppMessage.updateMany({
      where: {
        subscriberId: { in: subscriberIds },
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return res.status(200).json({
      message: 'All unread in-app messages marked as read',
      updatedCount: result.count,
    });
  } catch (error) {
    console.error('Mark All as Read Error:', error);
    return res.status(500).json({ error: 'Failed to mark all messages as read' });
  }
};

// --- 5. REAL-TIME SSE STREAM (GET /v1/inapp/stream) ---
export const streamInAppMessages = async (req: Request, res: Response): Promise<any> => {
  const subscriberId = getTargetSubscriberId(req);

  if (!subscriberId) {
    return res.status(400).json({
      error: 'Missing subscriberId parameter. Please provide ?subscriberId=xyz or x-subscriber-id header.',
    });
  }

  // Set mandatory headers for Server-Sent Events (SSE)
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Send initial connection handshake payload
  res.write(`event: connected\ndata: ${JSON.stringify({ subscriberId, connected: true, timestamp: new Date().toISOString() })}\n\n`);

  // Register in-memory client connection
  addSubscriberSseClient(subscriberId, res);

  // Clean disconnection listener to prevent memory leaks
  req.on('close', () => {
    removeSubscriberSseClient(subscriberId, res);
  });
};
