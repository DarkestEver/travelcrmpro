const { asyncHandler, AppError } = require('./errorHandler');
const SubUser = require('../models/SubUser');

/**
 * Middleware to check if sub-user has specific permission
 * Usage: requireSubUserPermission('customers', 'create')
 */
exports.requireSubUserPermission = (module, action) => {
  return asyncHandler(async (req, res, next) => {
    // If request is from main agent, allow (agents have all permissions)
    if (req.user && req.user.role === 'agent' && !req.subUser) {
      return next();
    }

    // Check if sub-user is attached to request
    if (!req.subUser) {
      throw new AppError('Sub-user authentication required', 401);
    }

    // Check permission
    if (!req.subUser.hasPermission(module, action)) {
      throw new AppError(`You don't have permission to ${action} ${module}`, 403);
    }

    next();
  });
};

/**
 * Middleware to attach sub-user context to request
 * This should run after protect middleware
 */
exports.attachSubUserContext = asyncHandler(async (req, res, next) => {
  // Check if request has sub-user ID in header or token
  const subUserId = req.headers['x-sub-user-id'];

  if (!subUserId) {
    // No sub-user context, proceed as main agent
    return next();
  }

  // Fetch sub-user
  const subUser = await SubUser.findOne({
    _id: subUserId,
    parentAgentId: req.user._id,
    tenantId: req.user.tenantId,
    isActive: true,
  });

  if (!subUser) {
    throw new AppError('Sub-user not found or inactive', 404);
  }

  // Update last login
  subUser.lastLogin = new Date();
  await subUser.save();

  // Attach to request
  req.subUser = subUser;
  next();
});

/**
 * Middleware to require admin role for sub-user operations
 */
exports.requireSubUserAdmin = asyncHandler(async (req, res, next) => {
  if (req.subUser && req.subUser.role !== 'admin') {
    throw new AppError('Admin privileges required', 403);
  }
  next();
});

/**
 * Check if user can manage sub-users (main agent only)
 */
exports.requireMainAgent = asyncHandler(async (req, res, next) => {
  if (req.subUser) {
    throw new AppError('Only main agents can manage sub-users', 403);
  }
  next();
});
