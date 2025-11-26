const Itinerary = require('../models/Itinerary');
const Lead = require('../models/Lead');
const User = require('../models/User');
const { NotFoundError, ValidationError, ForbiddenError } = require('../lib/errors');
const { USER_ROLES } = require('../config/constants');
const logger = require('../lib/logger');

/**
 * Get all itineraries with filtering and pagination
 * GET /api/v1/itineraries
 */
const getAllItineraries = async (req, res) => {
  const { status, isTemplate, startDate, endDate, createdBy, page = 1, limit = 20, search } = req.query;
  const tenantId = req.user.tenant;
  const userId = req.userId;
  const userRole = req.user.role;

  // Build filter
  const filter = { tenant: tenantId };

  // Agents can only see itineraries they created
  if (userRole === USER_ROLES.AGENT) {
    filter.createdBy = userId;
  }

  if (status) filter.status = status;
  if (isTemplate !== undefined) filter.isTemplate = isTemplate === 'true';
  if (createdBy) filter.createdBy = createdBy;

  // Date range filter
  if (startDate || endDate) {
    filter.startDate = {};
    if (startDate) filter.startDate.$gte = new Date(startDate);
    if (endDate) filter.startDate.$lte = new Date(endDate);
  }

  // Text search
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { destination: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  // Pagination
  const skip = (page - 1) * limit;
  const totalItems = await Itinerary.countDocuments(filter);
  const totalPages = Math.ceil(totalItems / limit);

  const itineraries = await Itinerary.find(filter)
    .populate('createdBy', 'firstName lastName email')
    .populate('lastModifiedBy', 'firstName lastName')
    .populate('lead', 'customer.name customer.email status')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  logger.info('Itineraries fetched', {
    count: itineraries.length,
    tenantId,
    userId,
    requestId: req.id,
  });

  res.json({
    success: true,
    data: itineraries,
    meta: {
      currentPage: parseInt(page),
      totalPages,
      totalItems,
      itemsPerPage: parseInt(limit),
    },
  });
};

/**
 * Get single itinerary by ID
 * GET /api/v1/itineraries/:id
 */
const getItinerary = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;
  const userRole = req.user.role;
  const tenantId = req.user.tenant;

  const itinerary = await Itinerary.findOne({ _id: id, tenant: tenantId })
    .populate('createdBy', 'firstName lastName email')
    .populate('lastModifiedBy', 'firstName lastName')
    .populate('lead', 'customer status')
    .populate('days.activities.supplier', 'name type')
    .populate('days.accommodation.supplier', 'name type')
    .populate('days.transport.supplier', 'name type');

  if (!itinerary) {
    throw new NotFoundError('Itinerary not found', 'ITINERARY_NOT_FOUND');
  }

  // Agents can only view their own itineraries
  const createdById = itinerary.createdBy?._id || itinerary.createdBy;
  if (userRole === USER_ROLES.AGENT && createdById?.toString() !== userId.toString()) {
    throw new ForbiddenError('You can only view itineraries you created', 'ACCESS_DENIED');
  }

  logger.info('Itinerary fetched', {
    itineraryId: id,
    userId,
    requestId: req.id,
  });

  res.json({
    success: true,
    data: itinerary,
  });
};

/**
 * Create new itinerary
 * POST /api/v1/itineraries
 */
const createItinerary = async (req, res) => {
  const userId = req.userId;
  const tenantId = req.user.tenant;
  const itineraryData = req.body;

  // Validate lead exists if provided
  if (itineraryData.lead) {
    const lead = await Lead.findOne({ _id: itineraryData.lead, tenant: tenantId });
    if (!lead) {
      throw new ValidationError('Lead not found', 'LEAD_NOT_FOUND');
    }
  }

  // Calculate duration from dates
  let duration;
  if (itineraryData.startDate && itineraryData.endDate) {
    const start = new Date(itineraryData.startDate);
    const end = new Date(itineraryData.endDate);
    const diffTime = Math.abs(end - start);
    duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Include both start and end days
  }

  // Create itinerary
  const itinerary = await Itinerary.create({
    ...itineraryData,
    duration,
    tenant: tenantId,
    createdBy: userId,
    lastModifiedBy: userId,
  });

  // Calculate initial pricing
  itinerary.updatePricing();
  await itinerary.save();

  const populated = await Itinerary.findById(itinerary._id)
    .populate('createdBy', 'firstName lastName email')
    .populate('lead', 'customer.name customer.email');

  logger.info('Itinerary created', {
    itineraryId: itinerary._id,
    userId,
    requestId: req.id,
  });

  res.status(201).json({
    success: true,
    data: populated,
  });
};

