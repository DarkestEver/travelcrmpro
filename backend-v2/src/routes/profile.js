const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { updateProfileSchema, changePasswordSchema } = require('../validation/profileSchemas');
const { uploadAvatar } = require('../services/uploadService');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * @route   GET /api/v1/profile
 * @desc    Get current user's profile
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  asyncHandler(profileController.getProfile),
);

/**
 * @route   PUT /api/v1/profile
 * @desc    Update current user's profile
 * @access  Private
 */
router.put(
  '/',
  authenticate,
  validate(updateProfileSchema),
  asyncHandler(profileController.updateProfile),
);

/**
 * @route   PUT /api/v1/profile/password
 * @desc    Change password
 * @access  Private
 */
router.put(
  '/password',
  authenticate,
  validate(changePasswordSchema),
  asyncHandler(profileController.changePassword),
);

/**
 * @route   POST /api/v1/profile/avatar
 * @desc    Upload avatar
 * @access  Private
 */
router.post(
  '/avatar',
  authenticate,
  uploadAvatar,
  asyncHandler(profileController.uploadAvatar),
);

/**
 * @route   GET /api/v1/profile/sessions
 * @desc    List active sessions
 * @access  Private
 */
router.get(
  '/sessions',
  authenticate,
  asyncHandler(profileController.listSessions),
);

/**
 * @route   DELETE /api/v1/profile/sessions/:sessionId
 * @desc    Revoke a session
 * @access  Private
 */
router.delete(
  '/sessions/:sessionId',
  authenticate,
  asyncHandler(profileController.revokeSession),
);

module.exports = router;
