import Redis from 'ioredis';
import { AnalyticsQueryParams } from '../models/analytics-types';

// Create Redis client
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Log Redis errors
redis.on('error', (err) => {
  console.error('Redis error:', err);
});

/**
 * Generate a cache key for analytics queries
 * @param params Analytics query parameters
 * @returns Cache key string
 */
export const generateCacheKey = (params: AnalyticsQueryParams): string => {
  return `analytics:${params.userId || 'all'}:${params.startDate}:${params.endDate}:${params.metrics.join(',')}:${params.segments?.join(',') || 'none'}`;
};

/**
 * Get cached data
 * @param key Cache key
 * @returns Cached data or null if not found
 */
export const getCachedData = async (key: string): Promise<any | null> => {
  const data = await redis.get(key);
  if (!data) return null;
  return JSON.parse(data);
};

/**
 * Set data in cache
 * @param key Cache key
 * @param data Data to cache
 * @param ttl Time to live in seconds (default: 900s = 15min)
 */
export const setCachedData = async (key: string, data: any, ttl: number = 900): Promise<void> => {
  await redis.set(key, JSON.stringify(data), 'EX', ttl);
};

/**
 * Clear cache by pattern
 * @param pattern Pattern to match keys (e.g., 'analytics:user123:*')
 */
export const clearCacheByPattern = async (pattern: string): Promise<void> => {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
};

export default redis;