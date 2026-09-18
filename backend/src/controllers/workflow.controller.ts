import { Response } from 'express';
import { ApiRequest } from '../middleware/apiKey.middleware';
import prisma from '../config/db';
import { enqueueWorkflowStep } from '../services/workflowQueue.service';

// --- 1. CREATE WORKFLOW ---
export const createWorkflow = async (req: ApiRequest, res: Response): Promise<any> => {
  try {
    const { name, triggerIdentifier, steps, description, active } = req.body;

    if (!name || !triggerIdentifier || !Array.isArray(steps)) {
      return res.status(400).json({
        error: 'Missing required fields: name, triggerIdentifier, and steps (must be an array)',
      });
    }

    const key = triggerIdentifier.toLowerCase().trim().replace(/\s+/g, '-');

    const workflow = await prisma.workflow.create({
      data: {
        projectId: req.project.id,
        name,
        triggerIdentifier: key,
        steps,
        description,
        active: active !== undefined ? active : true,
      },
    });

    return res.status(201).json({ message: 'Workflow created successfully', workflow });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'A workflow with this triggerIdentifier already exists in this project' });
    }
    console.error('Create Workflow Error:', error);
    return res.status(500).json({ error: 'Failed to create workflow' });
  }
};

// --- 2. LIST WORKFLOWS ---
export const listWorkflows = async (req: ApiRequest, res: Response): Promise<any> => {
  try {
    const workflows = await prisma.workflow.findMany({
      where: { projectId: req.project.id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { runs: true },
        },
      },
    });

    return res.status(200).json({ workflows });
  } catch (error) {
    console.error('List Workflows Error:', error);
    return res.status(500).json({ error: 'Failed to fetch workflows' });
  }
};

// --- 3. GET SINGLE WORKFLOW ---
export const getWorkflow = async (req: ApiRequest, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;

    const workflow = await prisma.workflow.findFirst({
      where: {
        id,
        projectId: req.project.id,
      },
      include: {
        runs: {
          take: 20,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    return res.status(200).json({ workflow });
  } catch (error) {
    console.error('Get Workflow Error:', error);
    return res.status(500).json({ error: 'Failed to fetch workflow' });
  }
};

// --- 4. UPDATE WORKFLOW ---
export const updateWorkflow = async (req: ApiRequest, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const { name, triggerIdentifier, steps, description, active } = req.body;

    const existing = await prisma.workflow.findFirst({
      where: { id, projectId: req.project.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    const key = triggerIdentifier ? (triggerIdentifier as string).toLowerCase().trim().replace(/\s+/g, '-') : undefined;

    const workflow = await prisma.workflow.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(key && { triggerIdentifier: key }),
        ...(steps && { steps }),
        ...(description !== undefined && { description }),
        ...(active !== undefined && { active }),
      },
    });

    return res.status(200).json({ message: 'Workflow updated successfully', workflow });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'A workflow with this triggerIdentifier already exists' });
    }
    console.error('Update Workflow Error:', error);
    return res.status(500).json({ error: 'Failed to update workflow' });
  }
};

// --- 5. DELETE WORKFLOW ---
export const deleteWorkflow = async (req: ApiRequest, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;

    const existing = await prisma.workflow.findFirst({
      where: { id, projectId: req.project.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    await prisma.workflow.delete({ where: { id } });

    return res.status(200).json({ message: 'Workflow deleted successfully' });
  } catch (error) {
    console.error('Delete Workflow Error:', error);
    return res.status(500).json({ error: 'Failed to delete workflow' });
  }
};

// --- 6. TRIGGER WORKFLOW (POST /v1/workflows/:triggerIdentifier/trigger) ---
export const triggerWorkflow = async (req: ApiRequest, res: Response): Promise<any> => {
  try {
    const triggerIdentifier = req.params.triggerIdentifier as string;
    const { subscriberId, recipient, payload, email, phone, firstName, lastName } = req.body;

    // Resolve final subscriber ID & inline details
    const subId =
      subscriberId ||
      recipient?.subscriberId ||
      (email ? email.split('@')[0] : null) ||
      (recipient?.email ? recipient.email.split('@')[0] : null) ||
      (phone ? phone.replace(/\D/g, '') : null) ||
      (recipient?.phone ? recipient.phone.replace(/\D/g, '') : null);

    if (!subId) {
      return res.status(400).json({
        error: 'Missing recipient identifier: Please provide subscriberId, email, or phone',
      });
    }

    const subEmail = email || recipient?.email;
    const subPhone = phone || recipient?.phone;
    const subFirstName = firstName || recipient?.firstName;
    const subLastName = lastName || recipient?.lastName;

    // Phase 1 Auto-Upsert Subscriber
    await prisma.subscriber.upsert({
      where: {
        projectId_subscriberId: {
          projectId: req.project.id,
          subscriberId: subId.toString(),
        },
      },
      update: {
        ...(subEmail && { email: subEmail }),
        ...(subPhone && { phone: subPhone }),
        ...(subFirstName && { firstName: subFirstName }),
        ...(subLastName && { lastName: subLastName }),
      },
      create: {
        projectId: req.project.id,
        subscriberId: subId.toString(),
        email: subEmail,
        phone: subPhone,
        firstName: subFirstName,
        lastName: subLastName,
      },
    });

    // Lookup Workflow by triggerIdentifier & projectId
    const normalizedKey = triggerIdentifier.toLowerCase().trim().replace(/\s+/g, '-');
    const workflow = await prisma.workflow.findUnique({
      where: {
        projectId_triggerIdentifier: {
          projectId: req.project.id,
          triggerIdentifier: normalizedKey,
        },
      },
    });

    if (!workflow) {
      return res.status(404).json({
        error: `Workflow with triggerIdentifier "${normalizedKey}" not found in this project`,
      });
    }

    if (!workflow.active) {
      return res.status(400).json({
        error: `Workflow "${workflow.name}" is currently inactive`,
      });
    }

    // Create WorkflowRun Record
    const run = await prisma.workflowRun.create({
      data: {
        workflowId: workflow.id,
        subscriberId: subId.toString(),
        projectId: req.project.id,
        currentStepIndex: 0,
        status: 'processing',
        payload: payload || {},
        logs: [
          {
            timestamp: new Date().toISOString(),
            stepIndex: 0,
            status: 'triggered',
            message: `Workflow "${workflow.name}" triggered for subscriber ${subId}`,
          },
        ],
      },
    });

    // Enqueue First Step into BullMQ Workflow Queue
    await enqueueWorkflowStep(run.id, 0);

    return res.status(202).json({
      message: 'Workflow triggered successfully',
      workflowRunId: run.id,
      workflowId: workflow.id,
      triggerIdentifier: normalizedKey,
      subscriberId: subId.toString(),
      status: 'processing',
    });
  } catch (error) {
    console.error('Trigger Workflow Error:', error);
    return res.status(500).json({ error: 'Failed to trigger workflow' });
  }
};

// --- 7. GET WORKFLOW RUN DETAILS & LOGS ---
export const getWorkflowRun = async (req: ApiRequest, res: Response): Promise<any> => {
  try {
    const runId = req.params.runId as string;

    const run = await prisma.workflowRun.findFirst({
      where: {
        id: runId,
        projectId: req.project.id,
      },
      include: {
        workflow: true,
      },
    });

    if (!run) {
      return res.status(404).json({ error: 'Workflow run not found' });
    }

    return res.status(200).json({ run });
  } catch (error) {
    console.error('Get Workflow Run Error:', error);
    return res.status(500).json({ error: 'Failed to fetch workflow run' });
  }
};
