const Redis = require('ioredis');
const logger = require('./logger');
const config = require('../config');

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.maxRetries = config.redis.maxRetries || 5;
    this.retryDelay = config.redis.retryDelay || 5000;
  }

  /**
   * Connect to Redis with retry logic
   */
  async connect() {
    if (this.isConnected) {
      logger.info('Already connected to Redis');
      return this.client;
    }

    try {
      this.connectionAttempts++;
      logger.info('Connecting to Redis...', {
        attempt: this.connectionAttempts,
        url: this.sanitizeUrl(config.redis.url),
      });

      const options = {
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: true,
        retryStrategy: (times) => {
          if (times > this.maxRetries) {
            logger.error('Redis max retries exceeded');
            return null;
          }
          const delay = Math.min(times * this.retryDelay, 30000);
          logger.info(`Retrying Redis connection in ${delay / 1000}s...`);
          return delay;
        },
      };

      this.client = new Redis(config.redis.url, options);

      // Connect explicitly with timeout
      const connectPromise = this.client.connect();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 10000)
      );
      
      await Promise.race([connectPromise, timeoutPromise]);

      this.isConnected = true;
      this.connectionAttempts = 0;

      logger.info('Successfully connected to Redis', {
        host: this.client.options.host,
        port: this.client.options.port,
        db: this.client.options.db,
      });

      this.setupEventListeners();

      return this.client;
    } catch (error) {
      logger.error('Redis connection error', {
        error: error.message,
        attempt: this.connectionAttempts,
      });

      // Clean up client if exists
      if (this.client) {
        try {
          await this.client.quit();
        } catch (quitError) {
          // Ignore quit errors
        }
        this.client = null;
      }

      if (this.connectionAttempts < this.maxRetries) {
        logger.info(`Retrying connection in ${this.retryDelay / 1000}s...`);
        await this.delay(this.retryDelay);
        return this.connect();
      }

      // Don't throw, just warn that Redis is unavailable
      logger.warn('Redis is unavailable - some features will be disabled');
      this.isConnected = false;
      return null;
    }
  }

  /**
   * Setup Redis event listeners
   */
  setupEventListeners() {
    this.client.on('connect', () => {
      logger.info('Redis connection established');
      this.isConnected = true;
    });

    this.client.on('ready', () => {
      logger.info('Redis client ready');
    });

    this.client.on('error', (error) => {
      logger.error('Redis error', { error: error.message });
      this.isConnected = false;
    });

    this.client.on('close', () => {
      logger.warn('Redis connection closed');
      this.isConnected = false;
    });

    this.client.on('reconnecting', (delay) => {
      logger.info('Redis reconnecting', { delay });
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      await this.disconnect();
    });
  }

  /**
   * Disconnect from Redis
   */
  async disconnect() {
    if (!this.client || !this.isConnected) {
      return;
    }

    try {
      await this.client.quit();
      this.isConnected = false;
      logger.info('Redis connection closed');
    } catch (error) {
      logger.error('Error closing Redis connection', { error: error.message });
      // Force disconnect if graceful quit fails
      this.client.disconnect();
    }
  }

  /**
   * Check if Redis is healthy
   */
  async healthCheck() {
    try {
      if (!this.isConnected || !this.client) {
        return { status: 'disconnected', healthy: false };
      }

      // Ping Redis
      const pong = await this.client.ping();

      if (pong !== 'PONG') {
        throw new Error('Invalid ping response');
      }

      return {
        status: 'connected',
        healthy: true,
        host: this.client.options.host,
        port: this.client.options.port,
        db: this.client.options.db,
      };
    } catch (error) {
      logger.error('Redis health check failed', { error: error.message });
      return {
        status: 'unhealthy',
        healthy: false,
        error: error.message,
      };
    }
  }

  /**
   * Get a value from Redis
   */
  async get(key) {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis GET error', { key, error: error.message });
      throw error;
    }
  }

  /**
   * Set a value in Redis with optional TTL
   */
  async set(key, value, ttl = null) {
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.client.setex(key, ttl, serialized);
      } else {
        await this.client.set(key, serialized);
      }
    } catch (error) {
      logger.error('Redis SET error', { key, error: error.message });
      throw error;
    }
  }

  /**
   * Delete a key from Redis
   */
  async del(key) {
    try {
      await this.client.del(key);
    } catch (error) {
      logger.error('Redis DEL error', { key, error: error.message });
      throw error;
    }
  }

  /**
   * Delete keys matching a pattern
   */
  async delPattern(pattern) {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
      return keys.length;
    } catch (error) {
      logger.error('Redis DEL pattern error', { pattern, error: error.message });
      throw error;
    }
  }

  /**
   * Sanitize Redis URL for logging (hide password)
   */
  sanitizeUrl(url) {
    return url.replace(/:([^:@]+)@/, ':****@');
  }

  /**
   * Delay helper for retries
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      status: this.client?.status || 'disconnected',
      host: this.client?.options?.host,
      port: this.client?.options?.port,
      db: this.client?.options?.db,
    };
  }
}

// Export singleton instance
const redis = new RedisClient();
module.exports = redis;
