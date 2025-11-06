const { Tenant, User } = require('../models');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { successResponse, paginatedResponse } = require('../utils/response');
const { parsePagination, parseSort } = require('../utils/pagination');
const bcrypt = require('bcryptjs');

// @desc    Get all tenants (Super Admin only)
// @route   GET /api/v1/tenants
// @access  Private/Super Admin
const getAllTenants = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req);
  const sortBy = parseSort(req, '-createdAt');
  const { status, plan } = req.query;

  const query = {};
  if (status) query.status = status;
  if (plan) query['subscription.plan'] = plan;

  const [tenants, total] = await Promise.all([
    Tenant.find(query)
      .sort(sortBy)
      .skip(skip)
      .limit(limit)
      .populate('ownerId', 'name email'),
    Tenant.countDocuments(query),
  ]);

  paginatedResponse(res, 200, 'Tenants fetched successfully', tenants, page, limit, total);
});

// @desc    Get single tenant
// @route   GET /api/v1/tenants/:id
// @access  Private/Super Admin or Tenant Owner
const getTenant = asyncHandler(async (req, res) => {
  const tenant = await Tenant.findById(req.params.id).populate('ownerId', 'name email phone');

  if (!tenant) {
    throw new AppError('Tenant not found', 404);
  }

  // Check permissions: super_admin or tenant owner
  if (req.user.role !== 'super_admin' && tenant.ownerId._id.toString() !== req.user._id.toString()) {
    throw new AppError('You do not have permission to view this tenant', 403);
  }

  successResponse(res, 200, 'Tenant fetched successfully', { tenant });
});

// @desc    Create new tenant
// @route   POST /api/v1/tenants
// @access  Public or Super Admin
const createTenant = asyncHandler(async (req, res) => {
  const {
    name,
    subdomain,
    customDomain,
    ownerName,
    ownerEmail,
    ownerPassword,
    ownerPhone,
    plan = 'free',
    settings,
    metadata,
  } = req.body;

  // Check if subdomain already exists
  const existingTenant = await Tenant.findOne({ subdomain: subdomain.toLowerCase() });
  if (existingTenant) {
    throw new AppError('Subdomain already exists', 400);
  }

  // Check if custom domain already exists (if provided)
  if (customDomain) {
    const existingDomain = await Tenant.findOne({ customDomain: customDomain.toLowerCase() });
    if (existingDomain) {
      throw new AppError('Custom domain already exists', 400);
    }
  }

  // Create owner user first
  const hashedPassword = await bcrypt.hash(ownerPassword, 10);
  
  // Create tenant first to get the ID
  const tenant = await Tenant.create({
    name,
    subdomain: subdomain.toLowerCase(),
    customDomain: customDomain ? customDomain.toLowerCase() : undefined,
    settings: settings || {},
    metadata: metadata || {},
    subscription: {
      plan,
      status: 'trial',
    },
    ownerId: null, // Will update after creating user
  });

  // Create owner user
  const owner = await User.create({
    tenantId: tenant._id,
    name: ownerName,
    email: ownerEmail,
    password: hashedPassword,
    phone: ownerPhone,
    role: 'super_admin', // Tenant owner has super_admin role within their tenant
    isActive: true,
    emailVerified: true,
  });

  // Update tenant with owner ID
  tenant.ownerId = owner._id;
  await tenant.save();

  // Update tenant usage
  tenant.usage.users = 1;
  await tenant.save();

  successResponse(res, 201, 'Tenant created successfully', {
    tenant,
    owner: {
      _id: owner._id,
      name: owner.name,
      email: owner.email,
      role: owner.role,
    },
  });
});

// @desc    Update tenant
// @route   PATCH /api/v1/tenants/:id
// @access  Private/Super Admin or Tenant Owner
const updateTenant = asyncHandler(async (req, res) => {
  let tenant = await Tenant.findById(req.params.id);

  if (!tenant) {
    throw new AppError('Tenant not found', 404);
  }

  // Check permissions
  if (req.user.role !== 'super_admin' && tenant.ownerId.toString() !== req.user._id.toString()) {
    throw new AppError('You do not have permission to update this tenant', 403);
  }

  // Don't allow changing ownerId or subscription (except by super_admin)
  if (req.user.role !== 'super_admin') {
    delete req.body.ownerId;
    delete req.body.subscription;
    delete req.body.usage;
  }

  tenant = await Tenant.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate('ownerId', 'name email');

  successResponse(res, 200, 'Tenant updated successfully', { tenant });
});

