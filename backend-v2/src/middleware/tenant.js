const Tenant = require('../models/Tenant');
const { NotFoundError, UnauthorizedError } = require('../lib/errors');
const logger = require('../lib/logger');

/**
 * Extract tenant from request and attach to req.tenant
 * Supports multiple tenant identification strategies:
 * 1. Subdomain-based: tenant-slug.domain.com
 * 2. Path-based: domain.com/tenant-slug/*
 * 3. Custom domain: custom-domain.com
 * 4. Header-based: X-Tenant-ID or X-Tenant-Slug
 */
const resolveTenant = async (req, res, next) => {
  try {
    let tenant = null;
    let tenantIdentifier = null;
    let strategy = null;

    // Strategy 1: Check X-Tenant-Slug header (useful for API clients)
    const tenantSlugHeader = req.get('X-Tenant-Slug');
    if (tenantSlugHeader) {
      tenantIdentifier = tenantSlugHeader;
      strategy = 'header-slug';
      tenant = await Tenant.findOne({ slug: tenantIdentifier, status: 'active' });
    }

    // Strategy 2: Check X-Tenant-ID header
    if (!tenant) {
      const tenantIdHeader = req.get('X-Tenant-ID');
      if (tenantIdHeader) {
        tenantIdentifier = tenantIdHeader;
        strategy = 'header-id';
        tenant = await Tenant.findOne({ _id: tenantIdHeader, status: 'active' });
      }
    }

    // Strategy 3: Subdomain-based (e.g., acme.travelcrm.com)
    if (!tenant) {
      const host = req.get('host') || '';
      const parts = host.split('.');
      
      // Check if subdomain exists (more than 2 parts, excluding port)
      const hostWithoutPort = host.split(':')[0];
      const domainParts = hostWithoutPort.split('.');
      
      if (domainParts.length >= 3) {
        const subdomain = domainParts[0];
        
        // Skip common subdomains
        if (!['www', 'api', 'admin', 'app'].includes(subdomain)) {
          tenantIdentifier = subdomain;
          strategy = 'subdomain';
          tenant = await Tenant.findOne({ slug: subdomain, status: 'active' });
        }
      }
    }

    // Strategy 4: Custom domain (e.g., acmetravels.com)
    if (!tenant) {
      const host = req.get('host') || '';
      const hostWithoutPort = host.split(':')[0];
      
      tenantIdentifier = hostWithoutPort;
      strategy = 'custom-domain';
      tenant = await Tenant.findOne({ customDomain: hostWithoutPort, status: 'active' });
    }

    // Strategy 5: Path-based (e.g., /acme/dashboard)
    if (!tenant) {
      const pathParts = req.path.split('/').filter(Boolean);
      if (pathParts.length > 0) {
        const potentialSlug = pathParts[0];
        
        // Check if first path segment looks like a tenant slug
        if (/^[a-z0-9-]+$/.test(potentialSlug) && potentialSlug.length >= 3) {
          tenantIdentifier = potentialSlug;
          strategy = 'path';
          tenant = await Tenant.findOne({ slug: potentialSlug, status: 'active' });
          
          // If found, strip tenant slug from path for downstream handlers
          if (tenant) {
            req.url = '/' + pathParts.slice(1).join('/');
            req.originalUrl = req.url;
          }
        }
      }
    }

    // Log tenant resolution
    if (tenant) {
      logger.debug('Tenant resolved', {
        tenantId: tenant._id,
        slug: tenant.slug,
        strategy,
        identifier: tenantIdentifier,
        requestId: req.id,
      });

      req.tenant = tenant;
      req.tenantId = tenant._id;
      next();
    } else {
      // No tenant found
      logger.warn('Tenant not found', {
        strategy,
        identifier: tenantIdentifier,
        host: req.get('host'),
        path: req.path,
        requestId: req.id,
      });

      throw new NotFoundError(
        'Tenant not found. Please check your URL or contact support.',
        'TENANT_NOT_FOUND',
      );
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Optional tenant middleware - sets req.tenant if found, but doesn't fail
 * Useful for routes that can work with or without tenant context (e.g., super_admin login)
 */
const resolveOptionalTenant = async (req, res, next) => {
  try {
    let tenant = null;
    let tenantIdentifier = null;
    let strategy = null;

    // Strategy 1: Check X-Tenant-Slug header
    const tenantSlugHeader = req.get('X-Tenant-Slug');
    if (tenantSlugHeader) {
      tenantIdentifier = tenantSlugHeader;
      strategy = 'header-slug';
      tenant = await Tenant.findOne({ slug: tenantIdentifier, status: 'active' });
    }

    // Strategy 2: Check X-Tenant-ID header
    if (!tenant) {
      const tenantIdHeader = req.get('X-Tenant-ID');
      if (tenantIdHeader) {
        tenantIdentifier = tenantIdHeader;
        strategy = 'header-id';
        tenant = await Tenant.findOne({ _id: tenantIdHeader, status: 'active' });
      }
    }

    // For optional tenant, we stop here - we don't check subdomain/domain/path
    // This allows super_admin login without tenant context

    if (tenant) {
      logger.debug('Optional tenant resolved', {
        tenantId: tenant._id,
        slug: tenant.slug,
        strategy,
        requestId: req.id,
      });

      req.tenant = tenant;
      req.tenantId = tenant._id;
      req.tenantRequested = !!tenantIdentifier;
    } else {
      logger.debug('No tenant context for optional route', {
        path: req.path,
        tenantRequested: !!tenantIdentifier,
        requestId: req.id,
      });

      req.tenant = null;
      req.tenantId = null;
      req.tenantRequested = !!tenantIdentifier; // Flag if tenant was requested but not found
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Verify tenant is active and not suspended
 */
const requireActiveTenant = (req, res, next) => {
  if (!req.tenant) {
    return next(
      new UnauthorizedError(
        'This operation requires a valid tenant context',
        'TENANT_REQUIRED',
      ),
    );
  }

  if (req.tenant.status !== 'active') {
    return next(
      new UnauthorizedError(
        'Your account is currently inactive. Please contact support.',
        'TENANT_INACTIVE',
      ),
    );
  }

  next();
};

/**
 * Check tenant subscription status
 */
const requireActiveSubscription = (req, res, next) => {
  if (!req.tenant) {
    return next(
      new UnauthorizedError(
        'This operation requires a valid tenant context',
        'TENANT_REQUIRED',
      ),
    );
  }

  const subscription = req.tenant.subscription;
  
  if (!subscription || subscription.status !== 'active') {
    return next(
      new UnauthorizedError(
        'Your subscription is not active. Please update your billing information.',
        'SUBSCRIPTION_INACTIVE',
      ),
    );
  }

  // Check if subscription has expired
  if (subscription.currentPeriodEnd && new Date(subscription.currentPeriodEnd) < new Date()) {
    return next(
      new UnauthorizedError(
        'Your subscription has expired. Please renew to continue.',
        'SUBSCRIPTION_EXPIRED',
      ),
    );
  }

  next();
};

module.exports = {
  resolveTenant,
  resolveOptionalTenant,
  requireActiveTenant,
  requireActiveSubscription,
};
