// Mock nodemailer to avoid email configuration issues
jest.mock('nodemailer', () => ({
  createTransporter: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
  }))
}));

const request = require('supertest');
const app = require('../../src/app');
const database = require('../../src/lib/database');
const redis = require('../../src/lib/redis');

// Mock database and redis
jest.mock('../../src/lib/database');
jest.mock('../../src/lib/redis');

describe('Health Endpoints', () => {
  beforeEach(() => {
    // Mock successful health checks by default
    database.healthCheck = jest.fn().mockResolvedValue({
      status: 'connected',
      healthy: true,
    });
    redis.healthCheck = jest.fn().mockResolvedValue({
      status: 'connected',
      healthy: true,
    });
  });

  describe('GET /health', () => {
    test('should return 200 with health status', async () => {
      const res = await request(app).get('/health');
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('status', 'healthy');
      expect(res.body.data).toHaveProperty('timestamp');
      expect(res.body.data).toHaveProperty('uptime');
      expect(res.body.data).toHaveProperty('version');
      expect(res.body).toHaveProperty('traceId');
    });
  });
  
  describe('GET /ready', () => {
    test('should return 200 when ready', async () => {
      const res = await request(app).get('/ready');
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('status', 'ready');
      expect(res.body.data).toHaveProperty('checks');
      expect(res.body.data.checks).toHaveProperty('database');
      expect(res.body.data.checks).toHaveProperty('redis');
      expect(res.body).toHaveProperty('traceId');
    });

    test('should return 503 when database is unhealthy', async () => {
      database.healthCheck = jest.fn().mockResolvedValue({
        status: 'disconnected',
        healthy: false,
      });

      const res = await request(app).get('/ready');
      
      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
    });

    test('should return 503 when redis is unhealthy', async () => {
      redis.healthCheck = jest.fn().mockResolvedValue({
        status: 'disconnected',
        healthy: false,
      });

      const res = await request(app).get('/ready');
      
      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
    });
  });
  
  describe('GET /version', () => {
    test('should return version information', async () => {
      const res = await request(app).get('/version');
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('version');
      expect(res.body.data).toHaveProperty('apiVersion');
      expect(res.body.data).toHaveProperty('nodeVersion');
      expect(res.body.data).toHaveProperty('environment');
      expect(res.body.data.apiVersion).toBe('v2');
      expect(res.body).toHaveProperty('traceId');
    });
  });
  
  describe('404 Handler', () => {
    test('should return 404 for unknown routes', async () => {
      const res = await request(app).get('/unknown-route-xyz');
      
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toHaveProperty('code', 'ROUTE_NOT_FOUND');
      expect(res.body.error).toHaveProperty('message');
      expect(res.body.error.message).toContain('/unknown-route-xyz');
      expect(res.body).toHaveProperty('traceId');
    });
    
    test('should return 404 for POST to unknown route', async () => {
      const res = await request(app)
        .post('/unknown-route')
        .send({ data: 'test' });
      
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('ROUTE_NOT_FOUND');
    });
  });
  
  describe('Request ID Tracing', () => {
    test('should include traceId in all responses', async () => {
      const res = await request(app).get('/health');
      
      expect(res.body).toHaveProperty('traceId');
      expect(typeof res.body.traceId).toBe('string');
      expect(res.body.traceId.length).toBeGreaterThan(0);
    });
    
    test('should return X-Request-Id header', async () => {
      const res = await request(app).get('/health');
      
      expect(res.headers['x-request-id']).toBeDefined();
      expect(typeof res.headers['x-request-id']).toBe('string');
    });
  });
  
  describe('Rate Limiting', () => {
    test.skip('should return rate limit headers (skipped - rate limiting disabled in test env)', async () => {
      const res = await request(app).get('/health');
      
      expect(res.headers).toHaveProperty('ratelimit-limit');
      expect(res.headers).toHaveProperty('ratelimit-remaining');
      expect(res.headers).toHaveProperty('ratelimit-reset');
    });
  });
  
  describe('CORS Headers', () => {
    test('should include CORS headers', async () => {
      const res = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:5176');
      
      expect(res.headers['access-control-allow-origin']).toBeDefined();
    });
  });
  
  describe('Security Headers', () => {
    test('should include security headers from Helmet', async () => {
      const res = await request(app).get('/health');
      
      // Helmet adds various security headers
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBeDefined();
    });
  });
});
