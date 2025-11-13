const AuditLog = require('../models/AuditLog');

// Create audit log entry
const createAuditLog = async (userId, userRole, tenantId, action, resourceType, resourceId, details, req) => {
  try {
    await AuditLog.create({
      userId,
      userRole,
      tenantId,
      action,
      resourceType,
      resourceId,
      details,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      timestamp: new Date(),
    });
  } catch (error) {
    // Don't throw error, just log it
    console.error('Audit log creation failed:', error);
  }
};

// Middleware to log actions
const auditLogger = (action, resourceType) => {
  return async (req, res, next) => {
    // Store original send function
    const originalSend = res.send;

    // Override send function to capture response
    res.send = function(data) {
      // Only log successful operations (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const resourceId = req.params.id || (req.body && req.body._id) || null;
        const details = {
          method: req.method,
          path: req.path,
          body: req.body,
        };

        // Log asynchronously without waiting
        if (req.user) {
          createAuditLog(
            req.user._id,
            req.user.role,
            req.user.tenantId,
            action,
            resourceType,
            resourceId,
            details,
            req
          ).catch(err => console.error('Audit log error:', err));
        }
      }

      // Call original send
      originalSend.call(this, data);
    };

    next();
  };
};

module.exports = {
  createAuditLog,
  auditLogger,
};
