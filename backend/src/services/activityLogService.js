const ActivityLog = require('../models/ActivityLog');

/**
 * Log an activity/action performed by a user or sub-user
 */
exports.logActivity = async ({
  tenantId,
  userId,
  subUserId = null,
  action,
  module,
  details = {},
  ipAddress = null,
  userAgent = null,
}) => {
  try {
    await ActivityLog.create({
      tenantId,
      userId,
      subUserId,
      action,
      module,
      details,
      ipAddress,
      userAgent,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't throw error - activity logging failure shouldn't break the main flow
  }
};

/**
 * Get activity logs for an agent
 */
exports.getAgentActivityLogs = async ({
  agentId,
  tenantId,
  module = null,
  action = null,
  startDate = null,
  endDate = null,
  page = 1,
  limit = 50,
}) => {
  const query = { userId: agentId, tenantId };

  if (module) query.module = module;
  if (action) query.action = action;
  
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    ActivityLog.find(query)
      .populate('userId', 'name email')
      .populate('subUserId', 'name email')
      .sort('-timestamp')
      .limit(limit)
      .skip(skip)
      .lean(),
    ActivityLog.countDocuments(query),
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get activity logs for a specific sub-user
 */
exports.getSubUserActivityLogs = async ({
  subUserId,
  tenantId,
  startDate = null,
  endDate = null,
  page = 1,
  limit = 50,
}) => {
  const query = { subUserId, tenantId };

  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    ActivityLog.find(query)
      .populate('subUserId', 'name email')
      .sort('-timestamp')
      .limit(limit)
      .skip(skip)
      .lean(),
    ActivityLog.countDocuments(query),
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};
