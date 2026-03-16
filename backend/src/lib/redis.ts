import { Redis } from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times: number) => Math.min(times * 50, 2000),
});

redis.on('error', (err: Error) => console.error('Redis error:', err));
redis.on('connect', () => console.log('Redis connected'));
