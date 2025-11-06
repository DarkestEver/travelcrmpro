const { Agent, User } = require('../models');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { successResponse, paginatedResponse } = require('../utils/response');
const { parsePagination, parseSort, buildSearchQuery } = require('../utils/pagination');
const { sendAgentApprovalEmail } = require('../utils/email');

// @desc    Get all agents (Admin/Operator only)
// @route   GET /api/v1/agents
// @access  Private (super_admin, operator)
const getAllAgents = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req);
  const sortBy = parseSort(req, '-createdAt');
  const { status, tier, search } = req.query;

  // Build query
  const query = {};
  if (status) query.status = status;
  if (tier) query.tier = tier;
  if (search) {
    Object.assign(query, buildSearchQuery(search, ['agencyName', 'email', 'contactPerson']));
  }

  // Execute query
  const [agents, total] = await Promise.all([
    Agent.find(query)
      .populate('userId', 'name email phone avatar')
      .sort(sortBy)
      .skip(skip)
      .limit(limit),
    Agent.countDocuments(query),
  ]);

  paginatedResponse(res, 200, agents, page, limit, total);
});

// @desc    Get single agent
// @route   GET /api/v1/agents/:id
// @access  Private
const getAgent = asyncHandler(async (req, res) => {
  const agent = await Agent.findById(req.params.id).populate('userId', 'name email phone avatar');

  if (!agent) {
    throw new AppError('Agent not found', 404);
  }

  // Agent users can only view their own profile
  if (req.user.role === 'agent' && req.agent._id.toString() !== agent._id.toString()) {
    throw new AppError('You do not have permission to view this agent', 403);
  }

  successResponse(res, 200, 'Agent fetched successfully', { agent });
});

// @desc    Create agent profile
// @route   POST /api/v1/agents
// @access  Private (super_admin, operator) or self-registration
const createAgent = asyncHandler(async (req, res) => {
  const {
    userId,
    agencyName,
    contactPerson,
    email,
    phone,
    address,
    creditLimit,
    commissionRules,
    tier,
    documents,
  } = req.body;

  // Check if agent already exists for this user
  const existingAgent = await Agent.findOne({ userId });
  if (existingAgent) {
    throw new AppError('Agent profile already exists for this user', 400);
  }

  // Verify user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Only agents can register themselves; admins can create any agent
  if (req.user.role === 'agent' && req.user._id.toString() !== userId) {
    throw new AppError('You can only create your own agent profile', 403);
  }

  // Create agent
  const agent = await Agent.create({
    userId,
    agencyName,
    contactPerson,
    email,
    phone,
    address,
    creditLimit: req.user.role === 'agent' ? 0 : creditLimit, // Agents start with 0 credit
    commissionRules,
    tier: req.user.role === 'agent' ? 'standard' : tier,
    status: req.user.role === 'agent' ? 'pending' : 'active', // Self-registrations need approval
    documents,
  });

  successResponse(res, 201, 'Agent profile created successfully', { agent });
});

// @desc    Update agent profile
// @route   PUT /api/v1/agents/:id
// @access  Private
const updateAgent = asyncHandler(async (req, res) => {
  let agent = await Agent.findById(req.params.id);

  if (!agent) {
    throw new AppError('Agent not found', 404);
  }

  // Agent users can only update their own profile
  if (req.user.role === 'agent' && req.agent._id.toString() !== agent._id.toString()) {
    throw new AppError('You do not have permission to update this agent', 403);
  }

  // Restrict fields agents can update
  const allowedFields = req.user.role === 'agent'
    ? ['contactPerson', 'phone', 'address', 'documents']
    : Object.keys(req.body);

  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  agent = await Agent.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  }).populate('userId', 'name email phone avatar');

  successResponse(res, 200, 'Agent updated successfully', { agent });
});

