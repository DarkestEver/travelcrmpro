const mongoose = require('mongoose');
const redis = require('redis');
const { promisify } = require('util');

// MongoDB Connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    return conn;
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Redis Connection
let redisClient;

const connectRedis = async () => {
  try {
    redisClient = redis.createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
      },
      password: process.env.REDIS_PASSWORD || undefined,
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis Connected');
    });

    await redisClient.connect();
    
    return redisClient;
  } catch (error) {
    console.error(`❌ Error connecting to Redis: ${error.message}`);
    // Don't exit process, Redis is optional for MVP
    return null;
  }
};

// Redis helper functions
const getAsync = async (key) => {
  if (!redisClient || !redisClient.isOpen) return null;
  try {
    return await redisClient.get(key);
  } catch (error) {
    console.error('Redis GET error:', error);
    return null;
  }
};

const setAsync = async (key, value, expireSeconds = 3600) => {
  if (!redisClient || !redisClient.isOpen) return false;
  try {
    await redisClient.setEx(key, expireSeconds, value);
    return true;
  } catch (error) {
    console.error('Redis SET error:', error);
    return false;
  }
};

const delAsync = async (key) => {
  if (!redisClient || !redisClient.isOpen) return false;
  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error('Redis DEL error:', error);
    return false;
  }
};

module.exports = {
  connectDB,
  connectRedis,
  redisClient: () => redisClient,
  getAsync,
  setAsync,
  delAsync,
};
