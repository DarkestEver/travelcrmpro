const shareService = require('../services/shareService');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { successResponse } = require('../utils/response');

/**
 * @desc    Generate share token for an entity
 * @route   POST /api/v1/share/generate
 * @access  Private
 */
const generateShareToken = asyncHandler(async (req, res) => {
  const {
    entityType,
    entityId,
    expiresInDays,
    password,
    allowedActions,
    requireEmail,
    customMessage
  } = req.body;

  if (!entityType || !entityId) {
    throw new AppError('Entity type and ID are required', 400);
  }

  const shareToken = await shareService.generateShareToken({
    entityType,
    entityId,
    tenantId: req.user.tenantId,
    createdBy: req.user._id,
    expiresInDays,
    password,
    allowedActions,
    requireEmail,
    customMessage
  });

  successResponse(res, 201, 'Share link generated successfully', {
    token: shareToken.token,
    shareUrl: shareToken.shareUrl,
    expiresAt: shareToken.expiresAt
  });
});

/**
 * @desc    Get all share tokens for an entity
 * @route   GET /api/v1/share/:entityType/:entityId
 * @access  Private
 */
const getEntityShareTokens = asyncHandler(async (req, res) => {
  const { entityType, entityId } = req.params;

  const tokens = await shareService.getTokensForEntity(
    entityType,
    entityId,
    req.user.tenantId
  );

  successResponse(res, 200, 'Share tokens retrieved successfully', { tokens });
});

/**
 * @desc    Deactivate share token
 * @route   DELETE /api/v1/share/:tokenId
 * @access  Private
 */
const deactivateShareToken = asyncHandler(async (req, res) => {
  const { tokenId } = req.params;

  const shareToken = await shareService.deactivateToken(tokenId, req.user._id);

  successResponse(res, 200, 'Share link deactivated successfully', { shareToken });
});

/**
 * @desc    Get share token analytics
 * @route   GET /api/v1/share/:tokenId/analytics
 * @access  Private
 */
const getShareTokenAnalytics = asyncHandler(async (req, res) => {
  const { tokenId } = req.params;

  const analytics = await shareService.getTokenAnalytics(tokenId);

  successResponse(res, 200, 'Analytics retrieved successfully', { analytics });
});

/**
 * @desc    Extend share token expiration
 * @route   PATCH /api/v1/share/:tokenId/extend
 * @access  Private
 */
const extendShareToken = asyncHandler(async (req, res) => {
  const { tokenId } = req.params;
  const { additionalDays = 30 } = req.body;

  const shareToken = await shareService.extendExpiration(tokenId, additionalDays);

  successResponse(res, 200, 'Share link expiration extended', {
    token: shareToken.token,
    newExpiresAt: shareToken.expiresAt
  });
});

module.exports = {
  generateShareToken,
  getEntityShareTokens,
  deactivateShareToken,
  getShareTokenAnalytics,
  extendShareToken
};
