const { Tenant, User } = require('../models');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { successResponse, paginatedResponse } = require('../utils/response');
const { parsePagination, parseSort } = require('../utils/pagination');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

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

  // Validate required fields
  if (!name || !subdomain || !ownerName || !ownerEmail || !ownerPassword) {
    throw new AppError('Please provide name, subdomain, ownerName, ownerEmail, and ownerPassword', 400);
  }

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

  // Create owner user first (password will be hashed by User model pre-save hook)
  // Create a temporary ObjectId for tenant
  const tempTenantId = new mongoose.Types.ObjectId();
  
  // Create owner user with temporary tenantId
  const owner = await User.create({
    tenantId: tempTenantId,
    name: ownerName,
    email: ownerEmail,
    password: ownerPassword, // Will be hashed by pre-save hook
    phone: ownerPhone,
    role: 'operator', // Tenant owner has operator role
    isActive: true,
    emailVerified: true,
  });

  // Now create tenant with the owner ID
  const tenant = await Tenant.create({
    _id: tempTenantId, // Use the same ID we used for user
    name,
    subdomain: subdomain.toLowerCase(),
    customDomain: customDomain ? customDomain.toLowerCase() : undefined,
    settings: settings || {},
    metadata: metadata || {},
    subscription: {
      plan,
      status: 'trial',
    },
    ownerId: owner._id,
  });

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

// @desc    Get tenant settings
// @route   GET /api/v1/tenants/settings
// @access  Private
const getTenantSettings = asyncHandler(async (req, res) => {
  const tenantId = req.user.tenantId;
  
  const tenant = await Tenant.findById(tenantId).select('settings subdomain companyName');

  if (!tenant) {
    throw new AppError('Tenant not found', 404);
  }

  successResponse(res, 200, 'Tenant settings fetched successfully', tenant.settings);
});

// @desc    Update tenant settings
// @route   PATCH /api/v1/tenants/settings
// @access  Private (Operator/Admin only)
const updateTenantSettings = asyncHandler(async (req, res) => {
  const tenantId = req.user.tenantId;
  const { aiSettings, emailSettings, generalSettings } = req.body;

  // Check if user has permission to update settings
  if (!['super_admin', 'operator', 'admin'].includes(req.user.role)) {
    throw new AppError('You do not have permission to update settings', 403);
  }

  const tenant = await Tenant.findById(tenantId);
  
  if (!tenant) {
    throw new AppError('Tenant not found', 404);
  }

  // Update settings
  if (aiSettings) {
    tenant.settings.aiSettings = {
      ...tenant.settings.aiSettings,
      ...aiSettings
    };
  }

  if (emailSettings) {
    tenant.settings.emailSettings = {
      ...tenant.settings.emailSettings,
      ...emailSettings
    };
  }

  if (generalSettings) {
    tenant.settings.general = {
      ...tenant.settings.general,
      ...generalSettings
    };
  }

  await tenant.save();

  successResponse(res, 200, 'Settings updated successfully', tenant.settings);
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
  getTenantSettings,
  updateTenantSettings,
};
