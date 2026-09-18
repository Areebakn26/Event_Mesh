import { Response, NextFunction } from 'express';
import redisClient from '../config/redis';
import { ApiRequest } from './apiKey.middleware';

// Default capacity and refill rate (e.g., 10 requests per second burst, refilling 10 per second)
const BUCKET_CAPACITY = 10;
const REFILL_RATE = 10;

export const rateLimiter = async (req: ApiRequest, res: Response, next: NextFunction): Promise<any> => {
  if (!req.project) {
    return res.status(500).json({ error: 'Rate limiter requires an authenticated project' });
  }

  const projectId = req.project.id;
  const bucketKey = `rate_limit:${projectId}`;

  try {
    // We use a Lua script for atomicity to avoid race conditions
    const luaScript = `
      local key = KEYS[1]
      local capacity = tonumber(ARGV[1])
      local refill_rate = tonumber(ARGV[2])
      local now = tonumber(ARGV[3])
      local requested = 1

      local bucket = redis.call("HMGET", key, "tokens", "last_refill")
      local tokens = tonumber(bucket[1])
      local last_refill = tonumber(bucket[2])

      if not tokens then
        tokens = capacity
        last_refill = now
      else
        local elapsed = math.max(0, now - last_refill)
        local refill = math.floor(elapsed * refill_rate)
        if refill > 0 then
          tokens = math.min(capacity, tokens + refill)
          last_refill = now
        end
      end

      if tokens >= requested then
        tokens = tokens - requested
        redis.call("HMSET", key, "tokens", tokens, "last_refill", last_refill)
        redis.call("EXPIRE", key, 60) -- Expire key after 1 minute of inactivity
        return tokens
      else
        return -1
      end
    `;

    const now = Math.floor(Date.now() / 1000); // Current time in seconds
    const result = await redisClient.eval(luaScript, 1, bucketKey, BUCKET_CAPACITY, REFILL_RATE, now);

    if (result === -1) {
      res.set('Retry-After', '1'); // Simple retry after 1 second
      return res.status(429).json({ error: 'Too Many Requests. Rate limit exceeded.' });
    }

    // Optional: Add X-RateLimit headers
    res.set('X-RateLimit-Remaining', result.toString());
    next();
  } catch (error) {
    console.error('Rate Limiter Error:', error);
    // On Redis failure, fail-open to not block valid requests, or fail-closed.
    // We choose fail-open for resilience, but log the error.
    next();
  }
};
