/**
 * Customer Portal Authentication Controller
 * Handles customer registration, login, password reset
 */

const { asyncHandler, AppError } = require('../../middleware/errorHandler');
const { successResponse } = require('../../utils/response');
const Customer = require('../../models/Customer');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const emailService = require('../../services/emailService');

// Generate JWT token
const generateToken = (id, role = 'customer') => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

/**
 * @desc    Register new customer
 * @route   POST /api/v1/customer/auth/register
 * @access  Public
 */
exports.register = asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    password,
    agentId,
    tenantId
  } = req.body;

  // Check if customer already exists
  const existingCustomer = await Customer.findOne({ email, tenantId });
  if (existingCustomer) {
    throw new AppError('Customer with this email already exists', 400);
  }

  // Create customer
  const customer = await Customer.create({
    firstName,
    lastName,
    email,
    phone,
    password,
    agentId,
    tenantId,
    portalAccess: true,
    status: 'active'
  });

  // Generate email verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  customer.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  customer.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  await customer.save();

  // Send verification email
  try {
    const verificationUrl = `${process.env.FRONTEND_URL}/customer/verify-email/${verificationToken}`;
    await emailService.sendWelcomeEmail({
      to: customer.email,
      name: `${customer.firstName} ${customer.lastName}`,
      role: 'customer',
      verificationUrl
    });
  } catch (error) {
    console.error('Failed to send verification email:', error);
  }

  // Generate token
  const token = generateToken(customer._id, 'customer');

  successResponse(res, 201, 'Registration successful', {
    token,
    customer: {
      id: customer._id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      emailVerified: customer.emailVerified
    }
  });
});

/**
 * @desc    Login customer
 * @route   POST /api/v1/customer/auth/login
 * @access  Public
 */
exports.login = asyncHandler(async (req, res) => {
  const { email, password, tenantId } = req.body;

  // Validate input
  if (!email || !password) {
    throw new AppError('Please provide email and password', 400);
  }

  // Check for customer
  const customer = await Customer.findOne({ email, tenantId })
    .select('+password')
    .populate('agentId', 'agencyName contactPerson email phone');

  if (!customer) {
    throw new AppError('Invalid credentials', 401);
  }

  // Check if customer has portal access
  if (!customer.portalAccess) {
    throw new AppError('Portal access not enabled for this account', 403);
  }

  // Check if account is active
  if (customer.status !== 'active') {
    throw new AppError('Your account is not active. Please contact support', 403);
  }

  // Check password
  const isPasswordValid = await customer.comparePassword(password);
  if (!isPasswordValid) {
    throw new AppError('Invalid credentials', 401);
  }

  // Update last login
  customer.lastLogin = Date.now();
  await customer.save();

  // Generate token
  const token = generateToken(customer._id, 'customer');

  successResponse(res, 200, 'Login successful', {
    token,
    customer: {
      id: customer._id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      emailVerified: customer.emailVerified,
      agent: customer.agentId
    }
  });
});

/**
 * @desc    Get current logged in customer
 * @route   GET /api/v1/customer/auth/me
 * @access  Private (Customer)
 */
exports.getMe = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.user._id)
    .populate('agentId', 'agencyName contactPerson email phone');

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  successResponse(res, 200, 'Customer profile retrieved', { customer });
});

/**
 * @desc    Logout customer
 * @route   POST /api/v1/customer/auth/logout
 * @access  Private (Customer)
 */
exports.logout = asyncHandler(async (req, res) => {
  // In a token-based system, logout is handled client-side
  // But we can log this event
  console.log(`Customer ${req.user._id} logged out`);

  successResponse(res, 200, 'Logout successful', {});
});

/**
 * @desc    Forgot password - send reset email
 * @route   POST /api/v1/customer/auth/forgot-password
 * @access  Public
 */
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email, tenantId } = req.body;

  const customer = await Customer.findOne({ email, tenantId });
  if (!customer) {
    // Don't reveal if email exists or not
    return successResponse(res, 200, 'If that email exists, a reset link has been sent', {});
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  customer.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  customer.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  await customer.save();

  // Send reset email
  try {
    const resetUrl = `${process.env.FRONTEND_URL}/customer/reset-password/${resetToken}`;
    await emailService.sendPasswordResetEmail({
      to: customer.email,
      name: `${customer.firstName} ${customer.lastName}`,
      resetUrl
    });
  } catch (error) {
    customer.resetPasswordToken = undefined;
    customer.resetPasswordExpires = undefined;
    await customer.save();
    throw new AppError('Failed to send reset email', 500);
  }

  successResponse(res, 200, 'Password reset email sent', {});
});

/**
 * @desc    Reset password
 * @route   POST /api/v1/customer/auth/reset-password/:token
 * @access  Public
 */
exports.resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  // Hash token
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  // Find customer with valid token
  const customer = await Customer.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!customer) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  // Set new password
  customer.password = password;
  customer.resetPasswordToken = undefined;
  customer.resetPasswordExpires = undefined;
  await customer.save();

  // Generate new token
  const newToken = generateToken(customer._id, 'customer');

  successResponse(res, 200, 'Password reset successful', { token: newToken });
});

/**
 * @desc    Verify email
 * @route   GET /api/v1/customer/auth/verify-email/:token
 * @access  Public
 */
exports.verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  // Hash token
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  // Find customer with valid token
  const customer = await Customer.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() }
  });

  if (!customer) {
    throw new AppError('Invalid or expired verification token', 400);
  }

  // Mark email as verified
  customer.emailVerified = true;
  customer.emailVerificationToken = undefined;
  customer.emailVerificationExpires = undefined;
  await customer.save();

  successResponse(res, 200, 'Email verified successfully', {});
});

module.exports = exports;
