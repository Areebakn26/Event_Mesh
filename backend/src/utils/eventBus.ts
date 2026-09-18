import { EventEmitter } from 'events';

class NotificationEventBus extends EventEmitter {}

export const eventBus = new NotificationEventBus();

export interface NotificationLogEvent {
  id: string;
  projectId: string;
  jobId?: string;
  channel: string;
  status: string;
  recipient: string;
  error?: string;
  createdAt: string;
  payload?: any;
}

export const emitLogUpdate = (event: NotificationLogEvent) => {
  eventBus.emit(`project:${event.projectId}`, event);
};
