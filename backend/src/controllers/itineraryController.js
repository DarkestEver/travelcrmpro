const { Itinerary } = require('../models');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { successResponse, paginatedResponse } = require('../utils/response');
const { parsePagination, parseSort, buildSearchQuery } = require('../utils/pagination');

// @desc    Get all itineraries
// @route   GET /api/v1/itineraries
// @access  Private
const getAllItineraries = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req);
  const sortBy = parseSort(req, '-createdAt');
  const { status, travelStyle, search, tags } = req.query;

  // Build query
  const query = {};
  if (status) query.status = status;
  if (travelStyle) query.travelStyle = travelStyle;
  if (tags) query.tags = { $in: tags.split(',') };
  if (search) {
    Object.assign(query, buildSearchQuery(search, ['title', 'description', 'destination.country', 'destination.city']));
  }

  // Agents can only see their own itineraries (unless it's a template)
  if (req.user.role === 'agent') {
    query.$or = [
      { createdBy: req.user._id },
      { isTemplate: true, templateVisibility: 'public' },
    ];
  }

  // Execute query
  const [itineraries, total] = await Promise.all([
    Itinerary.find(query)
      .populate('createdBy', 'name email')
      .sort(sortBy)
      .skip(skip)
      .limit(limit),
    Itinerary.countDocuments(query),
  ]);

  paginatedResponse(res, 200, itineraries, page, limit, total);
});

// @desc    Get single itinerary
// @route   GET /api/v1/itineraries/:id
// @access  Private
const getItinerary = asyncHandler(async (req, res) => {
  const itinerary = await Itinerary.findById(req.params.id)
    .populate('createdBy', 'name email')
    .populate('days.components.supplierId', 'companyName serviceTypes');

  if (!itinerary) {
    throw new AppError('Itinerary not found', 404);
  }

  // Check permissions
  const isOwner = itinerary.createdBy._id.toString() === req.user._id.toString();
  const isPublicTemplate = itinerary.isTemplate && itinerary.templateVisibility === 'public';
  const isAdmin = ['super_admin', 'operator'].includes(req.user.role);

  if (!isOwner && !isPublicTemplate && !isAdmin) {
    throw new AppError('You do not have permission to view this itinerary', 403);
  }

  successResponse(res, 200, 'Itinerary fetched successfully', { itinerary });
});

// @desc    Create itinerary
// @route   POST /api/v1/itineraries
// @access  Private (agent, operator, super_admin)
const createItinerary = asyncHandler(async (req, res) => {
  const itineraryData = {
    ...req.body,
    createdBy: req.user._id,
  };

  // Only admins can create templates
  if (itineraryData.isTemplate && !['super_admin', 'operator'].includes(req.user.role)) {
    throw new AppError('Only administrators can create templates', 403);
  }

  const itinerary = await Itinerary.create(itineraryData);
  await itinerary.populate('createdBy', 'name email');

  successResponse(res, 201, 'Itinerary created successfully', { itinerary });
});

// @desc    Update itinerary
// @route   PUT /api/v1/itineraries/:id
// @access  Private
const updateItinerary = asyncHandler(async (req, res) => {
  let itinerary = await Itinerary.findById(req.params.id);

  if (!itinerary) {
    throw new AppError('Itinerary not found', 404);
  }

  // Check permissions
  const isOwner = itinerary.createdBy.toString() === req.user._id.toString();
  const isAdmin = ['super_admin', 'operator'].includes(req.user.role);

  if (!isOwner && !isAdmin) {
    throw new AppError('You do not have permission to update this itinerary', 403);
  }

  // Version control: save current version before updating
  if (req.body.saveVersion && itinerary.version) {
    const versionData = {
      versionNumber: itinerary.version,
      days: itinerary.days,
      estimatedCost: itinerary.estimatedCost,
      savedAt: Date.now(),
      savedBy: req.user._id,
    };
    itinerary.versions = itinerary.versions || [];
    itinerary.versions.push(versionData);
  }

  // Update version number
  if (req.body.days) {
    itinerary.version = (itinerary.version || 1) + 1;
  }

  itinerary = await Itinerary.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate('createdBy', 'name email');

  successResponse(res, 200, 'Itinerary updated successfully', { itinerary });
});

// @desc    Duplicate itinerary
// @route   POST /api/v1/itineraries/:id/duplicate
// @access  Private
const duplicateItinerary = asyncHandler(async (req, res) => {
  const originalItinerary = await Itinerary.findById(req.params.id);

  if (!originalItinerary) {
    throw new AppError('Itinerary not found', 404);
  }

  // Check permissions
  const isOwner = originalItinerary.createdBy.toString() === req.user._id.toString();
  const isPublicTemplate = originalItinerary.isTemplate && originalItinerary.templateVisibility === 'public';
  const isAdmin = ['super_admin', 'operator'].includes(req.user.role);

  if (!isOwner && !isPublicTemplate && !isAdmin) {
    throw new AppError('You do not have permission to duplicate this itinerary', 403);
  }

  // Create duplicate
  const duplicateData = originalItinerary.toObject();
  delete duplicateData._id;
  delete duplicateData.createdAt;
  delete duplicateData.updatedAt;
  delete duplicateData.versions;

  duplicateData.title = `${duplicateData.title} (Copy)`;
  duplicateData.createdBy = req.user._id;
  duplicateData.status = 'draft';
  duplicateData.isTemplate = false;
  duplicateData.version = 1;
  duplicateData.clonedFrom = originalItinerary._id;

  const newItinerary = await Itinerary.create(duplicateData);
  await newItinerary.populate('createdBy', 'name email');

  successResponse(res, 201, 'Itinerary duplicated successfully', { itinerary: newItinerary });
});

