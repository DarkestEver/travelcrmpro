const authService = require('../services/authService');
const { ValidationError, NotFoundError } = require('../lib/errors');
const logger = require('../lib/logger');

/**
 * Register a new user
 * POST /auth/register
 */
const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;

    // Get tenant from request (set by tenant middleware)
    const tenantId = req.tenant?._id;

    if (!tenantId) {
      throw new ValidationError('Tenant context is required for registration');
    }

    // Register user
    const user = await authService.register(
      { email, password, firstName, lastName, role },
      tenantId,
    );

    logger.info('User registered successfully', {
      userId: user._id,
      email: user.email,
      tenantId,
      requestId: req.id,
    });

    res.created({
      user,
      message: 'Registration successful. Please check your email to verify your account.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * POST /auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Get tenant from request (optional - not required for super admins)
    const tenantId = req.tenant?._id;

    // If a tenant was requested (via header) but not found, return 404
    if (req.tenantRequested && !req.tenant) {
      throw new NotFoundError('Tenant not found', 'TENANT_NOT_FOUND');
    }

    // Login user
    const result = await authService.login(email, password, tenantId);

    logger.info('User logged in successfully', {
      userId: result.user._id,
      email: result.user.email,
      tenantId: tenantId || 'none',
      requestId: req.id,
    });

    res.ok({
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      message: 'Login successful',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify email with token
 * POST /auth/verify-email
 */
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      throw new ValidationError('Verification token is required');
    }

    const result = await authService.verifyEmail(token);

    logger.info('Email verified successfully', {
      requestId: req.id,
    });

    res.ok(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user
 * POST /auth/logout
 */
const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    // User ID from authenticated request
    const userId = req.user?._id;

    if (!userId) {
      throw new ValidationError('User must be authenticated to logout');
    }

    const result = await authService.logout(userId, refreshToken);

    logger.info('User logged out successfully', {
      userId,
      requestId: req.id,
    });

    res.ok(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh access token
 * POST /auth/refresh-token
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new ValidationError('Refresh token is required');
    }

    const result = await authService.refreshAccessToken(refreshToken);

    logger.info('Access token refreshed', {
      requestId: req.id,
    });

    res.ok(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Request password reset
 * POST /auth/forgot-password
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Get tenant from request
    const tenantId = req.tenant?._id;

    if (!tenantId) {
      throw new ValidationError('Tenant context is required');
    }

    const result = await authService.requestPasswordReset(email, tenantId);

    logger.info('Password reset requested', {
      email,
      tenantId,
      requestId: req.id,
    });

    res.ok(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password with token
 * POST /auth/reset-password
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      throw new ValidationError('Token and new password are required');
    }

    const result = await authService.resetPassword(token, newPassword);

    logger.info('Password reset successfully', {
      requestId: req.id,
    });

    res.ok(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  verifyEmail,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
};
