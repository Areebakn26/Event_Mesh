import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const notificationQueue = new Queue('notifications', { connection });
export const dlqQueue = new Queue('notifications_dlq', { connection });

export interface NotificationJobData {
  projectId: string;
  templateId: string;
  recipient: any;
  channels: string[];
  data: any;
  logId: string;
}

export const enqueueNotification = async (jobData: NotificationJobData) => {
  // We use exponential backoff for retries
  return notificationQueue.add('send_notification', jobData, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  });
};
