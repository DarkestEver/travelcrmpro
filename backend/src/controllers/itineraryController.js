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
  const query = {
    tenantId: req.tenantId,
  };
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
    tenantId: req.tenantId,
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

  duplicateData.tenantId = req.tenantId;
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
    tenantId: req.tenantId,
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

// @desc    Generate shareable link
// @route   POST /api/v1/itineraries/:id/share
// @access  Private
const generateShareLink = asyncHandler(async (req, res) => {
  const { expiryDays = 30, password } = req.body;
  
  const itinerary = await Itinerary.findById(req.params.id);

  if (!itinerary) {
    throw new AppError('Itinerary not found', 404);
  }

  // Check permissions
  const isOwner = itinerary.createdBy.toString() === req.user._id.toString();
  const isAdmin = ['super_admin', 'operator'].includes(req.user.role);

  if (!isOwner && !isAdmin) {
    throw new AppError('You do not have permission to share this itinerary', 403);
  }

  // Generate shareable link
  const token = itinerary.generateShareableLink(expiryDays, password);
  await itinerary.save();

  const shareUrl = `${req.protocol}://${req.get('host')}/share/itinerary/${token}`;

  successResponse(res, 200, 'Shareable link generated successfully', { 
    shareUrl,
    token,
    expiresAt: itinerary.shareableLink.expiresAt,
    hasPassword: !!password
  });
});

// @desc    Get itinerary by share token
// @route   GET /api/v1/itineraries/share/:token
// @access  Public
const getSharedItinerary = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const itinerary = await Itinerary.findOne({ 'shareableLink.token': token })
    .populate('createdBy', 'name email')
    .populate('days.components.supplierId', 'companyName');

  if (!itinerary) {
    throw new AppError('Itinerary not found or link expired', 404);
  }

  // Check if link expired
  if (itinerary.shareableLink.expiresAt < new Date()) {
    throw new AppError('Share link has expired', 403);
  }

  // Check password if required
  if (itinerary.shareableLink.password) {
    if (!password) {
      throw new AppError('Password required to access this itinerary', 401);
    }
    
    const crypto = require('crypto');
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    
    if (hashedPassword !== itinerary.shareableLink.password) {
      throw new AppError('Incorrect password', 401);
    }
  }

  // Increment view count
  itinerary.shareableLink.views += 1;
  itinerary.viewCount += 1;
  itinerary.lastViewedAt = new Date();
  await itinerary.save();

  successResponse(res, 200, 'Itinerary fetched successfully', { itinerary });
});

// @desc    Add day to itinerary
// @route   POST /api/v1/itineraries/:id/days
// @access  Private
const addDay = asyncHandler(async (req, res) => {
  const itinerary = await Itinerary.findById(req.params.id);

  if (!itinerary) {
    throw new AppError('Itinerary not found', 404);
  }

  // Check permissions
  const isOwner = itinerary.createdBy.toString() === req.user._id.toString();
  const isAdmin = ['super_admin', 'operator'].includes(req.user.role);

  if (!isOwner && !isAdmin) {
    throw new AppError('You do not have permission to modify this itinerary', 403);
  }

  const dayNumber = itinerary.days.length + 1;
  const newDay = {
    dayNumber,
    title: req.body.title || `Day ${dayNumber}`,
    date: req.body.date,
    location: req.body.location,
    weather: req.body.weather,
    components: req.body.components || [],
    ...req.body
  };

  itinerary.days.push(newDay);
  await itinerary.save();

  successResponse(res, 201, 'Day added successfully', { day: itinerary.days[itinerary.days.length - 1] });
});

// @desc    Update day
// @route   PUT /api/v1/itineraries/:id/days/:dayId
// @access  Private
const updateDay = asyncHandler(async (req, res) => {
  const itinerary = await Itinerary.findById(req.params.id);

  if (!itinerary) {
    throw new AppError('Itinerary not found', 404);
  }

  // Check permissions
  const isOwner = itinerary.createdBy.toString() === req.user._id.toString();
  const isAdmin = ['super_admin', 'operator'].includes(req.user.role);

  if (!isOwner && !isAdmin) {
    throw new AppError('You do not have permission to modify this itinerary', 403);
  }

  const day = itinerary.days.id(req.params.dayId);
  
  if (!day) {
    throw new AppError('Day not found', 404);
  }

  Object.assign(day, req.body);
  await itinerary.save();

  successResponse(res, 200, 'Day updated successfully', { day });
});

