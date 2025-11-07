const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { successResponse } = require('../utils/response');
const SubUser = require('../models/SubUser');
const { logActivity } = require('../services/activityLogService');

/**
 * @desc    Create a new sub-user
 * @route   POST /api/v1/agent-portal/sub-users
 * @access  Private (Agent only)
 */
exports.createSubUser = asyncHandler(async (req, res) => {
  const agentId = req.user._id;
  const tenantId = req.user.tenantId;
  const { name, email, password, role, permissions, phone, notes } = req.body;

  // Check if email already exists
  const existingSubUser = await SubUser.findOne({ email, tenantId });
  if (existingSubUser) {
    throw new AppError('Email already in use', 400);
  }

  // Create sub-user
  const subUser = await SubUser.create({
    tenantId,
    parentAgentId: agentId,
    name,
    email,
    password,
    role: role || 'user',
    permissions: permissions || {},
    phone,
    notes,
  });

  // Log activity
  await logActivity({
    tenantId,
    userId: agentId,
    action: 'sub_user_created',
    module: 'sub_users',
    details: {
      subUserId: subUser._id,
      subUserName: subUser.name,
      subUserEmail: subUser.email,
      role: subUser.role,
    },
  });

  successResponse(res, 201, 'Sub-user created successfully', {
    subUser,
  });
});

/**
 * @desc    Get all sub-users for authenticated agent
 * @route   GET /api/v1/agent-portal/sub-users
 * @access  Private (Agent only)
 */
exports.getMySubUsers = asyncHandler(async (req, res) => {
  const agentId = req.user._id;
  const tenantId = req.user.tenantId;

  const {
    page = 1,
    limit = 10,
    search,
    role,
    isActive,
    sortBy = '-createdAt',
  } = req.query;

  const query = { parentAgentId: agentId, tenantId };

  // Filter by role
  if (role) {
    query.role = role;
  }

  // Filter by active status
  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }

  // Search by name or email
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;

  const [subUsers, total] = await Promise.all([
    SubUser.find(query)
      .sort(sortBy)
      .limit(parseInt(limit))
      .skip(skip)
      .lean(),
    SubUser.countDocuments(query),
  ]);

  const pagination = {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / limit),
  };

  successResponse(res, 200, 'Sub-users retrieved successfully', {
    subUsers,
    pagination,
  });
});

/**
 * @desc    Get single sub-user by ID
 * @route   GET /api/v1/agent-portal/sub-users/:id
 * @access  Private (Agent only)
 */
exports.getSubUserById = asyncHandler(async (req, res) => {
  const agentId = req.user._id;
  const tenantId = req.user.tenantId;
  const { id } = req.params;

  const subUser = await SubUser.findOne({
    _id: id,
    parentAgentId: agentId,
    tenantId,
  });

  if (!subUser) {
    throw new AppError('Sub-user not found', 404);
  }

  successResponse(res, 200, 'Sub-user retrieved successfully', {
    subUser,
  });
});

/**
 * @desc    Update sub-user
 * @route   PUT /api/v1/agent-portal/sub-users/:id
 * @access  Private (Agent only)
 */
exports.updateSubUser = asyncHandler(async (req, res) => {
  const agentId = req.user._id;
  const tenantId = req.user.tenantId;
  const { id } = req.params;
  const { name, email, role, permissions, phone, notes, isActive } = req.body;

  const subUser = await SubUser.findOne({
    _id: id,
    parentAgentId: agentId,
    tenantId,
  });

  if (!subUser) {
    throw new AppError('Sub-user not found', 404);
  }

  // Check if email is being changed and if it's already in use
  if (email && email !== subUser.email) {
    const existingSubUser = await SubUser.findOne({ email, tenantId });
    if (existingSubUser) {
      throw new AppError('Email already in use', 400);
    }
    subUser.email = email;
  }

  // Update fields
  if (name) subUser.name = name;
  if (role) subUser.role = role;
  if (permissions) subUser.permissions = permissions;
  if (phone !== undefined) subUser.phone = phone;
  if (notes !== undefined) subUser.notes = notes;
  if (isActive !== undefined) subUser.isActive = isActive;

  await subUser.save();

  // Log activity
  await logActivity({
    tenantId,
    userId: agentId,
    action: 'sub_user_updated',
    module: 'sub_users',
    details: {
      subUserId: subUser._id,
      subUserName: subUser.name,
      changes: req.body,
    },
  });

  successResponse(res, 200, 'Sub-user updated successfully', {
    subUser,
  });
});

/**
 * @desc    Delete sub-user
 * @route   DELETE /api/v1/agent-portal/sub-users/:id
 * @access  Private (Agent only)
 */
