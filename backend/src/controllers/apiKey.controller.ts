import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/db';
import { generateApiKey, hashApiKey } from '../utils/hash';

export const generateKey = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { projectId, name } = req.body;
    
    if (!projectId || !name) {
      return res.status(400).json({ error: 'Project ID and Key name are required' });
    }

    // Verify project belongs to user
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.userId !== req.user.id) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const rawApiKey = generateApiKey();
    const hashedKey = hashApiKey(rawApiKey);

    const apiKeyRecord = await prisma.apiKey.create({
      data: {
        name,
        hash: hashedKey,
        projectId,
      }
    });

    // Return the raw key ONLY ONCE.
    return res.status(201).json({
      message: 'API Key generated successfully. Please copy it now, you will not be able to see it again.',
      apiKey: rawApiKey,
      id: apiKeyRecord.id,
      name: apiKeyRecord.name
    });
  } catch (error) {
    console.error('API Key generation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const listKeys = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const projectId = req.params.projectId as string;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.userId !== req.user.id) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const keys = await prisma.apiKey.findMany({
      where: { projectId },
      select: { id: true, name: true, createdAt: true, lastUsed: true }
      // Notice we do NOT select the hash!
    });

    return res.status(200).json({ keys });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const revokeKey = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const keyId = req.params.keyId as string;

    const keyRecord = await prisma.apiKey.findUnique({
      where: { id: keyId },
      include: { project: true }
    });

    if (!keyRecord || (keyRecord as any).project.userId !== req.user.id) {
      return res.status(404).json({ error: 'API Key not found' });
    }

    await prisma.apiKey.delete({ where: { id: keyId } });
    return res.status(200).json({ message: 'API Key revoked' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};
