const app = require('./app');
const config = require('./config');
const logger = require('./lib/logger');
const database = require('./lib/database');
const redis = require('./lib/redis');
const sentry = require('./lib/sentry');
const metrics = require('./lib/metrics');

const PORT = config.port;

let server;

/**
 * Initialize database connections and start server
 */
async function startServer() {
  try {
    // Initialize observability
    logger.info('Initializing observability...');
    sentry.initSentry(app);
    metrics.initMetrics();
    
    // Connect to database and Redis
    logger.info('Initializing database connections...');
    await database.connect();
    
    // Try to connect to Redis with a timeout, but don't fail if it's not available
    try {
      const redisTimeout = 5000; // 5 second timeout for Redis
      const redisPromise = redis.connect();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Redis connection timeout')), redisTimeout)
      );
      
      await Promise.race([redisPromise, timeoutPromise]);
      logger.info('Redis connection established');
    } catch (redisError) {
      logger.warn('Redis connection failed - continuing without Redis', { 
        error: redisError.message 
      });
      logger.info('Note: Email queues and caching will be disabled');
    }
    logger.info('Database connections established');

    // Start Express server
    server = app.listen(PORT, () => {
      logger.info('Server started', {
        port: PORT,
        environment: config.env,
        nodeVersion: process.version,
        apiVersion: config.apiVersion,
      });
      
      logger.info('Health endpoints available', {
        health: `http://localhost:${PORT}/health`,
        ready: `http://localhost:${PORT}/ready`,
        version: `http://localhost:${PORT}/version`,
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received, shutting down gracefully`);
  
  if (server) {
    server.close(async () => {
      logger.info('Server closed');
      
      // Close database connections
      await database.disconnect();
      
      try {
        await redis.disconnect();
      } catch (error) {
        logger.warn('Redis disconnect failed (may not be connected)', { error: error.message });
      }
      
      logger.info('Shutdown complete');
      process.exit(0);
    });
  } else {
    // Server never started, just close database connections
    try {
      await database.disconnect();
    } catch (error) {
      logger.error('Database disconnect failed', { error: error.message });
    }
    
    try {
      await redis.disconnect();
    } catch (error) {
      logger.warn('Redis disconnect failed (may not be connected)', { error: error.message });
    }
    
    logger.info('Shutdown complete');
    process.exit(0);
  }
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled rejection', { error: err });
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { error: err });
  process.exit(1);
});

// Start the server
startServer();

module.exports = server;
