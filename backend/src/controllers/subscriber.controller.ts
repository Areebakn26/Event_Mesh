import { Response } from 'express';
import { ApiRequest } from '../middleware/apiKey.middleware';
import prisma from '../config/db';

// --- 1. UPSERT SUBSCRIBER (Create or Update by subscriberId) ---
export const upsertSubscriber = async (req: ApiRequest, res: Response): Promise<any> => {
  try {
    const { subscriberId, email, phone, firstName, lastName, avatar, locale, timeZone, data } = req.body;

    if (!subscriberId) {
      return res.status(400).json({ error: 'Missing required field: subscriberId' });
    }

    const subscriber = await prisma.subscriber.upsert({
      where: {
        projectId_subscriberId: {
          projectId: req.project.id,
          subscriberId: subscriberId.toString(),
        },
      },
      update: {
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(avatar !== undefined && { avatar }),
        ...(locale !== undefined && { locale }),
        ...(timeZone !== undefined && { timeZone }),
        ...(data !== undefined && { data }),
      },
      create: {
        projectId: req.project.id,
        subscriberId: subscriberId.toString(),
        email,
        phone,
        firstName,
        lastName,
        avatar,
        locale: locale || 'en',
        timeZone,
        data,
      },
      include: {
        preferences: {
          include: {
            topic: true,
          },
        },
      },
    });

    return res.status(200).json({ message: 'Subscriber saved successfully', subscriber });
  } catch (error) {
    console.error('Upsert Subscriber Error:', error);
    return res.status(500).json({ error: 'Failed to save subscriber' });
  }
};

// --- 2. LIST SUBSCRIBERS (Pagination + Search) ---
export const listSubscribers = async (req: ApiRequest, res: Response): Promise<any> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = (req.query.search as string) || '';

    const skip = (page - 1) * limit;

    const whereClause: any = {
      projectId: req.project.id,
      ...(search && {
        OR: [
          { subscriberId: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [subscribers, total] = await Promise.all([
      prisma.subscriber.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          preferences: true,
        },
      }),
      prisma.subscriber.count({ where: whereClause }),
    ]);

    return res.status(200).json({
      subscribers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('List Subscribers Error:', error);
    return res.status(500).json({ error: 'Failed to fetch subscribers' });
  }
};

// --- 3. GET SINGLE SUBSCRIBER + PREFERENCES ---
export const getSubscriber = async (req: ApiRequest, res: Response): Promise<any> => {
  try {
    const subscriberId = req.params.subscriberId as string;

    const subscriber = await prisma.subscriber.findUnique({
      where: {
        projectId_subscriberId: {
          projectId: req.project.id,
          subscriberId,
        },
      },
      include: {
        preferences: {
          include: {
            topic: true,
          },
        },
      },
    });

    if (!subscriber) {
      return res.status(404).json({ error: 'Subscriber not found' });
    }

    return res.status(200).json({ subscriber });
  } catch (error) {
    console.error('Get Subscriber Error:', error);
    return res.status(500).json({ error: 'Failed to fetch subscriber' });
  }
};

// --- 4. DELETE SUBSCRIBER ---
export const deleteSubscriber = async (req: ApiRequest, res: Response): Promise<any> => {
  try {
    const subscriberId = req.params.subscriberId as string;

    await prisma.subscriber.delete({
      where: {
        projectId_subscriberId: {
          projectId: req.project.id,
          subscriberId,
        },
      },
    });

    return res.status(200).json({ message: 'Subscriber deleted successfully' });
  } catch (error) {
    console.error('Delete Subscriber Error:', error);
    return res.status(500).json({ error: 'Failed to delete subscriber' });
  }
};

// --- 5. GET SUBSCRIBER PREFERENCE MATRIX ---
export const getSubscriberPreferences = async (req: ApiRequest, res: Response): Promise<any> => {
  try {
    const subscriberId = req.params.subscriberId as string;

    const subscriber = await prisma.subscriber.findUnique({
      where: {
        projectId_subscriberId: {
          projectId: req.project.id,
          subscriberId,
        },
      },
    });

    if (!subscriber) {
      return res.status(404).json({ error: 'Subscriber not found' });
    }

    const [allTopics, preferences] = await Promise.all([
      prisma.notificationTopic.findMany({
        where: { projectId: req.project.id },
      }),
      prisma.subscriberPreference.findMany({
        where: { subscriberId: subscriber.id },
        include: { topic: true },
      }),
    ]);

    return res.status(200).json({
      subscriberId: subscriber.subscriberId,
      topics: allTopics,
      preferences,
    });
  } catch (error) {
    console.error('Get Preferences Error:', error);
    return res.status(500).json({ error: 'Failed to fetch preferences' });
  }
};

// --- 6. UPDATE SUBSCRIBER PREFERENCES ---
export const updateSubscriberPreferences = async (req: ApiRequest, res: Response): Promise<any> => {
  try {
    const subscriberId = req.params.subscriberId as string;
    const { preferences } = req.body; // Array of { channel: string, topicKey?: string, enabled: boolean }

    if (!Array.isArray(preferences)) {
      return res.status(400).json({ error: 'Preferences must be an array' });
    }

    const subscriber = await prisma.subscriber.findUnique({
      where: {
        projectId_subscriberId: {
          projectId: req.project.id,
          subscriberId,
        },
      },
    });

    if (!subscriber) {
      return res.status(404).json({ error: 'Subscriber not found' });
    }

    // Process each preference update in parallel
    const updateResults = await Promise.all(
      preferences.map(async (pref: { channel: string; topicKey?: string; enabled: boolean }) => {
        let topicId: string | null = null;

        if (pref.topicKey) {
          const topic = await prisma.notificationTopic.findUnique({
            where: {
              projectId_key: {
                projectId: req.project.id,
                key: pref.topicKey,
              },
            },
          });
          if (topic) topicId = topic.id;
        }

        return prisma.subscriberPreference.upsert({
          where: {
            subscriberId_topicId_channel: {
              subscriberId: subscriber.id,
              topicId: topicId || '',
              channel: pref.channel,
            },
          },
          update: {
            enabled: pref.enabled,
          },
          create: {
            subscriberId: subscriber.id,
            topicId: topicId,
            channel: pref.channel,
            enabled: pref.enabled,
          },
        });
      })
    );

    return res.status(200).json({
      message: 'Preferences updated successfully',
      updatedCount: updateResults.length,
    });
  } catch (error) {
    console.error('Update Preferences Error:', error);
    return res.status(500).json({ error: 'Failed to update preferences' });
  }
};

// --- 7. TOPICS MANAGEMENT (List & Create Topics) ---
export const listTopics = async (req: ApiRequest, res: Response): Promise<any> => {
  try {
    const topics = await prisma.notificationTopic.findMany({
      where: { projectId: req.project.id },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json({ topics });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch topics' });
  }
};

export const createTopic = async (req: ApiRequest, res: Response): Promise<any> => {
  try {
    const { key, name, description } = req.body;
    if (!key || !name) {
      return res.status(400).json({ error: 'Missing required fields: key, name' });
    }

    const topic = await prisma.notificationTopic.create({
      data: {
        projectId: req.project.id,
        key: key.toLowerCase().replace(/\s+/g, '_'),
        name,
        description,
      },
    });

    return res.status(201).json({ topic });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create topic' });
  }
};
