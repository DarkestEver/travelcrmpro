const User = require('../models/User');
const logger = require('../lib/logger');
const { NotFoundError, ValidationError, ForbiddenError } = require('../lib/errors');
const { USER_ROLES } = require('../config/constants');

/**
 * Get all users with pagination, filtering, and search
 * Super admin can see all users across tenants
 * Tenant admin can only see users in their tenant
 */
const getAllUsers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      role,
      status,
      search,
      sortBy = '-createdAt',
    } = req.query;

    const skip = (page - 1) * limit;

    // Build query based on user role
    const query = {};

    // Super admin can see all users, tenant admin only sees their tenant
    if (req.user.role !== USER_ROLES.SUPER_ADMIN) {
      query.tenant = req.user.tenant;
    }

    // Filter by role if specified
    if (role) {
      query.role = role;
    }

    // Filter by status if specified
    if (status) {
      query.status = status;
    }

    // Search by name or email
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Execute query
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password -verificationToken -resetToken')
        .populate('tenant', 'name slug')
        .populate('assignedAgent', 'firstName lastName email')
        .sort(sortBy)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      User.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    logger.info('Users retrieved successfully', {
      count: users.length,
      total,
      page,
      userId: req.user._id,
      requestId: req.id,
    });

    res.ok({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    logger.error('Error retrieving users', {
      error: error.message,
      userId: req.user?._id,
      requestId: req.id,
    });
    next(error);
  }
};

/**
 * Get user by ID
 * Super admin can get any user
 * Tenant admin can get users in their tenant
 * Users can get themselves
 */
const getUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .select('-password -verificationToken -resetToken')
      .populate('tenant', 'name slug domain')
      .populate('assignedAgent', 'firstName lastName email phone')
      .lean();

    if (!user) {
      throw new NotFoundError('User not found', 'USER_NOT_FOUND');
    }

    // Check permissions
    const isSuperAdmin = req.user.role === USER_ROLES.SUPER_ADMIN;
    const isOwnTenant = user.tenant && user.tenant._id.toString() === req.user.tenant?.toString();
    const isSelf = user._id.toString() === req.user._id.toString();

    if (!isSuperAdmin && !isOwnTenant && !isSelf) {
      throw new ForbiddenError(
        'You do not have permission to view this user',
        'FORBIDDEN'
      );
    }

    logger.info('User retrieved successfully', {
      userId: user._id,
      requestedBy: req.user._id,
      requestId: req.id,
    });

    res.ok({ user });
  } catch (error) {
    logger.error('Error retrieving user', {
      error: error.message,
      userId: req.params.id,
      requestId: req.id,
    });
    next(error);
  }
};

/**
 * Update user
 * Super admin can update any user
 * Tenant admin can update users in their tenant (except super admins)
 * Users cannot update their own role or status
 */
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const user = await User.findById(id);

    if (!user) {
      throw new NotFoundError('User not found', 'USER_NOT_FOUND');
    }

    // Check permissions
    const isSuperAdmin = req.user.role === USER_ROLES.SUPER_ADMIN;
    const isTenantAdmin = req.user.role === USER_ROLES.TENANT_ADMIN;
    const isOwnTenant = user.tenant && user.tenant.toString() === req.user.tenant?.toString();
    const isSelf = user._id.toString() === req.user._id.toString();

    // Permission checks
    if (!isSuperAdmin) {
      // Tenant admin can only update users in their own tenant
      if (isTenantAdmin && !isOwnTenant) {
        throw new ForbiddenError(
          'You can only update users in your own tenant',
          'FORBIDDEN'
        );
      }

      // Tenant admin cannot update super admins
      if (user.role === USER_ROLES.SUPER_ADMIN) {
        throw new ForbiddenError(
          'You do not have permission to update super administrators',
          'FORBIDDEN'
        );
      }

      // Users cannot update their own role or status
      if (isSelf && (updates.role || updates.status)) {
        throw new ForbiddenError(
          'You cannot modify your own role or status',
          'FORBIDDEN'
        );
      }

      // Non-super-admins cannot change roles or status for others
      if (!isSelf && (updates.role || updates.status)) {
        throw new ForbiddenError(
          'Only super administrators can change user roles or status',
          'FORBIDDEN'
        );
      }
    }

    // Prevent changing tenant
    if (updates.tenant) {
      delete updates.tenant;
    }

    // Prevent changing password through this endpoint
    if (updates.password) {
      delete updates.password;
    }

    // Prevent changing sensitive fields
    delete updates.verificationToken;
    delete updates.resetToken;
    delete updates.emailVerified;

    // Update allowed fields
    const allowedUpdates = [
      'firstName',
      'lastName',
      'phone',
      'avatar',
      'agentCode',
      'commission',
      'assignedAgent',
      'preferences',
    ];

    // Super admin can also update role and status
    if (isSuperAdmin) {
      allowedUpdates.push('role', 'status');
    }

    // Apply updates
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        user[field] = updates[field];
      }
    });

    await user.save();

    logger.info('User updated successfully', {
      userId: user._id,
      updatedBy: req.user._id,
      updatedFields: Object.keys(updates),
      requestId: req.id,
    });

    // Return updated user without sensitive fields
    const updatedUser = await User.findById(user._id)
      .select('-password -verificationToken -resetToken')
      .populate('tenant', 'name slug')
      .populate('assignedAgent', 'firstName lastName email')
      .lean();

    res.ok({ user: updatedUser });
  } catch (error) {
    logger.error('Error updating user', {
      error: error.message,
      userId: req.params.id,
      requestId: req.id,
    });
    next(error);
  }
};

