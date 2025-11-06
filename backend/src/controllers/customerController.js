const { Customer } = require('../models');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { successResponse, paginatedResponse } = require('../utils/response');
const { parsePagination, parseSort, buildSearchQuery } = require('../utils/pagination');

// Helper function to ensure agent profile exists
const ensureAgentProfile = (req, res) => {
  if (req.user.role === 'agent' && !req.agent) {
    res.status(404).json({
      success: false,
      message: 'Agent profile not found. Please contact administrator.',
    });
    return false;
  }
  return true;
};

// @desc    Get all customers (agent sees only their customers)
// @route   GET /api/v1/customers
// @access  Private
const getAllCustomers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req);
  const sortBy = parseSort(req, '-createdAt');
  const { search, tags } = req.query;

  // Build query
  const query = {};

  // Agent users can only see their own customers
  if (req.user.role === 'agent') {
    if (!ensureAgentProfile(req, res)) return;
    query.agentId = req.agent._id;
  } else if (req.query.agentId) {
    query.agentId = req.query.agentId;
  }

  // Search filter
  if (search) {
    Object.assign(query, buildSearchQuery(search, ['name', 'email', 'phone']));
  }

  // Tags filter
  if (tags) {
    query.tags = { $in: tags.split(',') };
  }

  // Execute query
  const [customers, total] = await Promise.all([
    Customer.find(query)
      .populate('agentId', 'agencyName contactPerson')
      .sort(sortBy)
      .skip(skip)
      .limit(limit),
    Customer.countDocuments(query),
  ]);

  paginatedResponse(res, 200, customers, page, limit, total);
});

// @desc    Get single customer
// @route   GET /api/v1/customers/:id
// @access  Private
const getCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id).populate('agentId', 'agencyName contactPerson email');

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  // Agent users can only view their own customers
  if (req.user.role === 'agent') {
    if (!ensureAgentProfile(req, res)) return;
    if (customer.agentId._id.toString() !== req.agent._id.toString()) {
      throw new AppError('You do not have permission to view this customer', 403);
    }
  }

  successResponse(res, 200, 'Customer fetched successfully', { customer });
});

// @desc    Create customer
// @route   POST /api/v1/customers
// @access  Private (agent, operator, super_admin)
const createCustomer = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    phone,
    passportInfo,
    preferences,
    emergencyContact,
    documents,
    tags,
    notes,
  } = req.body;

  let { agentId } = req.body;

  // Agent users automatically use their own agentId
  if (req.user.role === 'agent') {
    if (!ensureAgentProfile(req, res)) return;
    agentId = req.agent._id;
  }

  // Check if customer already exists for this agent
  const existingCustomer = await Customer.findOne({ agentId, email });
  if (existingCustomer) {
    throw new AppError('Customer with this email already exists for this agent', 400);
  }

  // Create customer
  const customer = await Customer.create({
    agentId,
    name,
    email,
    phone,
    passportInfo,
    preferences,
    emergencyContact,
    documents,
    tags,
    notes,
  });

  await customer.populate('agentId', 'agencyName contactPerson');

  successResponse(res, 201, 'Customer created successfully', { customer });
});

// @desc    Update customer
// @route   PUT /api/v1/customers/:id
// @access  Private
const updateCustomer = asyncHandler(async (req, res) => {
  let customer = await Customer.findById(req.params.id);

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  // Agent users can only update their own customers
  if (req.user.role === 'agent') {
    if (!ensureAgentProfile(req, res)) return;
    if (customer.agentId && customer.agentId.toString() !== req.agent._id.toString()) {
      throw new AppError('You do not have permission to update this customer', 403);
    }
  }

  // Don't allow changing agentId through this route
  delete req.body.agentId;

  customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate('agentId', 'agencyName contactPerson');

  successResponse(res, 200, 'Customer updated successfully', { customer });
});

// @desc    Delete customer
// @route   DELETE /api/v1/customers/:id
// @access  Private
const deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  // Agent users can only delete their own customers
  if (req.user.role === 'agent') {
    if (!ensureAgentProfile(req, res)) return;
    if (customer.agentId && customer.agentId.toString() !== req.agent._id.toString()) {
      throw new AppError('You do not have permission to delete this customer', 403);
    }
  }

  await customer.deleteOne();

  successResponse(res, 200, 'Customer deleted successfully');
});

