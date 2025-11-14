/**
 * Compression Middleware
 * Phase 10: Response compression for optimized payload delivery
 */

const compression = require('compression');
const logger = require('../utils/logger');

/**
 * Compression middleware with smart filtering
 */
const compressionMiddleware = compression({
  // Compression level (0-9, where 6 is balanced)
  level: 6,
  
  // Only compress responses above 1KB
  threshold: 1024,
  
  // Filter function - only compress specific content types
  filter: (req, res) => {
    // Don't compress if client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }

    // Use compression for these content types
    const contentType = res.getHeader('Content-Type');
    if (contentType && (
      contentType.includes('application/json') ||
      contentType.includes('text/html') ||
      contentType.includes('text/css') ||
      contentType.includes('text/javascript') ||
      contentType.includes('application/javascript')
    )) {
      return true;
    }

    // Fall back to default compression filter
    return compression.filter(req, res);
  }
});

/**
 * Compression statistics middleware
 */
const compressionStats = (req, res, next) => {
  const originalWrite = res.write;
  const originalEnd = res.end;
  let chunks = [];
  let uncompressedSize = 0;

  // Intercept write
  res.write = function(chunk, ...args) {
    if (chunk) {
      uncompressedSize += chunk.length;
      chunks.push(chunk);
    }
    return originalWrite.apply(res, [chunk, ...args]);
  };

  // Intercept end
  res.end = function(chunk, ...args) {
    if (chunk) {
      uncompressedSize += chunk.length;
      chunks.push(chunk);
    }

    // Log compression stats for large responses
    if (uncompressedSize > 10240) { // > 10KB
      const encoding = res.getHeader('Content-Encoding');
      if (encoding === 'gzip' || encoding === 'deflate') {
        const compressedSize = res.getHeader('Content-Length') || 0;
        const ratio = compressedSize > 0 
          ? ((1 - compressedSize / uncompressedSize) * 100).toFixed(1)
          : 0;
        
        logger.debug(`Compression: ${uncompressedSize}B → ${compressedSize}B (${ratio}% reduction)`);
      }
    }

    return originalEnd.apply(res, [chunk, ...args]);
  };

  next();
};

module.exports = {
  compressionMiddleware,
  compressionStats
};
