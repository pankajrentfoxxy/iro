import { Redis } from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  retryStrategy: (times: number) => (times > 20 ? null : Math.min(times * 50, 2000)),
});

let lastRedisErrorAt = 0;
redis.on('error', (err: Error) => {
  const now = Date.now();
  if (now - lastRedisErrorAt > 30_000) {
    console.warn('[Redis] Connection failed — start Redis or set REDIS_URL. Retrying…', err.message);
    lastRedisErrorAt = now;
  }
});
redis.on('connect', () => console.log('Redis connected'));
