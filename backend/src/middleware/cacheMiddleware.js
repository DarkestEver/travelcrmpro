/**
 * Cache Middleware
 * Phase 10: Route-level caching for API endpoints
 * 
 * Features:
 * - Automatic response caching
 * - Smart key generation
 * - Cache headers
 * - TTL configuration
 * - Skip caching for mutations
 */

const cacheService = require('../services/cacheService');
const logger = require('../utils/logger');

/**
 * Cache middleware factory
 * @param {number} ttl - Time to live in seconds (default: 300 = 5 minutes)
 * @param {object} options - Additional options
 */
const cacheMiddleware = (ttl = 300, options = {}) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    try {
      // Generate cache key
      const cacheKey = generateCacheKey(req, options);

      // Try to get from cache
      const cached = await cacheService.get(cacheKey);
      
      if (cached) {
        // Set cache headers
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Key', cacheKey);
        
        logger.debug(`Cache hit: ${cacheKey}`);
        
        return res.json(cached);
      }

      // Cache miss - intercept response
      const originalJson = res.json.bind(res);
      
      res.json = async (data) => {
        // Store in cache
        await cacheService.set(cacheKey, data, ttl);
        
        // Set cache headers
        res.setHeader('X-Cache', 'MISS');
        res.setHeader('X-Cache-Key', cacheKey);
        res.setHeader('X-Cache-TTL', ttl);
        
        logger.debug(`Cache miss: ${cacheKey}`);
        
        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      // Continue without caching on error
      next();
    }
  };
};

/**
 * Generate cache key from request
 */
function generateCacheKey(req, options = {}) {
  const { prefix = 'api' } = options;
  
  // Include tenant ID if available
  const tenantId = req.user?.tenantId || 'public';
  
  // Include path
  const path = req.path;
  
  // Include relevant query parameters (sorted for consistency)
  const queryKeys = Object.keys(req.query).sort();
  const queryString = queryKeys
    .map(key => `${key}=${req.query[key]}`)
    .join('&');
  
  return cacheService.generateKey(prefix, tenantId, path, queryString);
}

/**
 * Invalidate cache by pattern
 */
const invalidateCache = async (pattern) => {
  try {
    await cacheService.delPattern(pattern);
    logger.info(`Cache invalidated: ${pattern}`);
    return true;
  } catch (error) {
    logger.error('Cache invalidation error:', error);
    return false;
  }
};

/**
 * Invalidate cache for a specific tenant
 */
const invalidateTenantCache = async (tenantId) => {
  const pattern = `api:${tenantId}:*`;
  return invalidateCache(pattern);
};

/**
 * Invalidate cache for a specific resource
 */
const invalidateResourceCache = async (tenantId, resource) => {
  const pattern = `api:${tenantId}:*/${resource}*`;
  return invalidateCache(pattern);
};

module.exports = {
  cacheMiddleware,
  invalidateCache,
  invalidateTenantCache,
  invalidateResourceCache
};
