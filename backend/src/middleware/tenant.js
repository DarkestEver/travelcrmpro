const { Tenant } = require('../models');
const { AppError } = require('./errorHandler');

/**
 * Tenant identification middleware
 * Identifies tenant from subdomain, custom domain, or X-Tenant-ID header
 */
exports.identifyTenant = async (req, res, next) => {
  try {
    let tenant = null;
    
    // Method 1: Check X-Tenant-ID header (useful for API clients)
    const tenantIdHeader = req.headers['x-tenant-id'];
    if (tenantIdHeader) {
      tenant = await Tenant.findById(tenantIdHeader);
    }
    
    // Method 2: Extract from subdomain or custom domain
    if (!tenant) {
      const host = req.headers.host || req.hostname;
      const hostParts = host.split('.');
      
      // Check if it's a subdomain (e.g., acme.travelcrm.com)
      if (hostParts.length >= 3) {
        const subdomain = hostParts[0];
        tenant = await Tenant.findBySubdomain(subdomain);
      }
      
      // Check if it's a custom domain (e.g., booking.acmetravel.com)
      if (!tenant) {
        tenant = await Tenant.findByDomain(host);
      }
    }
    
    // If no tenant found, try to use a default tenant for local development
    if (!tenant && (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test')) {
      // Use default tenant ID or create one
      const defaultTenantId = process.env.DEFAULT_TENANT_ID;
      if (defaultTenantId) {
        tenant = await Tenant.findById(defaultTenantId);
      }
    }
    
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found. Please check your domain or contact support.',
      });
    }
    
    // Check if tenant is active
    if (tenant.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: `Tenant is ${tenant.status}. Please contact support.`,
      });
    }
    
    // Check if subscription is active
    if (tenant.subscription.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your subscription is suspended. Please contact billing.',
      });
    }
    
    // Check if trial has expired
    if (tenant.isTrialExpired()) {
      return res.status(403).json({
        success: false,
        message: 'Your trial has expired. Please upgrade your subscription.',
      });
    }
    
    // Attach tenant to request
    req.tenant = tenant;
    req.tenantId = tenant._id;
    
    next();
  } catch (error) {
    console.error('Tenant identification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error identifying tenant',
      error: error.message,
    });
  }
};

/**
 * Require tenant middleware (must be used after identifyTenant)
 */
exports.requireTenant = (req, res, next) => {
  if (!req.tenant || !req.tenantId) {
    return res.status(400).json({
      success: false,
      message: 'Tenant identification required',
    });
  }
  next();
};

/**
 * Check if tenant has a specific feature enabled
 */
exports.requireFeature = (featureName) => {
  return (req, res, next) => {
    if (!req.tenant) {
      return res.status(400).json({
        success: false,
        message: 'Tenant required',
      });
    }
    
    const featureEnabled = req.tenant.settings.features[featureName];
    
    if (!featureEnabled) {
      return res.status(403).json({
        success: false,
        message: `Feature '${featureName}' is not enabled for your plan`,
      });
    }
    
    next();
  };
};

/**
 * Check tenant usage limits
 */
exports.checkUsageLimit = (resource) => {
  return async (req, res, next) => {
    if (!req.tenant) {
      return res.status(400).json({
        success: false,
        message: 'Tenant required',
      });
    }
    
    try {
      let canAdd = false;
      
      switch (resource) {
        case 'user':
          canAdd = req.tenant.canAddUser();
          break;
        case 'agent':
          canAdd = req.tenant.canAddAgent();
          break;
        case 'customer':
          canAdd = req.tenant.canAddCustomer();
          break;
        case 'booking':
          canAdd = req.tenant.canAddBooking();
          break;
        default:
          canAdd = true;
      }
      
      if (!canAdd) {
        return res.status(403).json({
          success: false,
          message: `You have reached the maximum ${resource} limit for your plan. Please upgrade.`,
        });
      }
      
      next();
    } catch (error) {
      console.error('Usage limit check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking usage limits',
        error: error.message,
      });
    }
  };
};

/**
 * Update tenant usage after resource creation
 */
exports.updateTenantUsage = (resource, increment = 1) => {
  return async (req, res, next) => {
    if (!req.tenant) {
      return next();
    }
    
    try {
      const updateField = `usage.${resource}`;
      await Tenant.findByIdAndUpdate(
        req.tenant._id,
        { $inc: { [updateField]: increment } },
        { new: true }
      );
      next();
    } catch (error) {
      console.error('Usage update error:', error);
      // Don't fail the request if usage update fails
      next();
    }
  };
};
