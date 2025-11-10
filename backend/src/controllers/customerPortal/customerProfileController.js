/**
 * Customer Portal Profile Controller
 * Handles customer profile management
 */

const { asyncHandler, AppError } = require('../../middleware/errorHandler');
const { successResponse } = require('../../utils/response');
const Customer = require('../../models/Customer');

/**
 * @desc    Get customer profile
 * @route   GET /api/v1/customer/profile
 * @access  Private (Customer)
 */
exports.getProfile = asyncHandler(async (req, res) => {
  const customerId = req.user._id;

  const customer = await Customer.findById(customerId)
    .populate('agentId', 'agencyName contactPerson email phone')
    .lean();

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  successResponse(res, 200, 'Profile retrieved successfully', {
    customer,
  });
});

/**
 * @desc    Update customer profile
 * @route   PUT /api/v1/customer/profile
 * @access  Private (Customer)
 */
exports.updateProfile = asyncHandler(async (req, res) => {
  const customerId = req.user._id;

  const {
    firstName,
    lastName,
    phone,
    address,
    emergencyContact,
    preferences,
    passportInfo,
  } = req.body;

  const customer = await Customer.findById(customerId);

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  // Update allowed fields
  if (firstName) customer.firstName = firstName;
  if (lastName) customer.lastName = lastName;
  if (phone) customer.phone = phone;
  if (address) customer.address = { ...customer.address, ...address };
  if (emergencyContact) customer.emergencyContact = { ...customer.emergencyContact, ...emergencyContact };
  if (preferences) customer.preferences = { ...customer.preferences, ...preferences };
  if (passportInfo) customer.passportInfo = { ...customer.passportInfo, ...passportInfo };

  await customer.save();

  successResponse(res, 200, 'Profile updated successfully', {
    customer: customer.toObject(),
  });
});

/**
 * @desc    Change password
 * @route   PUT /api/v1/customer/profile/change-password
 * @access  Private (Customer)
 */
exports.changePassword = asyncHandler(async (req, res) => {
  const customerId = req.user._id;
  const { currentPassword, newPassword } = req.body;

  // Validation
  if (!currentPassword || !newPassword) {
    throw new AppError('Please provide current and new password', 400);
  }

  if (newPassword.length < 6) {
    throw new AppError('New password must be at least 6 characters', 400);
  }

  // Get customer with password
  const customer = await Customer.findById(customerId).select('+password');

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  // Check current password
  const isPasswordValid = await customer.comparePassword(currentPassword);
  if (!isPasswordValid) {
    throw new AppError('Current password is incorrect', 401);
  }

  // Update password
  customer.password = newPassword;
  await customer.save();

  successResponse(res, 200, 'Password changed successfully', {});
});

/**
 * @desc    Update email
 * @route   PUT /api/v1/customer/profile/update-email
 * @access  Private (Customer)
 */
exports.updateEmail = asyncHandler(async (req, res) => {
  const customerId = req.user._id;
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    throw new AppError('Please provide email and password', 400);
  }

  // Get customer with password
  const customer = await Customer.findById(customerId).select('+password');

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  // Verify password
  const isPasswordValid = await customer.comparePassword(password);
  if (!isPasswordValid) {
    throw new AppError('Password is incorrect', 401);
  }

  // Check if email already exists
  const existingCustomer = await Customer.findOne({
    email: email.toLowerCase(),
    tenantId: customer.tenantId,
    _id: { $ne: customerId },
  });

  if (existingCustomer) {
    throw new AppError('Email already in use', 400);
  }

  // Update email and reset verification
  customer.email = email.toLowerCase();
  customer.emailVerified = false;
  await customer.save();

  // TODO: Send verification email
  // await emailService.sendEmailVerification(customer);

  successResponse(res, 200, 'Email updated successfully. Please verify your new email.', {
    customer: {
      email: customer.email,
      emailVerified: customer.emailVerified,
    },
  });
});

/**
 * @desc    Upload document
 * @route   POST /api/v1/customer/profile/documents
 * @access  Private (Customer)
 */
exports.uploadDocument = asyncHandler(async (req, res) => {
  const customerId = req.user._id;
  const { type, name, url } = req.body;

  if (!type || !name || !url) {
    throw new AppError('Document type, name, and URL are required', 400);
  }

  const customer = await Customer.findById(customerId);

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  // Add document
  customer.documents.push({
    type,
    name,
    url,
    uploadedAt: Date.now(),
  });

  await customer.save();

  successResponse(res, 200, 'Document uploaded successfully', {
    documents: customer.documents,
  });
});

/**
 * @desc    Delete document
 * @route   DELETE /api/v1/customer/profile/documents/:documentId
 * @access  Private (Customer)
 */
exports.deleteDocument = asyncHandler(async (req, res) => {
  const customerId = req.user._id;
  const { documentId } = req.params;

  const customer = await Customer.findById(customerId);

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  // Remove document
  customer.documents = customer.documents.filter(
    (doc) => doc._id.toString() !== documentId
  );

  await customer.save();

  successResponse(res, 200, 'Document deleted successfully', {
    documents: customer.documents,
  });
});

module.exports = exports;
