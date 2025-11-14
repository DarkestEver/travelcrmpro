/**
 * Email Dashboard Controller
 * Provides aggregated stats and analytics for email processing
 */

const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { successResponse } = require('../utils/response');
const EmailLog = require('../models/EmailLog');
const mongoose = require('mongoose');

/**
 * @desc    Get dashboard stats (today's emails, review queue, AI costs)
 * @route   GET /api/v1/emails/dashboard-stats
 * @access  Private
 */
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  
  // Get today's date range
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Get yesterday's date range for comparison
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Parallel queries for efficiency
  const [
    todayEmails,
    yesterdayEmails,
    needsReview,
    recentEmails,
    aiCostToday,
    queuedEmails
  ] = await Promise.all([
    // Today's email count
    EmailLog.countDocuments({
      tenantId,
      receivedAt: { $gte: today, $lt: tomorrow }
    }),
    
    // Yesterday's email count (for % change)
    EmailLog.countDocuments({
      tenantId,
      receivedAt: { $gte: yesterday, $lt: today }
    }),
    
    // Needs review count
    EmailLog.countDocuments({
      tenantId,
      requiresReview: true,
      reviewedAt: null
    }),
    
    // Recent emails (last 10)
    EmailLog.find({ tenantId })
      .sort({ receivedAt: -1 })
      .limit(10)
      .select('from subject receivedAt processingStatus category')
      .lean(),
    
    // AI processing costs today
    EmailLog.aggregate([
      {
        $match: {
          tenantId: mongoose.Types.ObjectId(tenantId),
          receivedAt: { $gte: today, $lt: tomorrow },
          'aiProcessing.cost': { $exists: true }
        }
      },
      {
        $group: {
          _id: null,
          totalCost: { $sum: '$aiProcessing.cost' }
        }
      }
    ]),
    
    // Queued emails (pending processing)
    EmailLog.countDocuments({
      tenantId,
      processingStatus: 'pending'
    })
  ]);
  
  // Calculate percentage change
  const percentChange = yesterdayEmails > 0
    ? ((todayEmails - yesterdayEmails) / yesterdayEmails * 100).toFixed(1)
    : 0;
  
  const totalAICost = aiCostToday.length > 0 ? aiCostToday[0].totalCost : 0;
  
  const stats = {
    today: {
      count: todayEmails,
      percentChange: parseFloat(percentChange)
    },
    needsReview: needsReview,
    aiCost: {
      today: totalAICost.toFixed(4),
      currency: 'USD'
    },
    queue: queuedEmails,
    recentEmails: recentEmails
  };
  
  successResponse(res, 200, 'Dashboard stats retrieved successfully', stats);
});

/**
 * @desc    Get email analytics with date ranges
 * @route   GET /api/v1/emails/analytics
 * @access  Private
 */
