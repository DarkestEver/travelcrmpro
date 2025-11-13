const ShareToken = require('../models/ShareToken');
const { AppError } = require('../middleware/errorHandler');
const bcrypt = require('bcryptjs');

class ShareService {
  /**
   * Generate a share token for an entity
   */
  async generateShareToken(data) {
    const {
      entityType,
      entityId,
      tenantId,
      createdBy,
      expiresInDays = 30,
      password,
      allowedActions = ['view'],
      requireEmail = false,
      customMessage,
      singleUse = false // Add singleUse parameter
    } = data;

    // Hash password if provided
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const shareToken = await ShareToken.create({
      entityType,
      entityId,
      tenantId,
      createdBy,
      expiresAt,
      password: hashedPassword,
      singleUse, // Set single-use flag
      metadata: {
        allowedActions,
        requireEmail,
        customMessage
      }
    });

    return shareToken;
  }

  /**
   * Validate share token and optionally check password
   */
  async validateToken(token, password = null) {
    const shareToken = await ShareToken.findOne({ token })
      .select('+password');

    if (!shareToken) {
      throw new AppError('Share link not found', 404);
    }

    // Check if single-use link has already been accessed
    if (shareToken.singleUse && shareToken.accessCount > 0) {
      throw new AppError('This link has already been used and is no longer valid. Please request a new link if needed.', 403);
    }

    if (!shareToken.isValid()) {
      throw new AppError('Share link has expired or is no longer active', 403);
    }

    // Check password if token has one
    if (shareToken.password) {
      if (!password) {
        throw new AppError('This share link requires a password', 401);
      }

      const isPasswordValid = await bcrypt.compare(password, shareToken.password);
      if (!isPasswordValid) {
        throw new AppError('Incorrect password', 401);
      }
    }

    // Track access
    shareToken.accessCount += 1;
    shareToken.lastViewedAt = new Date();
    
    // Record first access timestamp
    if (!shareToken.firstAccessedAt) {
      shareToken.firstAccessedAt = new Date();
    }

    // Auto-deactivate if single-use link
    if (shareToken.singleUse) {
      shareToken.isActive = false;
      console.log(`Single-use link ${shareToken.token} auto-deactivated after first access`);
    }

    await shareToken.save();

    return shareToken;
  }

  /**
   * Get share token with entity data
   */
  async getTokenWithEntity(token, password = null) {
    const shareToken = await this.validateToken(token, password);

    // Populate entity based on type
    await shareToken.populate('entityId');
    await shareToken.populate('tenantId', 'name subdomain settings.branding');

    return shareToken;
  }

  /**
   * Deactivate a share token
   */
  async deactivateToken(tokenId, userId) {
    const shareToken = await ShareToken.findById(tokenId);

    if (!shareToken) {
      throw new AppError('Share token not found', 404);
    }

    // Verify user has permission (creator or admin)
    if (shareToken.createdBy.toString() !== userId.toString()) {
      // Could add admin check here
      throw new AppError('You do not have permission to deactivate this share link', 403);
    }

    shareToken.isActive = false;
    await shareToken.save();

    return shareToken;
  }

  /**
   * Get all share tokens for an entity
   */
  async getTokensForEntity(entityType, entityId, tenantId) {
    const tokens = await ShareToken.find({
      entityType,
      entityId,
      tenantId,
      isActive: true
    })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    return tokens;
  }

  /**
   * Get analytics for a share token
   */
  async getTokenAnalytics(tokenId) {
    const shareToken = await ShareToken.findById(tokenId);

    if (!shareToken) {
      throw new AppError('Share token not found', 404);
    }

    return {
      token: shareToken.token,
      viewCount: shareToken.viewCount,
      lastViewedAt: shareToken.lastViewedAt,
      createdAt: shareToken.createdAt,
      expiresAt: shareToken.expiresAt,
      isExpired: shareToken.expiresAt < new Date(),
      daysUntilExpiration: Math.ceil((shareToken.expiresAt - new Date()) / (1000 * 60 * 60 * 24))
    };
  }

  /**
   * Extend token expiration
   */
  async extendExpiration(tokenId, additionalDays) {
    const shareToken = await ShareToken.findById(tokenId);

    if (!shareToken) {
      throw new AppError('Share token not found', 404);
    }

    const newExpiration = new Date(shareToken.expiresAt);
    newExpiration.setDate(newExpiration.getDate() + additionalDays);

    shareToken.expiresAt = newExpiration;
    await shareToken.save();

    return shareToken;
  }
}

module.exports = new ShareService();
