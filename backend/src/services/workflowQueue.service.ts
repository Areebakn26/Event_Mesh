import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const workflowQueue = new Queue('workflow_execution', { connection });

export interface WorkflowJobData {
  workflowRunId: string;
  stepIndex: number;
}

export const enqueueWorkflowStep = async (
  workflowRunId: string,
  stepIndex: number,
  delayMs: number = 0
) => {
  return workflowQueue.add(
    'process_workflow_step',
    { workflowRunId, stepIndex },
    {
      delay: delayMs > 0 ? delayMs : undefined,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    }
  );
};

export interface DigestJobData {
  digestBatchId: string;
}

export const enqueueFlushDigest = async (digestBatchId: string, delayMs: number = 0) => {
  return workflowQueue.add(
    'flush_digest',
    { digestBatchId },
    {
      delay: delayMs > 0 ? delayMs : undefined,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    }
  );
};
