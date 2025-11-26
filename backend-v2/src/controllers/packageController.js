const Package = require('../models/Package');
const { ValidationError, NotFoundError } = require('../lib/errors');

/**
 * Package Controller
 * Manages pre-built travel packages
 */

/**
 * Create a new package
 * POST /packages
 */
exports.createPackage = async (req, res, next) => {
  try {
    const packageData = {
      ...req.body,
      tenant: req.user.tenant,
      createdBy: req.user._id,
    };

    const newPackage = await Package.create(packageData);

    res.status(201).json({
      success: true,
      data: newPackage,
      message: 'Package created successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all packages with filtering and pagination
 * GET /packages
 */
exports.getAllPackages = async (req, res, next) => {
  try {
    const {
      destination,
      country,
      city,
      minPrice,
      maxPrice,
      minDays,
      maxDays,
      categories,
      tags,
      visibility,
      status,
      isFeatured,
      search,
      page = 1,
      limit = 20,
      sort = '-createdAt',
    } = req.query;

    const query = { tenant: req.user.tenant };

    if (status) query.status = status;
    if (visibility) {
      query.visibility = Array.isArray(visibility) ? { $in: visibility } : visibility;
    }
    if (isFeatured !== undefined) query.isFeatured = isFeatured === 'true';
    if (country) query['destination.country'] = new RegExp(country, 'i');
    if (city) query['destination.city'] = new RegExp(city, 'i');
    if (destination) {
      query.$or = [
        { 'destination.country': new RegExp(destination, 'i') },
        { 'destination.state': new RegExp(destination, 'i') },
        { 'destination.city': new RegExp(destination, 'i') },
        { 'destination.region': new RegExp(destination, 'i') },
      ];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      query['pricing.basePrice'] = {};
      if (minPrice !== undefined) query['pricing.basePrice'].$gte = parseFloat(minPrice);
      if (maxPrice !== undefined) query['pricing.basePrice'].$lte = parseFloat(maxPrice);
    }

    if (minDays !== undefined || maxDays !== undefined) {
      query['duration.days'] = {};
      if (minDays !== undefined) query['duration.days'].$gte = parseInt(minDays);
      if (maxDays !== undefined) query['duration.days'].$lte = parseInt(maxDays);
    }

    if (categories) {
      query.categories = { $in: Array.isArray(categories) ? categories : [categories] };
    }

    if (tags) {
      query.tags = { $in: Array.isArray(tags) ? tags : [tags] };
    }

    if (search) {
      query.$text = { $search: search };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [packages, total] = await Promise.all([
      Package.find(query)
        .populate('createdBy', 'firstName lastName email')
        .populate('updatedBy', 'firstName lastName email')
        .select('-__v')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Package.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        packages,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
      message: 'Packages fetched successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get public/browsable packages (for customers)
 * GET /packages/browse
 */
exports.browsePackages = async (req, res, next) => {
  try {
    const { destination, country, city, minPrice, maxPrice, minDays, maxDays, categories, tags, search, page, limit, sort } = req.query;

    const filters = {
      destination,
      country,
      city,
      minPrice,
      maxPrice,
      minDays,
      maxDays,
      categories,
      tags,
      visibility: 'public',
      search,
    };

    const options = {
      page: page || 1,
      limit: limit || 20,
      sort: sort || '-createdAt',
    };

    const result = await Package.browsePackages(req.user.tenant, filters, options);

    res.json({
      success: true,
      data: result,
      message: 'Packages fetched successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get featured packages
 * GET /packages/featured
 */
exports.getFeaturedPackages = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const packages = await Package.getFeaturedPackages(req.user.tenant, parseInt(limit));

    res.json({
      success: true,
      data: packages,
      message: 'Featured packages fetched successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get popular packages (by bookings)
 * GET /packages/popular
 */
exports.getPopularPackages = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const packages = await Package.getPopularPackages(req.user.tenant, parseInt(limit));

    res.json({
      success: true,
      data: packages,
      message: 'Popular packages fetched successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get package statistics
 * GET /packages/statistics
 */
exports.getPackageStatistics = async (req, res, next) => {
  try {
    const stats = await Package.getPackageStatistics(req.user.tenant);

    res.json({
      success: true,
      data: stats,
      message: 'Package statistics fetched successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single package by ID
 * GET /packages/:id
 */
exports.getPackageById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { trackView } = req.query;

    const packageDoc = await Package.findOne({
      _id: id,
      tenant: req.user.tenant,
    })
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    if (!packageDoc) {
      throw new NotFoundError('Package not found');
    }

    if (trackView === 'true') {
      await packageDoc.incrementViews();
    }

    res.json({
      success: true,
      data: packageDoc,
      message: 'Package fetched successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get package by slug (for public viewing)
 * GET /packages/slug/:slug
 */
exports.getPackageBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { trackView } = req.query;

    const packageDoc = await Package.findOne({
      slug,
      tenant: req.user.tenant,
      status: 'published',
      visibility: { $in: ['public', 'agent-only'] },
    })
      .populate('createdBy', 'firstName lastName email')
      .select('-__v');

    if (!packageDoc) {
      throw new NotFoundError('Package not found');
    }

    if (trackView === 'true') {
      await packageDoc.incrementViews();
    }

    res.json({
      success: true,
      data: packageDoc,
      message: 'Package fetched successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update package
 * PUT /packages/:id
 */
exports.updatePackage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    delete updateData.tenant;
    delete updateData.createdBy;
    delete updateData.stats;

    updateData.updatedBy = req.user._id;

    const packageDoc = await Package.findOneAndUpdate(
      { _id: id, tenant: req.user.tenant },
      updateData,
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    if (!packageDoc) {
      throw new NotFoundError('Package not found');
    }

    res.json({
      success: true,
      data: packageDoc,
      message: 'Package updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete package
 * DELETE /packages/:id
 */
exports.deletePackage = async (req, res, next) => {
  try {
    const { id } = req.params;

    const packageDoc = await Package.findOneAndDelete({
      _id: id,
      tenant: req.user.tenant,
    });

    if (!packageDoc) {
      throw new NotFoundError('Package not found');
    }

    res.json({
      success: true,
      data: null,
      message: 'Package deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Calculate package price
 * POST /packages/:id/calculate-price
 */
exports.calculatePrice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { travelDate, groupSize, children, infants } = req.body;

    const packageDoc = await Package.findOne({
      _id: id,
      tenant: req.user.tenant,
    });

    if (!packageDoc) {
      throw new NotFoundError('Package not found');
    }

    if (!packageDoc.isAvailableForDate(travelDate)) {
      throw new ValidationError('Package is not available for the selected date');
    }

    const groupPrice = packageDoc.calculateGroupPrice(groupSize, travelDate);

    let childrenPrice = 0;
    if (children && packageDoc.pricing.childDiscount) {
      const childBasePrice = groupPrice.pricePerPerson;
      const childDiscountAmount = (childBasePrice * packageDoc.pricing.childDiscount.discountPercentage) / 100;
      childrenPrice = (childBasePrice - childDiscountAmount) * children;
    }

    let infantsPrice = 0;
    if (infants && packageDoc.pricing.infantDiscount) {
      const infantBasePrice = groupPrice.pricePerPerson;
      const infantDiscountAmount = (infantBasePrice * packageDoc.pricing.infantDiscount.discountPercentage) / 100;
      infantsPrice = (infantBasePrice - infantDiscountAmount) * infants;
    }

    const totalPrice = groupPrice.totalPrice + childrenPrice + infantsPrice;

    res.json({
      success: true,
      data: {
        basePrice: groupPrice.basePrice,
        pricePerPerson: groupPrice.pricePerPerson,
        adults: {
          count: groupSize,
          pricePerPerson: groupPrice.pricePerPerson,
          totalPrice: groupPrice.totalPrice,
        },
        children: {
          count: children || 0,
          pricePerPerson: children && packageDoc.pricing.childDiscount
            ? groupPrice.pricePerPerson - ((groupPrice.pricePerPerson * packageDoc.pricing.childDiscount.discountPercentage) / 100)
            : 0,
          totalPrice: childrenPrice,
        },
        infants: {
          count: infants || 0,
          pricePerPerson: infants && packageDoc.pricing.infantDiscount
            ? groupPrice.pricePerPerson - ((groupPrice.pricePerPerson * packageDoc.pricing.infantDiscount.discountPercentage) / 100)
            : 0,
          totalPrice: infantsPrice,
        },
        discount: groupPrice.discount,
        totalPrice,
        currency: packageDoc.pricing.currency,
      },
      message: 'Price calculated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check package availability
 * POST /packages/:id/check-availability
 */
exports.checkAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { travelDate } = req.body;

    if (!travelDate) {
      throw new ValidationError('Travel date is required');
    }

    const packageDoc = await Package.findOne({
      _id: id,
      tenant: req.user.tenant,
    });

    if (!packageDoc) {
      throw new NotFoundError('Package not found');
    }

    const isAvailable = packageDoc.isAvailableForDate(travelDate);

    res.json({
      success: true,
      data: {
        available: isAvailable,
        date: travelDate,
      },
      message: isAvailable ? 'Package is available' : 'Package is not available for this date',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Clone/duplicate package
 * POST /packages/:id/clone
 */
exports.clonePackage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { packageCode, title } = req.body;

    const originalPackage = await Package.findOne({
      _id: id,
      tenant: req.user.tenant,
    }).lean();

    if (!originalPackage) {
      throw new NotFoundError('Package not found');
    }

    delete originalPackage._id;
    delete originalPackage.createdAt;
    delete originalPackage.updatedAt;
    delete originalPackage.__v;
    delete originalPackage.stats;

    originalPackage.packageCode = packageCode;
    originalPackage.title = title || `${originalPackage.title} (Copy)`;
    originalPackage.slug = undefined;
    originalPackage.status = 'draft';
    originalPackage.createdBy = req.user._id;
    originalPackage.updatedBy = undefined;

    const newPackage = await Package.create(originalPackage);

    res.status(201).json({
      success: true,
      data: newPackage,
      message: 'Package cloned successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk update package visibility
 * PUT /packages/bulk/visibility
 */
exports.bulkUpdateVisibility = async (req, res, next) => {
  try {
    const { packageIds, visibility } = req.body;

    if (!packageIds || !Array.isArray(packageIds) || packageIds.length === 0) {
      throw new ValidationError('Package IDs array is required');
    }

    if (!['public', 'private', 'agent-only'].includes(visibility)) {
      throw new ValidationError('Invalid visibility value');
    }

    const result = await Package.updateMany(
      {
        _id: { $in: packageIds },
        tenant: req.user.tenant,
      },
      {
        $set: {
          visibility,
          updatedBy: req.user._id,
        },
      }
    );

    res.json({
      success: true,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
      },
      message: `${result.modifiedCount} package(s) updated successfully`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk update package status
 * PUT /packages/bulk/status
 */
exports.bulkUpdateStatus = async (req, res, next) => {
  try {
    const { packageIds, status } = req.body;

    if (!packageIds || !Array.isArray(packageIds) || packageIds.length === 0) {
      throw new ValidationError('Package IDs array is required');
    }

    if (!['draft', 'published', 'archived'].includes(status)) {
      throw new ValidationError('Invalid status value');
    }

    const result = await Package.updateMany(
      {
        _id: { $in: packageIds },
        tenant: req.user.tenant,
      },
      {
        $set: {
          status,
          updatedBy: req.user._id,
        },
      }
    );

    res.json({
      success: true,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
      },
      message: `${result.modifiedCount} package(s) updated successfully`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk delete packages
 * DELETE /packages/bulk
 */
exports.bulkDeletePackages = async (req, res, next) => {
  try {
    const { packageIds } = req.body;

    if (!packageIds || !Array.isArray(packageIds) || packageIds.length === 0) {
      throw new ValidationError('Package IDs array is required');
    }

    const result = await Package.deleteMany({
      _id: { $in: packageIds },
      tenant: req.user.tenant,
    });

    res.json({
      success: true,
      data: {
        deletedCount: result.deletedCount,
      },
      message: `${result.deletedCount} package(s) deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
};