/**
 * Delete user
 * Super admin can delete any user
 * Tenant admin can delete users in their tenant (except super admins and themselves)
 */
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      throw new NotFoundError('User not found', 'USER_NOT_FOUND');
    }

    // Check permissions
    const isSuperAdmin = req.user.role === USER_ROLES.SUPER_ADMIN;
    const isTenantAdmin = req.user.role === USER_ROLES.TENANT_ADMIN;
    const isOwnTenant = user.tenant && user.tenant.toString() === req.user.tenant?.toString();
    const isSelf = user._id.toString() === req.user._id.toString();

    // Cannot delete yourself
    if (isSelf) {
      throw new ForbiddenError(
        'You cannot delete your own account',
        'FORBIDDEN'
      );
    }

    // Permission checks
    if (!isSuperAdmin) {
      // Tenant admin can only delete users in their own tenant
      if (isTenantAdmin && !isOwnTenant) {
        throw new ForbiddenError(
          'You can only delete users in your own tenant',
          'FORBIDDEN'
        );
      }

      // Tenant admin cannot delete super admins
      if (user.role === USER_ROLES.SUPER_ADMIN) {
        throw new ForbiddenError(
          'You do not have permission to delete super administrators',
          'FORBIDDEN'
        );
      }
    }

    await User.findByIdAndDelete(id);

    logger.info('User deleted successfully', {
      userId: id,
      deletedBy: req.user._id,
      requestId: req.id,
    });

    res.ok({ message: 'User deleted successfully' });
  } catch (error) {
    logger.error('Error deleting user', {
      error: error.message,
      userId: req.params.id,
      requestId: req.id,
    });
    next(error);
  }
};

/**
 * Assign role to user
 * Super admin only
 */
const assignRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role) {
      throw new ValidationError('Role is required');
    }

    const user = await User.findById(id);

    if (!user) {
      throw new NotFoundError('User not found', 'USER_NOT_FOUND');
    }

    // Cannot change own role
    if (user._id.toString() === req.user._id.toString()) {
      throw new ForbiddenError(
        'You cannot change your own role',
        'FORBIDDEN'
      );
    }

    user.role = role;
    await user.save();

    logger.info('User role updated successfully', {
      userId: user._id,
      newRole: role,
      updatedBy: req.user._id,
      requestId: req.id,
    });

    const updatedUser = await User.findById(user._id)
      .select('-password -verificationToken -resetToken')
      .populate('tenant', 'name slug')
      .lean();

    res.ok({ user: updatedUser });
  } catch (error) {
    logger.error('Error assigning role', {
      error: error.message,
      userId: req.params.id,
      requestId: req.id,
    });
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  assignRole,
};
