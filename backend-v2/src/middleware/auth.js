const tokenService = require('../services/tokenService');
const User = require('../models/User');
const { UnauthorizedError, NotFoundError } = require('../lib/errors');
const logger = require('../lib/logger');

/**
 * Authentication middleware - verify JWT token and attach user to request
 */
const authenticate = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError(
        'No authentication token provided',
        'NO_TOKEN',
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = tokenService.verifyAccessToken(token);

    // Fetch user from database
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      throw new UnauthorizedError(
        'User not found or has been deleted',
        'USER_NOT_FOUND',
      );
    }

    // Check if user is active
    if (user.status !== 'active') {
      throw new UnauthorizedError(
        'Your account has been deactivated. Please contact support.',
        'USER_INACTIVE',
      );
    }

    // Check if email is verified (optional, depends on requirements)
    // if (!user.emailVerified) {
    //   throw new UnauthorizedError(
    //     'Please verify your email address to continue',
    //     'EMAIL_NOT_VERIFIED',
    //   );
    // }

    // Attach user to request
    req.user = user;
    req.userId = user._id;

    logger.debug('User authenticated', {
      userId: user._id,
      email: user.email,
      role: user.role,
      requestId: req.id,
    });

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication - attach user if token is valid, but don't fail if missing
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without authentication
      req.user = null;
      req.userId = null;
      return next();
    }

    const token = authHeader.substring(7);

    try {
      const decoded = tokenService.verifyAccessToken(token);
      const user = await User.findById(decoded.userId).select('-password');

      if (user && user.status === 'active') {
        req.user = user;
        req.userId = user._id;
      } else {
        req.user = null;
        req.userId = null;
      }
    } catch (tokenError) {
      // Token invalid or expired, continue without authentication
      req.user = null;
      req.userId = null;
      logger.debug('Optional auth token invalid', {
        error: tokenError.message,
        requestId: req.id,
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Require authenticated user
 * Alias for authenticate middleware for clarity
 */
const requireAuth = authenticate;

/**
 * Require specific user role
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(
        new UnauthorizedError(
          'Authentication required',
          'AUTH_REQUIRED',
        ),
      );
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new UnauthorizedError(
          'You do not have permission to access this resource',
          'INSUFFICIENT_PERMISSIONS',
        ),
      );
    }

    next();
  };
};

/**
 * Require user to belong to the same tenant
 */
const requireSameTenant = (req, res, next) => {
  if (!req.user) {
    return next(
      new UnauthorizedError(
        'Authentication required',
        'AUTH_REQUIRED',
      ),
    );
  }

  if (!req.tenant) {
    return next(
      new UnauthorizedError(
        'Tenant context required',
        'TENANT_REQUIRED',
      ),
    );
  }

  // Super admin can access any tenant
  if (req.user.role === 'super_admin') {
    return next();
  }

  // Check if user belongs to the current tenant
  if (req.user.tenant.toString() !== req.tenant._id.toString()) {
    return next(
      new NotFoundError(
        'Resource not found',
        'RESOURCE_NOT_FOUND',
      ),
    );
  }

  next();
};

module.exports = {
  authenticate,
  optionalAuth,
  requireAuth,
  requireRole,
  requireSameTenant,
};
