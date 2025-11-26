const redis = require('../../../src/lib/redis');
const Redis = require('ioredis');

// Mock ioredis
jest.mock('ioredis');

describe('Redis Connection', () => {
  let mockRedisClient;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockRedisClient = {
      connect: jest.fn().mockResolvedValue(),
      quit: jest.fn().mockResolvedValue(),
      disconnect: jest.fn(),
      ping: jest.fn().mockResolvedValue('PONG'),
      get: jest.fn(),
      set: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
      keys: jest.fn(),
      on: jest.fn(),
      options: {
        host: 'localhost',
        port: 6379,
        db: 0,
      },
      status: 'ready',
    };

    Redis.mockImplementation(() => mockRedisClient);

    redis.client = null;
    redis.isConnected = false;
    redis.connectionAttempts = 0;
  });

  describe('connect()', () => {
    test('should connect to Redis successfully', async () => {
      const result = await redis.connect();

      expect(Redis).toHaveBeenCalled();
      expect(mockRedisClient.connect).toHaveBeenCalled();
      expect(redis.isConnected).toBe(true);
      expect(result).toBe(mockRedisClient);
    });

    test('should return existing connection if already connected', async () => {
      redis.isConnected = true;
      redis.client = mockRedisClient;

      const result = await redis.connect();

      expect(Redis).not.toHaveBeenCalled();
      expect(result).toBe(mockRedisClient);
    });

    test('should retry on connection failure', async () => {
      mockRedisClient.connect
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValueOnce();

      redis.maxRetries = 2;
      redis.retryDelay = 100;

      await redis.connect();

      expect(mockRedisClient.connect).toHaveBeenCalledTimes(2);
      expect(redis.isConnected).toBe(true);
    });

    test('should return null after max retries', async () => {
      mockRedisClient.connect.mockRejectedValue(new Error('Connection failed'));

      redis.maxRetries = 2;
      redis.retryDelay = 100;

      const result = await redis.connect();
      expect(result).toBeNull();
      expect(redis.isConnected).toBe(false);
    });
  });

  describe('disconnect()', () => {
    test('should disconnect from Redis gracefully', async () => {
      redis.isConnected = true;
      redis.client = mockRedisClient;

      await redis.disconnect();

      expect(mockRedisClient.quit).toHaveBeenCalled();
      expect(redis.isConnected).toBe(false);
    });

    test('should force disconnect if quit fails', async () => {
      redis.isConnected = true;
      redis.client = mockRedisClient;
      mockRedisClient.quit.mockRejectedValueOnce(new Error('Quit failed'));

      await redis.disconnect();

      expect(mockRedisClient.disconnect).toHaveBeenCalled();
    });

    test('should not disconnect if not connected', async () => {
      redis.isConnected = false;
      redis.client = null;

      await redis.disconnect();

      expect(mockRedisClient.quit).not.toHaveBeenCalled();
    });
  });

  describe('healthCheck()', () => {
    test('should return healthy status when connected', async () => {
      redis.isConnected = true;
      redis.client = mockRedisClient;

      const health = await redis.healthCheck();

      expect(mockRedisClient.ping).toHaveBeenCalled();
      expect(health.status).toBe('connected');
      expect(health.healthy).toBe(true);
      expect(health.host).toBe('localhost');
      expect(health.port).toBe(6379);
    });

    test('should return disconnected status when not connected', async () => {
      redis.isConnected = false;

      const health = await redis.healthCheck();

      expect(health.status).toBe('disconnected');
      expect(health.healthy).toBe(false);
    });

    test('should return unhealthy status on ping failure', async () => {
      redis.isConnected = true;
      redis.client = mockRedisClient;
      mockRedisClient.ping.mockRejectedValueOnce(new Error('Ping failed'));

      const health = await redis.healthCheck();

      expect(health.status).toBe('unhealthy');
      expect(health.healthy).toBe(false);
      expect(health.error).toBe('Ping failed');
    });
  });

  describe('get()', () => {
    test('should get value from Redis', async () => {
      redis.client = mockRedisClient;
      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify({ test: 'data' }));

      const result = await redis.get('test-key');

      expect(mockRedisClient.get).toHaveBeenCalledWith('test-key');
      expect(result).toEqual({ test: 'data' });
    });

    test('should return null for non-existent key', async () => {
      redis.client = mockRedisClient;
      mockRedisClient.get.mockResolvedValueOnce(null);

      const result = await redis.get('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('set()', () => {
    test('should set value in Redis without TTL', async () => {
      redis.client = mockRedisClient;

      await redis.set('test-key', { test: 'data' });

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify({ test: 'data' }),
      );
    });

    test('should set value in Redis with TTL', async () => {
      redis.client = mockRedisClient;

      await redis.set('test-key', { test: 'data' }, 3600);

      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        'test-key',
        3600,
        JSON.stringify({ test: 'data' }),
      );
    });
  });

  describe('del()', () => {
    test('should delete key from Redis', async () => {
      redis.client = mockRedisClient;

      await redis.del('test-key');

      expect(mockRedisClient.del).toHaveBeenCalledWith('test-key');
    });
  });

  describe('delPattern()', () => {
    test('should delete keys matching pattern', async () => {
      redis.client = mockRedisClient;
      mockRedisClient.keys.mockResolvedValueOnce(['key1', 'key2', 'key3']);

      const count = await redis.delPattern('test:*');

      expect(mockRedisClient.keys).toHaveBeenCalledWith('test:*');
      expect(mockRedisClient.del).toHaveBeenCalledWith('key1', 'key2', 'key3');
      expect(count).toBe(3);
    });

    test('should not delete if no keys match', async () => {
      redis.client = mockRedisClient;
      mockRedisClient.keys.mockResolvedValueOnce([]);

      const count = await redis.delPattern('test:*');

      expect(mockRedisClient.del).not.toHaveBeenCalled();
      expect(count).toBe(0);
    });
  });

  describe('sanitizeUrl()', () => {
    test('should hide password in URL', () => {
      const url = 'redis://:password123@localhost:6379';
      const sanitized = redis.sanitizeUrl(url);

      expect(sanitized).toBe('redis://:****@localhost:6379');
      expect(sanitized).not.toContain('password123');
    });
  });

  describe('getStatus()', () => {
    test('should return connection status', () => {
      redis.isConnected = true;
      redis.client = mockRedisClient;

      const status = redis.getStatus();

      expect(status.isConnected).toBe(true);
      expect(status.status).toBe('ready');
      expect(status.host).toBe('localhost');
      expect(status.port).toBe(6379);
    });
  });
});
