const Lead = require('../models/Lead');
const User = require('../models/User');
const { NotFoundError, ValidationError, ForbiddenError } = require('../lib/errors');
const logger = require('../lib/logger');
const { USER_ROLES } = require('../config/constants');

/**
 * Get all leads with filtering and pagination
 * GET /api/v1/leads
 */
const getAllLeads = async (req, res) => {
  const { page = 1, limit = 20, status, priority, assignedTo, source, search, overdue } = req.query;
  const userId = req.userId;
  const userRole = req.user.role;
  const tenantId = req.user.tenant;

  // Build query
  const query = { tenant: tenantId };

  // Agents can only see their own leads (unless they're admin)
  if (userRole === USER_ROLES.AGENT) {
    query.assignedTo = userId;
  }

  // Filters
  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (assignedTo) query.assignedTo = assignedTo;
  if (source) query.source = source;

  // Overdue leads
  if (overdue === 'true') {
    query.followUpDate = { $lt: new Date() };
    query.status = { $nin: ['won', 'lost', 'closed'] };
  }

  // Text search
  if (search) {
    query.$text = { $search: search };
  }

  const skip = (page - 1) * limit;

  const [leads, total] = await Promise.all([
    Lead.find(query)
      .populate('assignedTo', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Lead.countDocuments(query),
  ]);

  logger.info('Leads fetched', {
    userId,
    count: leads.length,
    total,
    filters: { status, priority, assignedTo, source },
    requestId: req.id,
  });

  res.json({
    success: true,
    data: leads,
    meta: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: parseInt(limit),
    },
  });
};

/**
 * Get single lead by ID
 * GET /api/v1/leads/:id
 */
const getLead = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;
  const userRole = req.user.role;
  const tenantId = req.user.tenant;

  const lead = await Lead.findOne({ _id: id, tenant: tenantId })
    .populate('assignedTo', 'firstName lastName email')
    .populate('notes.createdBy', 'firstName lastName');

  if (!lead) {
    throw new NotFoundError('Lead not found', 'LEAD_NOT_FOUND');
  }

  // Agents can only view their own leads
  const assignedToId = lead.assignedTo?._id || lead.assignedTo;
  if (userRole === USER_ROLES.AGENT && assignedToId?.toString() !== userId.toString()) {
    throw new ForbiddenError('You can only view leads assigned to you', 'ACCESS_DENIED');
  }

  logger.info('Lead fetched', {
    leadId: id,
    userId,
    requestId: req.id,
  });

  res.json({
    success: true,
    data: lead,
  });
};

/**
 * Create new lead
 * POST /api/v1/leads
 */
const createLead = async (req, res) => {
  const userId = req.userId;
  const tenantId = req.user.tenant;
  const leadData = req.body;

  // Validate assigned user if provided
  if (leadData.assignedTo) {
    const assignedUser = await User.findOne({
      _id: leadData.assignedTo,
      tenant: tenantId,
      role: { $in: [USER_ROLES.AGENT, USER_ROLES.TENANT_ADMIN] },
    });

    if (!assignedUser) {
      throw new ValidationError('Invalid assigned user', 'INVALID_ASSIGNED_USER');
    }
  }

  const lead = await Lead.create({
    ...leadData,
    tenant: tenantId,
  });

  logger.info('Lead created', {
    leadId: lead._id,
    userId,
    customer: lead.customer.email,
    requestId: req.id,
  });

  res.status(201).json({
    success: true,
    message: 'Lead created successfully',
    data: lead,
  });
};

/**
 * Update lead
 * PUT /api/v1/leads/:id
 */
const updateLead = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;
  const userRole = req.user.role;
  const tenantId = req.user.tenant;
  const updates = req.body;

  const lead = await Lead.findOne({ _id: id, tenant: tenantId });

  if (!lead) {
    throw new NotFoundError('Lead not found', 'LEAD_NOT_FOUND');
  }

  // Agents can only update their own leads
  if (userRole === USER_ROLES.AGENT && lead.assignedTo?.toString() !== userId.toString()) {
    throw new ForbiddenError('You can only update leads assigned to you', 'ACCESS_DENIED');
  }

  // Validate assigned user if being updated
  if (updates.assignedTo) {
    const assignedUser = await User.findOne({
      _id: updates.assignedTo,
      tenant: tenantId,
      role: { $in: [USER_ROLES.AGENT, USER_ROLES.TENANT_ADMIN] },
    });

    if (!assignedUser) {
      throw new ValidationError('Invalid assigned user', 'INVALID_ASSIGNED_USER');
    }
  }

  // Update fields
  Object.keys(updates).forEach((key) => {
    if (key === 'customer' || key === 'requirements' || key === 'estimatedValue') {
      // Merge nested objects
      lead[key] = { ...lead[key], ...updates[key] };
      lead.markModified(key);
    } else {
      lead[key] = updates[key];
    }
  });

  await lead.save();

  logger.info('Lead updated', {
    leadId: id,
    userId,
    updatedFields: Object.keys(updates),
    requestId: req.id,
  });

  res.json({
    success: true,
    message: 'Lead updated successfully',
    data: lead,
  });
};

/**
 * Delete lead
 * DELETE /api/v1/leads/:id
 */