/**
 * Update itinerary
 * PUT /api/v1/itineraries/:id
 */
const updateItinerary = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;
  const userRole = req.user.role;
  const tenantId = req.user.tenant;
  const updates = req.body;

  const itinerary = await Itinerary.findOne({ _id: id, tenant: tenantId });

  if (!itinerary) {
    throw new NotFoundError('Itinerary not found', 'ITINERARY_NOT_FOUND');
  }

  // Agents can only update their own itineraries
  if (userRole === USER_ROLES.AGENT && itinerary.createdBy.toString() !== userId.toString()) {
    throw new ForbiddenError('You can only update itineraries you created', 'ACCESS_DENIED');
  }

  // Update fields
  const allowedUpdates = [
    'title', 'description', 'destination', 'startDate', 'endDate',
    'numberOfTravelers', 'days', 'pricing', 'status', 'tags',
    'isTemplate', 'templateName', 'internalNotes', 'clientNotes',
  ];

  allowedUpdates.forEach(field => {
    if (updates[field] !== undefined) {
      itinerary[field] = updates[field];
    }
  });

  itinerary.lastModifiedBy = userId;
  itinerary.version += 1;

  // Recalculate pricing if days were updated
  if (updates.days || updates.pricing) {
    itinerary.updatePricing();
  }

  await itinerary.save();

  const populated = await Itinerary.findById(itinerary._id)
    .populate('createdBy', 'firstName lastName email')
    .populate('lastModifiedBy', 'firstName lastName')
    .populate('lead', 'customer.name customer.email');

  logger.info('Itinerary updated', {
    itineraryId: id,
    userId,
    requestId: req.id,
  });

  res.json({
    success: true,
    data: populated,
  });
};

/**
 * Delete itinerary
 * DELETE /api/v1/itineraries/:id
 */
const deleteItinerary = async (req, res) => {
  const { id } = req.params;
  const tenantId = req.user.tenant;

  const itinerary = await Itinerary.findOneAndDelete({ _id: id, tenant: tenantId });

  if (!itinerary) {
    throw new NotFoundError('Itinerary not found', 'ITINERARY_NOT_FOUND');
  }

  logger.info('Itinerary deleted', {
    itineraryId: id,
    userId: req.userId,
    requestId: req.id,
  });

  res.json({
    success: true,
    message: 'Itinerary deleted successfully',
  });
};

/**
 * Add day to itinerary
 * POST /api/v1/itineraries/:id/days
 */
const addDay = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;
  const userRole = req.user.role;
  const tenantId = req.user.tenant;
  const dayData = req.body;

  const itinerary = await Itinerary.findOne({ _id: id, tenant: tenantId });

  if (!itinerary) {
    throw new NotFoundError('Itinerary not found', 'ITINERARY_NOT_FOUND');
  }

  // Agents can only update their own itineraries
  if (userRole === USER_ROLES.AGENT && itinerary.createdBy.toString() !== userId.toString()) {
    throw new ForbiddenError('You can only modify itineraries you created', 'ACCESS_DENIED');
  }

  const newDay = itinerary.addDay(dayData);
  itinerary.lastModifiedBy = userId;
  itinerary.updatePricing();
  await itinerary.save();

  logger.info('Day added to itinerary', {
    itineraryId: id,
    dayNumber: newDay.dayNumber,
    userId,
    requestId: req.id,
  });

  res.status(201).json({
    success: true,
    data: itinerary,
  });
};

/**
 * Update day in itinerary
 * PUT /api/v1/itineraries/:id/days/:dayNumber
 */