// @desc    Approve agent
// @route   PATCH /api/v1/agents/:id/approve
// @access  Private (super_admin, operator)
const approveAgent = asyncHandler(async (req, res) => {
  const { creditLimit, tier } = req.body;

  const agent = await Agent.findById(req.params.id).populate('userId');

  if (!agent) {
    throw new AppError('Agent not found', 404);
  }

  if (agent.status !== 'pending') {
    throw new AppError('Agent is not in pending status', 400);
  }

  // Update agent
  agent.status = 'active';
  agent.creditLimit = creditLimit || 5000;
  agent.availableCredit = creditLimit || 5000;
  agent.tier = tier || 'standard';
  await agent.save();

  // Send approval email
  try {
    await sendAgentApprovalEmail(agent, agent.userId);
  } catch (error) {
    console.error('Failed to send approval email:', error);
  }

  successResponse(res, 200, 'Agent approved successfully', { agent });
});

// @desc    Suspend agent
// @route   PATCH /api/v1/agents/:id/suspend
// @access  Private (super_admin, operator)
const suspendAgent = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const agent = await Agent.findByIdAndUpdate(
    req.params.id,
    { status: 'suspended', 'statusHistory': { $push: { status: 'suspended', reason, date: Date.now() } } },
    { new: true }
  ).populate('userId', 'name email phone avatar');

  if (!agent) {
    throw new AppError('Agent not found', 404);
  }

  successResponse(res, 200, 'Agent suspended successfully', { agent });
});

// @desc    Reactivate agent
// @route   PATCH /api/v1/agents/:id/reactivate
// @access  Private (super_admin, operator)
const reactivateAgent = asyncHandler(async (req, res) => {
  const agent = await Agent.findByIdAndUpdate(
    req.params.id,
    { status: 'active' },
    { new: true }
  ).populate('userId', 'name email phone avatar');

  if (!agent) {
    throw new AppError('Agent not found', 404);
  }

  successResponse(res, 200, 'Agent reactivated successfully', { agent });
});

// @desc    Delete agent
// @route   DELETE /api/v1/agents/:id
// @access  Private (super_admin only)
const deleteAgent = asyncHandler(async (req, res) => {
  const agent = await Agent.findById(req.params.id);

  if (!agent) {
    throw new AppError('Agent not found', 404);
  }

  // Soft delete by setting status to inactive
  agent.status = 'inactive';
  await agent.save();

  successResponse(res, 200, 'Agent deleted successfully');
});

// @desc    Get agent statistics
// @route   GET /api/v1/agents/stats (general stats)
// @route   GET /api/v1/agents/:id/stats (individual agent stats)
// @access  Private
const getAgentStats = asyncHandler(async (req, res) => {
  // If no ID provided, return general statistics
  if (!req.params.id || req.params.id === 'stats') {
    const [totalAgents, activeAgents, totalRevenue] = await Promise.all([
      Agent.countDocuments(),
      Agent.countDocuments({ status: 'active' }),
      Agent.aggregate([
        { $group: { _id: null, total: { $sum: '$totalRevenue' } } }
      ])
    ]);
    
    const stats = {
      totalAgents,
      activeAgents,
      totalRevenue: totalRevenue[0]?.total || 0,
      averageRevenuePerAgent: totalAgents > 0 ? (totalRevenue[0]?.total || 0) / totalAgents : 0
    };
    
    return successResponse(res, 200, 'Agent statistics fetched successfully', stats);
  }
  
  // Individual agent stats
  const agent = await Agent.findById(req.params.id);

  if (!agent) {
    throw new AppError('Agent not found', 404);
  }

  // Agent users can only view their own stats
  if (req.user.role === 'agent' && req.agent._id.toString() !== agent._id.toString()) {
    throw new AppError('You do not have permission to view these statistics', 403);
  }

  const stats = {
    totalBookings: agent.totalBookings,
    totalRevenue: agent.totalRevenue,
    availableCredit: agent.availableCredit,
    creditLimit: agent.creditLimit,
    creditUtilization: ((agent.creditLimit - agent.availableCredit) / agent.creditLimit * 100).toFixed(2),
    tier: agent.tier,
    rating: agent.rating,
    joinDate: agent.createdAt,
  };

  successResponse(res, 200, 'Agent statistics fetched successfully', { stats });
});

module.exports = {
  getAllAgents,
  getAgent,
  createAgent,
  updateAgent,
  approveAgent,
  suspendAgent,
  reactivateAgent,
  deleteAgent,
  getAgentStats,
};
