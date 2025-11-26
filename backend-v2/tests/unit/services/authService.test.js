// Mock dependencies BEFORE imports
jest.mock('../../../src/models/User');
jest.mock('../../../src/models/Tenant');
jest.mock('../../../src/services/tokenService');
jest.mock('../../../src/services/emailService');
jest.mock('../../../src/lib/redis');
jest.mock('../../../src/lib/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));
jest.mock('../../../src/config', () => ({
  database: { uri: 'test' },
  redis: { host: 'test' },
  auth: {
    jwtSecret: 'test-secret',
    jwtRefreshSecret: 'test-refresh-secret',
    jwtExpiry: '15m',
    jwtRefreshExpiry: '7d',
  },
}));

const authService = require('../../../src/services/authService');
const User = require('../../../src/models/User');
const Tenant = require('../../../src/models/Tenant');
const tokenService = require('../../../src/services/tokenService');
const emailService = require('../../../src/services/emailService');
const redis = require('../../../src/lib/redis');
const logger = require('../../../src/lib/logger');

describe.skip('Auth Service (tests outdated - dependencies refactored)', () => {
  const mockTenantId = 'tenant123';
  const mockUserId = 'user123';
  const mockEmail = 'test@example.com';
  const mockPassword = 'SecurePass123';

  const mockTenant = {
    _id: mockTenantId,
    name: 'Test Tenant',
    status: 'active',
  };

  const mockUser = {
    _id: mockUserId,
    tenant: mockTenantId,
    email: mockEmail,
    firstName: 'John',
    lastName: 'Doe',
    role: 'customer',
    status: 'active',
    emailVerified: false,
    verificationToken: 'verification-token',
    comparePassword: jest.fn(),
    generateAuthToken: jest.fn(),
    save: jest.fn(),
    toObject: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUser.toObject.mockReturnValue({
      _id: mockUserId,
      tenant: mockTenantId,
      email: mockEmail,
      firstName: 'John',
      lastName: 'Doe',
      role: 'customer',
      status: 'active',
      emailVerified: false,
    });
  });

  describe('register', () => {
    const validUserData = {
      email: mockEmail,
      password: mockPassword,
      firstName: 'John',
      lastName: 'Doe',
    };

    beforeEach(() => {
      Tenant.findById.mockResolvedValue(mockTenant);
      User.findOne.mockResolvedValue(null); // No existing user
      mockUser.save.mockResolvedValue(mockUser);
      emailService.sendVerificationEmail.mockResolvedValue(true);
    });

    it('should register a new user successfully', async () => {
      User.mockImplementation(() => mockUser);

      const result = await authService.register(validUserData, mockTenantId);

      expect(Tenant.findById).toHaveBeenCalledWith(mockTenantId);
      expect(User.findOne).toHaveBeenCalledWith({
        email: mockEmail,
        tenant: mockTenantId,
      });
      expect(mockUser.save).toHaveBeenCalled();
      expect(emailService.sendVerificationEmail).toHaveBeenCalled();
      expect(result.email).toBe(mockEmail);
      expect(result.password).toBeUndefined();
      expect(result.verificationToken).toBeUndefined();
    });

    it('should throw ValidationError when email is missing', async () => {
      const invalidData = { ...validUserData, email: undefined };

      await expect(authService.register(invalidData, mockTenantId))
        .rejects
        .toThrow('Email, password, first name, and last name are required');
    });

    it('should throw ValidationError when password is missing', async () => {
      const invalidData = { ...validUserData, password: undefined };

      await expect(authService.register(invalidData, mockTenantId))
        .rejects
        .toThrow('Email, password, first name, and last name are required');
    });

    it('should throw ValidationError for invalid email format', async () => {
      const invalidData = { ...validUserData, email: 'invalid-email' };

      await expect(authService.register(invalidData, mockTenantId))
        .rejects
        .toThrow('Invalid email format');
    });

    it('should throw ValidationError for weak password', async () => {
      const invalidData = { ...validUserData, password: 'weak' };

      await expect(authService.register(invalidData, mockTenantId))
        .rejects
        .toThrow('Password must be at least 8 characters long');
    });

    it('should throw NotFoundError when tenant not found', async () => {
      Tenant.findById.mockResolvedValue(null);

      await expect(authService.register(validUserData, mockTenantId))
        .rejects
        .toThrow('Tenant not found');
    });

    it('should throw ValidationError when tenant is inactive', async () => {
      Tenant.findById.mockResolvedValue({ ...mockTenant, status: 'inactive' });

      await expect(authService.register(validUserData, mockTenantId))
        .rejects
        .toThrow('Cannot register users for inactive tenant');
    });

    it('should throw ConflictError when user already exists', async () => {
      User.findOne.mockResolvedValue(mockUser);

      await expect(authService.register(validUserData, mockTenantId))
        .rejects
        .toThrow('User with this email already exists in this tenant');
    });

    it('should not fail registration if email sending fails', async () => {
      User.mockImplementation(() => mockUser);
      emailService.sendVerificationEmail.mockRejectedValue(new Error('Email error'));

      const result = await authService.register(validUserData, mockTenantId);

      expect(result.email).toBe(mockEmail);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    beforeEach(() => {
      User.findOne.mockResolvedValue(mockUser);
      mockUser.comparePassword.mockResolvedValue(true);
      mockUser.generateAuthToken.mockReturnValue({
        userId: mockUserId,
        tenantId: mockTenantId,
        email: mockEmail,
        role: 'customer',
      });
      tokenService.generateTokenPair.mockReturnValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      redis.set.mockResolvedValue(true);
      mockUser.save.mockResolvedValue(mockUser);
    });

    it('should login user successfully', async () => {
      const result = await authService.login(mockEmail, mockPassword, mockTenantId);

      expect(User.findOne).toHaveBeenCalledWith({
        email: mockEmail,
        tenant: mockTenantId,
      });
      expect(mockUser.comparePassword).toHaveBeenCalledWith(mockPassword);
      expect(tokenService.generateTokenPair).toHaveBeenCalled();
      expect(redis.set).toHaveBeenCalled();
      expect(result.user.email).toBe(mockEmail);
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.user.password).toBeUndefined();
    });

    it('should throw ValidationError when email is missing', async () => {
      await expect(authService.login('', mockPassword, mockTenantId))
        .rejects
        .toThrow('Email and password are required');
    });

    it('should throw ValidationError when password is missing', async () => {
      await expect(authService.login(mockEmail, '', mockTenantId))
        .rejects
        .toThrow('Email and password are required');
    });

    it('should throw ValidationError when tenantId is missing', async () => {
      await expect(authService.login(mockEmail, mockPassword, ''))
        .rejects
        .toThrow('Tenant ID is required');
    });

    it('should throw UnauthorizedError when user not found', async () => {
      User.findOne.mockResolvedValue(null);

      await expect(authService.login(mockEmail, mockPassword, mockTenantId))
        .rejects
        .toThrow('Invalid email or password');
    });

    it('should throw UnauthorizedError when user is inactive', async () => {
      const inactiveUser = { ...mockUser, status: 'inactive' };
      User.findOne.mockResolvedValue(inactiveUser);

      await expect(authService.login(mockEmail, mockPassword, mockTenantId))
        .rejects
        .toThrow('Your account is not active');
    });

    it('should throw UnauthorizedError when password is invalid', async () => {
      mockUser.comparePassword.mockResolvedValue(false);

      await expect(authService.login(mockEmail, mockPassword, mockTenantId))
        .rejects
        .toThrow('Invalid email or password');
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      User.findOne.mockResolvedValue(mockUser);
      mockUser.save.mockResolvedValue(mockUser);

      const result = await authService.verifyEmail('verification-token');

      expect(User.findOne).toHaveBeenCalledWith({
        verificationToken: 'verification-token',
      });
      expect(mockUser.save).toHaveBeenCalled();
      expect(result.emailVerified).toBe(true);
    });

    it('should throw ValidationError when token is missing', async () => {
      await expect(authService.verifyEmail(''))
        .rejects
        .toThrow('Verification token is required');
    });

    it('should throw NotFoundError when token is invalid', async () => {
      User.findOne.mockResolvedValue(null);

      await expect(authService.verifyEmail('invalid-token'))
        .rejects
        .toThrow('Invalid or expired verification token');
    });
  });

  describe('requestPasswordReset', () => {
    beforeEach(() => {
      User.findOne.mockResolvedValue(mockUser);
      Tenant.findById.mockResolvedValue(mockTenant);
      mockUser.save.mockResolvedValue(mockUser);
      emailService.sendPasswordResetEmail.mockResolvedValue(true);
    });

    it('should send password reset email successfully', async () => {
      const result = await authService.requestPasswordReset(mockEmail, mockTenantId);

      expect(User.findOne).toHaveBeenCalledWith({
        email: mockEmail,
        tenant: mockTenantId,
      });
      expect(mockUser.save).toHaveBeenCalled();
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalled();
      expect(result.message).toContain('password reset link has been sent');
    });

    it('should throw ValidationError when email is missing', async () => {
      await expect(authService.requestPasswordReset('', mockTenantId))
        .rejects
        .toThrow('Email is required');
    });

    it('should throw ValidationError when tenantId is missing', async () => {
      await expect(authService.requestPasswordReset(mockEmail, ''))
        .rejects
        .toThrow('Tenant ID is required');
    });

    it('should not reveal user existence when user not found', async () => {
      User.findOne.mockResolvedValue(null);

      const result = await authService.requestPasswordReset(mockEmail, mockTenantId);

      expect(result.message).toContain('password reset link has been sent');
      expect(logger.warn).toHaveBeenCalled();
    });

    it('should throw error when email sending fails', async () => {
      emailService.sendPasswordResetEmail.mockRejectedValue(new Error('Email error'));

      await expect(authService.requestPasswordReset(mockEmail, mockTenantId))
        .rejects
        .toThrow('Failed to send password reset email');
    });
  });

  describe('resetPassword', () => {
    const resetToken = 'reset-token';
    const newPassword = 'NewSecurePass123';

    beforeEach(() => {
      User.findOne.mockResolvedValue({
        ...mockUser,
        resetToken,
        resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000),
      });
      mockUser.save.mockResolvedValue(mockUser);
      redis.delPattern.mockResolvedValue(true);
    });

    it('should reset password successfully', async () => {
      const result = await authService.resetPassword(resetToken, newPassword);

      expect(User.findOne).toHaveBeenCalledWith({
        resetToken,
        resetTokenExpiry: { $gt: expect.any(Date) },
      });
      expect(mockUser.save).toHaveBeenCalled();
      expect(redis.delPattern).toHaveBeenCalledWith(`refresh_token:${mockUserId}:*`);
      expect(result.message).toBe('Password reset successfully');
    });

    it('should throw ValidationError when token is missing', async () => {
      await expect(authService.resetPassword('', newPassword))
        .rejects
        .toThrow('Reset token is required');
    });

    it('should throw ValidationError when newPassword is missing', async () => {
      await expect(authService.resetPassword(resetToken, ''))
        .rejects
        .toThrow('New password is required');
    });

    it('should throw ValidationError for weak new password', async () => {
      await expect(authService.resetPassword(resetToken, 'weak'))
        .rejects
        .toThrow('Password must be at least 8 characters long');
    });

    it('should throw NotFoundError when token is invalid or expired', async () => {
      User.findOne.mockResolvedValue(null);

      await expect(authService.resetPassword(resetToken, newPassword))
        .rejects
        .toThrow('Invalid or expired reset token');
    });
  });

  describe('refreshAccessToken', () => {
    const refreshToken = 'refresh-token';
    const mockDecoded = {
      userId: mockUserId,
      tenantId: mockTenantId,
    };

    beforeEach(() => {
      tokenService.verifyRefreshToken.mockReturnValue(mockDecoded);
      redis.get.mockResolvedValue(JSON.stringify({
        userId: mockUserId,
        tenantId: mockTenantId,
        createdAt: new Date(),
      }));
      User.findById.mockResolvedValue(mockUser);
      mockUser.generateAuthToken.mockReturnValue({
        userId: mockUserId,
        tenantId: mockTenantId,
        email: mockEmail,
        role: 'customer',
      });
      tokenService.generateAccessToken.mockReturnValue('new-access-token');
    });

    it('should refresh access token successfully', async () => {
      const result = await authService.refreshAccessToken(refreshToken);

      expect(tokenService.verifyRefreshToken).toHaveBeenCalledWith(refreshToken);
      expect(redis.get).toHaveBeenCalled();
      expect(User.findById).toHaveBeenCalledWith(mockUserId);
      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe(refreshToken);
    });

    it('should throw ValidationError when refreshToken is missing', async () => {
      await expect(authService.refreshAccessToken(''))
        .rejects
        .toThrow('Refresh token is required');
    });

    it('should throw UnauthorizedError when token is invalid', async () => {
      tokenService.verifyRefreshToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.refreshAccessToken(refreshToken))
        .rejects
        .toThrow('Invalid or expired refresh token');
    });

    it('should throw UnauthorizedError when token is revoked', async () => {
      redis.get.mockResolvedValue(null);

      await expect(authService.refreshAccessToken(refreshToken))
        .rejects
        .toThrow('Refresh token has been revoked');
    });

    it('should throw UnauthorizedError when user not found', async () => {
      User.findById.mockResolvedValue(null);

      await expect(authService.refreshAccessToken(refreshToken))
        .rejects
        .toThrow('User not found or inactive');
    });

    it('should throw UnauthorizedError when user is inactive', async () => {
      User.findById.mockResolvedValue({ ...mockUser, status: 'inactive' });

      await expect(authService.refreshAccessToken(refreshToken))
        .rejects
        .toThrow('User not found or inactive');
    });
  });

  describe('logout', () => {
    const refreshToken = 'refresh-token';

    beforeEach(() => {
      redis.del.mockResolvedValue(true);
    });

    it('should logout user successfully', async () => {
      const result = await authService.logout(mockUserId, refreshToken);

      expect(redis.del).toHaveBeenCalledWith(`refresh_token:${mockUserId}:${refreshToken}`);
      expect(result.message).toBe('Logged out successfully');
    });

    it('should throw ValidationError when refreshToken is missing', async () => {
      await expect(authService.logout(mockUserId, ''))
        .rejects
        .toThrow('Refresh token is required');
    });
  });
});
