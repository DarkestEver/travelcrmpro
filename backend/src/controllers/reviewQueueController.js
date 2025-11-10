const ManualReviewQueue = require('../models/ManualReviewQueue');
const EmailLog = require('../models/EmailLog');

class ReviewQueueController {
  /**
   * Get review queue items
   * GET /api/v1/review-queue
   */
  async getQueue(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        priority,
        assignedToMe,
        unassignedOnly,
        slaBreached
      } = req.query;

      const tenantId = req.user.tenantId;
      const userId = req.user._id;
      const skip = (page - 1) * limit;

      // Build filter
      const filter = { tenantId };

      if (status) {
        filter.status = status;
      }

      if (priority) {
        filter.priority = priority;
      }

      if (assignedToMe === 'true') {
        filter.assignedTo = userId;
      }

      if (unassignedOnly === 'true') {
        filter.assignedTo = null;
      }

      if (slaBreached === 'true') {
        filter.slaBreached = true;
      }

      // Execute query
      const [items, total] = await Promise.all([
        ManualReviewQueue.find(filter)
          .populate('emailLogId', 'from subject snippet receivedAt category')
          .populate('assignedTo', 'firstName lastName email')
          .populate('reviewedBy', 'firstName lastName email')
          .sort({ priority: 1, queuedAt: 1 })
          .skip(skip)
          .limit(parseInt(limit)),
        ManualReviewQueue.countDocuments(filter)
      ]);

      res.json({
        success: true,
        data: items,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get queue error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch review queue',
        error: error.message
      });
    }
  }

  /**
   * Get my assigned reviews
   * GET /api/v1/review-queue/my-queue
   */
  async getMyQueue(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user._id;

      const items = await ManualReviewQueue.getMyQueue(tenantId, userId);

      res.json({
        success: true,
        data: items
      });
    } catch (error) {
      console.error('Get my queue error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch my queue',
        error: error.message
      });
    }
  }

  /**
   * Get unassigned reviews
   * GET /api/v1/review-queue/unassigned
   */
  async getUnassignedQueue(req, res) {
    try {
      const tenantId = req.user.tenantId;

      const items = await ManualReviewQueue.getUnassignedQueue(tenantId);

      res.json({
        success: true,
        data: items
      });
    } catch (error) {
      console.error('Get unassigned queue error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch unassigned queue',
        error: error.message
      });
    }
  }

  /**
   * Get SLA breached items
   * GET /api/v1/review-queue/breached
   */
  async getBreachedSLA(req, res) {
    try {
      const tenantId = req.user.tenantId;

      const items = await ManualReviewQueue.getBreachedSLA(tenantId);

      res.json({
        success: true,
        data: items
      });
    } catch (error) {
      console.error('Get breached SLA error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch breached items',
        error: error.message
      });
    }
  }

  /**
   * Get queue statistics
   * GET /api/v1/review-queue/stats
   */
  async getStats(req, res) {
    try {
      const tenantId = req.user.tenantId;

      const stats = await ManualReviewQueue.getQueueStats(tenantId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get queue stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch queue statistics',
        error: error.message
      });
    }
  }

  /**
   * Get single review item
   * GET /api/v1/review-queue/:id
   */
  async getReviewItem(req, res) {
    try {
      const { id } = req.params;
      const tenantId = req.user.tenantId;

      const item = await ManualReviewQueue.findOne({ _id: id, tenantId })
        .populate('emailLogId')
        .populate('assignedTo', 'firstName lastName email')
        .populate('reviewedBy', 'firstName lastName email')
        .populate('comments.userId', 'firstName lastName email');

      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Review item not found'
        });
      }

      res.json({
        success: true,
        data: item
      });
    } catch (error) {
      console.error('Get review item error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch review item',
        error: error.message
      });
    }
  }

  /**
   * Assign review to user
   * POST /api/v1/review-queue/:id/assign
   */
  async assignReview(req, res) {
    try {
      const { id } = req.params;
      const { userId } = req.body;
      const tenantId = req.user.tenantId;
      const assignedBy = req.user._id;

      const item = await ManualReviewQueue.findOne({ _id: id, tenantId });

      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Review item not found'
        });
      }

      await item.assign(userId || assignedBy, assignedBy);

      res.json({
        success: true,
        message: 'Review assigned successfully',
        data: item
      });
    } catch (error) {
      console.error('Assign review error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to assign review',
        error: error.message
      });
    }
  }

  /**
   * Complete review with decision
   * POST /api/v1/review-queue/:id/complete
   */
  async completeReview(req, res) {
    try {
      const { id } = req.params;
      const { decision, notes } = req.body;
      const tenantId = req.user.tenantId;
      const userId = req.user._id;

      const item = await ManualReviewQueue.findOne({ _id: id, tenantId });

      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Review item not found'
        });
      }

      await item.complete(decision, userId, notes);

      // Update email based on decision
      const email = await EmailLog.findById(item.emailLogId);
      if (email) {
        email.reviewedBy = userId;
        email.reviewedAt = new Date();
        email.reviewNotes = notes;
        email.reviewDecision = decision.action;

        if (decision.categoryOverride) {
          email.category = decision.categoryOverride;
        }

        if (decision.extractedDataOverride) {
          email.extractedData = { ...email.extractedData, ...decision.extractedDataOverride };
        }

        await email.save();
      }

      res.json({
        success: true,
        message: 'Review completed successfully',
        data: item
      });
    } catch (error) {
      console.error('Complete review error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to complete review',
        error: error.message
      });
    }
  }

  /**
   * Escalate review
   * POST /api/v1/review-queue/:id/escalate
   */
  async escalateReview(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const tenantId = req.user.tenantId;
      const userId = req.user._id;

      const item = await ManualReviewQueue.findOne({ _id: id, tenantId });

      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Review item not found'
        });
      }

      await item.escalate(userId, reason);

      res.json({
        success: true,
        message: 'Review escalated successfully',
        data: item
      });
    } catch (error) {
      console.error('Escalate review error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to escalate review',
        error: error.message
      });
    }
  }

  /**
   * Add comment to review
   * POST /api/v1/review-queue/:id/comment
   */
  async addComment(req, res) {
    try {
      const { id } = req.params;
      const { comment } = req.body;
      const tenantId = req.user.tenantId;
      const userId = req.user._id;

      const item = await ManualReviewQueue.findOne({ _id: id, tenantId });

      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Review item not found'
        });
      }

      await item.addComment(userId, comment);

      res.json({
        success: true,
        message: 'Comment added successfully',
        data: item
      });
    } catch (error) {
      console.error('Add comment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add comment',
        error: error.message
      });
    }
  }
}

module.exports = new ReviewQueueController();
