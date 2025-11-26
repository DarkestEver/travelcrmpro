const Supplier = require('../models/Supplier');
const { NotFoundError, ValidationError, ForbiddenError } = require('../lib/errors');
const logger = require('../lib/logger');
const { USER_ROLES } = require('../config/constants');

/**
 * Get all suppliers with filtering, search, and pagination
 * GET /api/v1/suppliers
 */
const getAllSuppliers = async (req, res) => {
  // Build tenant query - super_admin sees all, others see their tenant only
  const query = {};
  if (req.user.role !== USER_ROLES.SUPER_ADMIN) {
    query.tenant = req.user.tenant;
  }

  const {
    page = 1,
    limit = 20,
    type,
    status,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = req.query;

  // Filters
  if (type) query.type = type;
  if (status) query.status = status;

  // Search
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { 'contact.name': { $regex: search, $options: 'i' } },
      { 'contact.email': { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  const [suppliers, total] = await Promise.all([
    Supplier.find(query)
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Supplier.countDocuments(query),
  ]);

  logger.info('Suppliers retrieved', {
    tenant: req.user.tenant,
    count: suppliers.length,
    total,
    filters: { type, status, search },
    userId: req.userId,
    requestId: req.id,
  });

  res.json({
    success: true,
    message: 'Suppliers retrieved successfully',
    data: {
      suppliers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    },
  });
};

/**
 * Get supplier by ID
 * GET /api/v1/suppliers/:id
 */
const getSupplier = async (req, res) => {
  const { id } = req.params;

  // Build query - super_admin can see any supplier, others only their tenant
  const query = { _id: id };
  if (req.user.role !== USER_ROLES.SUPER_ADMIN) {
    query.tenant = req.user.tenant;
  }

  const supplier = await Supplier.findOne(query)
    .populate('createdBy', 'firstName lastName email')
    .populate('updatedBy', 'firstName lastName email');

  if (!supplier) {
    throw new NotFoundError('Supplier not found', 'SUPPLIER_NOT_FOUND');
  }

  logger.info('Supplier retrieved', {
    supplierId: id,
    tenant: req.user.tenant,
    userId: req.userId,
    requestId: req.id,
  });

  res.json({
    success: true,
    message: 'Supplier retrieved successfully',
    data: { supplier },
  });
};

/**
 * Create new supplier
 * POST /api/v1/suppliers
 */
const createSupplier = async (req, res) => {
  const supplierData = {
    ...req.body,
    tenant: req.user.tenant,
    createdBy: req.userId,
  };

  const supplier = await Supplier.create(supplierData);

  await supplier.populate('createdBy', 'firstName lastName email');

  logger.info('Supplier created', {
    supplierId: supplier._id,
    name: supplier.name,
    type: supplier.type,
    tenant: req.user.tenant,
    userId: req.userId,
    requestId: req.id,
  });

  res.status(201).json({
    success: true,
    message: 'Supplier created successfully',
    data: { supplier },
  });
};

/**
 * Update supplier
 * PUT /api/v1/suppliers/:id
 */
const updateSupplier = async (req, res) => {
  const { id } = req.params;

  // Build query - super_admin can update any supplier, others only their tenant
  const query = { _id: id };
  if (req.user.role !== USER_ROLES.SUPER_ADMIN) {
    query.tenant = req.user.tenant;
  }

  const supplier = await Supplier.findOne(query);

  if (!supplier) {
    throw new NotFoundError('Supplier not found', 'SUPPLIER_NOT_FOUND');
  }

  // Update fields
  const allowedFields = [
    'name',
    'type',
    'status',
    'contact',
    'address',
    'services',
    'paymentTerms',
    'notes',
    'tags',
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      supplier[field] = req.body[field];
    }
  });

  supplier.updatedBy = req.userId;
  await supplier.save();

  await supplier.populate([
    { path: 'createdBy', select: 'firstName lastName email' },
    { path: 'updatedBy', select: 'firstName lastName email' },
  ]);

  logger.info('Supplier updated', {
    supplierId: id,
    tenant: req.user.tenant,
    userId: req.userId,
    updatedFields: Object.keys(req.body),
    requestId: req.id,
  });

  res.json({
    success: true,
    message: 'Supplier updated successfully',
    data: { supplier },
  });
};

/**
 * Delete supplier
 * DELETE /api/v1/suppliers/:id
 */
const deleteSupplier = async (req, res) => {
  const { id } = req.params;

  // Build query - super_admin can delete any supplier, others only their tenant
  const query = { _id: id };
  if (req.user.role !== USER_ROLES.SUPER_ADMIN) {
    query.tenant = req.user.tenant;
  }

  const supplier = await Supplier.findOne(query);

  if (!supplier) {
    throw new NotFoundError('Supplier not found', 'SUPPLIER_NOT_FOUND');
  }

  await Supplier.deleteOne({ _id: id });

  logger.info('Supplier deleted', {
    supplierId: id,
    name: supplier.name,
    tenant: req.user.tenant,
    userId: req.userId,
    requestId: req.id,
  });

  res.json({
    success: true,
    message: 'Supplier deleted successfully',
    data: { message: `Supplier "${supplier.name}" deleted successfully` },
  });
};

/**
 * Update supplier rating
 * PUT /api/v1/suppliers/:id/rating
 */
const updateRating = async (req, res) => {
  const { id } = req.params;
  const { quality, service, value } = req.body;

  // Build query - super_admin can rate any supplier, others only their tenant
  const query = { _id: id };
  if (req.user.role !== USER_ROLES.SUPER_ADMIN) {
    query.tenant = req.user.tenant;
  }

  const supplier = await Supplier.findOne(query);

  if (!supplier) {
    throw new NotFoundError('Supplier not found', 'SUPPLIER_NOT_FOUND');
  }

  await supplier.updateRating({ quality, service, value });

  logger.info('Supplier rating updated', {
    supplierId: id,
    rating: { quality, service, value, overall: supplier.rating.overall },
    tenant: req.user.tenant,
    userId: req.userId,
    requestId: req.id,
  });

  res.json({
    success: true,
    message: 'Supplier rating updated successfully',
    data: { rating: supplier.rating },
  });
};

/**
 * Add document to supplier
 * POST /api/v1/suppliers/:id/documents
 */
const addDocument = async (req, res) => {
  const { id } = req.params;

  // Build query - super_admin can add docs to any supplier, others only their tenant
  const query = { _id: id };
  if (req.user.role !== USER_ROLES.SUPER_ADMIN) {
    query.tenant = req.user.tenant;
  }

  const supplier = await Supplier.findOne(query);

  if (!supplier) {
    throw new NotFoundError('Supplier not found', 'SUPPLIER_NOT_FOUND');
  }

  // If file was uploaded, use the file path
  if (req.file) {
    req.body.url = `/uploads/documents/${req.file.filename}`;
  }

  await supplier.addDocument(req.body);

  logger.info('Document added to supplier', {
    supplierId: id,
    documentName: req.body.name,
    documentType: req.body.type,
    tenant: req.user.tenant,
    userId: req.userId,
    requestId: req.id,
  });

  res.json({
    success: true,
    message: 'Document added successfully',
    data: { documents: supplier.documents },
  });
};

/**
 * Get supplier statistics
 * GET /api/v1/suppliers/stats
 */
const getSupplierStats = async (req, res) => {
  // Build match - super_admin sees all, others see their tenant only
  const matchStage = {};
  if (req.user.role !== USER_ROLES.SUPER_ADMIN) {
    matchStage.tenant = req.user.tenant;
  }

  const stats = await Supplier.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        activeCount: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
        },
        averageRating: { $avg: '$rating.overall' },
      },
    },
    {
      $project: {
        type: '$_id',
        count: 1,
        activeCount: 1,
        averageRating: { $round: ['$averageRating', 2] },
        _id: 0,
      },
    },
    { $sort: { count: -1 } },
  ]);

  const totalSuppliers = await Supplier.countDocuments(matchStage);
  const activeSuppliers = await Supplier.countDocuments({
    ...matchStage,
    status: 'active',
  });

  logger.info('Supplier statistics retrieved', {
    tenant: req.user.tenant,
    totalSuppliers,
    activeSuppliers,
    userId: req.userId,
    requestId: req.id,
  });

  res.json({
    success: true,
    message: 'Supplier statistics retrieved successfully',
    data: {
      total: totalSuppliers,
      active: activeSuppliers,
      byType: stats,
    },
  });
};

module.exports = {
  getAllSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  updateRating,
  addDocument,
  getSupplierStats,
};