// @desc    Delete itinerary
// @route   DELETE /api/v1/itineraries/:id
// @access  Private
const deleteItinerary = asyncHandler(async (req, res) => {
  const itinerary = await Itinerary.findById(req.params.id);

  if (!itinerary) {
    throw new AppError('Itinerary not found', 404);
  }

  // Check permissions
  const isOwner = itinerary.createdBy.toString() === req.user._id.toString();
  const isAdmin = ['super_admin', 'operator'].includes(req.user.role);

  if (!isOwner && !isAdmin) {
    throw new AppError('You do not have permission to delete this itinerary', 403);
  }

  // Check if itinerary is used in any quotes or bookings
  const { Quote, Booking } = require('../models');
  const [quotesCount, bookingsCount] = await Promise.all([
    Quote.countDocuments({ itineraryId: itinerary._id }),
    Booking.countDocuments({ itineraryId: itinerary._id }),
  ]);

  if (quotesCount > 0 || bookingsCount > 0) {
    throw new AppError('Cannot delete itinerary that is used in quotes or bookings. Archive it instead.', 400);
  }

  await itinerary.deleteOne();

  successResponse(res, 200, 'Itinerary deleted successfully');
});

// @desc    Archive itinerary
// @route   PATCH /api/v1/itineraries/:id/archive
// @access  Private
const archiveItinerary = asyncHandler(async (req, res) => {
  const itinerary = await Itinerary.findById(req.params.id);

  if (!itinerary) {
    throw new AppError('Itinerary not found', 404);
  }

  // Check permissions
  const isOwner = itinerary.createdBy.toString() === req.user._id.toString();
  const isAdmin = ['super_admin', 'operator'].includes(req.user.role);

  if (!isOwner && !isAdmin) {
    throw new AppError('You do not have permission to archive this itinerary', 403);
  }

  itinerary.status = 'archived';
  await itinerary.save();

  successResponse(res, 200, 'Itinerary archived successfully', { itinerary });
});

// @desc    Publish itinerary as template
// @route   PATCH /api/v1/itineraries/:id/publish-template
// @access  Private (operator, super_admin)
const publishAsTemplate = asyncHandler(async (req, res) => {
  const { templateVisibility } = req.body;

  const itinerary = await Itinerary.findById(req.params.id);

  if (!itinerary) {
    throw new AppError('Itinerary not found', 404);
  }

  itinerary.isTemplate = true;
  itinerary.templateVisibility = templateVisibility || 'public';
  itinerary.status = 'published';
  await itinerary.save();

  successResponse(res, 200, 'Itinerary published as template successfully', { itinerary });
});

// @desc    Calculate itinerary cost
// @route   GET /api/v1/itineraries/:id/calculate-cost
// @access  Private
const calculateCost = asyncHandler(async (req, res) => {
  const itinerary = await Itinerary.findById(req.params.id);

  if (!itinerary) {
    throw new AppError('Itinerary not found', 404);
  }

  // Cost is calculated automatically via pre-save hook
  const costBreakdown = {
    baseCost: itinerary.estimatedCost.baseCost,
    breakdown: itinerary.estimatedCost.breakdown,
    totalDays: itinerary.days.length,
    totalComponents: itinerary.days.reduce((sum, day) => sum + day.components.length, 0),
  };

  successResponse(res, 200, 'Cost calculated successfully', { costBreakdown });
});

// @desc    Get itinerary templates
// @route   GET /api/v1/itineraries/templates
// @access  Private
const getTemplates = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req);
  const { travelStyle, search } = req.query;

  const query = {
    isTemplate: true,
    templateVisibility: 'public',
    status: 'published',
  };

  if (travelStyle) query.travelStyle = travelStyle;
  if (search) {
    Object.assign(query, buildSearchQuery(search, ['title', 'description', 'destination.country']));
  }

  const [templates, total] = await Promise.all([
    Itinerary.find(query)
      .populate('createdBy', 'name')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit),
    Itinerary.countDocuments(query),
  ]);

  paginatedResponse(res, 200, templates, page, limit, total);
});

module.exports = {
  getAllItineraries,
  getItinerary,
  createItinerary,
  updateItinerary,
  duplicateItinerary,
  deleteItinerary,
  archiveItinerary,
  publishAsTemplate,
  calculateCost,
  getTemplates,
};
