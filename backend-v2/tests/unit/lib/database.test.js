const database = require('../../../src/lib/database');
const mongoose = require('mongoose');

// Mock mongoose
jest.mock('mongoose', () => ({
  connect: jest.fn(),
  connection: {
    close: jest.fn(),
    on: jest.fn(),
    db: {
      admin: jest.fn().mockReturnValue({
        ping: jest.fn().mockResolvedValue(true),
      }),
    },
    host: 'localhost',
    name: 'test-db',
    readyState: 1,
  },
}));

describe('Database Connection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    database.isConnected = false;
    database.connectionAttempts = 0;
  });

  describe('connect()', () => {
    test('should connect to MongoDB successfully', async () => {
      mongoose.connect.mockResolvedValueOnce(mongoose);

      const result = await database.connect();

      expect(mongoose.connect).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          maxPoolSize: expect.any(Number),
          serverSelectionTimeoutMS: expect.any(Number),
        }),
      );
      expect(database.isConnected).toBe(true);
      expect(result).toBe(mongoose);
    });

    test('should return existing connection if already connected', async () => {
      database.isConnected = true;
      database.connection = mongoose;

      const result = await database.connect();

      expect(mongoose.connect).not.toHaveBeenCalled();
      expect(result).toBe(mongoose);
    });

    test('should retry on connection failure', async () => {
      mongoose.connect
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValueOnce(mongoose);

      database.maxRetries = 2;
      database.retryDelay = 100;

      const result = await database.connect();

      expect(mongoose.connect).toHaveBeenCalledTimes(2);
      expect(database.isConnected).toBe(true);
    });

    test('should throw error after max retries', async () => {
      mongoose.connect.mockRejectedValue(new Error('Connection failed'));

      database.maxRetries = 2;
      database.retryDelay = 100;

      await expect(database.connect()).rejects.toThrow(
        'Failed to connect to MongoDB after 2 attempts',
      );
      expect(mongoose.connect).toHaveBeenCalledTimes(2);
    });
  });

  describe('disconnect()', () => {
    test('should disconnect from MongoDB', async () => {
      database.isConnected = true;
      mongoose.connection.close.mockResolvedValueOnce();

      await database.disconnect();

      expect(mongoose.connection.close).toHaveBeenCalled();
      expect(database.isConnected).toBe(false);
    });

    test('should not disconnect if not connected', async () => {
      database.isConnected = false;

      await database.disconnect();

      expect(mongoose.connection.close).not.toHaveBeenCalled();
    });

    test('should throw error if disconnect fails', async () => {
      database.isConnected = true;
      mongoose.connection.close.mockRejectedValueOnce(new Error('Disconnect failed'));

      await expect(database.disconnect()).rejects.toThrow('Disconnect failed');
    });
  });

  describe('healthCheck()', () => {
    test('should return healthy status when connected', async () => {
      database.isConnected = true;

      const health = await database.healthCheck();

      expect(health.status).toBe('connected');
      expect(health.healthy).toBe(true);
      expect(health.host).toBe('localhost');
      expect(health.name).toBe('test-db');
    });

    test('should return disconnected status when not connected', async () => {
      database.isConnected = false;

      const health = await database.healthCheck();

      expect(health.status).toBe('disconnected');
      expect(health.healthy).toBe(false);
    });

    test('should return unhealthy status on ping failure', async () => {
      database.isConnected = true;
      mongoose.connection.db.admin().ping.mockRejectedValueOnce(new Error('Ping failed'));

      const health = await database.healthCheck();

      expect(health.status).toBe('unhealthy');
      expect(health.healthy).toBe(false);
      expect(health.error).toBe('Ping failed');
    });
  });

  describe('getStatus()', () => {
    test('should return connection status', () => {
      database.isConnected = true;

      const status = database.getStatus();

      expect(status.isConnected).toBe(true);
      expect(status.readyState).toBe(1);
      expect(status.host).toBe('localhost');
      expect(status.name).toBe('test-db');
    });
  });

  describe('sanitizeUri()', () => {
    test('should hide password in URI', () => {
      const uri = 'mongodb://user:password123@localhost:27017/db';
      const sanitized = database.sanitizeUri(uri);

      expect(sanitized).toBe('mongodb://user:****@localhost:27017/db');
      expect(sanitized).not.toContain('password123');
    });

    test('should handle URI without password', () => {
      const uri = 'mongodb://localhost:27017/db';
      const sanitized = database.sanitizeUri(uri);

      expect(sanitized).toBe('mongodb://localhost:27017/db');
    });
  });
});
