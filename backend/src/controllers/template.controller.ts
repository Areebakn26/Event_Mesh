import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/db';
import { extractPlaceholders } from '../utils/templateCompiler';

export const getTemplates = async (req: AuthRequest, res: Response) => {
  try {
    const projectId = String(req.params.projectId);
    const userId = req.user?.id;

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const templates = await prisma.template.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ templates });
  } catch (error) {
    console.error('Failed to fetch templates:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const createTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const projectId = String(req.params.projectId);
    const { name, channel, subject, body } = req.body;
    const userId = req.user?.id;

    if (!name || !channel || !body) {
      return res.status(400).json({ error: 'Name, channel, and body are required' });
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Auto-extract {{placeholders}} from subject and body
    const fullText = `${subject || ''} ${body}`;
    const placeholders = extractPlaceholders(fullText);

    const template = await prisma.template.create({
      data: {
        name,
        channel,
        subject: subject || null,
        body,
        placeholders,
        projectId,
      },
    });

    return res.status(201).json({ template });
  } catch (error) {
    console.error('Failed to create template:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const { name, channel, subject, body } = req.body;
    const userId = req.user?.id;

    const existingTemplate = await prisma.template.findFirst({
      where: { id, project: { userId } },
    });

    if (!existingTemplate) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const fullText = `${subject !== undefined ? subject : existingTemplate.subject || ''} ${body || existingTemplate.body}`;
    const placeholders = extractPlaceholders(fullText);

    const updatedTemplate = await prisma.template.update({
      where: { id },
      data: {
        name: name || existingTemplate.name,
        channel: channel || existingTemplate.channel,
        subject: subject !== undefined ? subject : existingTemplate.subject,
        body: body || existingTemplate.body,
        placeholders,
      },
    });

    return res.json({ template: updatedTemplate });
  } catch (error) {
    console.error('Failed to update template:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const userId = req.user?.id;

    const existingTemplate = await prisma.template.findFirst({
      where: { id, project: { userId } },
    });

    if (!existingTemplate) {
      return res.status(404).json({ error: 'Template not found' });
    }

    await prisma.template.delete({ where: { id } });

    return res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Failed to delete template:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
