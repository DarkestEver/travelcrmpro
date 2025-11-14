/**
 * Cache Service
 * Phase 10: Redis-based caching with fallback to memory
 * 
 * Features:
 * - Redis caching with automatic fallback
 * - Memory cache for development
 * - Cache invalidation strategies
 * - TTL-based expiration
 * - Cache warming
 * - Statistics tracking
 */

const logger = require('../utils/logger');

class CacheService {
  constructor() {
    this.memoryCache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0
    };
    
    // Try to connect to Redis if available
    this.redisClient = null;
    this.useRedis = false;
    this.initializeRedis();
  }

  /**
   * Initialize Redis connection
   */
  async initializeRedis() {
    try {
      if (process.env.REDIS_URL) {
        const redis = require('redis');
        this.redisClient = redis.createClient({
          url: process.env.REDIS_URL,
          socket: {
            reconnectStrategy: (retries) => {
              if (retries > 10) {
                logger.error('Redis connection failed after 10 retries, using memory cache');
                return new Error('Too many retries');
              }
              return Math.min(retries * 100, 3000);
            }
          }
        });

        this.redisClient.on('error', (err) => {
          logger.error('Redis error:', err);
          this.useRedis = false;
        });

        this.redisClient.on('connect', () => {
          logger.info('✓ Redis connected');
          this.useRedis = true;
        });

        await this.redisClient.connect();
      } else {
        logger.info('No REDIS_URL configured, using memory cache');
      }
    } catch (error) {
      logger.error('Failed to initialize Redis:', error);
      this.useRedis = false;
    }
  }

  /**
   * Generate cache key
   */
  generateKey(prefix, ...parts) {
    return `${prefix}:${parts.join(':')}`;
  }

  /**
   * Get value from cache
   */
  async get(key) {
    try {
      if (this.useRedis && this.redisClient) {
        const value = await this.redisClient.get(key);
        if (value) {
          this.stats.hits++;
          return JSON.parse(value);
        }
      } else {
        const cached = this.memoryCache.get(key);
        if (cached) {
          // Check expiration
          if (!cached.expiresAt || Date.now() < cached.expiresAt) {
            this.stats.hits++;
            return cached.value;
          } else {
            this.memoryCache.delete(key);
          }
        }
      }
      
      this.stats.misses++;
      return null;
    } catch (error) {
      this.stats.errors++;
      logger.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set(key, value, ttl = 3600) {
    try {
      if (this.useRedis && this.redisClient) {
        await this.redisClient.setEx(key, ttl, JSON.stringify(value));
      } else {
        this.memoryCache.set(key, {
          value,
          expiresAt: ttl ? Date.now() + (ttl * 1000) : null
        });
      }
      
      this.stats.sets++;
      return true;
    } catch (error) {
      this.stats.errors++;
      logger.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async del(key) {
    try {
      if (this.useRedis && this.redisClient) {
        await this.redisClient.del(key);
      } else {
        this.memoryCache.delete(key);
      }
      
      this.stats.deletes++;
      return true;
    } catch (error) {
      this.stats.errors++;
      logger.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Delete all keys matching pattern
   */
  async delPattern(pattern) {
    try {
      if (this.useRedis && this.redisClient) {
        const keys = await this.redisClient.keys(pattern);
        if (keys.length > 0) {
          await this.redisClient.del(keys);
          this.stats.deletes += keys.length;
        }
      } else {
        // Memory cache - iterate and delete matching keys
        const keysToDelete = [];
        for (const key of this.memoryCache.keys()) {
          const regex = new RegExp(pattern.replace('*', '.*'));
          if (regex.test(key)) {
            keysToDelete.push(key);
          }
        }
        keysToDelete.forEach(key => this.memoryCache.delete(key));
        this.stats.deletes += keysToDelete.length;
      }
      
      return true;
    } catch (error) {
      this.stats.errors++;
      logger.error('Cache pattern delete error:', error);
      return false;
    }
  }

  /**
   * Clear all cache
   */
  async clear() {
    try {
      if (this.useRedis && this.redisClient) {
        await this.redisClient.flushDb();
      } else {
        this.memoryCache.clear();
      }
      
      logger.info('Cache cleared');
      return true;
    } catch (error) {
      this.stats.errors++;
      logger.error('Cache clear error:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total > 0 ? ((this.stats.hits / total) * 100).toFixed(2) : 0,
      cacheType: this.useRedis ? 'redis' : 'memory',
      size: this.memoryCache.size
    };
  }

  /**
   * Warm cache with frequently accessed data
   */
  async warmCache(tenantId) {
    try {
      logger.info(`Warming cache for tenant ${tenantId}`);
      
      // This would typically pre-load frequently accessed data
      // Implementation depends on specific use cases
      
      return true;
    } catch (error) {
      logger.error('Cache warming error:', error);
      return false;
    }
  }

  /**
   * Cache wrapper for functions
   */
  async wrap(key, fn, ttl = 3600) {
    try {
      // Try to get from cache
      const cached = await this.get(key);
      if (cached !== null) {
        return cached;
      }

      // Execute function
      const result = await fn();

      // Store in cache
      await this.set(key, result, ttl);

      return result;
    } catch (error) {
      logger.error('Cache wrap error:', error);
      // On error, execute function without caching
      return await fn();
    }
  }
}

// Singleton instance
const cacheService = new CacheService();

module.exports = cacheService;
