/**
 * Customer Authentication Middleware
 * Verifies JWT token and ensures user is a customer
 */

const jwt = require('jsonwebtoken');
const { asyncHandler, AppError } = require('./errorHandler');
const Customer = require('../models/Customer');

/**
 * Protect customer routes - verify JWT and ensure customer role
 */
exports.customerAuth = asyncHandler(async (req, res, next) => {
  let token;

  // Get token from header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Check if token exists
  if (!token) {
    throw new AppError('Not authorized to access this route', 401);
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user is a customer
    if (decoded.role !== 'customer') {
      throw new AppError('Access denied. Customer access required', 403);
    }

    // Get customer from database
    const customer = await Customer.findById(decoded.id);

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    // Check if customer has portal access
    if (!customer.portalAccess) {
      throw new AppError('Portal access not enabled', 403);
    }

    // Check if customer is active
    if (customer.status !== 'active') {
      throw new AppError('Account is not active', 403);
    }

    // Attach customer to request
    req.user = customer;
    req.tenantId = customer.tenantId;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new AppError('Invalid token', 401);
    }
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Token expired', 401);
    }
    throw error;
  }
});

module.exports = exports;
