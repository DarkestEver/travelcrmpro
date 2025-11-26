const RateList = require('../models/RateList');
const Supplier = require('../models/Supplier');
const { AppError } = require('../lib/errors');

/**
 * RateList Controller
 * Handles all rate list management operations
 */

/**
 * @route   GET /api/v1/rate-lists
 * @desc    Get all rate lists with filters
 * @access  Private
 */
exports.getAllRateLists = async (req, res, next) => {
  try {
    const {
      supplierId,
      serviceType,
      destination,
      validOn,
      status,
      page = 1,
      limit = 20,
      sort = '-createdAt',
    } = req.query;

    // Build query
    const query = {
      tenant: req.user.tenant,
    };

    if (supplierId) {
      query.supplier = supplierId;
    }

    if (serviceType) {
      query.serviceType = serviceType;
    }

    if (destination) {
      query['destination.city'] = new RegExp(destination, 'i');
    }

    if (status) {
      query.status = status;
    }

    // Filter by valid date
    if (validOn) {
      const checkDate = new Date(validOn);
      query.validFrom = { $lte: checkDate };
      query.validTo = { $gte: checkDate };
      query.status = 'published';
      query.isActive = true;
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const rateLists = await RateList.find(query)
      .populate('supplier', 'name type contact.primaryEmail')
      .populate('createdBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await RateList.countDocuments(query);

    res.status(200).json({
      success: true,
      data: rateLists,
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/rate-lists/:id
 * @desc    Get single rate list by ID
 * @access  Private
 */
exports.getRateList = async (req, res, next) => {
  try {
    const rateList = await RateList.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
    })
      .populate('supplier', 'name type contact businessInfo')
      .populate('createdBy', 'name email')
      .populate('publishedBy', 'name email');

    if (!rateList) {
      throw new AppError('Rate list not found', 404);
    }

    res.status(200).json({
      success: true,
      data: rateList,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/rate-lists
 * @desc    Create new rate list
 * @access  Private
 */
exports.createRateList = async (req, res, next) => {
  try {
    const {
      supplierId,
      name,
      serviceType,
      validFrom,
      validTo,
      destination,
      pricing,
      availability,
      cancellationPolicy,
      inclusions,
      exclusions,
      description,
      notes,
    } = req.body;

    // Verify supplier exists and belongs to tenant
    const supplier = await Supplier.findOne({
      _id: supplierId,
      tenant: req.user.tenant,
    });

    if (!supplier) {
      throw new AppError('Supplier not found', 404);
    }

    // Check for overlapping rate lists
    const overlapping = await RateList.findOverlapping(
      req.user.tenant,
      supplierId,
      serviceType,
      new Date(validFrom),
      new Date(validTo)
    );

    if (overlapping.length > 0) {
      throw new AppError(
        `Overlapping rate list found: ${overlapping[0].name} (${overlapping[0].code})`,
        409
      );
    }

    // Generate unique code
    const code = await RateList.generateCode(req.user.tenant, serviceType);

    // Create rate list
    const rateList = await RateList.create({
      tenant: req.user.tenant,
      supplier: supplierId,
      name,
      code,
      serviceType,
      validFrom,
      validTo,
      destination,
      pricing,
      availability,
      cancellationPolicy,
      inclusions,
      exclusions,
      description,
      notes,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      data: rateList,
      message: 'Rate list created successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/v1/rate-lists/:id
 * @desc    Update rate list
 * @access  Private
 */
exports.updateRateList = async (req, res, next) => {
  try {
    const rateList = await RateList.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
    });

    if (!rateList) {
      throw new AppError('Rate list not found', 404);
    }

    // Prevent editing published rate lists
    if (rateList.status === 'published') {
      throw new AppError(
        'Cannot edit published rate list. Create a new version instead.',
        400
      );
    }

    // Check for overlaps if dates are being changed
    if (req.body.validFrom || req.body.validTo) {
      const validFrom = req.body.validFrom
        ? new Date(req.body.validFrom)
        : rateList.validFrom;
      const validTo = req.body.validTo
        ? new Date(req.body.validTo)
        : rateList.validTo;

      const overlapping = await RateList.findOverlapping(
        req.user.tenant,
        rateList.supplier,
        rateList.serviceType,
        validFrom,
        validTo,
        rateList._id
      );

      if (overlapping.length > 0) {
        throw new AppError(
          `Overlapping rate list found: ${overlapping[0].name}`,
          409
        );
      }
    }

    // Update allowed fields
    const allowedFields = [
      'name',
      'validFrom',
      'validTo',
      'destination',
      'pricing',
      'availability',
      'cancellationPolicy',
      'inclusions',
      'exclusions',
      'description',
      'notes',
      'isActive',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        rateList[field] = req.body[field];
      }
    });

    await rateList.save();

    res.status(200).json({
      success: true,
      data: rateList,
      message: 'Rate list updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/v1/rate-lists/:id
 * @desc    Delete rate list
 * @access  Private
 */
exports.deleteRateList = async (req, res, next) => {
  try {
    const rateList = await RateList.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
    });

    if (!rateList) {
      throw new AppError('Rate list not found', 404);
    }

    // Only allow deleting draft rate lists
    if (rateList.status !== 'draft') {
      throw new AppError(
        'Only draft rate lists can be deleted. Archive published rate lists instead.',
        400
      );
    }

    await rateList.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Rate list deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/rate-lists/:id/publish
 * @desc    Publish rate list
 * @access  Private
 */
exports.publishRateList = async (req, res, next) => {
  try {
    const rateList = await RateList.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
    });

    if (!rateList) {
      throw new AppError('Rate list not found', 404);
    }

    await rateList.publish(req.user._id);

    res.status(200).json({
      success: true,
      data: rateList,
      message: 'Rate list published successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/rate-lists/:id/unpublish
 * @desc    Unpublish rate list
 * @access  Private
 */
exports.unpublishRateList = async (req, res, next) => {
  try {
    const rateList = await RateList.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
    });

    if (!rateList) {
      throw new AppError('Rate list not found', 404);
    }

    await rateList.unpublish();

    res.status(200).json({
      success: true,
      data: rateList,
      message: 'Rate list unpublished successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/rate-lists/:id/clone
 * @desc    Clone rate list for versioning
 * @access  Private
 */
exports.cloneRateList = async (req, res, next) => {
  try {
    const rateList = await RateList.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
    });

    if (!rateList) {
      throw new AppError('Rate list not found', 404);
    }

    const newRateList = await rateList.clone(req.user._id, req.body);

    res.status(201).json({
      success: true,
      data: newRateList,
      message: 'Rate list cloned successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/rate-lists/:id/calculate-price
 * @desc    Calculate price for specific parameters
 * @access  Private
 */
exports.calculatePrice = async (req, res, next) => {
  try {
    const rateList = await RateList.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
    });

    if (!rateList) {
      throw new AppError('Rate list not found', 404);
    }

    const { date, nights, pax, ageBreakdown, occupancyType } = req.body;

    if (!date) {
      throw new AppError('Date is required for price calculation', 400);
    }

    const priceBreakdown = rateList.calculatePrice({
      date,
      nights,
      pax,
      ageBreakdown,
      occupancyType,
    });

    res.status(200).json({
      success: true,
      data: priceBreakdown,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/rate-lists/validate-dates
 * @desc    Check for overlapping rate lists
 * @access  Private
 */
exports.validateDates = async (req, res, next) => {
  try {
    const { supplierId, serviceType, validFrom, validTo, excludeId } =
      req.body;

    if (!supplierId || !serviceType || !validFrom || !validTo) {
      throw new AppError(
        'supplierId, serviceType, validFrom, and validTo are required',
        400
      );
    }

    const overlapping = await RateList.findOverlapping(
      req.user.tenant,
      supplierId,
      serviceType,
      new Date(validFrom),
      new Date(validTo),
      excludeId
    );

    res.status(200).json({
      success: true,
      data: {
        hasOverlap: overlapping.length > 0,
        overlappingRateLists: overlapping.map((rl) => ({
          id: rl._id,
          name: rl.name,
          code: rl.code,
          validFrom: rl.validFrom,
          validTo: rl.validTo,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/rate-lists/supplier/:supplierId/active
 * @desc    Get active rate lists for supplier
 * @access  Private
 */
exports.getActiveRateLists = async (req, res, next) => {
  try {
    const { date } = req.query;
    const checkDate = date ? new Date(date) : new Date();

    const rateLists = await RateList.getActiveRateLists(
      req.user.tenant,
      req.params.supplierId,
      checkDate
    );

    res.status(200).json({
      success: true,
      data: rateLists,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/v1/rate-lists/bulk-update
 * @desc    Bulk update multiple rate lists
 * @access  Private
 */
exports.bulkUpdate = async (req, res, next) => {
  try {
    const { ids, updates } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new AppError('ids array is required', 400);
    }

    if (!updates || Object.keys(updates).length === 0) {
      throw new AppError('updates object is required', 400);
    }

    // Only allow specific fields for bulk update
    const allowedFields = ['status', 'isActive'];
    const sanitizedUpdates = {};

    allowedFields.forEach((field) => {
      if (updates[field] !== undefined) {
        sanitizedUpdates[field] = updates[field];
      }
    });

    if (Object.keys(sanitizedUpdates).length === 0) {
      throw new AppError('No valid fields to update', 400);
    }

    const result = await RateList.updateMany(
      {
        _id: { $in: ids },
        tenant: req.user.tenant,
      },
      sanitizedUpdates
    );

    res.status(200).json({
      success: true,
      data: {
        matched: result.matchedCount,
        modified: result.modifiedCount,
      },
      message: `${result.modifiedCount} rate list(s) updated successfully`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/rate-lists/supplier/:supplierId/versions
 * @desc    Get all versions of rate lists for a supplier
 * @access  Private
 */
exports.getRateListVersions = async (req, res, next) => {
  try {
    const rateLists = await RateList.find({
      tenant: req.user.tenant,
      supplier: req.params.supplierId,
    })
      .sort({ version: -1, createdAt: -1 })
      .populate('createdBy', 'name email')
      .populate('publishedBy', 'name email');

    // Group by base rate list (same name/service type)
    const grouped = rateLists.reduce((acc, rl) => {
      const key = `${rl.serviceType}-${rl.name}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(rl);
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: grouped,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/rate-lists/stats
 * @desc    Get rate list statistics
 * @access  Private
 */
exports.getRateListStats = async (req, res, next) => {
  try {
    const stats = await RateList.aggregate([
      {
        $match: {
          tenant: req.user.tenant,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          published: {
            $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] },
          },
          draft: {
            $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] },
          },
          archived: {
            $sum: { $cond: [{ $eq: ['$status', 'archived'] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          _id: 0,
        },
      },
    ]);

    // Get by service type
    const byServiceType = await RateList.aggregate([
      {
        $match: {
          tenant: req.user.tenant,
        },
      },
      {
        $group: {
          _id: '$serviceType',
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: stats[0] || { total: 0, published: 0, draft: 0, archived: 0 },
        byServiceType: byServiceType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    next(error);
  }
};
