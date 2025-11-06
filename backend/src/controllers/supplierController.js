const { Supplier, User } = require('../models');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { successResponse, paginatedResponse } = require('../utils/response');
const { parsePagination, parseSort, buildSearchQuery } = require('../utils/pagination');

// @desc    Get all suppliers
// @route   GET /api/v1/suppliers
// @access  Private
const getAllSuppliers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req);
  const sortBy = parseSort(req, '-createdAt');
  const { status, country, serviceTypes, search } = req.query;

  // Build query
  const query = {};
  if (status) query.status = status;
  if (country) query.country = country;
  if (serviceTypes) query.serviceTypes = { $in: serviceTypes.split(',') };
  if (search) {
    Object.assign(query, buildSearchQuery(search, ['companyName', 'country']));
  }

  // Execute query
  const [suppliers, total] = await Promise.all([
    Supplier.find(query)
      .populate('userId', 'name email phone avatar')
      .sort(sortBy)
      .skip(skip)
      .limit(limit),
    Supplier.countDocuments(query),
  ]);

  paginatedResponse(res, 200, suppliers, page, limit, total);
});

// @desc    Get single supplier
// @route   GET /api/v1/suppliers/:id
// @access  Private
const getSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findById(req.params.id).populate('userId', 'name email phone avatar');

  if (!supplier) {
    throw new AppError('Supplier not found', 404);
  }

  // Supplier users can only view their own profile
  if (req.user.role === 'supplier' && req.supplier._id.toString() !== supplier._id.toString()) {
    throw new AppError('You do not have permission to view this supplier', 403);
  }

  successResponse(res, 200, 'Supplier fetched successfully', { supplier });
});

// @desc    Create supplier profile
// @route   POST /api/v1/suppliers
// @access  Private (super_admin, operator) or self-registration
const createSupplier = asyncHandler(async (req, res) => {
  let { userId } = req.body;
  
  // If userId not provided, use authenticated user's ID
  if (!userId) {
    userId = req.user._id;
  }
  
  const {
    companyName,
    email,
    phone,
    country,
    city,
    address,
    contactPersons,
    serviceTypes,
    currencies,
    paymentTerms,
    defaultMarkup,
    bankDetails,
    contracts,
    certificates,
  } = req.body;

  // Check if supplier already exists for this user
  const existingSupplier = await Supplier.findOne({ userId });
  if (existingSupplier) {
    throw new AppError('Supplier profile already exists for this user', 400);
  }

  // Verify user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Only suppliers can register themselves; admins can create any supplier
  if (req.user.role === 'supplier' && req.user._id.toString() !== userId) {
    throw new AppError('You can only create your own supplier profile', 403);
  }

  // Create supplier
  const supplier = await Supplier.create({
    userId,
    companyName,
    email,
    phone,
    country,
    city,
    address,
    contactPersons,
    serviceTypes,
    currencies,
    paymentTerms,
    defaultMarkup: defaultMarkup || 0,
    bankDetails,
    contracts,
    certificates,
    status: req.user.role === 'supplier' ? 'pending' : 'active',
  });

  successResponse(res, 201, 'Supplier profile created successfully', { supplier });
});

// @desc    Update supplier profile
// @route   PUT /api/v1/suppliers/:id
// @access  Private
const updateSupplier = asyncHandler(async (req, res) => {
  let supplier = await Supplier.findById(req.params.id);

  if (!supplier) {
    throw new AppError('Supplier not found', 404);
  }

  // Supplier users can only update their own profile
  if (req.user.role === 'supplier' && req.supplier._id.toString() !== supplier._id.toString()) {
    throw new AppError('You do not have permission to update this supplier', 403);
  }

  // Restrict fields suppliers can update
  const allowedFields = req.user.role === 'supplier'
    ? ['contactPersons', 'address', 'bankDetails', 'certificates']
    : Object.keys(req.body);

  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  supplier = await Supplier.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  }).populate('userId', 'name email phone avatar');

  successResponse(res, 200, 'Supplier updated successfully', { supplier });
});

// @desc    Approve supplier
// @route   PATCH /api/v1/suppliers/:id/approve
// @access  Private (super_admin, operator)
const approveSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findById(req.params.id).populate('userId');

  if (!supplier) {
    throw new AppError('Supplier not found', 404);
  }

  if (supplier.status !== 'pending') {
    throw new AppError('Supplier is not in pending status', 400);
  }

  supplier.status = 'active';
  await supplier.save();

  successResponse(res, 200, 'Supplier approved successfully', { supplier });
});

