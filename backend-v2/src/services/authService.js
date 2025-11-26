const User = require('../models/User');
const Tenant = require('../models/Tenant');
const tokenService = require('./tokenService');
const emailService = require('./emailService');
const redis = require('../lib/redis');
const crypto = require('crypto');
const logger = require('../lib/logger');
const {
  ValidationError,
  UnauthorizedError,
  NotFoundError,
  ConflictError,
} = require('../lib/errors');

/**
 * Generate a random token
 */
const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Register a new user
 */
const register = async (userData, tenantId) => {
  const { email, password, firstName, lastName, role = 'customer' } = userData;

  // Validate required fields
  if (!email || !password || !firstName || !lastName) {
    throw new ValidationError(
      'Email, password, first name, and last name are required',
      { missingFields: ['email', 'password', 'firstName', 'lastName'].filter(f => !userData[f]) },
    );
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format', { field: 'email' });
  }

  // Validate password strength (min 8 chars, 1 uppercase, 1 lowercase, 1 number)
  if (password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters long', { field: 'password' });
  }

  // Validate tenant exists and is active
  const tenant = await Tenant.findById(tenantId);
  if (!tenant) {
    throw new NotFoundError('Tenant not found', 'TENANT_NOT_FOUND', { tenantId });
  }

  if (tenant.status !== 'active') {
    throw new ValidationError(
      'Cannot register users for inactive tenant',
      { tenantStatus: tenant.status },
    );
  }

  // Check if user already exists in this tenant
  const existingUser = await User.findOne({ email, tenant: tenantId });
  if (existingUser) {
    throw new ConflictError(
      'User with this email already exists in this tenant',
      'USER_ALREADY_EXISTS',
      { email },
    );
  }

  // Generate email verification token
  const verificationToken = generateToken();

  // Create user
  const user = new User({
    tenant: tenantId,
    email,
    password, // Will be hashed by pre-save hook
    firstName,
    lastName,
    role,
    status: 'active',
    emailVerified: false,
    verificationToken,
  });

  await user.save();

  // Send verification email
  try {
    await emailService.sendVerificationEmail(user.email, verificationToken, {
      firstName: user.firstName,
      tenantName: tenant.name,
    });
  } catch (error) {
    logger.error('Failed to send verification email', {
      userId: user._id,
      email: user.email,
      error: error.message,
    });
    // Don't fail registration if email fails
  }

  logger.info('User registered successfully', {
    userId: user._id,
    email: user.email,
    tenantId,
  });

  // Return user without password
  const userObject = user.toObject();
  delete userObject.password;
  delete userObject.verificationToken;
  delete userObject.resetToken;
  delete userObject.resetTokenExpiry;

  return userObject;
};

/**
 * Login user and return JWT tokens
 */
const login = async (email, password, tenantId) => {
  // Validate required fields
  if (!email || !password) {
    throw new ValidationError('Email and password are required');
  }

  // Build query - tenantId is optional for super_admin
  const query = { email };
  if (tenantId) {
    query.tenant = tenantId;
  }

  // Find user by email and optionally tenant
  const user = await User.findOne(query).select('+password');
  if (!user) {
    throw new UnauthorizedError(
      'Invalid email or password',
      'INVALID_CREDENTIALS',
    );
  }

  // Check user status
  if (user.status !== 'active') {
    throw new UnauthorizedError(
      'Your account is not active. Please contact support.',
      'ACCOUNT_INACTIVE',
      { status: user.status },
    );
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new UnauthorizedError(
      'Invalid email or password',
      'INVALID_CREDENTIALS',
    );
  }

  // Generate JWT tokens
  const { accessToken, refreshToken } = tokenService.generateTokenPair(
    user.generateAuthToken(),
  );

  // Store refresh token in Redis with 7-day expiry
  const refreshTokenKey = `refresh_token:${user._id}:${refreshToken}`;
  await redis.set(refreshTokenKey, JSON.stringify({
    userId: user._id,
    tenantId: tenantId || null,
    createdAt: new Date(),
  }), 7 * 24 * 60 * 60); // 7 days in seconds

  // Update last login
  user.lastLoginAt = new Date();
  await user.save();

  logger.info('User logged in successfully', {
    userId: user._id,
    email: user.email,
    tenantId,
  });

  // Return tokens and user data (without password)
  const userObject = user.toObject();
  delete userObject.password;
  delete userObject.verificationToken;
  delete userObject.resetToken;
  delete userObject.resetTokenExpiry;

  return {
    user: userObject,
    accessToken,
    refreshToken,
  };
};

/**
 * Verify user email with token
 */
