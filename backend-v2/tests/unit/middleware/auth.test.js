const { authenticate, optionalAuth, requireRole, requireSameTenant } = require('../../../src/middleware/auth');
const tokenService = require('../../../src/services/tokenService');
const User = require('../../../src/models/User');

jest.mock('../../../src/services/tokenService');
jest.mock('../../../src/models/User');
jest.mock('../../../src/lib/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('Auth Middleware', () => {
  let req, res, next;

  const mockUser = {
    _id: 'user123',
    tenant: 'tenant123',
    email: 'test@example.com',
    role: 'agent',
    status: 'active',
    emailVerified: true,
  };

  const mockDecoded = {
    userId: 'user123',
    tenantId: 'tenant123',
    email: 'test@example.com',
    role: 'agent',
  };

  beforeEach(() => {
    req = {
      get: jest.fn(),
      id: 'req-123',
    };
    res = {};
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    test('should authenticate user with valid token', async () => {
      req.get.mockReturnValue('Bearer valid-token');
      tokenService.verifyAccessToken.mockReturnValue(mockDecoded);
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await authenticate(req, res, next);

      expect(req.get).toHaveBeenCalledWith('Authorization');
      expect(tokenService.verifyAccessToken).toHaveBeenCalledWith('valid-token');
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(req.user).toEqual(mockUser);
      expect(req.userId).toBe('user123');
      expect(next).toHaveBeenCalledWith();
    });

    test('should fail when no authorization header', async () => {
      req.get.mockReturnValue(null);

      await authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('No authentication token provided');
      expect(error.code).toBe('NO_TOKEN');
    });

    test('should fail when authorization header does not start with Bearer', async () => {
      req.get.mockReturnValue('Basic abc123');

      await authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('No authentication token provided');
      expect(error.code).toBe('NO_TOKEN');
    });

    test('should fail when token verification fails', async () => {
      req.get.mockReturnValue('Bearer invalid-token');
      const tokenError = new Error('Invalid token');
      tokenError.name = 'JsonWebTokenError';
      tokenService.verifyAccessToken.mockImplementation(() => {
        throw tokenError;
      });

      await authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    test('should fail when user not found', async () => {
      req.get.mockReturnValue('Bearer valid-token');
      tokenService.verifyAccessToken.mockReturnValue(mockDecoded);
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('User not found or has been deleted');
      expect(error.code).toBe('USER_NOT_FOUND');
    });

    test('should fail when user is inactive', async () => {
      req.get.mockReturnValue('Bearer valid-token');
      tokenService.verifyAccessToken.mockReturnValue(mockDecoded);
      const inactiveUser = { ...mockUser, status: 'suspended' };
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(inactiveUser),
      });

      await authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Your account has been deactivated. Please contact support.');
      expect(error.code).toBe('USER_INACTIVE');
    });
  });

  describe('optionalAuth', () => {
    test('should attach user if valid token provided', async () => {
      req.get.mockReturnValue('Bearer valid-token');
      tokenService.verifyAccessToken.mockReturnValue(mockDecoded);
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await optionalAuth(req, res, next);

      expect(req.user).toEqual(mockUser);
      expect(req.userId).toBe('user123');
      expect(next).toHaveBeenCalledWith();
    });

    test('should continue without user if no token provided', async () => {
      req.get.mockReturnValue(null);

      await optionalAuth(req, res, next);

      expect(req.user).toBeNull();
      expect(req.userId).toBeNull();
      expect(next).toHaveBeenCalledWith();
    });

    test('should continue without user if invalid token', async () => {
      req.get.mockReturnValue('Bearer invalid-token');
      tokenService.verifyAccessToken.mockImplementation(() => {
        const error = new Error('Invalid token');
        error.name = 'JsonWebTokenError';
        throw error;
      });

      await optionalAuth(req, res, next);

      expect(req.user).toBeNull();
      expect(req.userId).toBeNull();
      expect(next).toHaveBeenCalledWith();
    });

    test('should continue without user if user is inactive', async () => {
      req.get.mockReturnValue('Bearer valid-token');
      tokenService.verifyAccessToken.mockReturnValue(mockDecoded);
      const inactiveUser = { ...mockUser, status: 'suspended' };
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(inactiveUser),
      });

      await optionalAuth(req, res, next);

      expect(req.user).toBeNull();
      expect(req.userId).toBeNull();
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('requireRole', () => {
    test('should allow user with correct role', () => {
      req.user = mockUser;
      const middleware = requireRole('agent', 'operator');

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    test('should deny user without correct role', () => {
      req.user = mockUser;
      const middleware = requireRole('tenant_admin', 'super_admin');

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('You do not have permission to access this resource');
      expect(error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    test('should deny if user not authenticated', () => {
      req.user = null;
      const middleware = requireRole('agent');

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Authentication required');
      expect(error.code).toBe('AUTH_REQUIRED');
    });
  });

  describe('requireSameTenant', () => {
    test('should allow user from same tenant', () => {
      req.user = { ...mockUser, tenant: 'tenant123' };
      req.tenant = { _id: 'tenant123' };

      requireSameTenant(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    test('should allow super_admin to access any tenant', () => {
      req.user = { ...mockUser, role: 'super_admin', tenant: 'other-tenant' };
      req.tenant = { _id: 'tenant123' };

      requireSameTenant(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    test('should deny user from different tenant', () => {
      req.user = { ...mockUser, tenant: 'other-tenant' };
      req.tenant = { _id: 'tenant123' };

      requireSameTenant(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Resource not found');
      expect(error.code).toBe('RESOURCE_NOT_FOUND');
    });

    test('should deny if user not authenticated', () => {
      req.user = null;
      req.tenant = { _id: 'tenant123' };

      requireSameTenant(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Authentication required');
      expect(error.code).toBe('AUTH_REQUIRED');
    });

    test('should deny if tenant not resolved', () => {
      req.user = mockUser;
      req.tenant = null;

      requireSameTenant(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Tenant context required');
      expect(error.code).toBe('TENANT_REQUIRED');
    });
  });
});
