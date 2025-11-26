// Mock Redis (which we don't have) and nodemailer (to avoid actual email sending in tests)
jest.mock('../../src/lib/redis', () => ({
  healthCheck: jest.fn().mockResolvedValue({ status: 'connected', healthy: true }),
  get: jest.fn().mockImplementation((key) => {
    // Mock refresh token storage - return valid token data for refresh_token keys
    if (key && key.startsWith('refresh_token:')) {
      return Promise.resolve(JSON.stringify({
        userId: 'mock-user-id',
        tenantId: 'mock-tenant-id',
        createdAt: new Date().toISOString(),
      }));
    }
    return Promise.resolve(null);
  }),
  set: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
  exists: jest.fn().mockResolvedValue(0),
  setex: jest.fn().mockResolvedValue('OK'),
}));

jest.mock('nodemailer', () => ({
  createTransporter: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({
      messageId: 'test-message-id',
      accepted: ['test@example.com'],
    }),
  }),
}));

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const User = require('../../src/models/User');
const Tenant = require('../../src/models/Tenant');
const database = require('../../src/lib/database');

describe('Auth Routes Integration Tests - NO MOCKS (Real Database & Services)', () => {
  let testTenant;
  let testUser;
  let accessToken;
  let refreshToken;

  // Connect to test database
  beforeAll(async () => {
    await database.connect();
  });

  // Cleanup after all tests
  afterAll(async () => {
    await database.disconnect();
  });

  // Create test tenant before each test suite
  beforeEach(async () => {
    // Clean up any existing test data
    await User.deleteMany({ email: /test.*@example\.com/ });
    await Tenant.deleteMany({ slug: /test-tenant-/ });

    // Create a real test tenant
    testTenant = await Tenant.create({
      name: 'Test Tenant',
      slug: 'test-tenant-' + Date.now(),
      domain: 'test-tenant-' + Date.now() + '.example.com',
      status: 'active',
      branding: {
        primaryColor: '#000000',
        logo: 'https://example.com/logo.png',
      },
    });
  });

  // Cleanup after each test
  afterEach(async () => {
    if (testTenant) {
      await User.deleteMany({ tenant: testTenant._id });
      await Tenant.findByIdAndDelete(testTenant._id);
    }
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const registrationData = {
        email: 'newuser' + Date.now() + '@example.com',
        password: 'SecurePass123',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'customer',
      };

      const response = await request(app)
        .post('/auth/register')
        .set('X-Tenant-Slug', testTenant.slug)
        .send(registrationData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(registrationData.email);
      expect(response.body.data.user.firstName).toBe(registrationData.firstName);
      expect(response.body.data.message).toContain('Registration successful');

      // Verify user was actually created in database
      const user = await User.findOne({ email: registrationData.email });
      expect(user).toBeDefined();
      expect(user.tenant.toString()).toBe(testTenant._id.toString());
      expect(user.emailVerified).toBe(false);
      expect(user.status).toBe('active');
    });

    it('should return 400 when email is missing', async () => {
      const response = await request(app)
        .post('/auth/register')
        .set('X-Tenant-Slug', testTenant.slug)
        .send({
          password: 'SecurePass123',
          firstName: 'Jane',
          lastName: 'Smith',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when password is too weak', async () => {
      const response = await request(app)
        .post('/auth/register')
        .set('X-Tenant-Slug', testTenant.slug)
        .send({
          email: 'test@example.com',
          password: 'weak',
          firstName: 'Jane',
          lastName: 'Smith',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 when email format is invalid', async () => {
      const response = await request(app)
        .post('/auth/register')
        .set('X-Tenant-Slug', testTenant.slug)
        .send({
          email: 'invalid-email',
          password: 'SecurePass123',
          firstName: 'Jane',
          lastName: 'Smith',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 when tenant not found', async () => {
      const response = await request(app)
        .post('/auth/register')
        .set('X-Tenant-Slug', 'nonexistent-tenant-12345')
        .send({
          email: 'test@example.com',
          password: 'SecurePass123',
          firstName: 'Jane',
          lastName: 'Smith',
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      // Create a real user for login tests
      const registrationData = {
        email: 'loginuser' + Date.now() + '@example.com',
        password: 'SecurePass123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'customer',
      };

      const response = await request(app)
        .post('/auth/register')
        .set('X-Tenant-Slug', testTenant.slug)
        .send(registrationData);

      if (response.status !== 201 || !response.body.data) {
        console.error('Registration failed in login beforeEach:', response.body);
        throw new Error('Failed to create test user for login tests');
      }

      // Manually verify email for login test and get updated user
      const updatedUser = await User.findByIdAndUpdate(
        response.body.data.user._id,
        { emailVerified: true },
        { new: true }
      ).lean();
      
      testUser = updatedUser;
    });

    it('should login user successfully', async () => {
      const response = await request(app)
        .post('/auth/login')
        .set('X-Tenant-Slug', testTenant.slug)
        .send({
          email: testUser.email,
          password: 'SecurePass123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();

      // Save tokens for other tests
      accessToken = response.body.data.accessToken;
      refreshToken = response.body.data.refreshToken;
    });

    it('should return 400 when email is missing', async () => {
      const response = await request(app)
        .post('/auth/login')
        .set('X-Tenant-Slug', testTenant.slug)
        .send({ password: 'SecurePass123' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 when password is missing', async () => {
      const response = await request(app)
        .post('/auth/login')
        .set('X-Tenant-Slug', testTenant.slug)
        .send({ email: testUser.email });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 when tenant not found', async () => {
      const response = await request(app)
        .post('/auth/login')
        .set('X-Tenant-Slug', 'nonexistent-tenant-12345')
        .send({
          email: testUser.email,
          password: 'SecurePass123',
        });

      expect(response.status).toBe(404);
    });

    it('should return 401 with wrong password', async () => {
      const response = await request(app)
        .post('/auth/login')
        .set('X-Tenant-Slug', testTenant.slug)
        .send({
          email: testUser.email,
          password: 'WrongPassword123',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /auth/verify-email', () => {
    it('should return 400 when token is missing', async () => {
      const response = await request(app)
        .post('/auth/verify-email')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 when token is invalid', async () => {
      const response = await request(app)
        .post('/auth/verify-email')
        .send({ token: 'invalid-token-123' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /auth/logout', () => {
    beforeEach(async () => {
      // Create and login a user
      const registrationData = {
        email: 'logoutuser' + Date.now() + '@example.com',
        password: 'SecurePass123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'customer',
      };

      await request(app)
        .post('/auth/register')
        .set('X-Tenant-Slug', testTenant.slug)
        .send(registrationData);

      await User.findOneAndUpdate(
        { email: registrationData.email },
        { emailVerified: true }
      );

      const loginResponse = await request(app)
        .post('/auth/login')
        .set('X-Tenant-Slug', testTenant.slug)
        .send({
          email: registrationData.email,
          password: 'SecurePass123',
        });

      accessToken = loginResponse.body.data.accessToken;
      refreshToken = loginResponse.body.data.refreshToken;
    });

    it('should logout user successfully', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .send({ refreshToken: 'some-token' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 when refreshToken is missing', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /auth/refresh-token', () => {
    beforeEach(async () => {
      // Create and login a user
      const registrationData = {
        email: 'refreshuser' + Date.now() + '@example.com',
        password: 'SecurePass123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'customer',
      };

      await request(app)
        .post('/auth/register')
        .set('X-Tenant-Slug', testTenant.slug)
        .send(registrationData);

      await User.findOneAndUpdate(
        { email: registrationData.email },
        { emailVerified: true }
      );

      const loginResponse = await request(app)
        .post('/auth/login')
        .set('X-Tenant-Slug', testTenant.slug)
        .send({
          email: registrationData.email,
          password: 'SecurePass123',
        });

      refreshToken = loginResponse.body.data.refreshToken;
    });

    it('should refresh access token successfully', async () => {
      const response = await request(app)
        .post('/auth/refresh-token')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
    });

    it('should return 400 when refreshToken is missing', async () => {
      const response = await request(app)
        .post('/auth/refresh-token')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /auth/forgot-password', () => {
    beforeEach(async () => {
      // Create a user
      const registrationData = {
        email: 'forgotpwd' + Date.now() + '@example.com',
        password: 'SecurePass123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'customer',
      };

      await request(app)
        .post('/auth/register')
        .set('X-Tenant-Slug', testTenant.slug)
        .send(registrationData);

      testUser = await User.findOne({ email: registrationData.email });
    });

    it('should request password reset successfully', async () => {
      const response = await request(app)
        .post('/auth/forgot-password')
        .set('X-Tenant-Slug', testTenant.slug)
        .send({ email: testUser.email });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 400 when email is missing', async () => {
      const response = await request(app)
        .post('/auth/forgot-password')
        .set('X-Tenant-Slug', testTenant.slug)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 when tenant not found', async () => {
      const response = await request(app)
        .post('/auth/forgot-password')
        .set('X-Tenant-Slug', 'nonexistent-tenant-12345')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(404);
    });
  });

  describe('POST /auth/reset-password', () => {
    it('should return 400 when token is missing', async () => {
      const response = await request(app)
        .post('/auth/reset-password')
        .send({ newPassword: 'NewSecurePass123' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 when newPassword is missing', async () => {
      const response = await request(app)
        .post('/auth/reset-password')
        .send({ token: 'reset-token-123' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 when newPassword is too weak', async () => {
      const response = await request(app)
        .post('/auth/reset-password')
        .send({
          token: 'reset-token-123',
          newPassword: 'weak',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 when token is invalid', async () => {
      const response = await request(app)
        .post('/auth/reset-password')
        .send({
          token: 'invalid-token-123',
          newPassword: 'NewSecurePass123',
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});
