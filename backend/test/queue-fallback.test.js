/**
 * Queue Fallback System Tests
 * Tests the three-tier queue system: Redis → Memory → Sync
 */

const EmailProcessingQueue = require('../src/services/emailProcessingQueue');

// Mock dependencies
jest.mock('bull');
jest.mock('../src/services/InMemoryQueue');

const Queue = require('bull');
const InMemoryQueue = require('../src/services/InMemoryQueue');

describe('EmailProcessingQueue - Fallback System', () => {
  let originalEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = process.env.NODE_ENV;
    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original environment
    process.env.NODE_ENV = originalEnv;
  });

  describe('Queue Type Selection', () => {
    test('should use Redis queue when available', () => {
      // Mock successful Redis connection
      const mockQueue = {
        on: jest.fn(),
        process: jest.fn(),
        getWaitingCount: jest.fn().mockResolvedValue(0),
        getActiveCount: jest.fn().mockResolvedValue(0),
        getCompletedCount: jest.fn().mockResolvedValue(0),
        getFailedCount: jest.fn().mockResolvedValue(0),
        getDelayedCount: jest.fn().mockResolvedValue(0)
      };
      Queue.mockImplementation(() => mockQueue);

      const queueService = new EmailProcessingQueue();

      expect(queueService.queueType).toBe('redis');
      expect(Queue).toHaveBeenCalledWith(
        'email-processing',
        expect.objectContaining({
          redis: expect.any(Object)
        })
      );
    });

    test('should use in-memory queue in development when Redis fails', () => {
      // Mock Redis connection failure
      Queue.mockImplementation(() => {
        throw new Error('Redis connection failed');
      });

      // Mock InMemoryQueue
      const mockMemoryQueue = {
        on: jest.fn(),
        process: jest.fn(),
        add: jest.fn().mockResolvedValue({ id: 'test-job-1' })
      };
      InMemoryQueue.mockImplementation(() => mockMemoryQueue);

      // Set development environment
      process.env.NODE_ENV = 'development';

      const queueService = new EmailProcessingQueue();

      expect(queueService.queueType).toBe('memory');
      expect(InMemoryQueue).toHaveBeenCalledWith('email-processing');
    });

    test('should use synchronous mode in production when Redis fails', () => {
      // Mock Redis connection failure
      Queue.mockImplementation(() => {
        throw new Error('Redis connection failed');
      });

      // Set production environment
      process.env.NODE_ENV = 'production';

      const queueService = new EmailProcessingQueue();

      expect(queueService.queueType).toBe('sync');
      expect(InMemoryQueue).not.toHaveBeenCalled();
    });
  });

  describe('addToQueue Method', () => {
    test('should add job to Redis queue when available', async () => {
      const mockQueue = {
        on: jest.fn(),
        process: jest.fn(),
        add: jest.fn().mockResolvedValue({ id: 'redis-job-1' })
      };
      Queue.mockImplementation(() => mockQueue);

      const queueService = new EmailProcessingQueue();
      const emailData = { emailId: 'email-1', tenantId: 'tenant-1' };

      const result = await queueService.addToQueue(emailData);

      expect(mockQueue.add).toHaveBeenCalledWith(emailData, expect.any(Object));
      expect(result).toEqual({ id: 'redis-job-1' });
    });

    test('should add job to in-memory queue in development', async () => {
      Queue.mockImplementation(() => {
        throw new Error('Redis unavailable');
      });

      const mockMemoryQueue = {
        on: jest.fn(),
        process: jest.fn(),
        add: jest.fn().mockResolvedValue({ id: 'memory-job-1' })
      };
      InMemoryQueue.mockImplementation(() => mockMemoryQueue);

      process.env.NODE_ENV = 'development';

      const queueService = new EmailProcessingQueue();
      const emailData = { emailId: 'email-2', tenantId: 'tenant-1' };

      const result = await queueService.addToQueue(emailData);

      expect(mockMemoryQueue.add).toHaveBeenCalledWith(emailData, expect.any(Object));
      expect(result).toEqual({ id: 'memory-job-1' });
    });

    test('should process synchronously when no queue available', async () => {
      Queue.mockImplementation(() => {
        throw new Error('Redis unavailable');
      });

      process.env.NODE_ENV = 'production';

      const queueService = new EmailProcessingQueue();
      
      // Mock processEmail to prevent actual processing
      queueService.processEmail = jest.fn().mockResolvedValue({ status: 'processed' });

      const emailData = { emailId: 'email-3', tenantId: 'tenant-1' };

      const result = await queueService.addToQueue(emailData);

      expect(queueService.processEmail).toHaveBeenCalledWith({ data: emailData });
      expect(result).toEqual({ status: 'processed' });
    });
  });

  describe('getStats Method', () => {
    test('should return queue stats for Redis queue', async () => {
      const mockQueue = {
        on: jest.fn(),
        process: jest.fn(),
        getWaitingCount: jest.fn().mockResolvedValue(5),
        getActiveCount: jest.fn().mockResolvedValue(2),
        getCompletedCount: jest.fn().mockResolvedValue(100),
        getFailedCount: jest.fn().mockResolvedValue(3),
        getDelayedCount: jest.fn().mockResolvedValue(1)
      };
      Queue.mockImplementation(() => mockQueue);

      const queueService = new EmailProcessingQueue();
      const stats = await queueService.getStats();

      expect(stats).toEqual({
        waiting: 5,
        active: 2,
        completed: 100,
        failed: 3,
        delayed: 1,
        total: 111,
        mode: 'redis'
      });
    });

    test('should return queue stats for in-memory queue', async () => {
      Queue.mockImplementation(() => {
        throw new Error('Redis unavailable');
      });

      const mockMemoryQueue = {
        on: jest.fn(),
        process: jest.fn(),
        getWaitingCount: jest.fn().mockResolvedValue(3),
        getActiveCount: jest.fn().mockResolvedValue(1),
        getCompletedCount: jest.fn().mockResolvedValue(50),
        getFailedCount: jest.fn().mockResolvedValue(2),
        getDelayedCount: jest.fn().mockResolvedValue(0)
      };
      InMemoryQueue.mockImplementation(() => mockMemoryQueue);

      process.env.NODE_ENV = 'development';

      const queueService = new EmailProcessingQueue();
      const stats = await queueService.getStats();

      expect(stats).toEqual({
        waiting: 3,
        active: 1,
        completed: 50,
        failed: 2,
        delayed: 0,
        total: 56,
        mode: 'memory'
      });
    });

    test('should return zero stats for synchronous mode', async () => {
      Queue.mockImplementation(() => {
        throw new Error('Redis unavailable');
      });

      process.env.NODE_ENV = 'production';

      const queueService = new EmailProcessingQueue();
      const stats = await queueService.getStats();

      expect(stats).toEqual({
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
        total: 0,
        mode: 'synchronous'
      });
    });
  });

  describe('pause and resume Methods', () => {
    test('should pause and resume Redis queue', async () => {
      const mockQueue = {
        on: jest.fn(),
        process: jest.fn(),
        pause: jest.fn().mockResolvedValue(undefined),
        resume: jest.fn().mockResolvedValue(undefined)
      };
      Queue.mockImplementation(() => mockQueue);

      const queueService = new EmailProcessingQueue();

      await queueService.pause();
      expect(mockQueue.pause).toHaveBeenCalled();

      await queueService.resume();
      expect(mockQueue.resume).toHaveBeenCalled();
    });

    test('should pause and resume in-memory queue', async () => {
      Queue.mockImplementation(() => {
        throw new Error('Redis unavailable');
      });

      const mockMemoryQueue = {
        on: jest.fn(),
        process: jest.fn(),
        pause: jest.fn().mockResolvedValue(undefined),
        resume: jest.fn().mockResolvedValue(undefined)
      };
      InMemoryQueue.mockImplementation(() => mockMemoryQueue);

      process.env.NODE_ENV = 'development';

      const queueService = new EmailProcessingQueue();

      await queueService.pause();
      expect(mockMemoryQueue.pause).toHaveBeenCalled();

      await queueService.resume();
      expect(mockMemoryQueue.resume).toHaveBeenCalled();
    });

    test('should not call pause/resume in synchronous mode', async () => {
      Queue.mockImplementation(() => {
        throw new Error('Redis unavailable');
      });

      process.env.NODE_ENV = 'production';

      const queueService = new EmailProcessingQueue();

      // Should not throw error
      await expect(queueService.pause()).resolves.toBeUndefined();
      await expect(queueService.resume()).resolves.toBeUndefined();
    });
  });

  describe('cleanOldJobs Method', () => {
    test('should clean old jobs from Redis queue', async () => {
      const mockQueue = {
        on: jest.fn(),
        process: jest.fn(),
        clean: jest.fn().mockResolvedValue(undefined)
      };
      Queue.mockImplementation(() => mockQueue);

      const queueService = new EmailProcessingQueue();

      await queueService.cleanOldJobs(1000);

      expect(mockQueue.clean).toHaveBeenCalledWith(1000, 'completed');
      expect(mockQueue.clean).toHaveBeenCalledWith(1000, 'failed');
    });

    test('should not call clean in synchronous mode', async () => {
      Queue.mockImplementation(() => {
        throw new Error('Redis unavailable');
      });

      process.env.NODE_ENV = 'production';

      const queueService = new EmailProcessingQueue();

      // Should not throw error
      await expect(queueService.cleanOldJobs()).resolves.toBeUndefined();
    });
  });
});
