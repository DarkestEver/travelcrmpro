const packageJson = require('../../package.json');
const { ServiceUnavailableError } = require('../lib/errors');
const database = require('../lib/database');
const redis = require('../lib/redis');

/**
 * Basic health check
 */
exports.health = (req, res) => {
  res.ok({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version: packageJson.version,
  });
};

/**
 * Readiness check - verify dependencies
 */
exports.ready = async (req, res, next) => {
  try {
    // Check database and Redis connections
    const dbHealth = await database.healthCheck();
    const redisHealth = await redis.healthCheck();

    const checks = {
      database: dbHealth.status,
      redis: redisHealth.status,
    };
    
    const isReady = dbHealth.healthy && redisHealth.healthy;
    
    if (!isReady) {
      throw new ServiceUnavailableError('Service not ready', 'SERVICE_NOT_READY', checks);
    }
    
    res.ok({
      status: 'ready',
      checks,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Version information
 */
exports.version = (req, res) => {
  res.ok({
    version: packageJson.version,
    apiVersion: process.env.API_VERSION || 'v2',
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development',
  });
};
