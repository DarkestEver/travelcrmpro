const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { successResponse } = require('../utils/response');
const Customer = require('../models/Customer');
const { getAgentCustomers, verifyAgentOwnsCustomer } = require('../utils/agentDataAccess');
const {
  importCustomersForAgent,
  generateCustomerCSVTemplate,
} = require('../services/agentCustomerImport');

/**
 * @desc    Get all customers for logged-in agent
 * @route   GET /api/v1/agent-portal/customers
 * @access  Private (Agent only)
 */
exports.getMyCustomers = asyncHandler(async (req, res) => {
  const agentId = req.user._id;
  const tenantId = req.user.tenantId;

  const {
    page = 1,
    limit = 10,
    search = '',
    sortBy = '-createdAt',
  } = req.query;

  const result = await getAgentCustomers(
    agentId,
    {},
    { page, limit, search, sort: sortBy }
  );

  successResponse(res, 200, 'Customers retrieved successfully', result);
});

/**
 * @desc    Get single customer by ID
 * @route   GET /api/v1/agent-portal/customers/:id
 * @access  Private (Agent only)
 */
exports.getCustomerById = asyncHandler(async (req, res) => {
  const agentId = req.user._id;
  const customerId = req.params.id;

  // Verify ownership
  const customer = await Customer.findOne({
    _id: customerId,
    agentId,
  }).lean();

  if (!customer) {
    throw new AppError('Customer not found or access denied', 404);
  }

  successResponse(res, 200, 'Customer retrieved successfully', { customer });
});

/**
 * @desc    Create new customer
 * @route   POST /api/v1/agent-portal/customers
 * @access  Private (Agent only)
 */
exports.createCustomer = asyncHandler(async (req, res) => {
  const agentId = req.user._id;
  const tenantId = req.user.tenantId;

  const {
    firstName,
    lastName,
    email,
    phone,
    address,
    city,
    state,
    country,
    postalCode,
    dateOfBirth,
    nationality,
    passportNumber,
    passportExpiry,
    preferences,
    notes,
  } = req.body;

  // Check if customer with same email already exists for this agent
  const existingCustomer = await Customer.findOne({
    email,
    agentId,
    tenantId,
  });

  if (existingCustomer) {
    throw new AppError('Customer with this email already exists', 400);
  }

  const customer = await Customer.create({
    firstName,
    lastName,
    email,
    phone,
    address,
    city,
    state,
    country,
    postalCode,
    dateOfBirth,
    nationality,
    passportNumber,
    passportExpiry,
    preferences,
    notes,
    agentId,
    tenantId,
    createdBy: agentId,
  });

  successResponse(res, 201, 'Customer created successfully', { customer });
});

/**
 * @desc    Update customer
 * @route   PUT /api/v1/agent-portal/customers/:id
 * @access  Private (Agent only)
 */
exports.updateCustomer = asyncHandler(async (req, res) => {
  const agentId = req.user._id;
  const customerId = req.params.id;

  // Verify ownership
  const hasAccess = await verifyAgentOwnsCustomer(agentId, customerId);
  if (!hasAccess) {
    throw new AppError('Customer not found or access denied', 404);
  }

  const {
    firstName,
    lastName,
    email,
    phone,
    address,
    city,
    state,
    country,
    postalCode,
    dateOfBirth,
    nationality,
    passportNumber,
    passportExpiry,
    preferences,
    notes,
  } = req.body;

  // If email is being changed, check for duplicates
  if (email) {
    const existingCustomer = await Customer.findOne({
      email,
      agentId,
      _id: { $ne: customerId },
    });

    if (existingCustomer) {
      throw new AppError('Another customer with this email already exists', 400);
    }
  }

  const customer = await Customer.findByIdAndUpdate(
    customerId,
    {
      firstName,
      lastName,
      email,
      phone,
      address,
      city,
      state,
      country,
      postalCode,
      dateOfBirth,
      nationality,
      passportNumber,
      passportExpiry,
      preferences,
      notes,
      updatedBy: agentId,
    },
    { new: true, runValidators: true }
  );

  successResponse(res, 200, 'Customer updated successfully', { customer });
});

/**
 * @desc    Delete customer
 * @route   DELETE /api/v1/agent-portal/customers/:id
 * @access  Private (Agent only)
 */
exports.deleteCustomer = asyncHandler(async (req, res) => {
  const agentId = req.user._id;
  const customerId = req.params.id;

  // Verify ownership
  const customer = await Customer.findOne({
    _id: customerId,
    agentId,
  });

  if (!customer) {
    throw new AppError('Customer not found or access denied', 404);
  }

  // Check if customer has any active bookings
  const Booking = require('../models/Booking');
  const activeBookings = await Booking.countDocuments({
    customerId,
    status: { $in: ['confirmed', 'pending'] },
  });

  if (activeBookings > 0) {
    throw new AppError(
      'Cannot delete customer with active bookings. Please cancel or complete bookings first.',
      400
    );
  }

  await customer.deleteOne();

  successResponse(res, 200, 'Customer deleted successfully', null);
});

/**
 * @desc    Get customer statistics
 * @route   GET /api/v1/agent-portal/customers/stats
 * @access  Private (Agent only)
 */
exports.getCustomerStats = asyncHandler(async (req, res) => {
  const agentId = req.user._id;
  const tenantId = req.user.tenantId;

  const [
    totalCustomers,
    activeCustomers,
    recentCustomers,
    topDestinations,
  ] = await Promise.all([
    // Total customers
    Customer.countDocuments({ agentId, tenantId }),

    // Active customers (with bookings in last 12 months)
    Customer.aggregate([
      { $match: { agentId, tenantId } },
      {
        $lookup: {
          from: 'bookings',
          localField: '_id',
          foreignField: 'customerId',
          as: 'bookings',
        },
      },
      {
        $match: {
          'bookings.createdAt': {
            $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
          },
        },
      },
      { $count: 'count' },
    ]),

    // Recent customers (last 30 days)
    Customer.countDocuments({
      agentId,
      tenantId,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    }),

    // Top destinations
    Customer.aggregate([
      { $match: { agentId, tenantId } },
      { $unwind: '$preferences.destinations' },
      { $group: { _id: '$preferences.destinations', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
  ]);

  const stats = {
    total: totalCustomers,
    active: activeCustomers.length > 0 ? activeCustomers[0].count : 0,
    recent: recentCustomers,
    topDestinations: topDestinations.map((dest) => ({
      destination: dest._id,
      count: dest.count,
    })),
  };

  successResponse(res, 200, 'Customer statistics retrieved successfully', { stats });
});

/**
 * @desc    Import customers from CSV
 * @route   POST /api/v1/agent-portal/customers/import
 * @access  Private (Agent only)
 */
exports.importCustomers = asyncHandler(async (req, res) => {
  const agentId = req.user._id;
  const tenantId = req.user.tenantId;
  const { csvData } = req.body;

  if (!csvData) {
    throw new AppError('CSV data is required', 400);
  }

  const result = await importCustomersForAgent(csvData, agentId, tenantId);

  const statusCode = result.success ? 200 : 400;
  successResponse(res, statusCode, result.message, result);
});

/**
 * @desc    Download CSV template for customer import
 * @route   GET /api/v1/agent-portal/customers/import/template
 * @access  Private (Agent only)
 */
exports.downloadCSVTemplate = asyncHandler(async (req, res) => {
  const template = generateCustomerCSVTemplate();

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="customer-import-template.csv"');
  res.send(template);
});