const updateDay = async (req, res) => {
  const { id, dayNumber } = req.params;
  const userId = req.userId;
  const userRole = req.user.role;
  const tenantId = req.user.tenant;
  const dayUpdates = req.body;

  const itinerary = await Itinerary.findOne({ _id: id, tenant: tenantId });

  if (!itinerary) {
    throw new NotFoundError('Itinerary not found', 'ITINERARY_NOT_FOUND');
  }

  // Agents can only update their own itineraries
  if (userRole === USER_ROLES.AGENT && itinerary.createdBy.toString() !== userId.toString()) {
    throw new ForbiddenError('You can only modify itineraries you created', 'ACCESS_DENIED');
  }

  const dayIndex = itinerary.days.findIndex(d => d.dayNumber === parseInt(dayNumber));
  if (dayIndex === -1) {
    throw new NotFoundError('Day not found', 'DAY_NOT_FOUND');
  }

  // Update day fields
  const day = itinerary.days[dayIndex];
  Object.keys(dayUpdates).forEach(key => {
    if (key !== 'dayNumber') { // Don't allow changing day number
      day[key] = dayUpdates[key];
    }
  });

  itinerary.lastModifiedBy = userId;
  itinerary.updatePricing();
  await itinerary.save();

  logger.info('Day updated in itinerary', {
    itineraryId: id,
    dayNumber,
    userId,
    requestId: req.id,
  });

  res.json({
    success: true,
    data: itinerary,
  });
};

/**
 * Remove day from itinerary
 * DELETE /api/v1/itineraries/:id/days/:dayNumber
 */
const removeDay = async (req, res) => {
  const { id, dayNumber } = req.params;
  const userId = req.userId;
  const userRole = req.user.role;
  const tenantId = req.user.tenant;

  const itinerary = await Itinerary.findOne({ _id: id, tenant: tenantId });

  if (!itinerary) {
    throw new NotFoundError('Itinerary not found', 'ITINERARY_NOT_FOUND');
  }

  // Agents can only update their own itineraries
  if (userRole === USER_ROLES.AGENT && itinerary.createdBy.toString() !== userId.toString()) {
    throw new ForbiddenError('You can only modify itineraries you created', 'ACCESS_DENIED');
  }

  const removed = itinerary.removeDay(parseInt(dayNumber));
  if (!removed) {
    throw new NotFoundError('Day not found', 'DAY_NOT_FOUND');
  }

  itinerary.lastModifiedBy = userId;
  itinerary.updatePricing();
  await itinerary.save();

  logger.info('Day removed from itinerary', {
    itineraryId: id,
    dayNumber,
    userId,
    requestId: req.id,
  });

  res.json({
    success: true,
    data: itinerary,
  });
};

/**
 * Calculate itinerary costs
 * GET /api/v1/itineraries/:id/calculate-costs
 */
const calculateCosts = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;
  const userRole = req.user.role;
  const tenantId = req.user.tenant;

  const itinerary = await Itinerary.findOne({ _id: id, tenant: tenantId });

  if (!itinerary) {
    throw new NotFoundError('Itinerary not found', 'ITINERARY_NOT_FOUND');
  }

  // Agents can only view their own itineraries
  if (userRole === USER_ROLES.AGENT && itinerary.createdBy.toString() !== userId.toString()) {
    throw new ForbiddenError('You can only access itineraries you created', 'ACCESS_DENIED');
  }

  const costs = itinerary.calculateTotalCost();

  logger.info('Itinerary costs calculated', {
    itineraryId: id,
    totalPrice: costs.totalPrice,
    userId,
    requestId: req.id,
  });

  res.json({
    success: true,
    data: costs,
  });
};

/**
 * Clone itinerary as template
 * POST /api/v1/itineraries/:id/clone
 */