// @desc    Delete day
// @route   DELETE /api/v1/itineraries/:id/days/:dayId
// @access  Private
const deleteDay = asyncHandler(async (req, res) => {
  const itinerary = await Itinerary.findById(req.params.id);

  if (!itinerary) {
    throw new AppError('Itinerary not found', 404);
  }

  // Check permissions
  const isOwner = itinerary.createdBy.toString() === req.user._id.toString();
  const isAdmin = ['super_admin', 'operator'].includes(req.user.role);

  if (!isOwner && !isAdmin) {
    throw new AppError('You do not have permission to modify this itinerary', 403);
  }

  const day = itinerary.days.id(req.params.dayId);
  
  if (!day) {
    throw new AppError('Day not found', 404);
  }

  day.remove();
  await itinerary.save();

  successResponse(res, 200, 'Day deleted successfully');
});

// @desc    Add component to day
// @route   POST /api/v1/itineraries/:id/days/:dayId/components
// @access  Private
const addComponent = asyncHandler(async (req, res) => {
  const itinerary = await Itinerary.findById(req.params.id);

  if (!itinerary) {
    throw new AppError('Itinerary not found', 404);
  }

  // Check permissions
  const isOwner = itinerary.createdBy.toString() === req.user._id.toString();
  const isAdmin = ['super_admin', 'operator'].includes(req.user.role);

  if (!isOwner && !isAdmin) {
    throw new AppError('You do not have permission to modify this itinerary', 403);
  }

  const day = itinerary.days.id(req.params.dayId);
  
  if (!day) {
    throw new AppError('Day not found', 404);
  }

  const component = {
    type: req.body.type,
    title: req.body.title,
    startTime: req.body.startTime,
    endTime: req.body.endTime,
    location: req.body.location,
    cost: req.body.cost,
    order: day.components.length,
    ...req.body
  };

  day.components.push(component);
  await itinerary.save();

  const addedComponent = day.components[day.components.length - 1];
  successResponse(res, 201, 'Component added successfully', { component: addedComponent });
});

// @desc    Update component
// @route   PUT /api/v1/itineraries/:id/days/:dayId/components/:componentId
// @access  Private
const updateComponent = asyncHandler(async (req, res) => {
  const itinerary = await Itinerary.findById(req.params.id);

  if (!itinerary) {
    throw new AppError('Itinerary not found', 404);
  }

  // Check permissions
  const isOwner = itinerary.createdBy.toString() === req.user._id.toString();
  const isAdmin = ['super_admin', 'operator'].includes(req.user.role);

  if (!isOwner && !isAdmin) {
    throw new AppError('You do not have permission to modify this itinerary', 403);
  }

  const day = itinerary.days.id(req.params.dayId);
  
  if (!day) {
    throw new AppError('Day not found', 404);
  }

  const component = day.components.id(req.params.componentId);
  
  if (!component) {
    throw new AppError('Component not found', 404);
  }

  Object.assign(component, req.body);
  await itinerary.save();

  successResponse(res, 200, 'Component updated successfully', { component });
});

// @desc    Delete component
// @route   DELETE /api/v1/itineraries/:id/days/:dayId/components/:componentId
// @access  Private
const deleteComponent = asyncHandler(async (req, res) => {
  const itinerary = await Itinerary.findById(req.params.id);

  if (!itinerary) {
    throw new AppError('Itinerary not found', 404);
  }

  // Check permissions
  const isOwner = itinerary.createdBy.toString() === req.user._id.toString();
  const isAdmin = ['super_admin', 'operator'].includes(req.user.role);

  if (!isOwner && !isAdmin) {
    throw new AppError('You do not have permission to modify this itinerary', 403);
  }

  const day = itinerary.days.id(req.params.dayId);
  
  if (!day) {
    throw new AppError('Day not found', 404);
  }

  const component = day.components.id(req.params.componentId);
  
  if (!component) {
    throw new AppError('Component not found', 404);
  }

  component.remove();
  await itinerary.save();

  successResponse(res, 200, 'Component deleted successfully');
});

