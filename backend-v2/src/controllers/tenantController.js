const Tenant = require('../models/Tenant');
const User = require('../models/User');
const { ValidationError, NotFoundError, ConflictError, ForbiddenError } = require('../lib/errors');
const logger = require('../lib/logger');

/**
 * Get all tenants (super_admin only)
 * GET /tenants
 */
const getAllTenants = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      plan,
      search,
      sortBy = '-createdAt',
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (plan) {
      query['subscription.plan'] = plan;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
        { 'contact.email': { $regex: search, $options: 'i' } },
      ];
    }

    // Execute query with pagination
    const [tenants, total] = await Promise.all([
      Tenant.find(query)
        .sort(sortBy)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Tenant.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    logger.info('Tenants fetched successfully', {
      total,
      page: pageNum,
      limit: limitNum,
      userId: req.user?._id,
      requestId: req.id,
    });

    res.ok(
      { tenants },
      {
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
        },
      },
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get single tenant by ID
 * GET /tenants/:id
 */
const getTenant = async (req, res, next) => {
  try {
    const { id } = req.params;

    const tenant = await Tenant.findById(id).lean();

    if (!tenant) {
      throw new NotFoundError('Tenant not found', 'TENANT_NOT_FOUND', { tenantId: id });
    }

    // Permission check: super_admin can see all, others can only see their own tenant
    if (req.user.role !== 'super_admin' && tenant._id.toString() !== req.user.tenant.toString()) {
      throw new ForbiddenError(
        'You do not have permission to view this tenant',
        'FORBIDDEN',
      );
    }

    logger.info('Tenant fetched successfully', {
      tenantId: id,
      userId: req.user._id,
      requestId: req.id,
    });

    res.ok({ tenant });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new tenant (super_admin only)
 * POST /tenants
 */
const createTenant = async (req, res, next) => {
  try {
    const {
      name,
      slug,
      domain,
      customDomain,
      status = 'trial',
      subscription,
      branding,
      settings,
      contact,
      metadata,
    } = req.body;

    // Validate required fields
    if (!name || !slug) {
      throw new ValidationError('Name and slug are required', {
        missingFields: [!name && 'name', !slug && 'slug'].filter(Boolean),
      });
    }

    // Check if slug already exists
    const existingTenant = await Tenant.findOne({ slug: slug.toLowerCase() });
    if (existingTenant) {
      throw new ConflictError('Tenant with this slug already exists', 'SLUG_EXISTS', { slug });
    }

    // Check if domain already exists (if provided)
    if (domain) {
      const existingDomain = await Tenant.findOne({ domain: domain.toLowerCase() });
      if (existingDomain) {
        throw new ConflictError('Tenant with this domain already exists', 'DOMAIN_EXISTS', { domain });
      }
    }

    // Check if custom domain already exists (if provided)
    if (customDomain) {
      const existingCustomDomain = await Tenant.findOne({ customDomain: customDomain.toLowerCase() });
      if (existingCustomDomain) {
        throw new ConflictError(
          'Tenant with this custom domain already exists',
          'CUSTOM_DOMAIN_EXISTS',
          { customDomain },
        );
      }
    }

    // Create tenant
    const tenant = await Tenant.create({
      name,
      slug: slug.toLowerCase(),
      domain: domain?.toLowerCase(),
      customDomain: customDomain?.toLowerCase(),
      status,
      subscription,
      branding,
      settings,
      contact,
      metadata,
    });

    logger.info('Tenant created successfully', {
      tenantId: tenant._id,
      slug: tenant.slug,
      userId: req.user._id,
      requestId: req.id,
    });

    res.created({
      tenant,
      message: 'Tenant created successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update tenant
 * PUT /tenants/:id
 */
const updateTenant = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      domain,
      customDomain,
      status,
      subscription,
      branding,
      settings,
      contact,
      metadata,
    } = req.body;

    // Find tenant
    const tenant = await Tenant.findById(id);
    if (!tenant) {
      throw new NotFoundError('Tenant not found', 'TENANT_NOT_FOUND', { tenantId: id });
    }

    // Permission check: super_admin can update all, tenant_admin can update their own
    if (req.user.role !== 'super_admin' && tenant._id.toString() !== req.user.tenant.toString()) {
      throw new ForbiddenError(
        'You do not have permission to update this tenant',
        'FORBIDDEN',
      );
    }

    // Non-super_admin cannot change status
    if (status && req.user.role !== 'super_admin') {
      throw new ForbiddenError(
        'Only super admins can change tenant status',
        'FORBIDDEN',
      );
    }

    // Check domain conflicts if domain is being changed
    if (domain && domain !== tenant.domain) {
      const existingDomain = await Tenant.findOne({
        domain: domain.toLowerCase(),
        _id: { $ne: id },
      });
      if (existingDomain) {
        throw new ConflictError('Tenant with this domain already exists', 'DOMAIN_EXISTS', { domain });
      }
    }

    // Check custom domain conflicts if custom domain is being changed
    if (customDomain && customDomain !== tenant.customDomain) {
      const existingCustomDomain = await Tenant.findOne({
        customDomain: customDomain.toLowerCase(),
        _id: { $ne: id },
      });
      if (existingCustomDomain) {
        throw new ConflictError(
          'Tenant with this custom domain already exists',
          'CUSTOM_DOMAIN_EXISTS',
          { customDomain },
        );
      }
    }

    // Update fields
    if (name) tenant.name = name;
    if (domain !== undefined) tenant.domain = domain?.toLowerCase();
    if (customDomain !== undefined) tenant.customDomain = customDomain?.toLowerCase();
    if (status) tenant.status = status;
    if (subscription) tenant.subscription = { ...tenant.subscription, ...subscription };
    if (branding) tenant.branding = { ...tenant.branding, ...branding };
    if (settings) tenant.settings = { ...tenant.settings, ...settings };
    if (contact) tenant.contact = { ...tenant.contact, ...contact };
    if (metadata) tenant.metadata = { ...tenant.metadata, ...metadata };

    await tenant.save();

    logger.info('Tenant updated successfully', {
      tenantId: id,
      userId: req.user._id,
      requestId: req.id,
    });

    res.ok({
      tenant,
      message: 'Tenant updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update tenant branding
 * PUT /tenants/:id/branding
 */
const updateBranding = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { logo, favicon, primaryColor, secondaryColor } = req.body;

    // Find tenant
    const tenant = await Tenant.findById(id);
    if (!tenant) {
      throw new NotFoundError('Tenant not found', 'TENANT_NOT_FOUND', { tenantId: id });
    }

    // Permission check
    if (req.user.role !== 'super_admin' && tenant._id.toString() !== req.user.tenant.toString()) {
      throw new ForbiddenError(
        'You do not have permission to update this tenant branding',
        'FORBIDDEN',
      );
    }

    // Update branding
    if (logo !== undefined) tenant.branding.logo = logo;
    if (favicon !== undefined) tenant.branding.favicon = favicon;
    if (primaryColor !== undefined) tenant.branding.primaryColor = primaryColor;
    if (secondaryColor !== undefined) tenant.branding.secondaryColor = secondaryColor;

    await tenant.save();

    logger.info('Tenant branding updated successfully', {
      tenantId: id,
      userId: req.user._id,
      requestId: req.id,
    });

    res.ok({
      branding: tenant.branding,
      message: 'Tenant branding updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete tenant (super_admin only)
 * DELETE /tenants/:id
 */
const deleteTenant = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find tenant
    const tenant = await Tenant.findById(id);
    if (!tenant) {
      throw new NotFoundError('Tenant not found', 'TENANT_NOT_FOUND', { tenantId: id });
    }

    // Check if there are users associated with this tenant
    const userCount = await User.countDocuments({ tenant: id });
    if (userCount > 0) {
      throw new ValidationError(
        `Cannot delete tenant with ${userCount} associated users. Please delete or reassign users first.`,
        { userCount },
      );
    }

    await tenant.deleteOne();

    logger.info('Tenant deleted successfully', {
      tenantId: id,
      userId: req.user._id,
      requestId: req.id,
    });

    res.ok({
      message: 'Tenant deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get tenant statistics
 * GET /tenants/:id/stats
 */
const getTenantStats = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find tenant
    const tenant = await Tenant.findById(id);
    if (!tenant) {
      throw new NotFoundError('Tenant not found', 'TENANT_NOT_FOUND', { tenantId: id });
    }

    // Permission check
    if (req.user.role !== 'super_admin' && tenant._id.toString() !== req.user.tenant.toString()) {
      throw new ForbiddenError(
        'You do not have permission to view this tenant statistics',
        'FORBIDDEN',
      );
    }

    // Get statistics
    const [totalUsers, activeUsers, adminUsers] = await Promise.all([
      User.countDocuments({ tenant: id }),
      User.countDocuments({ tenant: id, status: 'active' }),
      User.countDocuments({ tenant: id, role: { $in: ['tenant_admin', 'super_admin'] } }),
    ]);

    const stats = {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
        admins: adminUsers,
      },
      subscription: {
        plan: tenant.subscription.plan,
        isActive: tenant.subscription.isActive,
        startDate: tenant.subscription.startDate,
        endDate: tenant.subscription.endDate,
      },
      status: tenant.status,
      createdAt: tenant.createdAt,
    };

    logger.info('Tenant statistics fetched successfully', {
      tenantId: id,
      userId: req.user._id,
      requestId: req.id,
    });

    res.ok({ stats });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllTenants,
  getTenant,
  createTenant,
  updateTenant,
  updateBranding,
  deleteTenant,
  getTenantStats,
};