exports.deleteSubUser = asyncHandler(async (req, res) => {
  const agentId = req.user._id;
  const tenantId = req.user.tenantId;
  const { id } = req.params;

  const subUser = await SubUser.findOne({
    _id: id,
    parentAgentId: agentId,
    tenantId,
  });

  if (!subUser) {
    throw new AppError('Sub-user not found', 404);
  }

  await subUser.deleteOne();

  // Log activity
  await logActivity({
    tenantId,
    userId: agentId,
    action: 'sub_user_deleted',
    module: 'sub_users',
    details: {
      subUserId: subUser._id,
      subUserName: subUser.name,
      subUserEmail: subUser.email,
    },
  });

  successResponse(res, 200, 'Sub-user deleted successfully');
});

/**
 * @desc    Update sub-user permissions
 * @route   PATCH /api/v1/agent-portal/sub-users/:id/permissions
 * @access  Private (Agent only)
 */
exports.updatePermissions = asyncHandler(async (req, res) => {
  const agentId = req.user._id;
  const tenantId = req.user.tenantId;
  const { id } = req.params;
  const { permissions } = req.body;

  if (!permissions) {
    throw new AppError('Permissions object is required', 400);
  }

  const subUser = await SubUser.findOne({
    _id: id,
    parentAgentId: agentId,
    tenantId,
  });

  if (!subUser) {
    throw new AppError('Sub-user not found', 404);
  }

  subUser.permissions = permissions;
  await subUser.save();

  // Log activity
  await logActivity({
    tenantId,
    userId: agentId,
    action: 'sub_user_permissions_updated',
    module: 'sub_users',
    details: {
      subUserId: subUser._id,
      subUserName: subUser.name,
      newPermissions: permissions,
    },
  });

  successResponse(res, 200, 'Permissions updated successfully', {
    subUser,
  });
});

/**
 * @desc    Toggle sub-user active status
 * @route   PATCH /api/v1/agent-portal/sub-users/:id/toggle-status
 * @access  Private (Agent only)
 */
exports.toggleStatus = asyncHandler(async (req, res) => {
  const agentId = req.user._id;
  const tenantId = req.user.tenantId;
  const { id } = req.params;

  const subUser = await SubUser.findOne({
    _id: id,
    parentAgentId: agentId,
    tenantId,
  });

  if (!subUser) {
    throw new AppError('Sub-user not found', 404);
  }

  subUser.isActive = !subUser.isActive;
  await subUser.save();

  // Log activity
  await logActivity({
    tenantId,
    userId: agentId,
    action: subUser.isActive ? 'sub_user_activated' : 'sub_user_deactivated',
    module: 'sub_users',
    details: {
      subUserId: subUser._id,
      subUserName: subUser.name,
      newStatus: subUser.isActive,
    },
  });

  successResponse(res, 200, `Sub-user ${subUser.isActive ? 'activated' : 'deactivated'} successfully`, {
    subUser,
  });
});

/**
 * @desc    Get sub-user statistics
 * @route   GET /api/v1/agent-portal/sub-users/stats
 * @access  Private (Agent only)
 */
exports.getSubUserStats = asyncHandler(async (req, res) => {
  const agentId = req.user._id;
  const tenantId = req.user.tenantId;

  const [total, active, inactive, byRole] = await Promise.all([
    SubUser.countDocuments({ parentAgentId: agentId, tenantId }),
    SubUser.countDocuments({ parentAgentId: agentId, tenantId, isActive: true }),
    SubUser.countDocuments({ parentAgentId: agentId, tenantId, isActive: false }),
    SubUser.aggregate([
      { $match: { parentAgentId: agentId, tenantId } },
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]),
  ]);

  const stats = {
    total,
    active,
    inactive,
    byRole: byRole.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
  };

  successResponse(res, 200, 'Sub-user statistics retrieved', { stats });
});

/**
 * @desc    Get activity logs for a sub-user
 * @route   GET /api/v1/agent-portal/sub-users/:id/activity-logs
 * @access  Private (Agent only)
 */
exports.getSubUserActivityLogs = asyncHandler(async (req, res) => {
  const agentId = req.user._id;
  const tenantId = req.user.tenantId;
  const { id } = req.params;
  const { page = 1, limit = 50 } = req.query;

  // Verify sub-user belongs to agent
  const subUser = await SubUser.findOne({
    _id: id,
    parentAgentId: agentId,
    tenantId,
  });

  if (!subUser) {
    throw new AppError('Sub-user not found', 404);
  }

  const ActivityLog = require('../models/ActivityLog');
  
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    ActivityLog.find({ subUserId: id, tenantId })
      .sort('-createdAt')
      .limit(parseInt(limit))
      .skip(skip)
      .lean(),
    ActivityLog.countDocuments({ subUserId: id, tenantId }),
  ]);

  const pagination = {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / limit),
  };

  successResponse(res, 200, 'Activity logs retrieved successfully', {
    logs,
    pagination,
  });
});
