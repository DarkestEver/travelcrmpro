const AuditLog = require('../models/AuditLog');
const logger = require('../lib/logger');

/**
 * Audit logging middleware
 * Automatically logs important actions
 */
const auditMiddleware = (action, entityType) => {
  return async (req, res, next) => {
    const startTime = Date.now();
    
    // Store original functions
    const originalJson = res.json;
    const originalSend = res.send;

    // Override res.json and res.send to capture response
    res.json = function (data) {
      res.locals.responseData = data;
      return originalJson.call(this, data);
    };

    res.send = function (data) {
      res.locals.responseData = data;
      return originalSend.call(this, data);
    };

    // Log after response is sent
    res.on('finish', async () => {
      try {
        const duration = Date.now() - startTime;
        const status = res.statusCode >= 200 && res.statusCode < 300 ? 'success' : 'failure';

        // Extract entity ID from params or body
        const entityId = req.params.id || req.body?._id || res.locals.responseData?.data?._id;

        // Prepare audit log data
        const auditData = {
          tenantId: req.user?.tenant,
          userId: req.user?._id,
          action,
          entity: {
            type: entityType,
            id: entityId,
          },
          status,
          description: `${action} ${entityType}`,
          metadata: {
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('user-agent'),
            requestId: req.id,
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            duration,
          },
        };

        // Add error information if request failed
        if (status === 'failure') {
          auditData.error = {
            code: res.locals.errorCode,
            message: res.locals.errorMessage,
          };
        }

        // Log to audit trail
        await AuditLog.log(auditData);
      } catch (error) {
        logger.error('Failed to create audit log', {
          error: error.message,
          action,
          entityType,
        });
      }
    });

    next();
  };
};

/**
 * Log custom audit event
 */
const logAudit = async (req, action, entityType, entityId, options = {}) => {
  try {
    const auditData = {
      tenantId: req.user?.tenant || options.tenantId,
      userId: req.user?._id || options.userId,
      action,
      entity: {
        type: entityType,
        id: entityId,
      },
      status: options.status || 'success',
      description: options.description || `${action} ${entityType}`,
      changes: options.changes,
      metadata: {
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.get ? req.get('user-agent') : undefined,
        requestId: req.id,
        method: req.method,
        path: req.originalUrl || req.path,
        ...options.metadata,
      },
      error: options.error,
      security: options.security,
    };

    await AuditLog.log(auditData);
  } catch (error) {
    logger.error('Failed to create audit log', {
      error: error.message,
      action,
      entityType,
    });
  }
};

module.exports = {
  auditMiddleware,
  logAudit,
};
