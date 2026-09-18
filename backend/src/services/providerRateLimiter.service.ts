import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export class ProviderRateLimitExceededError extends Error {
  public projectId: string;
  public providerId: string;
  public limitPerSecond: number;

  constructor(projectId: string, providerId: string, limitPerSecond: number) {
    super(`Provider ${providerId} rate limit of ${limitPerSecond}/sec exceeded for project ${projectId}`);
    this.name = 'ProviderRateLimitExceededError';
    this.projectId = projectId;
    this.providerId = providerId;
    this.limitPerSecond = limitPerSecond;
  }
}

/**
 * Consumes 1 rate limit token for a provider using Redis sliding 1-second window.
 * Throws ProviderRateLimitExceededError if rate limit is exhausted.
 */
export const checkAndConsumeProviderRateLimit = async (
  projectId: string,
  providerId: string,
  limitPerSecond: number = 10
): Promise<boolean> => {
  if (!limitPerSecond || limitPerSecond <= 0) {
    return true;
  }

  const currentSecond = Math.floor(Date.now() / 1000);
  const key = `ratelimit:${projectId}:${providerId}:${currentSecond}`;

  const currentCount = await redis.incr(key);

  if (currentCount === 1) {
    // Set 2-second TTL to ensure automatic cleanup
    await redis.expire(key, 2);
  }

  if (currentCount > limitPerSecond) {
    console.warn(`[RateLimiter] Rate limit EXHAUSTED for provider "${providerId}" (${currentCount}/${limitPerSecond} per sec)`);
    throw new ProviderRateLimitExceededError(projectId, providerId, limitPerSecond);
  }

  return true;
};
