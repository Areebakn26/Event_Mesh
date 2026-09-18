import prisma from '../config/db';
import { sendEmail } from './email.service';
import { sendSms } from './sms.service';
import { sendWebhook } from './webhook.service';
import { broadcastInAppMessage } from './inappSse.service';
import {
  checkAndConsumeProviderRateLimit,
  ProviderRateLimitExceededError,
} from './providerRateLimiter.service';

export interface DispatchOptions {
  projectId: string;
  channel: 'email' | 'sms' | 'webhook' | 'in_app' | string;
  recipient: {
    email?: string;
    phone?: string;
    webhookUrl?: string;
    url?: string;
    subscriberId?: string;
  };
  subject?: string;
  body: string;
  data?: any;
}

export interface DispatchResult {
  success: boolean;
  providerId?: string;
  providerIdentifier: string;
  attemptedProviders: string[];
  logs: string[];
}

/**
 * Sequential Failover Dispatcher with Redis Provider Rate Limiting
 */
export const dispatchNotificationWithFailover = async (
  options: DispatchOptions
): Promise<DispatchResult> => {
  const { projectId, channel, recipient, subject, body, data } = options;

  // 1. Fetch active providers for project & channel, sorted by priority ASC (1 is highest priority)
  const providers = await prisma.channelProvider.findMany({
    where: {
      projectId,
      channel,
      active: true,
    },
    orderBy: {
      priority: 'asc',
    },
  });

  const attemptedProviders: string[] = [];
  const logs: string[] = [];

  // Fallback to legacy single ProviderConfig if no ChannelProvider records exist
  if (providers.length === 0) {
    console.log(`[Dispatcher] No custom ChannelProvider records for channel "${channel}". Using default project provider config.`);
    const fallbackConfig = await prisma.providerConfig.findUnique({ where: { projectId } });

    if (channel === 'email' && recipient.email) {
      await sendEmail(recipient.email, subject || 'Notification', body, fallbackConfig);
    } else if (channel === 'sms' && recipient.phone) {
      await sendSms(recipient.phone, body, fallbackConfig);
    } else if (channel === 'webhook' && (recipient.webhookUrl || recipient.url)) {
      const targetUrl = recipient.webhookUrl || recipient.url;
      await sendWebhook({ recipientUrl: targetUrl!, data: data || {}, secret: fallbackConfig?.webhookSecret || 'secret' });
    }

    return {
      success: true,
      providerIdentifier: 'system-default',
      attemptedProviders: ['system-default'],
      logs: ['Dispatched via system default provider config'],
    };
  }

  // 2. Sequential Failover Loop across priority-ordered providers
  for (const provider of providers) {
    const providerTag = `${provider.providerIdentifier} (Priority ${provider.priority})`;

    // Step A: Check Redis sliding window rate limiter
    try {
      await checkAndConsumeProviderRateLimit(
        projectId,
        provider.id,
        provider.rateLimitPerSecond || 10
      );
    } catch (err: any) {
      if (err instanceof ProviderRateLimitExceededError) {
        const msg = `Provider "${providerTag}" rate limit (${provider.rateLimitPerSecond}/sec) exhausted. Skipping to next priority provider.`;
        console.warn(`[Failover] ${msg}`);
        logs.push(msg);
        attemptedProviders.push(`${providerTag} [RATE_LIMITED]`);
        continue; // Failover to next provider!
      }
    }

    // Step B: Extract credentials JSON
    const creds =
      typeof provider.credentials === 'string'
        ? JSON.parse(provider.credentials)
        : provider.credentials || {};

    // Step C: Attempt dispatch with current provider
    try {
      console.log(`[Dispatcher] Attempting dispatch via ${providerTag}...`);

      if (channel === 'email') {
        const targetEmail = recipient.email;
        if (!targetEmail) throw new Error('Recipient has no email address');

        // Construct ProviderConfig shape from credentials JSON
        const emailConfig = {
          smtpHost: creds.smtpHost || creds.host,
          smtpPort: creds.smtpPort || (creds.port ? Number(creds.port) : undefined),
          smtpUser: creds.smtpUser || creds.user || creds.apiKey,
          smtpPass: creds.smtpPass || creds.pass || creds.apiKey,
        };

        await sendEmail(targetEmail, subject || 'Notification', body, emailConfig);

      } else if (channel === 'sms') {
        const targetPhone = recipient.phone;
        if (!targetPhone) throw new Error('Recipient has no phone number');

        const smsConfig = {
          twilioSid: creds.twilioSid || creds.accountSid,
          twilioToken: creds.twilioToken || creds.authToken,
          twilioPhone: creds.twilioPhone || creds.fromPhone,
        };

        await sendSms(targetPhone, body, smsConfig);

      } else if (channel === 'webhook') {
        const targetUrl = recipient.webhookUrl || recipient.url || creds.webhookUrl;
        if (!targetUrl) throw new Error('Recipient has no webhook URL');

        await sendWebhook({
          recipientUrl: targetUrl,
          data: data || {},
          secret: creds.secret || creds.webhookSecret || 'secret',
        });

      } else if (channel === 'in_app') {
        const subId = recipient.subscriberId;
        if (!subId) throw new Error('Recipient has no subscriberId');

        const subscriber = await prisma.subscriber.findFirst({
          where: { projectId, subscriberId: subId },
        });

        if (subscriber) {
          const inAppMsg = await prisma.inAppMessage.create({
            data: {
              subscriberId: subscriber.id,
              projectId,
              title: subject || 'Notification',
              body,
              data: data || {},
            },
          });
          broadcastInAppMessage(subId, inAppMsg);
        }
      }

      // Success! Break failover loop
      attemptedProviders.push(`${providerTag} [SUCCESS]`);
      logs.push(`Dispatched successfully via ${providerTag}`);
      console.log(`[Dispatcher] SUCCESS via ${providerTag}!`);

      return {
        success: true,
        providerId: provider.id,
        providerIdentifier: provider.providerIdentifier,
        attemptedProviders,
        logs,
      };

    } catch (err: any) {
      const errorMsg = err.message || 'API dispatch failure';
      const failoverWarning = `Provider "${providerTag}" failed: "${errorMsg}". Triggering failover to next provider...`;
      console.warn(`[Failover Warning] ${failoverWarning}`);
      logs.push(failoverWarning);
      attemptedProviders.push(`${providerTag} [FAILED: ${errorMsg}]`);
      // Continue to next provider in loop!
    }
  }

  // 3. All providers failed or were rate-limited
  const fatalError = `All ${providers.length} configured ${channel} providers failed or were rate-limited for project ${projectId}.`;
  console.error(`[Dispatcher Fatal] ${fatalError}`);
  throw new Error(`${fatalError} Details: ${logs.join(' | ')}`);
};
