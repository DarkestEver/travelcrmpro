const { ForbiddenError, UnauthorizedError } = require('../lib/errors');
const { USER_ROLES } = require('../config/constants');
const logger = require('../lib/logger');

/**
 * Role hierarchy - higher roles can access lower role resources
 * super_admin > tenant_admin > operator > agent > supplier > customer
 */
const ROLE_HIERARCHY = {
  super_admin: 6,
  tenant_admin: 5,
  operator: 4,
  agent: 3,
  supplier: 2,
  customer: 1,
};

/**
 * Permission definitions for each role
 */
const PERMISSIONS = {
  super_admin: ['*'], // All permissions
  
  tenant_admin: [
    'tenant:read',
    'tenant:update',
    'users:create',
    'users:read',
    'users:update',
    'users:delete',
    'suppliers:*',
    'rate-lists:*',
    'packages:*',
    'queries:*',
    'itineraries:*',
    'quotes:*',
    'bookings:*',
    'payments:read',
    'reports:read',
    'settings:*',
  ],
  
  operator: [
    'queries:read',
    'queries:update',
    'queries:assign',
    'itineraries:create',
    'itineraries:read',
    'itineraries:update',
    'quotes:create',
    'quotes:read',
    'quotes:update',
    'bookings:create',
    'bookings:read',
    'bookings:update',
    'suppliers:read',
    'rate-lists:read',
    'packages:read',
    'customers:read',
  ],
  
  agent: [
    'queries:create',
    'queries:read',
    'itineraries:create',
    'itineraries:read',
    'quotes:create',
    'quotes:read',
    'packages:read',
    'customers:create',
    'customers:read',
    'customers:update',
    'bookings:read',
  ],
  
  supplier: [
    'rate-lists:create',
    'rate-lists:read',
    'rate-lists:update',
    'rate-lists:delete',
    'bookings:read',
    'bookings:confirm',
  ],
  
  customer: [
    'queries:create',
    'queries:read:own',
    'itineraries:read:own',
    'quotes:read:own',
    'bookings:read:own',
    'bookings:pay',
    'documents:read:own',
    'reviews:create',
  ],
};

/**
 * Check if user has required permission
 */
const hasPermission = (userRole, requiredPermission) => {
  const userPermissions = PERMISSIONS[userRole] || [];

  // Super admin has all permissions
  if (userPermissions.includes('*')) {
    return true;
  }

  // Check exact permission match
  if (userPermissions.includes(requiredPermission)) {
    return true;
  }

  // Check wildcard permissions (e.g., 'suppliers:*' matches 'suppliers:create')
  const [resource] = requiredPermission.split(':');
  if (userPermissions.includes(`${resource}:*`)) {
    return true;
  }

  return false;
};

/**
 * Check if user has role with equal or higher hierarchy level
 */
const hasRoleLevel = (userRole, requiredRole) => {
  const userLevel = ROLE_HIERARCHY[userRole] || 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;

  return userLevel >= requiredLevel;
};

/**
 * Middleware to check if user has required permission
 */
const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(
        new UnauthorizedError(
          'Authentication required',
          'AUTH_REQUIRED',
        ),
      );
    }

    if (!hasPermission(req.user.role, requiredPermission)) {
      logger.warn('Permission denied', {
        userId: req.user._id,
        role: req.user.role,
        requiredPermission,
        requestId: req.id,
      });

      return next(
        new ForbiddenError(
          'You do not have permission to perform this action',
          'PERMISSION_DENIED',
          { requiredPermission },
        ),
      );
    }

    next();
  };
};

/**
 * Middleware to check if user has one of the required roles
 */
const checkRole = (...requiredRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(
        new UnauthorizedError(
          'Authentication required',
          'AUTH_REQUIRED',
        ),
      );
    }

    if (!requiredRoles.includes(req.user.role)) {
      logger.warn('Role check failed', {
        userId: req.user._id,
        userRole: req.user.role,
        requiredRoles,
        requestId: req.id,
      });

      return next(
        new ForbiddenError(
          'You do not have the required role to access this resource',
          'ROLE_REQUIRED',
          { requiredRoles },
        ),
      );
    }

    next();
  };
};

/**
 * Middleware to check if user has minimum role level
 */
const checkRoleLevel = (minimumRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(
        new UnauthorizedError(
          'Authentication required',
          'AUTH_REQUIRED',
        ),
      );
    }

    if (!hasRoleLevel(req.user.role, minimumRole)) {
      logger.warn('Role level check failed', {
        userId: req.user._id,
        userRole: req.user.role,
        minimumRole,
        requestId: req.id,
      });

      return next(
        new ForbiddenError(
          'Insufficient privileges to access this resource',
          'INSUFFICIENT_ROLE_LEVEL',
          { minimumRole },
        ),
      );
    }

    next();
  };
};

/**
 * Middleware to check resource ownership
 * Allows super_admin, tenant_admin, and resource owner
 */
const checkOwnership = (getResourceOwnerId) => {
  return async (req, res, next) => {
    if (!req.user) {
      return next(
        new UnauthorizedError(
          'Authentication required',
          'AUTH_REQUIRED',
        ),
      );
    }

    // Super admin and tenant admin can access any resource
    if (['super_admin', 'tenant_admin'].includes(req.user.role)) {
      return next();
    }

    try {
      // Get resource owner ID (can be async function or sync value)
      const ownerId = typeof getResourceOwnerId === 'function'
        ? await getResourceOwnerId(req)
        : getResourceOwnerId;

      if (req.user._id.toString() !== ownerId.toString()) {
        logger.warn('Ownership check failed', {
          userId: req.user._id,
          ownerId,
          requestId: req.id,
        });

        return next(
          new ForbiddenError(
            'You can only access your own resources',
            'OWNERSHIP_REQUIRED',
          ),
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user is super admin
 */
const isSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'super_admin') {
    return next(
      new ForbiddenError(
        'This action requires super administrator privileges',
        'SUPER_ADMIN_REQUIRED',
      ),
    );
  }
  next();
};

/**
 * Check if user is tenant admin or higher
 */
const isTenantAdmin = (req, res, next) => {
  if (!req.user || !['super_admin', 'tenant_admin'].includes(req.user.role)) {
    return next(
      new ForbiddenError(
        'This action requires tenant administrator privileges',
        'TENANT_ADMIN_REQUIRED',
      ),
    );
  }
  next();
};

module.exports = {
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
};