// @desc    Suspend supplier
// @route   PATCH /api/v1/suppliers/:id/suspend
// @access  Private (super_admin, operator)
const suspendSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findByIdAndUpdate(
    req.params.id,
    { status: 'suspended' },
    { new: true }
  ).populate('userId', 'name email phone avatar');

  if (!supplier) {
    throw new AppError('Supplier not found', 404);
  }

  successResponse(res, 200, 'Supplier suspended successfully', { supplier });
});

// @desc    Reactivate supplier
// @route   PATCH /api/v1/suppliers/:id/reactivate
// @access  Private (super_admin, operator)
const reactivateSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findByIdAndUpdate(
    req.params.id,
    { status: 'active' },
    { new: true }
  ).populate('userId', 'name email phone avatar');

  if (!supplier) {
    throw new AppError('Supplier not found', 404);
  }

  successResponse(res, 200, 'Supplier reactivated successfully', { supplier });
});

// @desc    Delete supplier
// @route   DELETE /api/v1/suppliers/:id
// @access  Private (super_admin only)
const deleteSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);

  if (!supplier) {
    throw new AppError('Supplier not found', 404);
  }

  supplier.status = 'inactive';
  await supplier.save();

  successResponse(res, 200, 'Supplier deleted successfully');
});

// @desc    Update supplier rating
// @route   PATCH /api/v1/suppliers/:id/rating
// @access  Private (operator, super_admin)
const updateSupplierRating = asyncHandler(async (req, res) => {
  const { rating, review } = req.body;

  if (rating < 1 || rating > 5) {
    throw new AppError('Rating must be between 1 and 5', 400);
  }

  const supplier = await Supplier.findById(req.params.id);

  if (!supplier) {
    throw new AppError('Supplier not found', 404);
  }

  // Calculate new average rating
  const totalRatings = (supplier.performance.totalRatings || 0) + 1;
  const currentAverage = supplier.rating || 0;
  const newAverage = ((currentAverage * (totalRatings - 1)) + rating) / totalRatings;

  supplier.rating = newAverage;
  supplier.performance.totalRatings = totalRatings;

  if (review) {
    supplier.performance.reviews = supplier.performance.reviews || [];
    supplier.performance.reviews.push({
      rating,
      review,
      reviewedBy: req.user._id,
      date: Date.now(),
    });
  }

  await supplier.save();

  successResponse(res, 200, 'Supplier rating updated successfully', { supplier });
});

// @desc    Get supplier statistics
// @route   GET /api/v1/suppliers/stats (general stats)
// @route   GET /api/v1/suppliers/:id/stats (individual supplier stats)
// @access  Private
const getSupplierStats = asyncHandler(async (req, res) => {
  // If no ID provided, return general statistics
  if (!req.params.id || req.params.id === 'stats') {
    const [totalSuppliers, activeSuppliers, avgRating] = await Promise.all([
      Supplier.countDocuments(),
      Supplier.countDocuments({ status: 'active' }),
      Supplier.aggregate([
        { $group: { _id: null, avgRating: { $avg: '$rating' } } }
      ])
    ]);
    
    const stats = {
      totalSuppliers,
      activeSuppliers,
      averageRating: avgRating[0]?.avgRating || 0
    };
    
    return successResponse(res, 200, 'Supplier statistics fetched successfully', stats);
  }
  
  // Individual supplier stats
  const supplier = await Supplier.findById(req.params.id);

  if (!supplier) {
    throw new AppError('Supplier not found', 404);
  }

  // Supplier users can only view their own stats
  if (req.user.role === 'supplier' && req.supplier._id.toString() !== supplier._id.toString()) {
    throw new AppError('You do not have permission to view these statistics', 403);
  }

  const stats = {
    companyName: supplier.companyName,
    rating: supplier.rating,
    totalBookings: supplier.performance.totalBookings,
    completedBookings: supplier.performance.completedBookings,
    cancelledBookings: supplier.performance.cancelledBookings,
    completionRate: supplier.performance.totalBookings > 0
      ? (supplier.performance.completedBookings / supplier.performance.totalBookings * 100).toFixed(2)
      : 0,
    averageResponseTime: supplier.performance.averageResponseTime,
    status: supplier.status,
    joinDate: supplier.createdAt,
  };

  successResponse(res, 200, 'Supplier statistics fetched successfully', { stats });
});

module.exports = {
  getAllSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  approveSupplier,
  suspendSupplier,
  reactivateSupplier,
  deleteSupplier,
  updateSupplierRating,
  getSupplierStats,
};