// @desc    Update tenant subscription
// @route   PATCH /api/v1/tenants/:id/subscription
// @access  Private/Super Admin
const updateSubscription = asyncHandler(async (req, res) => {
  const { plan, status, endDate, price, billingCycle } = req.body;

  const tenant = await Tenant.findById(req.params.id);

  if (!tenant) {
    throw new AppError('Tenant not found', 404);
  }

  // Update subscription details
  if (plan) tenant.subscription.plan = plan;
  if (status) tenant.subscription.status = status;
  if (endDate) tenant.subscription.endDate = endDate;
  if (price !== undefined) tenant.subscription.price = price;
  if (billingCycle) tenant.subscription.billingCycle = billingCycle;

  // Update feature limits based on plan
  if (plan) {
    const planLimits = {
      free: { maxUsers: 5, maxAgents: 10, maxCustomers: 100, maxBookings: 50 },
      starter: { maxUsers: 10, maxAgents: 25, maxCustomers: 500, maxBookings: 200 },
      professional: { maxUsers: 25, maxAgents: 50, maxCustomers: 2000, maxBookings: 1000 },
      enterprise: { maxUsers: 100, maxAgents: 200, maxCustomers: 10000, maxBookings: 5000 },
    };

    if (planLimits[plan]) {
      tenant.settings.features = {
        ...tenant.settings.features,
        ...planLimits[plan],
      };
    }
  }

  await tenant.save();

  successResponse(res, 200, 'Subscription updated successfully', { tenant });
});

// @desc    Suspend tenant
// @route   PATCH /api/v1/tenants/:id/suspend
// @access  Private/Super Admin
const suspendTenant = asyncHandler(async (req, res) => {
  const tenant = await Tenant.findById(req.params.id);

  if (!tenant) {
    throw new AppError('Tenant not found', 404);
  }

  tenant.status = 'suspended';
  tenant.subscription.status = 'suspended';
  await tenant.save();

  successResponse(res, 200, 'Tenant suspended successfully', { tenant });
});

// @desc    Activate tenant
// @route   PATCH /api/v1/tenants/:id/activate
// @access  Private/Super Admin
const activateTenant = asyncHandler(async (req, res) => {
  const tenant = await Tenant.findById(req.params.id);

  if (!tenant) {
    throw new AppError('Tenant not found', 404);
  }

  tenant.status = 'active';
  tenant.subscription.status = 'active';
  await tenant.save();

  successResponse(res, 200, 'Tenant activated successfully', { tenant });
});

// @desc    Delete tenant
// @route   DELETE /api/v1/tenants/:id
// @access  Private/Super Admin
const deleteTenant = asyncHandler(async (req, res) => {
  const tenant = await Tenant.findById(req.params.id);

  if (!tenant) {
    throw new AppError('Tenant not found', 404);
  }

  // This is a soft delete - we just mark it as inactive
  tenant.status = 'inactive';
  await tenant.save();

  successResponse(res, 200, 'Tenant deleted successfully');
});

// @desc    Get tenant statistics
// @route   GET /api/v1/tenants/:id/stats
// @access  Private/Super Admin or Tenant Owner
const getTenantStats = asyncHandler(async (req, res) => {
  const tenant = await Tenant.findById(req.params.id);

  if (!tenant) {
    throw new AppError('Tenant not found', 404);
  }

  // Check permissions
  if (req.user.role !== 'super_admin' && tenant.ownerId.toString() !== req.user._id.toString()) {
    throw new AppError('You do not have permission to view these statistics', 403);
  }

  const stats = {
    usage: tenant.usage,
    limits: {
      maxUsers: tenant.settings.features.maxUsers,
      maxAgents: tenant.settings.features.maxAgents,
      maxCustomers: tenant.settings.features.maxCustomers,
      maxBookings: tenant.settings.features.maxBookings,
    },
    utilizationPercentage: {
      users: (tenant.usage.users / tenant.settings.features.maxUsers) * 100,
      agents: (tenant.usage.agents / tenant.settings.features.maxAgents) * 100,
      customers: (tenant.usage.customers / tenant.settings.features.maxCustomers) * 100,
      bookings: (tenant.usage.bookings / tenant.settings.features.maxBookings) * 100,
    },
    subscription: tenant.subscription,
    isTrialExpired: tenant.isTrialExpired(),
    daysUntilTrialExpiry: tenant.subscription.status === 'trial' 
      ? Math.ceil((tenant.subscription.trialEndsAt - new Date()) / (1000 * 60 * 60 * 24))
      : null,
  };

  successResponse(res, 200, 'Tenant statistics fetched successfully', { stats });
});

// @desc    Get current tenant info (from context)
// @route   GET /api/v1/tenants/current
// @access  Private
const getCurrentTenant = asyncHandler(async (req, res) => {
  if (!req.tenant) {
    throw new AppError('No tenant context found', 404);
  }

  const tenant = await Tenant.findById(req.tenant._id).populate('ownerId', 'name email phone');

  successResponse(res, 200, 'Current tenant fetched successfully', { tenant });
});

module.exports = {
  getAllTenants,
  getTenant,
  createTenant,
  updateTenant,
  updateSubscription,
  suspendTenant,
  activateTenant,
  deleteTenant,
  getTenantStats,
  getCurrentTenant,
};
