const crypto = require('crypto');
const { User } = require('../models');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { successResponse } = require('../utils/response');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/email');
const { setAsync, delAsync } = require('../config/database');

// @desc    Register new user
// @route   POST /api/v1/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('Email already registered', 400);
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role: role || 'agent',
    phone,
  });

  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

  // Store token in Redis (expires in 24 hours)
  await setAsync(`verify:${hashedToken}`, user._id.toString(), 86400);

  // Send verification email
  try {
    await sendVerificationEmail(user, verificationToken);
  } catch (error) {
    console.error('Failed to send verification email:', error);
  }

  // Generate auth tokens
  const accessToken = user.generateAuthToken();
  const refreshToken = user.generateRefreshToken();

  // Store refresh token in Redis (expires in 30 days)
  await setAsync(`refresh:${user._id}`, refreshToken, 2592000);

  successResponse(res, 201, 'Registration successful. Please check your email to verify your account.', {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
    },
    accessToken,
    refreshToken,
  });
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user and include password
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }

  // Check if user is active
  if (!user.isActive) {
    throw new AppError('Your account has been deactivated. Please contact support.', 403);
  }

  // Update last login
  user.lastLogin = Date.now();
  await user.save({ validateBeforeSave: false });

  // Generate auth tokens
  const accessToken = user.generateAuthToken();
  const refreshToken = user.generateRefreshToken();

  // Store refresh token in Redis
  await setAsync(`refresh:${user._id}`, refreshToken, 2592000);

  // Cache user data
  await setAsync(`user:${user._id}`, JSON.stringify(user), 3600);

  successResponse(res, 200, 'Login successful', {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      avatar: user.avatar,
    },
    accessToken,
    refreshToken,
  });
});

// @desc    Logout user
// @route   POST /api/v1/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  // Blacklist current access token
  const token = req.headers.authorization.split(' ')[1];
  await setAsync(`blacklist:${token}`, 'true', 604800); // 7 days

  // Delete refresh token
  await delAsync(`refresh:${req.user._id}`);

  // Delete cached user data
  await delAsync(`user:${req.user._id}`);

  successResponse(res, 200, 'Logout successful');
});

// @desc    Refresh access token
// @route   POST /api/v1/auth/refresh
// @access  Public
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError('Refresh token is required', 400);
  }

  // Verify refresh token
  let decoded;
  try {
    decoded = require('jsonwebtoken').verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  // Check if token exists in Redis
  const storedToken = await require('../config/database').getAsync(`refresh:${decoded.id}`);
  if (!storedToken || storedToken !== refreshToken) {
    throw new AppError('Invalid refresh token', 401);
  }

  // Get user
  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) {
    throw new AppError('User not found or inactive', 401);
  }

  // Generate new access token
  const newAccessToken = user.generateAuthToken();

  successResponse(res, 200, 'Token refreshed successfully', {
    accessToken: newAccessToken,
  });
});

// @desc    Verify email
// @route   GET /api/v1/auth/verify-email/:token
// @access  Public
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  // Hash token
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // Get user ID from Redis
  const userId = await require('../config/database').getAsync(`verify:${hashedToken}`);
  if (!userId) {
    throw new AppError('Invalid or expired verification token', 400);
  }

  // Update user
  const user = await User.findByIdAndUpdate(
    userId,
    { emailVerified: true },
    { new: true }
  );

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Delete token from Redis
  await delAsync(`verify:${hashedToken}`);

  successResponse(res, 200, 'Email verified successfully', {
    emailVerified: true,
  });
});

// @desc    Forgot password
// @route   POST /api/v1/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Find user
  const user = await User.findOne({ email });
  if (!user) {
    // Don't reveal if email exists
    return successResponse(res, 200, 'If that email exists, a password reset link has been sent.');
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  // Store token in Redis (expires in 10 minutes)
  await setAsync(`reset:${hashedToken}`, user._id.toString(), 600);

  // Send reset email
  try {
    await sendPasswordResetEmail(user, resetToken);
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw new AppError('Failed to send password reset email. Please try again.', 500);
  }

  successResponse(res, 200, 'Password reset link sent to your email');
});

// @desc    Reset password
// @route   POST /api/v1/auth/reset-password/:token
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  // Hash token
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // Get user ID from Redis
  const userId = await require('../config/database').getAsync(`reset:${hashedToken}`);
  if (!userId) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  // Update password
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  user.password = password;
  user.passwordChangedAt = Date.now();
  await user.save();

  // Delete token from Redis
  await delAsync(`reset:${hashedToken}`);

  // Invalidate all existing sessions
  await delAsync(`refresh:${user._id}`);
  await delAsync(`user:${user._id}`);

  successResponse(res, 200, 'Password reset successful. Please log in with your new password.');
});

// @desc    Change password
// @route   POST /api/v1/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await User.findById(req.user._id).select('+password');

  // Verify current password
  if (!(await user.comparePassword(currentPassword))) {
    throw new AppError('Current password is incorrect', 401);
  }

  // Update password
  user.password = newPassword;
  user.passwordChangedAt = Date.now();
  await user.save();

  // Invalidate all existing sessions
  await delAsync(`refresh:${user._id}`);
  await delAsync(`user:${user._id}`);

  // Generate new tokens
  const accessToken = user.generateAuthToken();
  const refreshToken = user.generateRefreshToken();
  await setAsync(`refresh:${user._id}`, refreshToken, 2592000);

  successResponse(res, 200, 'Password changed successfully', {
    accessToken,
    refreshToken,
  });
});

// @desc    Get current user
// @route   GET /api/v1/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  successResponse(res, 200, 'User fetched successfully', {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar,
      emailVerified: user.emailVerified,
      mfaEnabled: user.mfaEnabled,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
    },
  });
});

// @desc    Update user profile
// @route   PUT /api/v1/auth/me
// @access  Private
const updateMe = asyncHandler(async (req, res) => {
  const { name, phone, avatar } = req.body;

  // Don't allow updating sensitive fields
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, phone, avatar },
    { new: true, runValidators: true }
  );

  // Update cache
  await delAsync(`user:${user._id}`);

  successResponse(res, 200, 'Profile updated successfully', { user });
});

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  verifyEmail,
  forgotPassword,
  resetPassword,
  changePassword,
  getMe,
  updateMe,
};
