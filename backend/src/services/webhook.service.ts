import axios from 'axios';
import crypto from 'crypto';

interface WebhookPayload {
  recipientUrl: string;
  data: Record<string, any>;
  secret?: string;
}

export const sendWebhook = async ({ recipientUrl, data, secret }: WebhookPayload) => {
  const payloadString = JSON.stringify(data);
  const signature = secret 
    ? crypto.createHmac('sha256', secret).update(payloadString).digest('hex')
    : '';

  const response = await axios.post(recipientUrl, data, {
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'EventMesh-Notifier/1.0',
      'X-EventMesh-Signature': signature,
      'X-EventMesh-Timestamp': Date.now().toString(),
    },
    timeout: 10000, // 10s timeout
  });

  return {
    status: response.status,
    statusText: response.statusText,
    data: response.data,
  };
};
