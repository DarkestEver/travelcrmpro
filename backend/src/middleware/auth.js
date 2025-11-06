const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getAsync, setAsync } = require('../config/database');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route. Please login.',
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if token is blacklisted (in case of logout)
      const blacklisted = await getAsync(`bl_${token}`);
      if (blacklisted) {
        return res.status(401).json({
          success: false,
          message: 'Token has been invalidated. Please login again.',
        });
      }

      // Check cache first
      let user = await getAsync(`user_${decoded.id}`);
      
      if (user) {
        user = JSON.parse(user);
      } else {
        // Get user from database
        user = await User.findById(decoded.id).select('-password');

        if (!user) {
          return res.status(401).json({
            success: false,
            message: 'User no longer exists.',
          });
        }
        
        // Verify user belongs to the current tenant (if tenant context exists)
        if (req.tenantId && user.tenantId.toString() !== req.tenantId.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Access denied. User does not belong to this tenant.',
          });
        }

        // Cache user data for 1 hour
        await setAsync(`user_${decoded.id}`, JSON.stringify(user), 3600);
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Your account has been deactivated.',
        });
      }

      // Check if password was changed after token was issued
      if (user.passwordChangedAt) {
        const passwordChangedTimestamp = parseInt(
          new Date(user.passwordChangedAt).getTime() / 1000,
          10
        );
        if (decoded.iat < passwordChangedTimestamp) {
          return res.status(401).json({
            success: false,
            message: 'Password recently changed. Please login again.',
          });
        }
      }

      // Grant access
      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token.',
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: error.message,
    });
  }
};

// Restrict to specific roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action.',
      });
    }
    next();
  };
};

// Check resource ownership for agents
exports.checkAgentOwnership = (Model, paramName = 'id') => {
  return async (req, res, next) => {
    try {
      // Super admin and operators can access all resources
      if (['super_admin', 'operator'].includes(req.user.role)) {
        return next();
      }

      // For agents, check ownership
      if (req.user.role === 'agent') {
        const resource = await Model.findById(req.params[paramName]);
        
        if (!resource) {
          return res.status(404).json({
            success: false,
            message: 'Resource not found',
          });
        }

        // Check if resource belongs to agent
        if (resource.agentId && resource.agentId.toString() !== req.agent._id.toString()) {
          return res.status(403).json({
            success: false,
            message: 'You do not have access to this resource',
          });
        }
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Authorization check failed',
        error: error.message,
      });
    }
  };
};

// Load agent data if user is an agent
exports.loadAgent = async (req, res, next) => {
  try {
    if (req.user.role === 'agent') {
      const Agent = require('../models/Agent');
      const agent = await Agent.findOne({ userId: req.user._id });
      
      if (!agent) {
        // Don't fail the request, just log and continue without agent data
        console.warn(`Agent profile not found for user ${req.user._id}`);
        req.agent = null;
        return next();
      }

      if (agent.status !== 'active') {
        return res.status(403).json({
          success: false,
          message: 'Your agent account is not active',
        });
      }

      req.agent = agent;
    }
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error loading agent data',
      error: error.message,
    });
  }
};

// Require agent profile (use after loadAgent)
exports.requireAgent = (req, res, next) => {
  if (req.user.role === 'agent' && !req.agent) {
    return res.status(404).json({
      success: false,
      message: 'Agent profile not found. Please contact administrator.',
    });
  }
  next();
};

// Load supplier data if user is a supplier
exports.loadSupplier = async (req, res, next) => {
  try {
    if (req.user.role === 'supplier') {
      const Supplier = require('../models/Supplier');
      const supplier = await Supplier.findOne({ userId: req.user._id });
      
      if (!supplier) {
        return res.status(404).json({
          success: false,
          message: 'Supplier profile not found',
        });
      }

      if (supplier.status !== 'active') {
        return res.status(403).json({
          success: false,
          message: 'Your supplier account is not active',
        });
      }

      req.supplier = supplier;
    }
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error loading supplier data',
      error: error.message,
    });
  }
};

// Alias for protect (used in some routes)
exports.authenticate = exports.protect;
// Alias for restrictTo (used in some routes)
exports.authorize = exports.restrictTo;