const deleteLead = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;
  const tenantId = req.user.tenant;

  const lead = await Lead.findOneAndDelete({ _id: id, tenant: tenantId });

  if (!lead) {
    throw new NotFoundError('Lead not found', 'LEAD_NOT_FOUND');
  }

  logger.info('Lead deleted', {
    leadId: id,
    userId,
    requestId: req.id,
  });

  res.json({
    success: true,
    message: 'Lead deleted successfully',
    data: null,
  });
};

/**
 * Assign lead to user
 * PUT /api/v1/leads/:id/assign
 */
const assignLead = async (req, res) => {
  const { id } = req.params;
  const { assignedTo } = req.body;
  const userId = req.userId;
  const tenantId = req.user.tenant;

  const lead = await Lead.findOne({ _id: id, tenant: tenantId });

  if (!lead) {
    throw new NotFoundError('Lead not found', 'LEAD_NOT_FOUND');
  }

  // Validate assigned user
  const assignedUser = await User.findOne({
    _id: assignedTo,
    tenant: tenantId,
    role: { $in: [USER_ROLES.AGENT, USER_ROLES.TENANT_ADMIN] },
  });

  if (!assignedUser) {
    throw new ValidationError('Invalid assigned user', 'INVALID_ASSIGNED_USER');
  }

  lead.assignedTo = assignedTo;
  await lead.save();

  logger.info('Lead assigned', {
    leadId: id,
    assignedTo,
    assignedBy: userId,
    requestId: req.id,
  });

  res.json({
    success: true,
    message: 'Lead assigned successfully',
    data: lead,
  });
};

/**
 * Add note to lead
 * POST /api/v1/leads/:id/notes
 */
const addNote = async (req, res) => {
  const { id } = req.params;
  const { note } = req.body;
  const userId = req.userId;
  const userRole = req.user.role;
  const tenantId = req.user.tenant;

  const lead = await Lead.findOne({ _id: id, tenant: tenantId });

  if (!lead) {
    throw new NotFoundError('Lead not found', 'LEAD_NOT_FOUND');
  }

  // Agents can only add notes to their own leads
  if (userRole === USER_ROLES.AGENT && lead.assignedTo?.toString() !== userId.toString()) {
    throw new ForbiddenError('You can only add notes to leads assigned to you', 'ACCESS_DENIED');
  }

  await lead.addNote(note, userId);

  logger.info('Note added to lead', {
    leadId: id,
    userId,
    requestId: req.id,
  });

  res.json({
    success: true,
    message: 'Note added successfully',
    data: lead,
  });
};

/**
 * Convert lead to booking
 * POST /api/v1/leads/:id/convert
 */
const convertLead = async (req, res) => {
  const { id } = req.params;
  const { bookingId } = req.body;
  const userId = req.userId;
  const tenantId = req.user.tenant;

  const lead = await Lead.findOne({ _id: id, tenant: tenantId });

  if (!lead) {
    throw new NotFoundError('Lead not found', 'LEAD_NOT_FOUND');
  }

  if (lead.convertedToBooking) {
    throw new ValidationError('Lead already converted to booking', 'ALREADY_CONVERTED');
  }

  lead.convertedToBooking = true;
  lead.bookingId = bookingId;
  lead.conversionDate = new Date();
  lead.status = 'won';

  await lead.save();

  logger.info('Lead converted to booking', {
    leadId: id,
    bookingId,
    userId,
    requestId: req.id,
  });

  res.json({
    success: true,
    message: 'Lead converted successfully',
    data: lead,
  });
};

/**
 * Get lead statistics
 * GET /api/v1/leads/stats
 */
const getLeadStats = async (req, res) => {
  const userId = req.userId;
  const userRole = req.user.role;
  const tenantId = req.user.tenant;

  const matchQuery = { tenant: tenantId };

  // Agents see only their stats
  if (userRole === USER_ROLES.AGENT) {
    matchQuery.assignedTo = userId;
  }

  const [statusStats, priorityStats, sourceStats, conversionRate, overdueCount] = await Promise.all([
    Lead.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Lead.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]),
    Lead.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$source', count: { $sum: 1 } } },
    ]),
    Lead.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          converted: { $sum: { $cond: ['$convertedToBooking', 1, 0] } },
        },
      },
    ]),
    Lead.countDocuments({
      ...matchQuery,
      followUpDate: { $lt: new Date() },
      status: { $nin: ['won', 'lost', 'closed'] },
    }),
  ]);

  const stats = {
    byStatus: statusStats.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
    byPriority: priorityStats.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
    bySource: sourceStats.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
    conversionRate: conversionRate[0]
      ? ((conversionRate[0].converted / conversionRate[0].total) * 100).toFixed(2)
      : 0,
    totalLeads: conversionRate[0]?.total || 0,
    convertedLeads: conversionRate[0]?.converted || 0,
    overdueLeads: overdueCount,
  };

  logger.info('Lead stats fetched', {
    userId,
    requestId: req.id,
  });

  res.json({
    success: true,
    data: stats,
  });
};

module.exports = {
  getAllLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  assignLead,
  addNote,
  convertLead,
  getLeadStats,
};
