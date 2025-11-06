const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const AuditLog = require('../models/AuditLog');

// All routes require authentication and admin access
router.use(protect);
router.use(restrictTo('super_admin', 'operator'));

// Get audit logs with filtering
router.get('/', async (req, res, next) => {
  try {
    const {
      userId,
      action,
      resourceType,
      resourceId,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = req.query;
    
    // Build query
    const query = {};
    
    if (userId) query.userId = userId;
    if (action) query.action = action;
    if (resourceType) query.resourceType = resourceType;
    if (resourceId) query.resourceId = resourceId;
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    
    // Execute query with pagination
    const logs = await AuditLog.find(query)
      .populate('userId', 'name email role')
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await AuditLog.countDocuments(query);
    
    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get audit log statistics
router.get('/stats', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateQuery = {};
    if (startDate || endDate) {
      dateQuery.timestamp = {};
      if (startDate) dateQuery.timestamp.$gte = new Date(startDate);
      if (endDate) dateQuery.timestamp.$lte = new Date(endDate);
    }
    
    // Get action breakdown
    const actionStats = await AuditLog.aggregate([
      { $match: dateQuery },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Get resource type breakdown
    const resourceStats = await AuditLog.aggregate([
      { $match: dateQuery },
      { $group: { _id: '$resourceType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Get user activity
    const userActivity = await AuditLog.aggregate([
      { $match: dateQuery },
      { $group: { _id: '$userId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Populate user details
    await AuditLog.populate(userActivity, {
      path: '_id',
      select: 'name email role'
    });
    
    // Get total logs
    const totalLogs = await AuditLog.countDocuments(dateQuery);
    
    res.json({
      success: true,
      data: {
        totalLogs,
        actionBreakdown: actionStats,
        resourceBreakdown: resourceStats,
        topUsers: userActivity
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get audit logs for specific resource
router.get('/resource/:resourceType/:resourceId', async (req, res, next) => {
  try {
    const { resourceType, resourceId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const logs = await AuditLog.find({ resourceType, resourceId })
      .populate('userId', 'name email role')
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await AuditLog.countDocuments({ resourceType, resourceId });
    
    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get audit logs for specific user
router.get('/user/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, action, resourceType } = req.query;
    
    const query = { userId };
    if (action) query.action = action;
    if (resourceType) query.resourceType = resourceType;
    
    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await AuditLog.countDocuments(query);
    
    // Get user activity summary
    const actionSummary = await AuditLog.aggregate([
      { $match: { userId: require('mongoose').Types.ObjectId(userId) } },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    res.json({
      success: true,
      data: logs,
      summary: actionSummary,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
