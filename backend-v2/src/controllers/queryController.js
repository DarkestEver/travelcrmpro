const Query = require('../models/Query');
const AgentAvailability = require('../models/AgentAvailability');
const Lead = require('../models/Lead');
const { ValidationError, NotFoundError, ForbiddenError } = require('../lib/errors');

/**
 * Query Controller
 * Manages customer queries with SLA tracking and auto-assignment
 */

/**
 * Create a new query
 * POST /queries/create
 */
exports.createQuery = async (req, res, next) => {
  try {
    const queryNumber = await Query.generateQueryNumber(req.user.tenant);

    const queryData = {
      ...req.body,
      tenant: req.user.tenant,
      queryNumber,
      createdBy: req.user._id,
    };

    const newQuery = new Query(queryData);
    
    // Calculate SLA deadline
    newQuery.calculateSLA();
    
    await newQuery.save();

    res.status(201).json({
      success: true,
      data: newQuery,
      message: 'Query created successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all queries with filtering and pagination
 * GET /queries
 */
exports.getAllQueries = async (req, res, next) => {
  try {
    const {
      status,
      priority,
      assignedTo,
      source,
      dateFrom,
      dateTo,
      overdue,
      unassigned,
      search,
      page = 1,
      limit = 20,
      sort = '-createdAt',
    } = req.query;

    const query = { tenant: req.user.tenant };

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo;
    if (source) query.source = source;

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    if (overdue === 'true') {
      query['sla.deadline'] = { $lt: new Date() };
      query['sla.resolved'] = false;
    }

    if (unassigned === 'true') {
      query.assignedTo = { $exists: false };
    }

    if (search) {
      query.$or = [
        { queryNumber: new RegExp(search, 'i') },
        { 'customer.name': new RegExp(search, 'i') },
        { 'customer.email': new RegExp(search, 'i') },
        { 'customer.phone': new RegExp(search, 'i') },
        { 'tripDetails.destination': new RegExp(search, 'i') },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [queries, totalCount] = await Promise.all([
      Query.find(query)
        .populate('assignedTo', 'firstName lastName email')
        .populate('createdBy', 'firstName lastName')
        .populate('lead', 'leadNumber status')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Query.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        queries,
        pagination: {
          total: totalCount,
          page: parseInt(page),
          pages: Math.ceil(totalCount / parseInt(limit)),
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get query by ID
 * GET /queries/:id
 */
exports.getQueryById = async (req, res, next) => {
  try {
    const query = await Query.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
    })
      .populate('assignedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .populate('lead')
      .populate('quotes')
      .populate('notes.createdBy', 'firstName lastName');

    if (!query) {
      throw new NotFoundError('Query not found');
    }

    // Track view
    if (!query.viewedBy.some(v => v.user.toString() === req.user._id.toString())) {
      query.viewedBy.push({
        user: req.user._id,
        viewedAt: new Date(),
      });
      await query.save();
    }

    res.json({
      success: true,
      data: query,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update query
 * PATCH /queries/:id
 */
exports.updateQuery = async (req, res, next) => {
  try {
    const query = await Query.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
    });

    if (!query) {
      throw new NotFoundError('Query not found');
    }

    const allowedFields = [
      'customer',
      'tripDetails',
      'budget',
      'tripType',
      'preferences',
      'tags',
      'customFields',
    ];

    // Check if priority is changing before updating
    const priorityChanged = req.body.priority && req.body.priority !== query.priority;

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        query[field] = req.body[field];
      }
    });

    // Update priority separately if provided
    if (req.body.priority !== undefined) {
      query.priority = req.body.priority;
    }

    // If priority changed, recalculate SLA
    if (priorityChanged) {
      query.calculateSLA();
    }

    query.updatedBy = req.user._id;
    await query.save();

    res.json({
      success: true,
      data: query,
      message: 'Query updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete query
 * DELETE /queries/:id
 */
exports.deleteQuery = async (req, res, next) => {
  try {
    const query = await Query.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
    });

    if (!query) {
      throw new NotFoundError('Query not found');
    }

    // Don't allow deletion if converted to lead
    if (query.lead) {
      throw new ForbiddenError('Cannot delete query that has been converted to lead');
    }

    await query.deleteOne();

    res.json({
      success: true,
      message: 'Query deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Assign query manually
 * POST /queries/:id/assign
 */
exports.assignQuery = async (req, res, next) => {
  try {
    const { agentId } = req.body;

    const query = await Query.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
    });

    if (!query) {
      throw new NotFoundError('Query not found');
    }

    query.assignTo(agentId, 'manual');
    query.updatedBy = req.user._id;
    await query.save();

    // Update agent workload
    const agentAvailability = await AgentAvailability.findOne({
      tenant: req.user.tenant,
      agent: agentId,
    });

    if (agentAvailability) {
      await agentAvailability.updateWorkload();
    }

    res.json({
      success: true,
      data: query,
      message: 'Query assigned successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Auto-assign query
 * POST /queries/:id/auto-assign
 */
exports.autoAssignQuery = async (req, res, next) => {
  try {
    const { method = 'workload' } = req.body;

    const query = await Query.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
    });

    if (!query) {
      throw new NotFoundError('Query not found');
    }

    // Find best available agent
    const bestAgent = await AgentAvailability.findBestAgent(
      req.user.tenant,
      method
    );

    if (!bestAgent) {
      throw new ValidationError('No available agents found for assignment');
    }

    query.assignTo(
      bestAgent.agent._id,
      method === 'round_robin' ? 'auto_round_robin' : 'auto_workload'
    );
    query.updatedBy = req.user._id;
    await query.save();

    // Update agent workload
    await bestAgent.updateWorkload();

    res.json({
      success: true,
      data: query,
      message: `Query auto-assigned to ${bestAgent.agent.firstName} ${bestAgent.agent.lastName}`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk assign queries
 * POST /queries/bulk-assign
 */
exports.bulkAssignQueries = async (req, res, next) => {
  try {
    const { queryIds, agentId } = req.body;

    if (!Array.isArray(queryIds) || queryIds.length === 0) {
      throw new ValidationError('queryIds must be a non-empty array');
    }

    const queries = await Query.find({
      _id: { $in: queryIds },
      tenant: req.user.tenant,
    });

    if (queries.length !== queryIds.length) {
      throw new NotFoundError('One or more queries not found');
    }

    const updates = queries.map(query => {
      query.assignTo(agentId, 'manual');
      query.updatedBy = req.user._id;
      return query.save();
    });

    await Promise.all(updates);

    // Update agent workload
    const agentAvailability = await AgentAvailability.findOne({
      tenant: req.user.tenant,
      agent: agentId,
    });

    if (agentAvailability) {
      await agentAvailability.updateWorkload();
    }

    res.json({
      success: true,
      data: { assigned: queries.length },
      message: `${queries.length} queries assigned successfully`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Unassign query
 * POST /queries/:id/unassign
 */
exports.unassignQuery = async (req, res, next) => {
  try {
    const query = await Query.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
    });

    if (!query) {
      throw new NotFoundError('Query not found');
    }

    const previousAgent = query.assignedTo;

    if (query.assignedTo) {
      query.previousAssignments.push({
        agent: query.assignedTo,
        assignedAt: query.assignedAt,
        unassignedAt: new Date(),
        reason: req.body.reason || 'Unassigned',
      });
    }

    query.assignedTo = undefined;
    query.assignedAt = undefined;
    query.assignmentMethod = undefined;
    query.status = 'pending';
    query.updatedBy = req.user._id;
    
    await query.save();

    // Update previous agent workload
    if (previousAgent) {
      const agentAvailability = await AgentAvailability.findOne({
        tenant: req.user.tenant,
        agent: previousAgent,
      });

      if (agentAvailability) {
        await agentAvailability.updateWorkload();
      }
    }

    res.json({
      success: true,
      data: query,
      message: 'Query unassigned successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update query status
 * PATCH /queries/:id/status
 */
exports.updateQueryStatus = async (req, res, next) => {
  try {
    const { status, notes } = req.body;

    const query = await Query.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
    });

    if (!query) {
      throw new NotFoundError('Query not found');
    }

    query.status = status;
    query.updatedBy = req.user._id;

    if (notes) {
      query.notes.push({
        text: notes,
        createdBy: req.user._id,
        isInternal: true,
      });
    }

    // Auto-resolve if status is won/lost/cancelled
    if (['won', 'lost', 'cancelled'].includes(status)) {
      query.markAsResolved();
    }

    await query.save();

    res.json({
      success: true,
      data: query,
      message: 'Query status updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark query as responded
 * POST /queries/:id/mark-responded
 */
exports.markAsResponded = async (req, res, next) => {
  try {
    const query = await Query.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
    });

    if (!query) {
      throw new NotFoundError('Query not found');
    }

    query.markAsResponded();
    query.updatedBy = req.user._id;
    await query.save();

    res.json({
      success: true,
      data: query,
      message: 'Query marked as responded',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark query as resolved
 * POST /queries/:id/mark-resolved
 */
exports.markAsResolved = async (req, res, next) => {
  try {
    const query = await Query.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
    });

    if (!query) {
      throw new NotFoundError('Query not found');
    }

    query.markAsResolved();
    query.updatedBy = req.user._id;
    await query.save();

    res.json({
      success: true,
      data: query,
      message: 'Query marked as resolved',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get overdue queries
 * GET /queries/overdue
 */
exports.getOverdueQueries = async (req, res, next) => {
  try {
    const queries = await Query.find({
      tenant: req.user.tenant,
      'sla.deadline': { $lt: new Date() },
      'sla.resolved': false,
    })
      .populate('assignedTo', 'firstName lastName email')
      .sort('sla.deadline');

    res.json({
      success: true,
      data: {
        queries,
        count: queries.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Escalate query
 * POST /queries/:id/escalate
 */
exports.escalateQuery = async (req, res, next) => {
  try {
    const { level, escalateTo } = req.body;

    const query = await Query.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
    });

    if (!query) {
      throw new NotFoundError('Query not found');
    }

    query.escalate(level, escalateTo);
    query.updatedBy = req.user._id;
    await query.save();

    res.json({
      success: true,
      data: query,
      message: `Query escalated to level ${level}`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get escalated queries
 * GET /queries/escalated
 */
exports.getEscalatedQueries = async (req, res, next) => {
  try {
    const queries = await Query.find({
      tenant: req.user.tenant,
      'sla.escalated': true,
    })
      .populate('assignedTo', 'firstName lastName email')
      .populate('sla.escalatedTo.user', 'firstName lastName email')
      .sort('-sla.escalatedAt');

    res.json({
      success: true,
      data: {
        queries,
        count: queries.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Find duplicate queries
 * POST /queries/find-duplicates
 */
exports.findDuplicates = async (req, res, next) => {
  try {
    const { email, phone } = req.body;

    const query = { tenant: req.user.tenant };
    
    if (email && phone) {
      query.$or = [
        { 'customer.email': email },
        { 'customer.phone': phone },
      ];
    } else if (email) {
      query['customer.email'] = email;
    } else if (phone) {
      query['customer.phone'] = phone;
    } else {
      throw new ValidationError('Email or phone is required');
    }

    const duplicates = await Query.find(query)
      .populate('assignedTo', 'firstName lastName')
      .sort('-createdAt')
      .limit(10);

    res.json({
      success: true,
      data: {
        duplicates,
        count: duplicates.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark as duplicate
 * POST /queries/:id/mark-duplicate
 */
exports.markAsDuplicate = async (req, res, next) => {
  try {
    const { originalQueryId } = req.body;

    const [query, originalQuery] = await Promise.all([
      Query.findOne({ _id: req.params.id, tenant: req.user.tenant }),
      Query.findOne({ _id: originalQueryId, tenant: req.user.tenant }),
    ]);

    if (!query) {
      throw new NotFoundError('Query not found');
    }

    if (!originalQuery) {
      throw new NotFoundError('Original query not found');
    }

    query.duplicateOf = originalQueryId;
    query.status = 'cancelled';
    query.updatedBy = req.user._id;
    
    await query.save();

    res.json({
      success: true,
      data: query,
      message: 'Query marked as duplicate',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get query statistics
 * GET /queries/stats
 */
exports.getQueryStatistics = async (req, res, next) => {
  try {
    const { dateFrom, dateTo, groupBy = 'status' } = req.query;

    const matchQuery = { tenant: req.user.tenant };

    if (dateFrom || dateTo) {
      matchQuery.createdAt = {};
      if (dateFrom) matchQuery.createdAt.$gte = new Date(dateFrom);
      if (dateTo) matchQuery.createdAt.$lte = new Date(dateTo);
    }

    const stats = await Query.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: groupBy === 'source' ? '$source' : groupBy === 'priority' ? '$priority' : '$status',
          count: { $sum: 1 },
          avgResponseTime: { $avg: '$sla.responseTime' },
          avgResolutionTime: { $avg: '$sla.resolutionTime' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const totalCount = await Query.countDocuments(matchQuery);
    const overdueCount = await Query.countDocuments({
      ...matchQuery,
      'sla.deadline': { $lt: new Date() },
      'sla.resolved': false,
    });
    const escalatedCount = await Query.countDocuments({
      ...matchQuery,
      'sla.escalated': true,
    });

    res.json({
      success: true,
      data: {
        stats,
        summary: {
          total: totalCount,
          overdue: overdueCount,
          escalated: escalatedCount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get SLA compliance report
 * GET /queries/sla-report
 */
exports.getSLAReport = async (req, res, next) => {
  try {
    const { dateFrom, dateTo } = req.query;

    const matchQuery = { tenant: req.user.tenant };

    if (dateFrom || dateTo) {
      matchQuery.createdAt = {};
      if (dateFrom) matchQuery.createdAt.$gte = new Date(dateFrom);
      if (dateTo) matchQuery.createdAt.$lte = new Date(dateTo);
    }

    const totalQueries = await Query.countDocuments(matchQuery);
    const respondedOnTime = await Query.countDocuments({
      ...matchQuery,
      'sla.responded': true,
      $expr: { $lt: ['$sla.respondedAt', '$sla.responseDeadline'] },
    });
    const resolvedOnTime = await Query.countDocuments({
      ...matchQuery,
      'sla.resolved': true,
      $expr: { $lt: ['$sla.resolvedAt', '$sla.deadline'] },
    });
    const breached = await Query.countDocuments({
      ...matchQuery,
      'sla.breached': true,
    });

    const avgResponseTime = await Query.aggregate([
      { $match: { ...matchQuery, 'sla.responded': true } },
      { $group: { _id: null, avg: { $avg: '$sla.responseTime' } } },
    ]);

    const avgResolutionTime = await Query.aggregate([
      { $match: { ...matchQuery, 'sla.resolved': true } },
      { $group: { _id: null, avg: { $avg: '$sla.resolutionTime' } } },
    ]);

    res.json({
      success: true,
      data: {
        totalQueries,
        respondedOnTime,
        resolvedOnTime,
        breached,
        responseComplianceRate: totalQueries > 0 ? (respondedOnTime / totalQueries * 100).toFixed(2) : 0,
        resolutionComplianceRate: totalQueries > 0 ? (resolvedOnTime / totalQueries * 100).toFixed(2) : 0,
        breachRate: totalQueries > 0 ? (breached / totalQueries * 100).toFixed(2) : 0,
        avgResponseTimeMinutes: avgResponseTime[0]?.avg || 0,
        avgResolutionTimeMinutes: avgResolutionTime[0]?.avg || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get agent performance
 * GET /queries/agent-performance
 */
exports.getAgentPerformance = async (req, res, next) => {
  try {
    const { dateFrom, dateTo, agentId } = req.query;

    const matchQuery = { tenant: req.user.tenant };

    if (agentId) {
      matchQuery.assignedTo = agentId;
    }

    if (dateFrom || dateTo) {
      matchQuery.createdAt = {};
      if (dateFrom) matchQuery.createdAt.$gte = new Date(dateFrom);
      if (dateTo) matchQuery.createdAt.$lte = new Date(dateTo);
    }

    const performance = await Query.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$assignedTo',
          totalQueries: { $sum: 1 },
          resolved: {
            $sum: { $cond: ['$sla.resolved', 1, 0] },
          },
          respondedOnTime: {
            $sum: {
              $cond: [
                {
                  $and: [
                    '$sla.responded',
                    { $lt: ['$sla.respondedAt', '$sla.responseDeadline'] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          resolvedOnTime: {
            $sum: {
              $cond: [
                {
                  $and: [
                    '$sla.resolved',
                    { $lt: ['$sla.resolvedAt', '$sla.deadline'] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          avgResponseTime: { $avg: '$sla.responseTime' },
          avgResolutionTime: { $avg: '$sla.resolutionTime' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'agent',
        },
      },
      { $unwind: { path: '$agent', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          agentId: '$_id',
          agentName: {
            $concat: ['$agent.firstName', ' ', '$agent.lastName'],
          },
          agentEmail: '$agent.email',
          totalQueries: 1,
          resolved: 1,
          respondedOnTime: 1,
          resolvedOnTime: 1,
          avgResponseTime: 1,
          avgResolutionTime: 1,
          resolutionRate: {
            $multiply: [
              { $divide: ['$resolved', '$totalQueries'] },
              100,
            ],
          },
        },
      },
      { $sort: { totalQueries: -1 } },
    ]);

    res.json({
      success: true,
      data: performance,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get source analysis
 * GET /queries/source-analysis
 */
exports.getSourceAnalysis = async (req, res, next) => {
  try {
    const { dateFrom, dateTo } = req.query;

    const matchQuery = { tenant: req.user.tenant };

    if (dateFrom || dateTo) {
      matchQuery.createdAt = {};
      if (dateFrom) matchQuery.createdAt.$gte = new Date(dateFrom);
      if (dateTo) matchQuery.createdAt.$lte = new Date(dateTo);
    }

    const sourceStats = await Query.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 },
          converted: {
            $sum: { $cond: [{ $ne: ['$lead', null] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          source: '$_id',
          count: 1,
          converted: 1,
          conversionRate: {
            $multiply: [
              { $divide: ['$converted', '$count'] },
              100,
            ],
          },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json({
      success: true,
      data: sourceStats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Set agent availability status
 * POST /agents/availability/status
 */
exports.setAgentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    let agentAvailability = await AgentAvailability.findOne({
      tenant: req.user.tenant,
      agent: req.user._id,
    });

    if (!agentAvailability) {
      agentAvailability = new AgentAvailability({
        tenant: req.user.tenant,
        agent: req.user._id,
      });
    }

    agentAvailability.status = status;
    agentAvailability.isOnline = status !== 'offline';
    agentAvailability.lastSeenAt = new Date();
    
    await agentAvailability.save();
    await agentAvailability.updateWorkload();

    res.json({
      success: true,
      data: agentAvailability,
      message: 'Agent status updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get online agents
 * GET /agents/online
 */
exports.getOnlineAgents = async (req, res, next) => {
  try {
    const agents = await AgentAvailability.find({
      tenant: req.user.tenant,
      isOnline: true,
    })
      .populate('agent', 'firstName lastName email role')
      .sort('currentWorkload.activeQueries');

    res.json({
      success: true,
      data: {
        agents,
        count: agents.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get agent workload
 * GET /agents/:id/workload
 */
exports.getAgentWorkload = async (req, res, next) => {
  try {
    const agentAvailability = await AgentAvailability.findOne({
      tenant: req.user.tenant,
      agent: req.params.id,
    });

    if (!agentAvailability) {
      throw new NotFoundError('Agent availability not found');
    }

    await agentAvailability.updateWorkload();

    res.json({
      success: true,
      data: agentAvailability,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Convert query to lead
 * POST /queries/:id/convert-to-lead
 */
exports.convertToLead = async (req, res, next) => {
  try {
    const query = await Query.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
    });

    if (!query) {
      throw new NotFoundError('Query not found');
    }

    if (query.lead) {
      throw new ValidationError('Query already converted to lead');
    }

    // Check if Lead model has generateLeadNumber static method
    const leadNumber = Lead.generateLeadNumber 
      ? await Lead.generateLeadNumber(req.user.tenant)
      : `LEAD-${Date.now()}`;

    // Create lead from query
    const lead = new Lead({
      tenant: req.user.tenant,
      leadNumber,
      customer: query.customer,
      source: query.source,
      sourceDetails: query.sourceDetails,
      destination: query.tripDetails.destination,
      travelDates: query.tripDetails.travelDates.preferred,
      travelers: query.tripDetails.travelers,
      budget: query.budget.amount,
      budgetCurrency: query.budget.currency,
      tripType: query.tripType,
      status: 'new',
      assignedTo: query.assignedTo,
      createdBy: req.user._id,
    });

    await lead.save();

    // Link query to lead
    query.lead = lead._id;
    query.status = 'won';
    query.markAsResolved();
    query.updatedBy = req.user._id;
    await query.save();

    res.status(201).json({
      success: true,
      data: {
        query,
        lead,
      },
      message: 'Query converted to lead successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add note to query
 * POST /queries/:id/notes
 */
exports.addNote = async (req, res, next) => {
  try {
    const { text, isInternal = false } = req.body;

    const query = await Query.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
    });

    if (!query) {
      throw new NotFoundError('Query not found');
    }

    query.notes.push({
      text,
      createdBy: req.user._id,
      isInternal,
    });

    await query.save();

    res.status(201).json({
      success: true,
      data: query,
      message: 'Note added successfully',
    });
  } catch (error) {
    next(error);
  }
};
