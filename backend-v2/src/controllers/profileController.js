const User = require('../models/User');
const { NotFoundError, ValidationError, ForbiddenError } = require('../lib/errors');
const logger = require('../lib/logger');
const redis = require('../lib/redis');

/**
 * Get current user's profile
 * GET /api/v1/profile
 */
const getProfile = async (req, res) => {
  const userId = req.userId;

  const user = await User.findById(userId)
    .populate('tenant', 'name slug')
    .select('-password');

  if (!user) {
    throw new NotFoundError('User not found', 'USER_NOT_FOUND');
  }

  logger.info('User retrieved profile', {
    userId,
    requestId: req.id,
  });

  res.json({
    success: true,
    message: 'Profile retrieved successfully',
    data: user,
  });
};

/**
 * Update current user's profile
 * PUT /api/v1/profile
 */
const updateProfile = async (req, res) => {
  const userId = req.userId;
  const { firstName, lastName, phone, preferences } = req.body;

  const user = await User.findById(userId);

  if (!user) {
    throw new NotFoundError('User not found', 'USER_NOT_FOUND');
  }

  // Update allowed fields
  if (firstName !== undefined) user.firstName = firstName;
  if (lastName !== undefined) user.lastName = lastName;
  if (phone !== undefined) user.phone = phone;
  if (preferences !== undefined) {
    // Get current preferences or initialize with defaults from schema
    const currentPrefs = user.preferences ? 
      (user.preferences.toObject ? user.preferences.toObject() : user.preferences) : 
      {
        language: 'en',
        currency: 'USD',
        timezone: 'UTC',
        dateFormat: 'MM/DD/YYYY',
        notifications: {
          email: true,
          push: true,
          sms: false,
        },
      };
    
    // Deep merge notifications if provided
    if (preferences.notifications) {
      preferences.notifications = {
        ...(currentPrefs.notifications || {}),
        ...preferences.notifications,
      };
    }
    
    user.preferences = { 
      ...currentPrefs, 
      ...preferences 
    };
    
    // Mark as modified for nested object
    user.markModified('preferences');
  }

  await user.save();

  // Reload user to get all defaults populated
  const savedUser = await User.findById(userId);
  
  // Remove password from response
  const userObject = savedUser.toObject();
  delete userObject.password;
  
  // Ensure preferences has all fields (Mongoose doesn't apply defaults to existing docs)
  if (userObject.preferences) {
    userObject.preferences = {
      language: userObject.preferences.language || 'en',
      currency: userObject.preferences.currency || 'USD',
      timezone: userObject.preferences.timezone || 'UTC',
      dateFormat: userObject.preferences.dateFormat || 'MM/DD/YYYY',
      notifications: {
        email: userObject.preferences.notifications?.email !== undefined ? userObject.preferences.notifications.email : true,
        push: userObject.preferences.notifications?.push !== undefined ? userObject.preferences.notifications.push : true,
        sms: userObject.preferences.notifications?.sms !== undefined ? userObject.preferences.notifications.sms : false,
      },
    };
  }

  logger.info('User updated profile', {
    userId,
    updatedFields: Object.keys(req.body),
    requestId: req.id,
  });

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: userObject,
  });
};

/**
 * Change password
 * PUT /api/v1/profile/password
 */
const changePassword = async (req, res) => {
  const userId = req.userId;
  const { oldPassword, newPassword } = req.body;

  // Fetch user WITH password (auth middleware excludes it)
  const user = await User.findById(userId).select('+password');

  if (!user) {
    throw new NotFoundError('User not found', 'USER_NOT_FOUND');
  }

  // Verify old password
  const isPasswordValid = await user.comparePassword(oldPassword);
  if (!isPasswordValid) {
    throw new ValidationError(
      'Current password is incorrect',
      'INVALID_PASSWORD',
    );
  }

  // Check if new password is different from old
  const isSamePassword = await user.comparePassword(newPassword);
  if (isSamePassword) {
    throw new ValidationError(
      'New password must be different from current password',
      'SAME_PASSWORD',
    );
  }

  // Update password
  user.password = newPassword;
  await user.save();

  logger.info('User changed password', {
    userId,
    requestId: req.id,
  });

  res.json({
    success: true,
    message: 'Password changed successfully',
    data: null,
  });
};

/**
 * Upload avatar
 * POST /api/v1/profile/avatar
 */
const uploadAvatar = async (req, res) => {
  const userId = req.userId;

  if (!req.file) {
    throw new ValidationError('No file uploaded', 'NO_FILE');
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new NotFoundError('User not found', 'USER_NOT_FOUND');
  }

  // Update avatar URL (uploadService will handle the file)
  user.avatar = `/uploads/avatars/${req.file.filename}`;
  await user.save();

  logger.info('User uploaded avatar', {
    userId,
    filename: req.file.filename,
    requestId: req.id,
  });

  res.json({
    success: true,
    message: 'Avatar uploaded successfully',
    data: { avatar: user.avatar },
  });
};

/**
 * List active sessions
 * GET /api/v1/profile/sessions
 */
const listSessions = async (req, res) => {
  const userId = req.userId;

  // Get all refresh tokens for this user from Redis
  const pattern = `refresh_token:${userId}:*`;
  const keys = await redis.keys(pattern);

  const sessions = [];
  for (const key of keys) {
    const sessionData = await redis.get(key);
    if (sessionData) {
      const data = JSON.parse(sessionData);
      const ttl = await redis.ttl(key);
      
      // Extract session ID from key (the token part)
      const sessionId = key.split(':')[2];
      
      sessions.push({
        sessionId,
        createdAt: data.createdAt,
        expiresIn: ttl,
        isCurrent: key.includes(req.user.sessionId || ''),
      });
    }
  }

  logger.info('User listed sessions', {
    userId,
    sessionCount: sessions.length,
    requestId: req.id,
  });

  res.json({
    success: true,
    message: 'Sessions retrieved successfully',
    data: sessions,
  });
};

/**
 * Revoke a session
 * DELETE /api/v1/profile/sessions/:sessionId
 */
const revokeSession = async (req, res) => {
  const userId = req.userId;
  const { sessionId } = req.params;

  // Prevent revoking current session
  if (req.user.sessionId && sessionId === req.user.sessionId) {
    throw new ForbiddenError(
      'Cannot revoke current session. Use logout instead.',
      'CANNOT_REVOKE_CURRENT_SESSION',
    );
  }

  const key = `refresh_token:${userId}:${sessionId}`;
  const deleted = await redis.del(key);

  if (deleted === 0) {
    throw new NotFoundError('Session not found', 'SESSION_NOT_FOUND');
  }

  logger.info('User revoked session', {
    userId,
    sessionId,
    requestId: req.id,
  });

  res.json({
    success: true,
    message: 'Session revoked successfully',
    data: null,
  });
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  uploadAvatar,
  listSessions,
  revokeSession,
};