// @desc    Reorder components within a day
// @route   PUT /api/v1/itineraries/:id/days/:dayId/reorder
// @access  Private
const reorderComponents = asyncHandler(async (req, res) => {
  const { componentIds } = req.body; // Array of component IDs in new order

  if (!Array.isArray(componentIds)) {
    throw new AppError('componentIds must be an array', 400);
  }

  const itinerary = await Itinerary.findById(req.params.id);

  if (!itinerary) {
    throw new AppError('Itinerary not found', 404);
  }

  // Check permissions
  const isOwner = itinerary.createdBy.toString() === req.user._id.toString();
  const isAdmin = ['super_admin', 'operator'].includes(req.user.role);

  if (!isOwner && !isAdmin) {
    throw new AppError('You do not have permission to modify this itinerary', 403);
  }

  const day = itinerary.days.id(req.params.dayId);
  
  if (!day) {
    throw new AppError('Day not found', 404);
  }

  // Update order for each component
  componentIds.forEach((id, index) => {
    const component = day.components.id(id);
    if (component) {
      component.order = index;
    }
  });

  // Sort components by order
  day.components.sort((a, b) => a.order - b.order);
  
  await itinerary.save();

  successResponse(res, 200, 'Components reordered successfully', { components: day.components });
});

// @desc    Get itinerary statistics
// @route   GET /api/v1/itineraries/:id/stats
// @access  Private
const getItineraryStats = asyncHandler(async (req, res) => {
  const itinerary = await Itinerary.findById(req.params.id);

  if (!itinerary) {
    throw new AppError('Itinerary not found', 404);
  }

  // Check permissions
  const isOwner = itinerary.createdBy.toString() === req.user._id.toString();
  const isAdmin = ['super_admin', 'operator'].includes(req.user.role);

  if (!isOwner && !isAdmin) {
    throw new AppError('You do not have permission to view this itinerary', 403);
  }

  const stats = {
    totalDays: itinerary.days.length,
    totalNights: Math.max(0, itinerary.days.length - 1),
    totalComponents: itinerary.getTotalComponents(),
    componentsByType: {
      stays: itinerary.getComponentsByType('stay').length,
      transfers: itinerary.getComponentsByType('transfer').length,
      activities: itinerary.getComponentsByType('activity').length,
      meals: itinerary.getComponentsByType('meal').length,
      notes: itinerary.getComponentsByType('note').length,
    },
    estimatedCost: itinerary.estimatedCost,
    viewCount: itinerary.viewCount,
    downloadCount: itinerary.downloadCount,
    destinations: itinerary.destinations,
    status: itinerary.status,
    version: itinerary.version,
  };

  successResponse(res, 200, 'Statistics fetched successfully', { stats });
});

// @desc    Clone itinerary (using instance method)
// @route   POST /api/v1/itineraries/:id/clone
// @access  Private
const cloneItinerary = asyncHandler(async (req, res) => {
  const originalItinerary = await Itinerary.findById(req.params.id);

  if (!originalItinerary) {
    throw new AppError('Itinerary not found', 404);
  }

  // Check permissions
  const isOwner = originalItinerary.createdBy.toString() === req.user._id.toString();
  const isPublicTemplate = originalItinerary.isTemplate;
  const isAdmin = ['super_admin', 'operator'].includes(req.user.role);

  if (!isOwner && !isPublicTemplate && !isAdmin) {
    throw new AppError('You do not have permission to clone this itinerary', 403);
  }

  // Use instance method to clone
  const clonedData = originalItinerary.clone();
  clonedData.tenantId = req.tenantId;
  clonedData.createdBy = req.user._id;

  const newItinerary = await Itinerary.create(clonedData);
  await newItinerary.populate('createdBy', 'name email');

  successResponse(res, 201, 'Itinerary cloned successfully', { itinerary: newItinerary });
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
  generateShareLink,
  getSharedItinerary,
  addDay,
  updateDay,
  deleteDay,
  addComponent,
  updateComponent,
  deleteComponent,
  reorderComponents,
  getItineraryStats,
  cloneItinerary,
};
