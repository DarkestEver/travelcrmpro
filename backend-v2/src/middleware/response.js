const config = require('../config');

/**
 * Attach response helper methods to res object
 */
const attachResponseHelpers = (req, res, next) => {
  /**
   * Success response
   * @param {*} data - Response data
   * @param {Object} meta - Optional metadata (pagination, etc.)
   * @param {Number} status - HTTP status code (default: 200)
   */
  res.ok = (data, meta = null, status = 200) => {
    const response = {
      success: true,
      data,
    };
    
    if (meta) {
      response.meta = meta;
    }
    
    if (config.request.includeTraceId && req.id) {
      response.traceId = req.id;
    }
    
    return res.status(status).json(response);
  };
  
  /**
   * Created response (201)
   * @param {*} data - Created resource data
   * @param {Object} meta - Optional metadata
   */
  res.created = (data, meta = null) => {
    return res.ok(data, meta, 201);
  };
  
  /**
   * No content response (204)
   */
  res.noContent = () => {
    return res.status(204).send();
  };
  
  /**
   * Error response
   * @param {Number} status - HTTP status code
   * @param {String} code - Error code
   * @param {String} message - Error message
   * @param {*} details - Optional error details
   * @param {String} type - Error type/name
   */
  res.fail = (status, code, message, details = null, type = 'Error') => {
    const response = {
      success: false,
      error: {
        code,
        message,
        type,
      },
    };
    
    if (details) {
      response.error.details = details;
    }
    
    if (config.request.includeTraceId && req.id) {
      response.traceId = req.id;
    }
    
    return res.status(status).json(response);
  };
  
  next();
};

module.exports = attachResponseHelpers;