exports.getAnalytics = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const { startDate, endDate } = req.query;
  
  // Default to last 30 days if no dates provided
  const end = endDate ? new Date(endDate) : new Date();
  const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  // Parallel aggregation queries
  const [
    totalEmails,
    categoryBreakdown,
    statusBreakdown,
    aiAccuracy,
    totalAICost,
    avgResponseTime,
    reviewQueue
  ] = await Promise.all([
    // Total emails in period
    EmailLog.countDocuments({
      tenantId,
      receivedAt: { $gte: start, $lte: end }
    }),
    
    // Category breakdown
    EmailLog.aggregate([
      {
        $match: {
          tenantId: mongoose.Types.ObjectId(tenantId),
          receivedAt: { $gte: start, $lte: end },
          category: { $exists: true }
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]),
    
    // Processing status breakdown
    EmailLog.aggregate([
      {
        $match: {
          tenantId: mongoose.Types.ObjectId(tenantId),
          receivedAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$processingStatus',
          count: { $sum: 1 }
        }
      }
    ]),
    
    // AI accuracy (confidence > 80%)
    EmailLog.aggregate([
      {
        $match: {
          tenantId: mongoose.Types.ObjectId(tenantId),
          receivedAt: { $gte: start, $lte: end },
          categoryConfidence: { $exists: true }
        }
      },
      {
        $group: {
          _id: null,
          avgConfidence: { $avg: '$categoryConfidence' },
          highConfidence: {
            $sum: {
              $cond: [{ $gte: ['$categoryConfidence', 80] }, 1, 0]
            }
          },
          total: { $sum: 1 }
        }
      }
    ]),
    
    // Total AI costs in period
    EmailLog.aggregate([
      {
        $match: {
          tenantId: mongoose.Types.ObjectId(tenantId),
          receivedAt: { $gte: start, $lte: end },
          'aiProcessing.cost': { $exists: true }
        }
      },
      {
        $group: {
          _id: null,
          totalCost: { $sum: '$aiProcessing.cost' },
          totalTokens: { $sum: '$aiProcessing.tokens.total' }
        }
      }
    ]),
    
    // Average response time (processedAt - receivedAt)
    EmailLog.aggregate([
      {
        $match: {
          tenantId: mongoose.Types.ObjectId(tenantId),
          receivedAt: { $gte: start, $lte: end },
          processedAt: { $exists: true }
        }
      },
      {
        $project: {
          responseTime: {
            $subtract: ['$processedAt', '$receivedAt']
          }
        }
      },
      {
        $group: {
          _id: null,
          avgResponseTime: { $avg: '$responseTime' }
        }
      }
    ]),
    
    // Manual review queue
    EmailLog.countDocuments({
      tenantId,
      receivedAt: { $gte: start, $lte: end },
      requiresReview: true,
      reviewedAt: null
    })
  ]);
  
  // Calculate AI accuracy percentage
  const accuracyData = aiAccuracy.length > 0 ? aiAccuracy[0] : { avgConfidence: 0, highConfidence: 0, total: 1 };
  const accuracyPercent = accuracyData.total > 0
    ? (accuracyData.highConfidence / accuracyData.total * 100).toFixed(1)
    : 0;
  
  // Format response time (milliseconds to minutes)
  const avgResponseMinutes = avgResponseTime.length > 0
    ? (avgResponseTime[0].avgResponseTime / 60000).toFixed(1)
    : '-';
  
  // Format cost
  const aiCost = totalAICost.length > 0 ? totalAICost[0].totalCost : 0;
  const aiTokens = totalAICost.length > 0 ? totalAICost[0].totalTokens : 0;
  
  const analytics = {
    period: {
      startDate: start,
      endDate: end,
      days: Math.ceil((end - start) / (1000 * 60 * 60 * 24))
    },
    summary: {
      totalEmails: totalEmails,
      aiAccuracy: parseFloat(accuracyPercent),
      avgConfidence: accuracyData.avgConfidence.toFixed(1),
      totalAICost: aiCost.toFixed(4),
      totalTokens: aiTokens,
      avgResponseTime: avgResponseMinutes,
      reviewQueue: reviewQueue
    },
    categoryBreakdown: categoryBreakdown.map(item => ({
      category: item._id,
      count: item.count,
      percentage: ((item.count / totalEmails) * 100).toFixed(1)
    })),
    statusBreakdown: statusBreakdown.map(item => ({
      status: item._id,
      count: item.count,
      percentage: ((item.count / totalEmails) * 100).toFixed(1)
    }))
  };
  
  successResponse(res, 200, 'Analytics retrieved successfully', analytics);
});

/**
 * @desc    Get manual review queue
 * @route   GET /api/v1/emails/review-queue
 * @access  Private
 */
exports.getReviewQueue = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const { page = 1, limit = 20, priority = 'all' } = req.query;
  
  const skip = (page - 1) * limit;
  
  // Build query
  const query = {
    tenantId,
    requiresReview: true,
    reviewedAt: null
  };
  
  if (priority !== 'all') {
    query.priority = priority;
  }
  
  // Calculate SLA breach (emails older than 24 hours)
  const slaThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  // Parallel queries
  const [
    emails,
    totalCount,
    statusCounts,
    slaBreached
  ] = await Promise.all([
    // Get paginated emails
    EmailLog.find(query)
      .sort({ priority: -1, receivedAt: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('from subject receivedAt priority category categoryConfidence processingStatus reviewNotes')
      .lean(),
    
    // Total count
    EmailLog.countDocuments(query),
    
    // Status counts
    EmailLog.aggregate([
      {
        $match: {
          tenantId: mongoose.Types.ObjectId(tenantId),
          requiresReview: true,
          reviewedAt: null
        }
      },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]),
    
    // SLA breached count
    EmailLog.countDocuments({
      tenantId,
      requiresReview: true,
      reviewedAt: null,
      receivedAt: { $lt: slaThreshold }
    })
  ]);
  
  // Calculate average response time for pending items
  const avgWaitTime = emails.length > 0
    ? emails.reduce((sum, email) => {
        const waitTime = Date.now() - new Date(email.receivedAt).getTime();
        return sum + waitTime;
      }, 0) / emails.length / (1000 * 60 * 60) // Convert to hours
    : 0;
  
  const stats = {
    pending: totalCount,
    slaBreached: slaBreached,
    inReview: 0, // Could track this separately if needed
    avgResponseTime: `${avgWaitTime.toFixed(1)}h`,
    byCriticality: statusCounts.reduce((acc, item) => {
      acc[item._id || 'normal'] = item.count;
      return acc;
    }, {})
  };
  
  const result = {
    stats,
    emails,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: totalCount,
      pages: Math.ceil(totalCount / limit)
    }
  };
  
  successResponse(res, 200, 'Review queue retrieved successfully', result);
});
