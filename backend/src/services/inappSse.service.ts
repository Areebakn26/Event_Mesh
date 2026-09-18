import { Response } from 'express';

// In-memory registry mapping subscriberId -> Set of Express Response objects
const sseClientsRegistry = new Map<string, Set<Response>>();

/**
 * Registers an active SSE client connection for a subscriberId
 */
export const addSubscriberSseClient = (subscriberId: string, res: Response) => {
  if (!sseClientsRegistry.has(subscriberId)) {
    sseClientsRegistry.set(subscriberId, new Set());
  }
  const clientSet = sseClientsRegistry.get(subscriberId)!;
  clientSet.add(res);
  console.log(`[InAppSSE] Client connected for subscriber "${subscriberId}". Active connections: ${clientSet.size}`);
};

/**
 * Removes an SSE client connection when disconnected
 */
export const removeSubscriberSseClient = (subscriberId: string, res: Response) => {
  const clientSet = sseClientsRegistry.get(subscriberId);
  if (clientSet) {
    clientSet.delete(res);
    console.log(`[InAppSSE] Client disconnected for subscriber "${subscriberId}". Remaining connections: ${clientSet.size}`);
    if (clientSet.size === 0) {
      sseClientsRegistry.delete(subscriberId);
    }
  }
};

/**
 * Broadcasts a newly created InAppMessage object directly to active SSE connections for subscriberId
 */
export const broadcastInAppMessage = (subscriberId: string, message: any) => {
  const clientSet = sseClientsRegistry.get(subscriberId);
  if (!clientSet || clientSet.size === 0) {
    return;
  }

  const sseData = `event: in_app_message\ndata: ${JSON.stringify(message)}\n\n`;

  clientSet.forEach((clientRes) => {
    try {
      clientRes.write(sseData);
    } catch (err) {
      console.error(`[InAppSSE] Error pushing message to subscriber "${subscriberId}":`, err);
      clientSet.delete(clientRes);
    }
  });

  console.log(`[InAppSSE] Broadcasted live message to ${clientSet.size} connection(s) for subscriber "${subscriberId}"`);
};

// 30-Second Keep-Alive Heartbeat to prevent browser / proxy timeouts
setInterval(() => {
  const pingPayload = `: heartbeat\n\n`;
  sseClientsRegistry.forEach((clientSet) => {
    clientSet.forEach((clientRes) => {
      try {
        clientRes.write(pingPayload);
      } catch {
        clientSet.delete(clientRes);
      }
    });
  });
}, 30000);
