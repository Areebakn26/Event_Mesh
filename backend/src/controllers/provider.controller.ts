import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { ApiRequest } from '../middleware/apiKey.middleware';
import prisma from '../config/db';

// --- LEGACY PROVIDER CONFIG (Dashboard) ---
export const getProviderConfig = async (req: AuthRequest, res: Response) => {
  try {
    const projectId = String(req.params.projectId);
    const userId = req.user?.id;

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
      include: { providerConfig: true, channelProviders: true },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    return res.json({
      providerConfig: (project as any).providerConfig || null,
      channelProviders: (project as any).channelProviders || [],
    });
  } catch (error) {
    console.error('Failed to fetch provider config:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProviderConfig = async (req: AuthRequest, res: Response) => {
  try {
    const projectId = String(req.params.projectId);
    const userId = req.user?.id;
    const {
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPass,
      twilioSid,
      twilioToken,
      twilioPhone,
      webhookSecret,
    } = req.body;

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const config = await prisma.providerConfig.upsert({
      where: { projectId },
      create: {
        projectId,
        smtpHost: smtpHost || null,
        smtpPort: smtpPort ? parseInt(smtpPort, 10) : null,
        smtpUser: smtpUser || null,
        smtpPass: smtpPass || null,
        twilioSid: twilioSid || null,
        twilioToken: twilioToken || null,
        twilioPhone: twilioPhone || null,
        webhookSecret: webhookSecret || undefined,
      },
      update: {
        smtpHost: smtpHost !== undefined ? smtpHost : undefined,
        smtpPort: smtpPort ? parseInt(smtpPort, 10) : undefined,
        smtpUser: smtpUser !== undefined ? smtpUser : undefined,
        smtpPass: smtpPass !== undefined ? smtpPass : undefined,
        twilioSid: twilioSid !== undefined ? twilioSid : undefined,
        twilioToken: twilioToken !== undefined ? twilioToken : undefined,
        twilioPhone: twilioPhone !== undefined ? twilioPhone : undefined,
        webhookSecret: webhookSecret !== undefined ? webhookSecret : undefined,
      },
    });

    return res.json({ providerConfig: config });
  } catch (error) {
    console.error('Failed to update provider config:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// --- PHASE 4 CHANNEL PROVIDER CRUD & REORDER ENDPOINTS (/v1/providers) ---

// 1. CREATE CHANNEL PROVIDER
export const createChannelProvider = async (req: ApiRequest, res: Response): Promise<any> => {
  try {
    const { channel, providerIdentifier, credentials, priority, active, rateLimitPerSecond } = req.body;

    if (!channel || !providerIdentifier) {
      return res.status(400).json({ error: 'Missing required fields: channel, providerIdentifier' });
    }

    // Determine default priority (max current priority + 1)
    let assignedPriority = priority;
    if (assignedPriority === undefined) {
      const existingMax = await prisma.channelProvider.findFirst({
        where: { projectId: req.project.id, channel },
        orderBy: { priority: 'desc' },
      });
      assignedPriority = existingMax ? existingMax.priority + 1 : 1;
    }

    const provider = await prisma.channelProvider.create({
      data: {
        projectId: req.project.id,
        channel: channel.toLowerCase().trim(),
        providerIdentifier: providerIdentifier.toLowerCase().trim(),
        credentials: credentials || {},
        priority: Number(assignedPriority),
        active: active !== undefined ? active : true,
        rateLimitPerSecond: rateLimitPerSecond !== undefined ? Number(rateLimitPerSecond) : 10,
      },
    });

    return res.status(201).json({ message: 'Channel provider added successfully', provider });
  } catch (error) {
    console.error('Create Channel Provider Error:', error);
    return res.status(500).json({ error: 'Failed to create channel provider' });
  }
};

// 2. LIST CHANNEL PROVIDERS
export const listChannelProviders = async (req: ApiRequest, res: Response): Promise<any> => {
  try {
    const channelFilter = req.query.channel as string;

    const providers = await prisma.channelProvider.findMany({
      where: {
        projectId: req.project.id,
        ...(channelFilter && { channel: channelFilter.toLowerCase() }),
      },
      orderBy: [
        { channel: 'asc' },
        { priority: 'asc' },
      ],
    });

    return res.status(200).json({ providers });
  } catch (error) {
    console.error('List Channel Providers Error:', error);
    return res.status(500).json({ error: 'Failed to fetch channel providers' });
  }
};

// 3. UPDATE CHANNEL PROVIDER
export const updateChannelProvider = async (req: ApiRequest, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const { providerIdentifier, credentials, priority, active, rateLimitPerSecond } = req.body;

    const existing = await prisma.channelProvider.findFirst({
      where: { id, projectId: req.project.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Channel provider configuration not found' });
    }

    const updated = await prisma.channelProvider.update({
      where: { id },
      data: {
        ...(providerIdentifier && { providerIdentifier: providerIdentifier.toLowerCase().trim() }),
        ...(credentials !== undefined && { credentials }),
        ...(priority !== undefined && { priority: Number(priority) }),
        ...(active !== undefined && { active }),
        ...(rateLimitPerSecond !== undefined && { rateLimitPerSecond: Number(rateLimitPerSecond) }),
      },
    });

    return res.status(200).json({ message: 'Channel provider updated successfully', provider: updated });
  } catch (error) {
    console.error('Update Channel Provider Error:', error);
    return res.status(500).json({ error: 'Failed to update channel provider' });
  }
};

// 4. DELETE CHANNEL PROVIDER
export const deleteChannelProvider = async (req: ApiRequest, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;

    const existing = await prisma.channelProvider.findFirst({
      where: { id, projectId: req.project.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Channel provider configuration not found' });
    }

    await prisma.channelProvider.delete({ where: { id } });

    return res.status(200).json({ message: 'Channel provider deleted successfully' });
  } catch (error) {
    console.error('Delete Channel Provider Error:', error);
    return res.status(500).json({ error: 'Failed to delete channel provider' });
  }
};

// 5. REORDER PROVIDER PRIORITIES (PATCH /v1/providers/reorder)
export const reorderChannelProviders = async (req: ApiRequest, res: Response): Promise<any> => {
  try {
    const { providerOrder } = req.body; // Array of { id: string, priority: number }

    if (!Array.isArray(providerOrder)) {
      return res.status(400).json({ error: 'providerOrder must be an array of { id, priority }' });
    }

    const updatePromises = providerOrder.map((item) =>
      prisma.channelProvider.updateMany({
        where: {
          id: item.id,
          projectId: req.project.id,
        },
        data: {
          priority: Number(item.priority),
        },
      })
    );

    await Promise.all(updatePromises);

    const updatedProviders = await prisma.channelProvider.findMany({
      where: { projectId: req.project.id },
      orderBy: [{ channel: 'asc' }, { priority: 'asc' }],
    });

    return res.status(200).json({
      message: 'Provider priorities reordered successfully',
      providers: updatedProviders,
    });
  } catch (error) {
    console.error('Reorder Channel Providers Error:', error);
    return res.status(500).json({ error: 'Failed to reorder provider priorities' });
  }
};