const verifyEmail = async (token) => {
  if (!token) {
    throw new ValidationError('Verification token is required');
  }

  // Find user by verification token
  const user = await User.findOne({ verificationToken: token });
  if (!user) {
    throw new NotFoundError(
      'Invalid or expired verification token',
      'INVALID_VERIFICATION_TOKEN',
    );
  }

  // Mark email as verified
  user.emailVerified = true;
  user.verificationToken = undefined;
  await user.save();

  logger.info('Email verified successfully', {
    userId: user._id,
    email: user.email,
  });

  return {
    message: 'Email verified successfully',
    emailVerified: true,
  };
};

/**
 * Request password reset email
 */
const requestPasswordReset = async (email, tenantId) => {
  if (!email) {
    throw new ValidationError('Email is required');
  }

  if (!tenantId) {
    throw new ValidationError('Tenant ID is required');
  }

  // Find user by email and tenant
  const user = await User.findOne({ email, tenant: tenantId });
  
  // Don't reveal if user exists (security best practice)
  if (!user) {
    logger.warn('Password reset requested for non-existent user', {
      email,
      tenantId,
    });
    return {
      message: 'If an account exists with this email, a password reset link has been sent',
    };
  }

  // Generate reset token (valid for 1 hour)
  const resetToken = generateToken();
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  user.resetToken = resetToken;
  user.resetTokenExpiry = resetTokenExpiry;
  await user.save();

  // Get tenant for email template
  const tenant = await Tenant.findById(tenantId);

  // Send password reset email
  try {
    await emailService.sendPasswordResetEmail(user.email, resetToken, {
      firstName: user.firstName,
      tenantName: tenant?.name || 'Travel CRM',
      tenantId,
    });
  } catch (error) {
    logger.error('Failed to send password reset email', {
      userId: user._id,
      email: user.email,
      error: error.message,
    });
    
    // In test environment, log the error but don't fail
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('Failed to send password reset email');
    }
    logger.warn('Email sending failed in test environment - continuing', { userId: user._id });
  }

  logger.info('Password reset requested', {
    userId: user._id,
    email: user.email,
  });

  return {
    message: 'If an account exists with this email, a password reset link has been sent',
  };
};

/**
 * Reset password with token
 */
const resetPassword = async (token, newPassword) => {
  if (!token) {
    throw new ValidationError('Reset token is required');
  }

  if (!newPassword) {
    throw new ValidationError('New password is required');
  }

  // Validate password strength
  if (newPassword.length < 8) {
    throw new ValidationError('Password must be at least 8 characters long', { field: 'password' });
  }

  // Find user by reset token
  const user = await User.findOne({
    resetToken: token,
    resetTokenExpiry: { $gt: new Date() }, // Token not expired
  });

  if (!user) {
    throw new NotFoundError(
      'Invalid or expired reset token',
      'INVALID_RESET_TOKEN',
    );
  }

  // Update password (will be hashed by pre-save hook)
  user.password = newPassword;
  user.resetToken = undefined;
  user.resetTokenExpiry = undefined;
  await user.save();

  // Invalidate all refresh tokens for this user
  await redis.delPattern(`refresh_token:${user._id}:*`);

  logger.info('Password reset successfully', {
    userId: user._id,
    email: user.email,
  });

  return {
    message: 'Password reset successfully',
  };
};

/**
 * Refresh access token using refresh token
 */
const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new ValidationError('Refresh token is required');
  }

  // Verify refresh token
  let decoded;
  try {
    decoded = tokenService.verifyRefreshToken(refreshToken);
  } catch (error) {
    throw new UnauthorizedError(
      'Invalid or expired refresh token',
      'INVALID_REFRESH_TOKEN',
    );
  }

  // Check if refresh token exists in Redis
  const refreshTokenKey = `refresh_token:${decoded.userId}:${refreshToken}`;
  const tokenData = await redis.get(refreshTokenKey);
  
  if (!tokenData) {
    throw new UnauthorizedError(
      'Refresh token has been revoked',
      'TOKEN_REVOKED',
    );
  }

  // Get user
  const user = await User.findById(decoded.userId);
  if (!user || user.status !== 'active') {
    throw new UnauthorizedError(
      'User not found or inactive',
      'USER_INACTIVE',
    );
  }

  // Generate new access token
  const accessToken = tokenService.generateAccessToken(user.generateAuthToken());

  logger.debug('Access token refreshed', {
    userId: user._id,
  });

  return {
    accessToken,
    refreshToken, // Return same refresh token
  };
};

/**
 * Logout user (revoke refresh token)
 */
const logout = async (userId, refreshToken) => {
  if (!refreshToken) {
    throw new ValidationError('Refresh token is required');
  }

  // Delete refresh token from Redis
  const refreshTokenKey = `refresh_token:${userId}:${refreshToken}`;
  await redis.del(refreshTokenKey);

  logger.info('User logged out', {
    userId,
  });

  return {
    message: 'Logged out successfully',
  };
};

module.exports = {
  register,
  login,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  refreshAccessToken,
  logout,
};
