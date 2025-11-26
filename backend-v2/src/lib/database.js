const mongoose = require('mongoose');
const logger = require('./logger');
const config = require('../config');

class Database {
  constructor() {
    this.connection = null;
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.maxRetries = config.database.maxRetries || 5;
    this.retryDelay = config.database.retryDelay || 5000;
  }

  /**
   * Connect to MongoDB with retry logic
   */
  async connect() {
    if (this.isConnected) {
      logger.info('Already connected to MongoDB');
      return this.connection;
    }

    try {
      this.connectionAttempts++;
      logger.info('Connecting to MongoDB...', {
        attempt: this.connectionAttempts,
        uri: this.sanitizeUri(config.database.uri),
      });

      const options = {
        maxPoolSize: config.database.poolSize,
        serverSelectionTimeoutMS: config.database.connectTimeout,
        socketTimeoutMS: config.database.socketTimeout,
        family: 4, // Use IPv4, skip IPv6
      };

      this.connection = await mongoose.connect(config.database.uri, options);
      this.isConnected = true;
      this.connectionAttempts = 0;

      logger.info('Successfully connected to MongoDB', {
        host: this.connection.connection.host,
        name: this.connection.connection.name,
      });

      this.setupEventListeners();

      return this.connection;
    } catch (error) {
      logger.error('MongoDB connection error', {
        error: error.message,
        attempt: this.connectionAttempts,
      });

      if (this.connectionAttempts < this.maxRetries) {
        logger.info(`Retrying connection in ${this.retryDelay / 1000}s...`);
        await this.delay(this.retryDelay);
        return this.connect();
      }

      throw new Error(`Failed to connect to MongoDB after ${this.maxRetries} attempts`);
    }
  }

  /**
   * Setup connection event listeners
   */
  setupEventListeners() {
    mongoose.connection.on('connected', () => {
      logger.info('MongoDB connection established');
      this.isConnected = true;
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB connection disconnected');
      this.isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB connection reconnected');
      this.isConnected = true;
    });

    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error', { error: error.message });
      this.isConnected = false;
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      await this.disconnect();
      process.exit(0);
    });
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnect() {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.connection.close();
      this.isConnected = false;
      logger.info('MongoDB connection closed');
    } catch (error) {
      logger.error('Error closing MongoDB connection', { error: error.message });
      throw error;
    }
  }

  /**
   * Check if database is healthy
   */
  async healthCheck() {
    try {
      if (!this.isConnected) {
        return { status: 'disconnected', healthy: false };
      }

      // Ping the database
      await mongoose.connection.db.admin().ping();

      return {
        status: 'connected',
        healthy: true,
        host: mongoose.connection.host,
        name: mongoose.connection.name,
        readyState: mongoose.connection.readyState,
      };
    } catch (error) {
      logger.error('Database health check failed', { error: error.message });
      return {
        status: 'unhealthy',
        healthy: false,
        error: error.message,
      };
    }
  }

  /**
   * Sanitize MongoDB URI for logging (hide password)
   */
  sanitizeUri(uri) {
    return uri.replace(/:([^:@]+)@/, ':****@');
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
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      name: mongoose.connection.name,
    };
  }
}

// Export singleton instance
const database = new Database();
module.exports = database;
