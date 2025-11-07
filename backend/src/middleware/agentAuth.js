const asyncHandler = require('./asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

/**
 * Protect routes - require agent role
 * Use this middleware after the main 'protect' middleware
 */
exports.requireAgent = asyncHandler(async (req, res, next) => {
  // Check if user is authenticated (should be done by protect middleware first)
  if (!req.user) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  // Check if user has agent role
  if (req.user.role !== 'agent') {
    return next(
      new ErrorResponse(
        `User role '${req.user.role}' is not authorized to access this route. Agent role required.`,
        403
      )
    );
  }

  // Check if agent account is active
  if (!req.user.isActive) {
    return next(new ErrorResponse('Agent account is inactive. Please contact support.', 403));
  }

  next();
});

/**
 * Check if agent has sufficient credit limit
 * @param {number} requiredAmount - Amount to check against credit limit
 */
exports.checkCreditLimit = (requiredAmount) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user || req.user.role !== 'agent') {
      return next(new ErrorResponse('Agent role required', 403));
    }

    const { creditLimit = 0 } = req.user;

    if (creditLimit < requiredAmount) {
      return next(
        new ErrorResponse(
          `Insufficient credit limit. Required: ${requiredAmount}, Available: ${creditLimit}`,
          403
        )
      );
    }

    next();
  });
};

/**
 * Check agent level
 * @param {Array<string>} allowedLevels - Array of allowed agent levels
 */
exports.requireAgentLevel = (allowedLevels) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user || req.user.role !== 'agent') {
      return next(new ErrorResponse('Agent role required', 403));
    }

    const { agentLevel = 'bronze' } = req.user;

    if (!allowedLevels.includes(agentLevel)) {
      return next(
        new ErrorResponse(
          `Agent level '${agentLevel}' is not authorized. Required levels: ${allowedLevels.join(', ')}`,
          403
        )
      );
    }

    next();
  });
};

/**
 * Attach agent metadata to request
 * Useful for logging and analytics
 */
exports.attachAgentMetadata = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.role === 'agent') {
    req.agentMetadata = {
      agentId: req.user._id,
      agentCode: req.user.agentCode,
      agentLevel: req.user.agentLevel,
      tenantId: req.user.tenantId,
      commissionRate: req.user.commissionRate || 10,
    };
  }
  next();
});