// @desc    Add note to customer
// @route   POST /api/v1/customers/:id/notes
// @access  Private
const addCustomerNote = asyncHandler(async (req, res) => {
  const { note } = req.body;

  const customer = await Customer.findById(req.params.id);

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  // Agent users can only add notes to their own customers
  if (req.user.role === 'agent') {
    if (!ensureAgentProfile(req, res)) return;
    if (customer.agentId && customer.agentId.toString() !== req.agent._id.toString()) {
      throw new AppError('You do not have permission to add notes to this customer', 403);
    }
  }

  // Initialize notes array if it doesn't exist
  if (!customer.notes) {
    customer.notes = [];
  }

  customer.notes.push({
    note,
    createdBy: req.user._id,
    createdAt: Date.now(),
  });

  await customer.save();

  successResponse(res, 200, 'Note added successfully', { customer });
});

// @desc    Get customer notes
// @route   GET /api/v1/customers/:id/notes
// @access  Private
const getCustomerNotes = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id)
    .populate('notes.createdBy', 'name email')
    .select('notes');

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  // Agent users can only view notes from their own customers
  if (req.user.role === 'agent') {
    if (!ensureAgentProfile(req, res)) return;
    const fullCustomer = await Customer.findById(req.params.id).select('agentId');
    if (fullCustomer.agentId && fullCustomer.agentId.toString() !== req.agent._id.toString()) {
      throw new AppError('You do not have permission to view notes for this customer', 403);
    }
  }

  successResponse(res, 200, 'Notes retrieved successfully', { notes: customer.notes || [] });
});

// @desc    Get customer statistics
// @route   GET /api/v1/customers/stats (general stats)
// @route   GET /api/v1/customers/:id/stats (individual customer stats)
// @access  Private
const getCustomerStats = asyncHandler(async (req, res) => {
  // If no ID provided, return general statistics
  if (!req.params.id || req.params.id === 'stats') {
    const query = {};
    
    // Agent users can only view their own customers' stats
    if (req.user.role === 'agent') {
      if (!ensureAgentProfile(req, res)) return;
      query.agentId = req.agent._id;
    }
    
    const [totalCustomers, activeCustomers, totalRevenue] = await Promise.all([
      Customer.countDocuments(query),
      Customer.countDocuments({ ...query, totalBookings: { $gt: 0 } }),
      Customer.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: '$totalSpent' } } }
      ])
    ]);
    
    const stats = {
      totalCustomers,
      activeCustomers,
      totalRevenue: totalRevenue[0]?.total || 0,
      averageCustomerValue: totalCustomers > 0 ? (totalRevenue[0]?.total || 0) / totalCustomers : 0
    };
    
    return successResponse(res, 200, 'Customer statistics fetched successfully', stats);
  }
  
  // Individual customer stats
  const customer = await Customer.findById(req.params.id);

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  // Agent users can only view their own customers' stats
  if (req.user.role === 'agent') {
    if (!ensureAgentProfile(req, res)) return;
    if (customer.agentId && customer.agentId.toString() !== req.agent._id.toString()) {
      throw new AppError('You do not have permission to view these statistics', 403);
    }
  }

  const stats = {
    totalBookings: customer.totalBookings,
    totalSpent: customer.totalSpent,
    averageBookingValue: customer.totalBookings > 0 ? customer.totalSpent / customer.totalBookings : 0,
    joinDate: customer.createdAt,
    lastBooking: customer.updatedAt,
    tags: customer.tags,
  };

  successResponse(res, 200, 'Customer statistics fetched successfully', { stats });
});

// @desc    Bulk import customers
// @route   POST /api/v1/customers/bulk-import
// @access  Private (agent, operator, super_admin)
const bulkImportCustomers = asyncHandler(async (req, res) => {
  const { customers } = req.body;

  if (!Array.isArray(customers) || customers.length === 0) {
    throw new AppError('Please provide an array of customers', 400);
  }

  let agentId;
  if (req.user.role === 'agent') {
    if (!ensureAgentProfile(req, res)) return;
    agentId = req.agent._id;
  }

  const results = {
    created: 0,
    skipped: 0,
    errors: [],
  };

  for (const customerData of customers) {
    try {
      // Set agentId for agent users
      if (agentId) {
        customerData.agentId = agentId;
      }

      // Check if customer already exists
      const existing = await Customer.findOne({
        agentId: customerData.agentId,
        email: customerData.email,
      });

      if (existing) {
        results.skipped++;
        continue;
      }

      await Customer.create(customerData);
      results.created++;
    } catch (error) {
      results.errors.push({
        email: customerData.email,
        error: error.message,
      });
    }
  }

  successResponse(res, 200, 'Bulk import completed', { results });
});

module.exports = {
  getAllCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  addCustomerNote,
  getCustomerNotes,
  getCustomerStats,
  bulkImportCustomers,
};