const cloneItinerary = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;
  const userRole = req.user.role;
  const tenantId = req.user.tenant;
  const { templateName, asTemplate = false } = req.body;

  const itinerary = await Itinerary.findOne({ _id: id, tenant: tenantId });

  if (!itinerary) {
    throw new NotFoundError('Itinerary not found', 'ITINERARY_NOT_FOUND');
  }

  // Agents can only clone their own itineraries
  if (userRole === USER_ROLES.AGENT && itinerary.createdBy.toString() !== userId.toString()) {
    throw new ForbiddenError('You can only clone itineraries you created', 'ACCESS_DENIED');
  }

  let cloneData;
  if (asTemplate && templateName) {
    cloneData = itinerary.cloneAsTemplate(templateName, userId);
  } else {
    cloneData = itinerary.toObject();
    delete cloneData._id;
    delete cloneData.createdAt;
    delete cloneData.updatedAt;
    cloneData.createdBy = userId;
    cloneData.status = 'draft';
    cloneData.version = 1;
    cloneData.title = `${cloneData.title} (Copy)`;
  }

  cloneData.tenant = tenantId;

  const clonedItinerary = await Itinerary.create(cloneData);

  const populated = await Itinerary.findById(clonedItinerary._id)
    .populate('createdBy', 'firstName lastName email');

  logger.info('Itinerary cloned', {
    originalId: id,
    clonedId: clonedItinerary._id,
    asTemplate,
    userId,
    requestId: req.id,
  });

  res.status(201).json({
    success: true,
    data: populated,
  });
};

/**
 * Send itinerary to client
 * POST /api/v1/itineraries/:id/send
 */
const sendToClient = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;
  const userRole = req.user.role;
  const tenantId = req.user.tenant;
  const { clientEmail } = req.body;

  if (!clientEmail) {
    throw new ValidationError('Client email is required', 'EMAIL_REQUIRED');
  }

  const itinerary = await Itinerary.findOne({ _id: id, tenant: tenantId });

  if (!itinerary) {
    throw new NotFoundError('Itinerary not found', 'ITINERARY_NOT_FOUND');
  }

  // Agents can only send their own itineraries
  if (userRole === USER_ROLES.AGENT && itinerary.createdBy.toString() !== userId.toString()) {
    throw new ForbiddenError('You can only send itineraries you created', 'ACCESS_DENIED');
  }

  // Update status and sent info
  itinerary.status = 'sent-to-client';
  itinerary.sentToClient = {
    sentAt: new Date(),
    sentBy: userId,
    clientEmail,
  };
  itinerary.clientFeedback = {
    status: 'pending',
  };
  itinerary.lastModifiedBy = userId;

  await itinerary.save();

  // TODO: Send email with itinerary details
  // This would integrate with the email service

  logger.info('Itinerary sent to client', {
    itineraryId: id,
    clientEmail,
    userId,
    requestId: req.id,
  });

  res.json({
    success: true,
    message: 'Itinerary sent to client successfully',
    data: itinerary,
  });
};

/**
 * Get itinerary statistics
 * GET /api/v1/itineraries/stats
 */
const getItineraryStats = async (req, res) => {
  const tenantId = req.user.tenant;
  const userId = req.userId;
  const userRole = req.user.role;

  const filter = { tenant: tenantId };

  // Agents see only their stats
  if (userRole === USER_ROLES.AGENT) {
    filter.createdBy = userId;
  }

  const [byStatus, byMonth, templates, upcoming] = await Promise.all([
    // By status
    Itinerary.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),

    // By month (last 6 months)
    Itinerary.aggregate([
      {
        $match: {
          ...filter,
          createdAt: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),

    // Template count
    Itinerary.countDocuments({ ...filter, isTemplate: true }),

    // Upcoming trips
    Itinerary.countDocuments({
      ...filter,
      startDate: { $gt: new Date() },
      status: { $in: ['approved', 'sent-to-client', 'accepted'] },
    }),
  ]);

  // Total itineraries
  const totalItineraries = await Itinerary.countDocuments(filter);

  logger.info('Itinerary stats fetched', {
    tenantId,
    userId,
    requestId: req.id,
  });

  res.json({
    success: true,
    data: {
      totalItineraries,
      byStatus: byStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byMonth,
      templates,
      upcoming,
    },
  });
};

module.exports = {
  getAllItineraries,
  getItinerary,
  createItinerary,
  updateItinerary,
  deleteItinerary,
  addDay,
  updateDay,
  removeDay,
  calculateCosts,
  cloneItinerary,
  sendToClient,
  getItineraryStats,
};
