const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../../../src/models/User');
const { USER_ROLES, USER_STATUS } = require('../../../src/config/constants');

// Mock bcrypt
jest.mock('bcryptjs');

// Mock mongoose
jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return {
    ...actual,
    connect: jest.fn(),
    connection: {
      close: jest.fn(),
      on: jest.fn(),
    },
  };
});

describe('User Model', () => {
  const validTenantId = new mongoose.Types.ObjectId();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema Validation', () => {
    test('should create a valid user with required fields', () => {
      const userData = {
        tenant: validTenantId,
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: USER_ROLES.CUSTOMER,
      };

      const user = new User(userData);
      const error = user.validateSync();

      expect(error).toBeUndefined();
      expect(user.email).toBe('test@example.com');
      expect(user.firstName).toBe('John');
      expect(user.role).toBe(USER_ROLES.CUSTOMER);
    });

    test('should fail validation without email', () => {
      const user = new User({
        tenant: validTenantId,
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      });
      const error = user.validateSync();

      expect(error).toBeDefined();
      expect(error.errors.email).toBeDefined();
    });

    test('should fail validation with invalid email', () => {
      const user = new User({
        tenant: validTenantId,
        email: 'invalid-email',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      });
      const error = user.validateSync();

      expect(error).toBeDefined();
      expect(error.errors.email).toBeDefined();
    });

    test('should fail validation without password', () => {
      const user = new User({
        tenant: validTenantId,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      });
      const error = user.validateSync();

      expect(error).toBeDefined();
      expect(error.errors.password).toBeDefined();
    });

    test('should fail validation with short password', () => {
      const user = new User({
        tenant: validTenantId,
        email: 'test@example.com',
        password: 'short',
        firstName: 'John',
        lastName: 'Doe',
      });
      const error = user.validateSync();

      expect(error).toBeDefined();
      expect(error.errors.password).toBeDefined();
      expect(error.errors.password.message).toContain('at least 8 characters');
    });

    test('should fail validation without firstName', () => {
      const user = new User({
        tenant: validTenantId,
        email: 'test@example.com',
        password: 'password123',
        lastName: 'Doe',
      });
      const error = user.validateSync();

      expect(error).toBeDefined();
      expect(error.errors.firstName).toBeDefined();
    });

    test('should fail validation without lastName', () => {
      const user = new User({
        tenant: validTenantId,
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
      });
      const error = user.validateSync();

      expect(error).toBeDefined();
      expect(error.errors.lastName).toBeDefined();
    });

    test('should fail validation with invalid role', () => {
      const user = new User({
        tenant: validTenantId,
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'invalid_role',
      });
      const error = user.validateSync();

      expect(error).toBeDefined();
      expect(error.errors.role).toBeDefined();
    });

    test('should accept all valid roles', () => {
      Object.values(USER_ROLES).forEach((role) => {
        const user = new User({
          tenant: role === USER_ROLES.SUPER_ADMIN ? undefined : validTenantId,
          email: `test-${role}@example.com`,
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
          role,
        });
        const error = user.validateSync();
        expect(error).toBeUndefined();
      });
    });

    test('should not require tenant for super_admin', () => {
      const user = new User({
        email: 'admin@example.com',
        password: 'password123',
        firstName: 'Admin',
        lastName: 'User',
        role: USER_ROLES.SUPER_ADMIN,
      });
      const error = user.validateSync();

      expect(error).toBeUndefined();
    });

    test('should require tenant for non-super_admin roles', () => {
      const user = new User({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: USER_ROLES.CUSTOMER,
      });
      const error = user.validateSync();

      expect(error).toBeDefined();
      expect(error.errors.tenant).toBeDefined();
    });
  });

  describe('Default Values', () => {
    test('should set default role to customer', () => {
      const user = new User({
        tenant: validTenantId,
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(user.role).toBe(USER_ROLES.CUSTOMER);
    });

    test('should set default status to active', () => {
      const user = new User({
        tenant: validTenantId,
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(user.status).toBe(USER_STATUS.ACTIVE);
    });

    test('should set default emailVerified to false', () => {
      const user = new User({
        tenant: validTenantId,
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(user.emailVerified).toBe(false);
    });

    test('should set default preferences', () => {
      const user = new User({
        tenant: validTenantId,
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(user.preferences.language).toBe('en');
      expect(user.preferences.timezone).toBe('UTC');
      expect(user.preferences.notifications.email).toBe(true);
      expect(user.preferences.notifications.sms).toBe(false);
    });
  });

  describe('Virtual Properties', () => {
    test('should generate fullName from firstName and lastName', () => {
      const user = new User({
        tenant: validTenantId,
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(user.fullName).toBe('John Doe');
    });

    test('should generate initials from firstName and lastName', () => {
      const user = new User({
        tenant: validTenantId,
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(user.initials).toBe('JD');
    });
  });

  describe('Instance Methods', () => {
    test('comparePassword should return true for correct password', async () => {
      bcrypt.compare.mockResolvedValue(true);

      const user = new User({
        tenant: validTenantId,
        email: 'test@example.com',
        password: 'hashedPassword',
        firstName: 'John',
        lastName: 'Doe',
      });

      const result = await user.comparePassword('password123');

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
    });

    test('comparePassword should return false for incorrect password', async () => {
      bcrypt.compare.mockResolvedValue(false);

      const user = new User({
        tenant: validTenantId,
        email: 'test@example.com',
        password: 'hashedPassword',
        firstName: 'John',
        lastName: 'Doe',
      });

      const result = await user.comparePassword('wrongPassword');

      expect(result).toBe(false);
    });

    test('generateVerificationToken should create token and expiry', () => {
      const user = new User({
        tenant: validTenantId,
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      });

      const token = user.generateVerificationToken();

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(user.verificationToken).toBeDefined();
      expect(user.verificationTokenExpiry).toBeDefined();
      expect(user.verificationTokenExpiry > new Date()).toBe(true);
    });

    test('generateResetToken should create token and expiry', () => {
      const user = new User({
        tenant: validTenantId,
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      });

      const token = user.generateResetToken();

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(user.resetToken).toBeDefined();
      expect(user.resetTokenExpiry).toBeDefined();
      expect(user.resetTokenExpiry > new Date()).toBe(true);
    });

    test('verifyResetToken should return true for valid token', () => {
      const user = new User({
        tenant: validTenantId,
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      });

      const token = user.generateResetToken();
      const isValid = user.verifyResetToken(token);

      expect(isValid).toBe(true);
    });

    test('verifyResetToken should return false for invalid token', () => {
      const user = new User({
        tenant: validTenantId,
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      });

      user.generateResetToken();
      const isValid = user.verifyResetToken('invalid-token');

      expect(isValid).toBe(false);
    });

    test('hasRole should return true for matching role', () => {
      const user = new User({
        tenant: validTenantId,
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: USER_ROLES.AGENT,
      });

      expect(user.hasRole(USER_ROLES.AGENT)).toBe(true);
      expect(user.hasRole(USER_ROLES.CUSTOMER)).toBe(false);
    });

    test('isActive should return true for active and verified users', () => {
      const user = new User({
        tenant: validTenantId,
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        status: USER_STATUS.ACTIVE,
        emailVerified: true,
      });

      expect(user.isActive()).toBe(true);
    });

    test('isActive should return false for unverified users', () => {
      const user = new User({
        tenant: validTenantId,
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        status: USER_STATUS.ACTIVE,
        emailVerified: false,
      });

      expect(user.isActive()).toBe(false);
    });

    test('isActive should return false for inactive users', () => {
      const user = new User({
        tenant: validTenantId,
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        status: USER_STATUS.INACTIVE,
        emailVerified: true,
      });

      expect(user.isActive()).toBe(false);
    });
  });

  describe('Static Methods', () => {
    test('findByEmail should query with lowercase email', () => {
      const findOneSpy = jest.spyOn(User, 'findOne').mockResolvedValue({});

      User.findByEmail('Test@Example.COM');

      expect(findOneSpy).toHaveBeenCalledWith({ email: 'test@example.com' });
      findOneSpy.mockRestore();
    });

    test('findByTenant should filter by tenant', () => {
      const findSpy = jest.spyOn(User, 'find').mockResolvedValue([]);

      User.findByTenant(validTenantId, { role: USER_ROLES.AGENT });

      expect(findSpy).toHaveBeenCalledWith({
        tenant: validTenantId,
        role: USER_ROLES.AGENT,
      });
      findSpy.mockRestore();
    });

    test('findAgentsByTenant should filter active agents', () => {
      const findSpy = jest.spyOn(User, 'find').mockResolvedValue([]);

      User.findAgentsByTenant(validTenantId);

      expect(findSpy).toHaveBeenCalledWith({
        tenant: validTenantId,
        role: USER_ROLES.AGENT,
        status: USER_STATUS.ACTIVE,
      });
      findSpy.mockRestore();
    });

    test('findCustomersByAgent should filter customers by agent', () => {
      const agentId = new mongoose.Types.ObjectId();
      const findSpy = jest.spyOn(User, 'find').mockResolvedValue([]);

      User.findCustomersByAgent(agentId);

      expect(findSpy).toHaveBeenCalledWith({
        assignedAgent: agentId,
        role: USER_ROLES.CUSTOMER,
      });
      findSpy.mockRestore();
    });

    test('hashToken should return hashed token', () => {
      const token = 'test-token';
      const hashed = User.hashToken(token);

      expect(hashed).toBeDefined();
      expect(typeof hashed).toBe('string');
      expect(hashed).not.toBe(token);
    });
  });

  describe('toJSON Transform', () => {
    test('should exclude sensitive fields from JSON', () => {
      const user = new User({
        tenant: validTenantId,
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      });

      user.verificationToken = 'token';
      user.resetToken = 'reset-token';

      const json = user.toJSON();

      expect(json.password).toBeUndefined();
      expect(json.verificationToken).toBeUndefined();
      expect(json.verificationTokenExpiry).toBeUndefined();
      expect(json.resetToken).toBeUndefined();
      expect(json.resetTokenExpiry).toBeUndefined();
      expect(json.__v).toBeUndefined();
      expect(json.email).toBe('test@example.com');
    });
  });
});
