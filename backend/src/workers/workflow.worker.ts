import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import prisma from '../config/db';
import {
  WorkflowJobData,
  DigestJobData,
  enqueueWorkflowStep,
  enqueueFlushDigest,
} from '../services/workflowQueue.service';
import { compileTemplate } from '../utils/templateCompiler';
import { emitLogUpdate } from '../utils/eventBus';
import { dispatchNotificationWithFailover } from '../services/dispatcher.service';
import dotenv from 'dotenv';

dotenv.config();

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

/**
 * Handle Flush Digest Job (The Batch Processor)
 * Executes when BullMQ delayed 'flush_digest' job fires.
 */
const handleFlushDigestJob = async (job: Job<DigestJobData>) => {
  const { digestBatchId } = job.data;
  console.log(`[WorkflowWorker] Flushing DigestBatch ${digestBatchId}`);

  // a) Fetch the DigestBatch
  const batch = await prisma.digestBatch.findUnique({
    where: { id: digestBatchId },
    include: { workflow: true },
  });

  if (!batch) {
    console.error(`[WorkflowWorker] DigestBatch ${digestBatchId} not found`);
    return;
  }

  if (batch.status !== 'active') {
    console.log(`[WorkflowWorker] DigestBatch ${digestBatchId} status is "${batch.status}". Skipping flush.`);
    return;
  }

  // Update status to "processing"
  await prisma.digestBatch.update({
    where: { id: digestBatchId },
    data: { status: 'processing' },
  });

  const batchEvents = Array.isArray(batch.events) ? (batch.events as any[]) : [];
  console.log(`[WorkflowWorker] DigestBatch ${digestBatchId} flushing with ${batchEvents.length} aggregated events.`);

  // b & c) Create BRAND NEW WorkflowRun to resume workflow from NEXT step (currentStepIndex: batch.stepIndex + 1)
  // Set payload to { events: batch.events }
  const newRun = await prisma.workflowRun.create({
    data: {
      workflowId: batch.workflowId,
      subscriberId: batch.subscriberId,
      projectId: batch.projectId,
      currentStepIndex: batch.stepIndex + 1,
      status: 'pending',
      payload: { events: batchEvents },
      logs: [
        {
          timestamp: new Date().toISOString(),
          type: 'digest_flushed',
          digestBatchId: batch.id,
          eventCount: batchEvents.length,
          message: `Flushed DigestBatch ${batch.id} containing ${batchEvents.length} aggregated events. Resuming workflow at step ${batch.stepIndex + 1}.`,
        },
      ],
    },
  });

  // d) Enqueue this new WorkflowRun into BullMQ as a standard step execution
  await enqueueWorkflowStep(newRun.id, batch.stepIndex + 1, 0);
  console.log(`[WorkflowWorker] Enqueued new WorkflowRun ${newRun.id} for step index ${batch.stepIndex + 1}`);

  // e) Mark DigestBatch as "completed"
  try {
    await prisma.digestBatch.update({
      where: { id: digestBatchId },
      data: { status: 'completed' },
    });
  } catch {
    await prisma.digestBatch.update({
      where: { id: digestBatchId },
      data: { status: `completed_${batch.id}` },
    });
  }
};

/**
 * Process Standard Workflow Step
 */
