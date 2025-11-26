const Quote = require('../models/Quote');
const Itinerary = require('../models/Itinerary');
const Booking = require('../models/Booking');
const Tenant = require('../models/Tenant');
const Lead = require('../models/Lead');
const pdfService = require('../services/pdfService');
const uploadService = require('../services/uploadService');
const { AppError } = require('../lib/errors');
const path = require('path');
const fs = require('fs').promises;

/**
 * Quote Controller
 * Handles quote generation, PDF creation, approval workflow, and conversion to bookings
 */

/**
 * @route   GET /api/v1/quotes
 * @desc    Get all quotes with filters
 * @access  Private
 */
exports.getAllQuotes = async (req, res, next) => {
  try {
    const {
      status,
      customerId,
      leadId,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20,
      sort = '-createdAt',
    } = req.query;

    // Build query
    const query = {
      tenant: req.user.tenant,
    };

    if (status) {
      query.status = status;
    }

    if (customerId) {
      query['customer.email'] = customerId;
    }

    if (leadId) {
      query.lead = leadId;
    }

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) {
        query.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        query.createdAt.$lte = new Date(dateTo);
      }
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const quotes = await Quote.find(query)
      .populate('lead', 'customer.name customer.email')
      .populate('itinerary', 'title destination startDate endDate')
      .populate('createdBy', 'firstName lastName email')
      .populate('booking', 'bookingNumber status')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Quote.countDocuments(query);

    res.status(200).json({
      success: true,
      data: quotes,
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
 * @route   GET /api/v1/quotes/:id
 * @desc    Get single quote by ID
 * @access  Private
 */
exports.getQuote = async (req, res, next) => {
  try {
    const quote = await Quote.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
    })
      .populate('lead', 'customer')
      .populate('itinerary')
      .populate('createdBy', 'firstName lastName email')
      .populate('sentBy', 'firstName lastName email')
      .populate('booking');

    if (!quote) {
      throw new AppError('Quote not found', 404);
    }

    res.status(200).json({
      success: true,
      data: quote,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/quotes
 * @desc    Create quote from itinerary
 * @access  Private
 */
exports.createQuote = async (req, res, next) => {
  try {
    const {
      itineraryId,
      leadId,
      customer,
      title,
      validityDays = 7,
      discounts = [],
      taxes = [],
      paymentSchedule = [],
      inclusions = [],
      exclusions = [],
      termsAndConditions,
      cancellationPolicy,
      internalNotes,
    } = req.body;

    // Fetch itinerary
    const itinerary = await Itinerary.findOne({
      _id: itineraryId,
      tenant: req.user.tenant,
    });

    if (!itinerary) {
      throw new AppError('Itinerary not found', 404);
    }

    // Fetch lead if provided
    let lead = null;
    if (leadId) {
      lead = await Lead.findOne({
        _id: leadId,
        tenant: req.user.tenant,
      });
    }

    // Validate customer info - either from leadId or customer param
    if (!leadId && !customer) {
      throw new AppError('Either leadId or customer information is required', 400);
    }

    // Extract line items from itinerary
    const lineItems = [];
    
    // Process each day
    if (itinerary.days && itinerary.days.length > 0) {
      itinerary.days.forEach((day, dayIndex) => {
        // Accommodation
        if (day.accommodation) {
          lineItems.push({
            day: dayIndex + 1,
            itemType: 'accommodation',
            description: `${day.accommodation.name} - ${day.accommodation.roomType || 'Standard Room'}`,
            quantity: day.accommodation.numberOfRooms || 1,
            unitPrice: day.accommodation.cost?.amount || 0,
            total: (day.accommodation.cost?.amount || 0) * (day.accommodation.numberOfRooms || 1),
          });
        }

        // Activities
        if (day.activities && Array.isArray(day.activities) && day.activities.length > 0) {
          day.activities.forEach((activity) => {
            if (!activity.cost?.includedInPackage) {
              lineItems.push({
                day: dayIndex + 1,
                itemType: 'activity',
                description: activity.title,
                quantity: 1,
                unitPrice: activity.cost?.amount || 0,
                total: activity.cost?.amount || 0,
              });
            }
          });
        }

        // Transport
        if (day.transport && Array.isArray(day.transport)) {
          day.transport.forEach((transport) => {
            if (transport.cost && transport.cost.amount) {
              lineItems.push({
                day: dayIndex + 1,
                itemType: 'transport',
                description: `${transport.type} - ${transport.from} to ${transport.to}`,
                quantity: 1,
                unitPrice: transport.cost.amount || 0,
                total: transport.cost.amount || 0,
              });
            }
          });
        }

        // Meals
        if (day.meals && Array.isArray(day.meals) && day.meals.length > 0) {
          day.meals.forEach((meal) => {
            if (!meal.cost?.includedInPackage && meal.cost?.amount) {
              lineItems.push({
                day: dayIndex + 1,
                itemType: 'meal',
                description: `${meal.type} - ${meal.restaurant || 'Local Restaurant'}`,
                quantity: 1,
                unitPrice: meal.cost.amount,
                total: meal.cost.amount,
              });
            }
          });
        }
      });
    }

    // Calculate pricing
    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
    
    // Apply discounts
    let discountTotal = 0;
    const processedDiscounts = discounts.map((discount) => {
      const amount = discount.type === 'percentage'
        ? (subtotal * discount.value) / 100
        : discount.value;
      discountTotal += amount;
      return {
        ...discount,
        amount,
      };
    });

    // Calculate taxes
    let taxTotal = 0;
    const processedTaxes = taxes.map((tax) => {
      const amount = tax.type === 'percentage'
        ? ((subtotal - discountTotal) * tax.value) / 100
        : tax.value;
      taxTotal += amount;
      return {
        ...tax,
        amount,
      };
    });

    const grandTotal = subtotal - discountTotal + taxTotal;

    // Set validity
    const validFrom = new Date();
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validityDays);

    // Generate quote number
    const quoteNumber = await Quote.generateQuoteNumber(req.user.tenant);

    // Create quote
    const quote = await Quote.create({
      tenant: req.user.tenant,
      quoteNumber,
      lead: leadId || undefined,
      itinerary: itineraryId,
      customer: customer || {
        name: lead?.customer?.name || 'Customer',
        email: lead?.customer?.email || '',
        phone: lead?.customer?.phone || '',
      },
      title: title || itinerary.title,
      destination: itinerary.destination,
      duration: itinerary.days?.length || 0,
      travelDates: {
        startDate: itinerary.startDate,
        endDate: itinerary.endDate,
      },
      travelers: {
        adults: itinerary.travelers?.adults || 2,
        children: itinerary.travelers?.children || 0,
        infants: itinerary.travelers?.infants || 0,
      },
      lineItems,
      pricing: {
        subtotal,
        discounts: processedDiscounts,
        discountTotal,
        taxes: processedTaxes,
        taxTotal,
        grandTotal,
        currency: itinerary.currency || 'USD',
      },
      paymentSchedule,
      validFrom,
      validUntil,
      inclusions,
      exclusions,
      termsAndConditions,
      cancellationPolicy,
      internalNotes,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      data: quote,
      message: 'Quote created successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/v1/quotes/:id
 * @desc    Update quote (draft only)
 * @access  Private
 */
exports.updateQuote = async (req, res, next) => {
  try {
    const quote = await Quote.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
    });

    if (!quote) {
      throw new AppError('Quote not found', 404);
    }

    // Only allow updating draft quotes
    if (quote.status !== 'draft') {
      throw new AppError('Only draft quotes can be updated. Create a revision instead.', 400);
    }

    // Update allowed fields
    const allowedFields = [
      'title',
      'customer',
      'travelDates',
      'travelers',
      'lineItems',
      'pricing',
      'paymentSchedule',
      'validUntil',
      'inclusions',
      'exclusions',
      'termsAndConditions',
      'cancellationPolicy',
      'internalNotes',
      'tags',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        quote[field] = req.body[field];
      }
    });

    quote.updatedBy = req.user._id;
    await quote.save();

    res.status(200).json({
      success: true,
      data: quote,
      message: 'Quote updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/v1/quotes/:id
 * @desc    Delete quote (draft only)
 * @access  Private
 */
exports.deleteQuote = async (req, res, next) => {
  try {
    const quote = await Quote.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
    });

    if (!quote) {
      throw new AppError('Quote not found', 404);
    }

    // Only allow deleting draft quotes
    if (quote.status !== 'draft') {
      throw new AppError('Only draft quotes can be deleted', 400);
    }

    await quote.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Quote deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/quotes/:id/generate-pdf
 * @desc    Generate quote PDF
 * @access  Private
 */
exports.generatePDF = async (req, res, next) => {
  try {
    const quote = await Quote.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
    }).populate('itinerary');

    if (!quote) {
      throw new AppError('Quote not found', 404);
    }

    // Fetch tenant for branding
    const tenant = await Tenant.findById(req.user.tenant);

    // Generate quote PDF
    const quotePdfBuffer = await pdfService.generateQuotePDF(quote, tenant);

    // Save PDF to uploads directory
    const uploadsDir = path.join(process.cwd(), 'uploads', 'quotes');
    await fs.mkdir(uploadsDir, { recursive: true });
    
    const filename = `quote-${quote.quoteNumber}-${Date.now()}.pdf`;
    const filepath = path.join(uploadsDir, filename);
    await fs.writeFile(filepath, quotePdfBuffer);

    // Update quote with PDF URL
    quote.quotePdfUrl = `/uploads/quotes/${filename}`;
    quote.pdfGeneratedAt = new Date();
    await quote.save();

    res.status(200).json({
      success: true,
      data: {
        pdfUrl: quote.quotePdfUrl,
        generatedAt: quote.pdfGeneratedAt,
      },
      message: 'PDF generated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/quotes/:id/send
 * @desc    Send quote via email with PDF
 * @access  Private
 */
exports.sendQuote = async (req, res, next) => {
  try {
    const { recipientEmail, message } = req.body;

    const quote = await Quote.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
    }).populate('itinerary');

    if (!quote) {
      throw new AppError('Quote not found', 404);
    }

    // Generate PDF if not already generated
    if (!quote.quotePdfUrl) {
      const tenant = await Tenant.findById(req.user.tenant);
      const quotePdfBuffer = await pdfService.generateQuotePDF(quote, tenant);

      const uploadsDir = path.join(process.cwd(), 'uploads', 'quotes');
      await fs.mkdir(uploadsDir, { recursive: true });
      
      const filename = `quote-${quote.quoteNumber}-${Date.now()}.pdf`;
      const filepath = path.join(uploadsDir, filename);
      await fs.writeFile(filepath, quotePdfBuffer);

      quote.quotePdfUrl = `/uploads/quotes/${filename}`;
      quote.pdfGeneratedAt = new Date();
    }

    // Mark as sent
    quote.markAsSent(req.user._id);
    quote.addEmailSent(recipientEmail || quote.customer.email, 'quote_sent', null);
    await quote.save();

    // TODO: Send email with PDF attachment (implement when email service is complete)
    // await emailService.sendQuoteEmail(quote, recipientEmail || quote.customer.email, message);

    res.status(200).json({
      success: true,
      data: quote,
      message: 'Quote sent successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/quotes/:id/approve
 * @desc    Approve quote (customer action)
 * @access  Public
 */
exports.approveQuote = async (req, res, next) => {
  try {
    const { customerName, notes } = req.body;

    const quote = await Quote.findById(req.params.id);

    if (!quote) {
      throw new AppError('Quote not found', 404);
    }

    if (quote.status !== 'sent' && quote.status !== 'viewed') {
      throw new AppError('Quote cannot be approved in its current status', 400);
    }

    quote.approve(customerName || quote.customer.name, notes);
    await quote.save();

    res.status(200).json({
      success: true,
      data: quote,
      message: 'Quote approved successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/quotes/:id/reject
 * @desc    Reject quote (customer action)
 * @access  Public
 */
exports.rejectQuote = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const quote = await Quote.findById(req.params.id);

    if (!quote) {
      throw new AppError('Quote not found', 404);
    }

    if (quote.status !== 'sent' && quote.status !== 'viewed') {
      throw new AppError('Quote cannot be rejected in its current status', 400);
    }

    quote.reject(reason || 'No reason provided');
    await quote.save();

    res.status(200).json({
      success: true,
      data: quote,
      message: 'Quote rejected',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/quotes/:id/revise
 * @desc    Create new version of quote
 * @access  Private
 */
exports.reviseQuote = async (req, res, next) => {
  try {
    const quote = await Quote.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
    });

    if (!quote) {
      throw new AppError('Quote not found', 404);
    }

    const revision = await quote.createRevision(req.body, req.user._id);

    res.status(201).json({
      success: true,
      data: revision,
      message: 'Quote revision created successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/quotes/:id/convert
 * @desc    Convert quote to booking
 * @access  Private
 */
exports.convertToBooking = async (req, res, next) => {
  try {
    const quote = await Quote.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
    }).populate('itinerary');

    if (!quote) {
      throw new AppError('Quote not found', 404);
    }

    if (quote.status !== 'approved') {
      throw new AppError('Only approved quotes can be converted to bookings', 400);
    }

    if (quote.booking) {
      throw new AppError('Quote has already been converted to a booking', 400);
    }

    // Generate booking number
    const year = new Date().getFullYear();
    const count = await Booking.countDocuments({
      tenant: req.user.tenant,
      bookingNumber: new RegExp(`^BK-${year}-`),
    });
    const bookingNumber = `BK-${year}-${String(count + 1).padStart(5, '0')}`;

    // Convert quote travelers to booking travelers format
    const travelers = [];
    const adultsCount = quote.travelers?.adults || 0;
    const childrenCount = quote.travelers?.children || 0;
    const infantsCount = quote.travelers?.infants || 0;

    // Add adults
    for (let i = 0; i < adultsCount; i++) {
      travelers.push({
        type: 'adult',
        firstName: i === 0 ? (quote.customer.name.split(' ')[0] || 'Adult') : `Adult`,
        lastName: i === 0 ? (quote.customer.name.split(' ').slice(1).join(' ') || `${i + 1}`) : `${i + 1}`,
      });
    }

    // Add children
    for (let i = 0; i < childrenCount; i++) {
      travelers.push({
        type: 'child',
        firstName: 'Child',
        lastName: `${i + 1}`,
      });
    }

    // Add infants
    for (let i = 0; i < infantsCount; i++) {
      travelers.push({
        type: 'infant',
        firstName: 'Infant',
        lastName: `${i + 1}`,
      });
    }

    // Create booking from quote
    const booking = await Booking.create({
      tenant: req.user.tenant,
      bookingNumber,
      itinerary: quote.itinerary._id,
      lead: quote.lead,
      customer: quote.customer,
      travelStartDate: quote.travelDates?.startDate || quote.itinerary.startDate,
      travelEndDate: quote.travelDates?.endDate || quote.itinerary.endDate,
      travelers,
      pricing: {
        basePrice: quote.pricing.subtotal || 0,
        totalPrice: quote.pricing.grandTotal || 0,
        currency: quote.pricing.currency || 'USD',
        taxes: quote.pricing.taxTotal || 0,
        discount: quote.pricing.discountTotal || 0,
      },
      status: 'confirmed',
      createdBy: req.user._id,
    });

    // Update quote
    quote.convertToBooking(booking._id);
    await quote.save();

    res.status(201).json({
      success: true,
      data: {
        booking,
        quote,
      },
      message: 'Quote converted to booking successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/quotes/:id/versions
 * @desc    Get all versions of a quote
 * @access  Private
 */
exports.getQuoteVersions = async (req, res, next) => {
  try {
    const quote = await Quote.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
    });

    if (!quote) {
      throw new AppError('Quote not found', 404);
    }

    // Find all versions (parent and children)
    const parentId = quote.parentQuote || quote._id;
    
    const versions = await Quote.find({
      tenant: req.user.tenant,
      $or: [
        { _id: parentId },
        { parentQuote: parentId },
      ],
    })
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email')
      .sort({ version: 1 });

    res.status(200).json({
      success: true,
      data: versions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/quotes/stats
 * @desc    Get quote statistics
 * @access  Private
 */
exports.getQuoteStats = async (req, res, next) => {
  try {
    const { userId } = req.query;

    const stats = await Quote.getStatistics(
      req.user.tenant,
      userId || null
    );

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/quotes/expiring
 * @desc    Get expiring quotes
 * @access  Private
 */
exports.getExpiringQuotes = async (req, res, next) => {
  try {
    const { days = 7 } = req.query;

    const quotes = await Quote.findExpiring(req.user.tenant, parseInt(days));

    res.status(200).json({
      success: true,
      data: quotes,
    });
  } catch (error) {
    next(error);
  }
};
