const redis = require('redis');

// Redis client configuration
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('Redis connection failed after 10 retries');
        return new Error('Redis connection failed');
      }
      return Math.min(retries * 100, 3000);
    },
  },
});

// Error handling
redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('✅ Redis Connected');
});

redisClient.on('ready', () => {
  console.log('✅ Redis Ready');
});

redisClient.on('reconnecting', () => {
  console.log('🔄 Redis Reconnecting...');
});

// Connect to Redis
const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log('Redis connection established');
  } catch (error) {
    console.error('Failed to connect to Redis:', error.message);
    // Continue without Redis - app should still work
  }
};

// Redis helper functions
const redisHelpers = {
  // Set key with expiration
  async set(key, value, expirationInSeconds = 3600) {
    try {
      await redisClient.set(key, JSON.stringify(value), {
        EX: expirationInSeconds,
      });
      return true;
    } catch (error) {
      console.error('Redis SET error:', error);
      return false;
    }
  },

  // Get key
  async get(key) {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  },

  // Delete key
  async del(key) {
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      console.error('Redis DEL error:', error);
      return false;
    }
  },

  // Check if key exists
  async exists(key) {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis EXISTS error:', error);
      return false;
    }
  },

  // Set key without expiration
  async setPermanent(key, value) {
    try {
      await redisClient.set(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Redis SET error:', error);
      return false;
    }
  },

  // Increment counter
  async increment(key) {
    try {
      const result = await redisClient.incr(key);
      return result;
    } catch (error) {
      console.error('Redis INCR error:', error);
      return null;
    }
  },

  // Add to set
  async addToSet(key, value) {
    try {
      await redisClient.sAdd(key, value);
      return true;
    } catch (error) {
      console.error('Redis SADD error:', error);
      return false;
    }
  },

  // Remove from set
  async removeFromSet(key, value) {
    try {
      await redisClient.sRem(key, value);
      return true;
    } catch (error) {
      console.error('Redis SREM error:', error);
      return false;
    }
  },

  // Get all members of set
  async getSet(key) {
    try {
      const members = await redisClient.sMembers(key);
      return members;
    } catch (error) {
      console.error('Redis SMEMBERS error:', error);
      return [];
    }
  },

  // Clear all keys (use with caution)
  async flushAll() {
    try {
      await redisClient.flushAll();
      return true;
    } catch (error) {
      console.error('Redis FLUSHALL error:', error);
      return false;
    }
  },
};

module.exports = {
  redisClient,
  connectRedis,
  redisHelpers,
};