const processWorkflowStep = async (job: Job<WorkflowJobData>) => {
  const { workflowRunId, stepIndex } = job.data;

  console.log(`[WorkflowWorker] Processing WorkflowRun ${workflowRunId} at Step Index ${stepIndex}`);

  // 1. Fetch WorkflowRun with Workflow
  const run = await prisma.workflowRun.findUnique({
    where: { id: workflowRunId },
    include: {
      workflow: true,
    },
  });

  if (!run) {
    console.error(`[WorkflowWorker] WorkflowRun ${workflowRunId} not found`);
    return;
  }

  if (run.status === 'failed' || run.status === 'completed' || run.status === 'paused') {
    console.log(`[WorkflowWorker] WorkflowRun ${workflowRunId} is in state "${run.status}". Stopping execution.`);
    return;
  }

  const steps = (run.workflow.steps as any[]) || [];
  const logs = (run.logs as any[]) || [];

  // 2. Check if workflow step index is out of bounds (completed)
  if (stepIndex >= steps.length) {
    logs.push({
      timestamp: new Date().toISOString(),
      stepIndex,
      status: 'completed',
      message: 'Workflow completed all steps successfully.',
    });

    await prisma.workflowRun.update({
      where: { id: workflowRunId },
      data: { status: 'completed', logs },
    });

    console.log(`[WorkflowWorker] WorkflowRun ${workflowRunId} fully COMPLETED.`);
    return;
  }

  // 3. Fetch Subscriber
  const subscriber = await prisma.subscriber.findUnique({
    where: {
      projectId_subscriberId: {
        projectId: run.projectId,
        subscriberId: run.subscriberId,
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

  const currentStep = steps[stepIndex];
  console.log(`[WorkflowWorker] Step ${stepIndex} type: "${currentStep.type}"`);

  // -------------------------------------------------------------
  // STEP TYPE 1: DELAY
  // -------------------------------------------------------------
  if (currentStep.type === 'delay') {
    let delayMs = 0;

    if (currentStep.delayMs) {
      delayMs = Number(currentStep.delayMs);
    } else if (currentStep.duration) {
      const dur = Number(currentStep.duration);
      const unit = currentStep.unit || 'seconds';
      switch (unit) {
        case 'seconds':
          delayMs = dur * 1000;
          break;
        case 'minutes':
          delayMs = dur * 60 * 1000;
          break;
        case 'hours':
          delayMs = dur * 3600 * 1000;
          break;
        case 'days':
          delayMs = dur * 86400 * 1000;
          break;
        default:
          delayMs = dur * 1000;
      }
    }

    logs.push({
      timestamp: new Date().toISOString(),
      stepIndex,
      type: 'delay',
      status: 'paused_delay',
      delayMs,
      message: `Delay step initiated: Pausing workflow for ${delayMs / 1000}s before step ${stepIndex + 1}`,
    });

    await prisma.workflowRun.update({
      where: { id: workflowRunId },
      data: {
        currentStepIndex: stepIndex + 1,
        status: 'processing',
        logs,
      },
    });

    await enqueueWorkflowStep(workflowRunId, stepIndex + 1, delayMs);
    console.log(`[WorkflowWorker] Enqueued step ${stepIndex + 1} with delay ${delayMs}ms.`);
    return;
  }

  // -------------------------------------------------------------
  // STEP TYPE 2: DIGEST & BATCHING
  // -------------------------------------------------------------
  if (currentStep.type === 'digest') {
    console.log(`[WorkflowWorker] Intercepting DIGEST step at index ${stepIndex} for Subscriber ${run.subscriberId}`);

    // a) Look for an existing DigestBatch for this subscriber/workflow/step where status === "active"
    const existingBatch = await prisma.digestBatch.findFirst({
      where: {
        projectId: run.projectId,
        workflowId: run.workflowId,
        subscriberId: run.subscriberId,
        stepIndex,
        status: 'active',
      },
    });

    // b) If it exists: Append current run.payload to the events JSON array & complete current run
    if (existingBatch) {
      const currentEvents = Array.isArray(existingBatch.events) ? (existingBatch.events as any[]) : [];
      const payloadToAppend = run.payload ?? {};
      const updatedEvents = [...currentEvents, payloadToAppend];

      await prisma.digestBatch.update({
        where: { id: existingBatch.id },
        data: { events: updatedEvents },
      });

      logs.push({
        timestamp: new Date().toISOString(),
        stepIndex,
        type: 'digest',
        status: 'batched',
        digestBatchId: existingBatch.id,
        eventCount: updatedEvents.length,
        message: `Appended run payload to active DigestBatch ${existingBatch.id} (${updatedEvents.length} total events). Completing individual run.`,
      });

      await prisma.workflowRun.update({
        where: { id: workflowRunId },
        data: { status: 'completed', logs },
      });

      console.log(`[WorkflowWorker] WorkflowRun ${workflowRunId} merged into active DigestBatch ${existingBatch.id} & completed.`);
      return;
    }

    // c) If it does NOT exist: Create a new DigestBatch (status: "active")
    let windowMs = 0;
    if (currentStep.windowMs) {
      windowMs = Number(currentStep.windowMs);
    } else if (currentStep.window) {
      if (typeof currentStep.window === 'number') {
        windowMs = currentStep.window;
      } else if (typeof currentStep.window === 'string') {
        const match = currentStep.window.match(/^(\d+)\s*(s|m|h|d)?$/i);
        if (match) {
          const num = parseInt(match[1], 10);
          const unit = (match[2] || 's').toLowerCase();
          switch (unit) {
            case 's': windowMs = num * 1000; break;
            case 'm': windowMs = num * 60 * 1000; break;
            case 'h': windowMs = num * 3600 * 1000; break;
            case 'd': windowMs = num * 86400 * 1000; break;
            default: windowMs = num * 1000;
          }
        } else {
          windowMs = parseInt(currentStep.window, 10) || 60000;
        }
      }
    } else if (currentStep.duration) {
      const dur = Number(currentStep.duration);
      const unit = (currentStep.unit || 'seconds').toLowerCase();
      switch (unit) {
        case 'seconds': case 's': windowMs = dur * 1000; break;
        case 'minutes': case 'm': windowMs = dur * 60 * 1000; break;
        case 'hours': case 'h': windowMs = dur * 3600 * 1000; break;
        case 'days': case 'd': windowMs = dur * 86400 * 1000; break;
        default: windowMs = dur * 1000;
      }
    }
    if (windowMs <= 0) windowMs = 60000; // default 1 minute fallback

    const flushAt = new Date(Date.now() + windowMs);
    const initialEvents = run.payload ? [run.payload] : [];

    const newBatch = await prisma.digestBatch.create({
      data: {
        projectId: run.projectId,
        workflowId: run.workflowId,
        subscriberId: run.subscriberId,
        stepIndex,
        events: initialEvents,
        status: 'active',
        flushAt,
      },
    });

    logs.push({
      timestamp: new Date().toISOString(),
      stepIndex,
      type: 'digest',
      status: 'digest_batch_created',
      digestBatchId: newBatch.id,
      flushAt: flushAt.toISOString(),
      windowMs,
      message: `Created new active DigestBatch ${newBatch.id}. Scheduled flush in ${windowMs / 1000}s. Completing individual run.`,
    });

    await prisma.workflowRun.update({
      where: { id: workflowRunId },
      data: { status: 'completed', logs },
    });

    // d) ONLY when creating a NEW batch, enqueue a new BullMQ job ('flush_digest') with delay
    await enqueueFlushDigest(newBatch.id, windowMs);
    console.log(`[WorkflowWorker] Created DigestBatch ${newBatch.id} and enqueued flush_digest job with ${windowMs}ms delay.`);
    return;
  }

  // -------------------------------------------------------------
  // STEP TYPE 3: NOTIFICATIONS (email, sms, in_app, webhook)
  // -------------------------------------------------------------
  const channel = currentStep.type; // "email" | "sms" | "in_app" | "webhook"

  // Check Phase 1 Subscriber Preference
  if (subscriber) {
    const isOptedOut = subscriber.preferences.some((pref) => {
      if (currentStep.topicKey && pref.topic) {
        return pref.channel === channel && pref.topic.key === currentStep.topicKey && pref.enabled === false;
      }
      return pref.channel === channel && (!pref.topicId || pref.topicId === '') && pref.enabled === false;
    });

    if (isOptedOut) {
      logs.push({
        timestamp: new Date().toISOString(),
        stepIndex,
        type: channel,
        status: 'skipped',
        message: `Subscriber ${run.subscriberId} opted out of ${channel}${currentStep.topicKey ? ` (Topic: ${currentStep.topicKey})` : ''}`,
      });

      const isLastStep = stepIndex + 1 >= steps.length;
      await prisma.workflowRun.update({
        where: { id: workflowRunId },
        data: {
          currentStepIndex: stepIndex + 1,
          status: isLastStep ? 'completed' : 'processing',
          logs,
        },
      });

      if (!isLastStep) {
        await enqueueWorkflowStep(workflowRunId, stepIndex + 1, 0);
      }
      return;
    }
  }

  // Execute Dispatch
  try {
    // Build context object by merging subscriber data and workflow payload
    const contextData = {
      ...(typeof run.payload === 'object' ? run.payload : {}),
      subscriber: subscriber
        ? {
            id: subscriber.id,
            subscriberId: subscriber.subscriberId,
            email: subscriber.email,
            phone: subscriber.phone,
            firstName: subscriber.firstName,
            lastName: subscriber.lastName,
            locale: subscriber.locale,
            timeZone: subscriber.timeZone,
            ...(typeof subscriber.data === 'object' ? subscriber.data : {}),
          }
        : { subscriberId: run.subscriberId },
    };

    let subjectTemplate = currentStep.subject || 'Notification';
    let bodyTemplate = currentStep.body || 'You have a new message from EventMesh.';

    // Fetch Template from DB if templateId is specified
    if (currentStep.templateId) {
      const dbTemplate = await prisma.template.findFirst({
        where: {
          projectId: run.projectId,
          OR: [{ id: currentStep.templateId }, { name: currentStep.templateId }],
        },
      });
      if (dbTemplate) {
        if (dbTemplate.subject) subjectTemplate = dbTemplate.subject;
        bodyTemplate = dbTemplate.body;
      }
    }

    const compiledSubject = compileTemplate(subjectTemplate, contextData);
    const compiledBody = compileTemplate(bodyTemplate, contextData);

    const recipientAddress =
      subscriber?.email ||
      subscriber?.phone ||
      (typeof run.payload === 'object' && (run.payload as any)?.email) ||
      (typeof run.payload === 'object' && (run.payload as any)?.phone) ||
      run.subscriberId;

    // Create Notification Log for Dashboard Live Streams
    const notifLog = await prisma.notificationLog.create({
      data: {
        projectId: run.projectId,
        channel,
        status: 'processing',
        recipient: recipientAddress,
        payload: {
          workflowRunId,
          stepIndex,
          compiledSubject,
          compiledBody,
          contextData,
        },
      },
    });

    emitLogUpdate({
      id: notifLog.id,
      projectId: run.projectId,
      channel,
      status: 'processing',
      recipient: recipientAddress,
      createdAt: notifLog.createdAt.toISOString(),
      payload: notifLog.payload,
    });

    // Execute Failover Dispatch Engine across priority-ordered providers
    const dispatchResult = await dispatchNotificationWithFailover({
      projectId: run.projectId,
      channel,
      recipient: {
        email: subscriber?.email || (run.payload as any)?.email,
        phone: subscriber?.phone || (run.payload as any)?.phone,
        webhookUrl: (subscriber?.data as any)?.webhookUrl || (run.payload as any)?.webhookUrl || (run.payload as any)?.url,
        subscriberId: run.subscriberId,
      },
      subject: compiledSubject,
      body: compiledBody,
      data: contextData,
    });

    // Record failover warnings to workflow execution logs
    if (dispatchResult.logs && dispatchResult.logs.length > 1) {
      dispatchResult.logs.slice(0, -1).forEach((failoverMsg) => {
        logs.push({
          timestamp: new Date().toISOString(),
          stepIndex,
          type: channel,
          status: 'failover_warning',
          message: failoverMsg,
        });
      });
    }

    // Update Notification Log to sent
    await prisma.notificationLog.update({
      where: { id: notifLog.id },
      data: { status: 'sent' },
    });

    emitLogUpdate({
      id: notifLog.id,
      projectId: run.projectId,
      channel,
      status: 'sent',
      recipient: recipientAddress,
      createdAt: notifLog.createdAt.toISOString(),
      payload: notifLog.payload,
    });

    logs.push({
      timestamp: new Date().toISOString(),
      stepIndex,
      type: channel,
      status: 'sent',
      recipient: recipientAddress,
      message: `Dispatched ${channel} notification successfully`,
    });

    const isLastStep = stepIndex + 1 >= steps.length;
    await prisma.workflowRun.update({
      where: { id: workflowRunId },
      data: {
        currentStepIndex: stepIndex + 1,
        status: isLastStep ? 'completed' : 'processing',
        logs,
      },
    });

    if (!isLastStep) {
      await enqueueWorkflowStep(workflowRunId, stepIndex + 1, 0);
    } else {
      console.log(`[WorkflowWorker] WorkflowRun ${workflowRunId} completed all steps.`);
    }
  } catch (error: any) {
    console.error(`[WorkflowWorker] Error executing step ${stepIndex} for WorkflowRun ${workflowRunId}:`, error.message);

    logs.push({
      timestamp: new Date().toISOString(),
      stepIndex,
      type: channel,
      status: 'failed',
      error: error.message,
    });

    await prisma.workflowRun.update({
      where: { id: workflowRunId },
      data: {
        status: 'failed',
        logs,
      },
    });
  }
};

/**
 * BullMQ Worker Instance
 */
export const workflowWorker = new Worker(
  'workflow_execution',
  async (job: Job<any>) => {
    if (job.name === 'flush_digest') {
      return handleFlushDigestJob(job);
    }
    return processWorkflowStep(job);
  },
  {
    connection,
    concurrency: 5,
  }
);

workflowWorker.on('failed', (job, err) => {
  if (job) {
    console.error(`[WorkflowWorker] Job ${job.id} (${job.name}) failed:`, err.message);
  }
});
