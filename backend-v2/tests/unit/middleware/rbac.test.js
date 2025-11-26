const {
  ROLE_HIERARCHY,
  PERMISSIONS,
  hasPermission,
  hasRoleLevel,
  checkPermission,
  checkRole,
  checkRoleLevel,
  checkOwnership,
  isSuperAdmin,
  isTenantAdmin,
} = require('../../../src/middleware/rbac');
const logger = require('../../../src/lib/logger');

// Mock logger
jest.mock('../../../src/lib/logger', () => ({
  warn: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

describe('RBAC Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: null,
      id: 'test-request-id',
    };
    res = {};
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('ROLE_HIERARCHY', () => {
    it('should have correct hierarchy levels', () => {
      expect(ROLE_HIERARCHY.super_admin).toBe(6);
      expect(ROLE_HIERARCHY.tenant_admin).toBe(5);
      expect(ROLE_HIERARCHY.operator).toBe(4);
      expect(ROLE_HIERARCHY.agent).toBe(3);
      expect(ROLE_HIERARCHY.supplier).toBe(2);
      expect(ROLE_HIERARCHY.customer).toBe(1);
    });
  });

  describe('PERMISSIONS', () => {
    it('should grant super_admin all permissions', () => {
      expect(PERMISSIONS.super_admin).toEqual(['*']);
    });

    it('should have permissions for all roles', () => {
      expect(PERMISSIONS.tenant_admin).toBeDefined();
      expect(PERMISSIONS.operator).toBeDefined();
      expect(PERMISSIONS.agent).toBeDefined();
      expect(PERMISSIONS.supplier).toBeDefined();
      expect(PERMISSIONS.customer).toBeDefined();
    });
  });

  describe('hasPermission', () => {
    it('should return true for super_admin with any permission', () => {
      expect(hasPermission('super_admin', 'anything:do')).toBe(true);
      expect(hasPermission('super_admin', 'users:delete')).toBe(true);
    });

    it('should return true for exact permission match', () => {
      expect(hasPermission('tenant_admin', 'users:create')).toBe(true);
      expect(hasPermission('operator', 'queries:read')).toBe(true);
    });

    it('should return true for wildcard permission match', () => {
      expect(hasPermission('tenant_admin', 'suppliers:create')).toBe(true);
      expect(hasPermission('tenant_admin', 'suppliers:delete')).toBe(true);
      expect(hasPermission('supplier', 'rate-lists:create')).toBe(true);
    });

    it('should return false for permission not granted', () => {
      expect(hasPermission('customer', 'users:delete')).toBe(false);
      expect(hasPermission('agent', 'suppliers:create')).toBe(false);
      expect(hasPermission('operator', 'tenant:delete')).toBe(false);
    });

    it('should return false for undefined role', () => {
      expect(hasPermission('invalid_role', 'users:read')).toBe(false);
    });
  });

  describe('hasRoleLevel', () => {
    it('should return true when user role is higher', () => {
      expect(hasRoleLevel('super_admin', 'tenant_admin')).toBe(true);
      expect(hasRoleLevel('tenant_admin', 'operator')).toBe(true);
      expect(hasRoleLevel('operator', 'agent')).toBe(true);
    });

    it('should return true when user role is equal', () => {
      expect(hasRoleLevel('tenant_admin', 'tenant_admin')).toBe(true);
      expect(hasRoleLevel('operator', 'operator')).toBe(true);
    });

    it('should return false when user role is lower', () => {
      expect(hasRoleLevel('customer', 'agent')).toBe(false);
      expect(hasRoleLevel('agent', 'operator')).toBe(false);
      expect(hasRoleLevel('operator', 'tenant_admin')).toBe(false);
    });
  });

  describe('checkPermission', () => {
    it('should call next when user has permission', () => {
      req.user = { _id: 'user123', role: 'tenant_admin' };
      const middleware = checkPermission('users:create');

      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    it('should call next with UnauthorizedError when user not authenticated', () => {
      const middleware = checkPermission('users:create');

      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error.name).toBe('UnauthorizedError');
      expect(error.code).toBe('AUTH_REQUIRED');
    });

    it('should call next with ForbiddenError when user lacks permission', () => {
      req.user = { _id: 'user123', role: 'customer' };
      const middleware = checkPermission('users:delete');

      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error.name).toBe('ForbiddenError');
      expect(error.code).toBe('PERMISSION_DENIED');
      expect(error.details.requiredPermission).toBe('users:delete');
      expect(logger.warn).toHaveBeenCalled();
    });

    it('should allow super_admin to access any permission', () => {
      req.user = { _id: 'user123', role: 'super_admin' };
      const middleware = checkPermission('anything:do');

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('checkRole', () => {
    it('should call next when user has required role', () => {
      req.user = { _id: 'user123', role: 'tenant_admin' };
      const middleware = checkRole('tenant_admin', 'operator');

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should call next with UnauthorizedError when user not authenticated', () => {
      const middleware = checkRole('tenant_admin');

      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error.name).toBe('UnauthorizedError');
    });

    it('should call next with ForbiddenError when user lacks role', () => {
      req.user = { _id: 'user123', role: 'customer' };
      const middleware = checkRole('tenant_admin', 'operator');

      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error.name).toBe('ForbiddenError');
      expect(error.code).toBe('ROLE_REQUIRED');
      expect(logger.warn).toHaveBeenCalled();
    });
  });

  describe('checkRoleLevel', () => {
    it('should call next when user has sufficient role level', () => {
      req.user = { _id: 'user123', role: 'tenant_admin' };
      const middleware = checkRoleLevel('operator');

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should call next when user has exact role level', () => {
      req.user = { _id: 'user123', role: 'operator' };
      const middleware = checkRoleLevel('operator');

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should call next with UnauthorizedError when user not authenticated', () => {
      const middleware = checkRoleLevel('operator');

      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error.name).toBe('UnauthorizedError');
    });

    it('should call next with ForbiddenError when user has insufficient role level', () => {
      req.user = { _id: 'user123', role: 'customer' };
      const middleware = checkRoleLevel('operator');

      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error.name).toBe('ForbiddenError');
      expect(error.code).toBe('INSUFFICIENT_ROLE_LEVEL');
      expect(logger.warn).toHaveBeenCalled();
    });
  });

  describe('checkOwnership', () => {
    it('should call next when user is resource owner', async () => {
      req.user = { _id: 'user123', role: 'customer' };
      const getOwnerId = jest.fn().mockResolvedValue('user123');
      const middleware = checkOwnership(getOwnerId);

      await middleware(req, res, next);

      expect(getOwnerId).toHaveBeenCalledWith(req);
      expect(next).toHaveBeenCalledWith();
    });

    it('should call next when user is super_admin', async () => {
      req.user = { _id: 'user123', role: 'super_admin' };
      const getOwnerId = jest.fn();
      const middleware = checkOwnership(getOwnerId);

      await middleware(req, res, next);

      expect(getOwnerId).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith();
    });

    it('should call next when user is tenant_admin', async () => {
      req.user = { _id: 'user123', role: 'tenant_admin' };
      const getOwnerId = jest.fn();
      const middleware = checkOwnership(getOwnerId);

      await middleware(req, res, next);

      expect(getOwnerId).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith();
    });

    it('should call next with UnauthorizedError when user not authenticated', async () => {
      const middleware = checkOwnership(() => 'owner123');

      await middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error.name).toBe('UnauthorizedError');
    });

    it('should call next with ForbiddenError when user is not owner', async () => {
      req.user = { _id: 'user123', role: 'customer' };
      const getOwnerId = jest.fn().mockResolvedValue('owner456');
      const middleware = checkOwnership(getOwnerId);

      await middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error.name).toBe('ForbiddenError');
      expect(error.code).toBe('OWNERSHIP_REQUIRED');
      expect(logger.warn).toHaveBeenCalled();
    });

    it('should handle sync ownership function', async () => {
      req.user = { _id: 'user123', role: 'customer' };
      const middleware = checkOwnership('user123');

      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should handle errors from ownership function', async () => {
      req.user = { _id: 'user123', role: 'customer' };
      const error = new Error('Database error');
      const getOwnerId = jest.fn().mockRejectedValue(error);
      const middleware = checkOwnership(getOwnerId);

      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('isSuperAdmin', () => {
    it('should call next when user is super_admin', () => {
      req.user = { _id: 'user123', role: 'super_admin' };

      isSuperAdmin(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should call next with ForbiddenError when user is not super_admin', () => {
      req.user = { _id: 'user123', role: 'tenant_admin' };

      isSuperAdmin(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error.name).toBe('ForbiddenError');
      expect(error.code).toBe('SUPER_ADMIN_REQUIRED');
    });

    it('should call next with ForbiddenError when user not authenticated', () => {
      isSuperAdmin(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error.name).toBe('ForbiddenError');
    });
  });

  describe('isTenantAdmin', () => {
    it('should call next when user is tenant_admin', () => {
      req.user = { _id: 'user123', role: 'tenant_admin' };

      isTenantAdmin(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should call next when user is super_admin', () => {
      req.user = { _id: 'user123', role: 'super_admin' };

      isTenantAdmin(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should call next with ForbiddenError when user has lower role', () => {
      req.user = { _id: 'user123', role: 'operator' };

      isTenantAdmin(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error.name).toBe('ForbiddenError');
      expect(error.code).toBe('TENANT_ADMIN_REQUIRED');
    });

    it('should call next with ForbiddenError when user not authenticated', () => {
      isTenantAdmin(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error.name).toBe('ForbiddenError');
    });
  });
});
