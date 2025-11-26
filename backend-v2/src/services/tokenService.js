const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../lib/logger');
const { UnauthorizedError } = require('../lib/errors');

/**
 * Token Service - Handle JWT generation and verification
 */
class TokenService {
  /**
   * Generate access token
   */
  generateAccessToken(payload) {
    try {
      return jwt.sign(payload, config.auth.jwtSecret, {
        expiresIn: config.auth.jwtAccessExpiry,
        issuer: config.app.name,
        audience: config.app.name,
      });
    } catch (error) {
      logger.error('Error generating access token', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(payload) {
    try {
      return jwt.sign(payload, config.auth.jwtRefreshSecret, {
        expiresIn: config.auth.jwtRefreshExpiry,
        issuer: config.app.name,
        audience: config.app.name,
      });
    } catch (error) {
      logger.error('Error generating refresh token', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate both access and refresh tokens
   */
  generateTokenPair(payload) {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
      expiresIn: this.parseExpiry(config.auth.jwtAccessExpiry),
    };
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, config.auth.jwtSecret, {
        issuer: config.app.name,
        audience: config.app.name,
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Token has expired', 'TOKEN_EXPIRED');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedError('Invalid token', 'INVALID_TOKEN');
      }
      throw error;
    }
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, config.auth.jwtRefreshSecret, {
        issuer: config.app.name,
        audience: config.app.name,
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Refresh token has expired', 'REFRESH_TOKEN_EXPIRED');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedError('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
      }
      throw error;
    }
  }

  /**
   * Decode token without verification (for debugging)
   */
  decode(token) {
    return jwt.decode(token);
  }

  /**
   * Parse expiry string to seconds
   */
  parseExpiry(expiryString) {
    const match = expiryString.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 3600; // Default 1 hour
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };

    return value * (multipliers[unit] || 1);
  }
}

// Export singleton instance
const tokenService = new TokenService();
module.exports = tokenService;
