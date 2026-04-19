import Redis from 'ioredis';
import { logger } from '../utils/logger';

// Redis client for caching and session storage
export const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

redis.on('connect', () => {
  logger.info('✅ Redis connected successfully');
});

redis.on('error', (error) => {
  logger.error('❌ Redis connection error:', error instanceof Error ? error.message : String(error));
});

redis.on('close', () => {
  logger.warn('Redis connection closed');
});

// Cache helper functions
export const cache = {
  async get(key: string): Promise<any> {
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error: unknown) {
      logger.error(`Cache get error for key ${key}:`, error instanceof Error ? error.message : String(error));
      return null;
    }
  },

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const data = JSON.stringify(value);
      if (ttl) {
        await redis.set(key, data, 'EX', ttl);
      } else {
        await redis.set(key, data);
      }
    } catch (error: unknown) {
      logger.error(`Cache set error for key ${key}:`, error instanceof Error ? error.message : String(error));
    }
  },

  async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error: unknown) {
      logger.error(`Cache delete error for key ${key}:`, error instanceof Error ? error.message : String(error));
    }
  },

  async flush(): Promise<void> {
    try {
      await redis.flushall();
      logger.info('Cache flushed');
    } catch (error: unknown) {
      logger.error('Cache flush error:', error instanceof Error ? error.message : String(error));
    }
  },

  // Pattern-based deletion
  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error: unknown) {
      logger.error(`Cache delete pattern error for ${pattern}:`, error instanceof Error ? error.message : String(error));
    }
  }
};

export default redis;
