const BookingAdjustment = require('../models/BookingAdjustment');
const Booking = require('../models/Booking');
const Invoice = require('../models/Invoice');
const TaxSettings = require('../models/TaxSettings');
const { sendEmail } = require('../utils/emailService');

// @desc    Get all adjustments for finance
// @route   GET /api/finance/adjustments
// @access  Private (Finance)
exports.getAdjustments = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { 
      bookingId, 
      adjustmentType, 
      status, 
      startDate, 
      endDate,
      page = 1,
      limit = 50 
    } = req.query;
    
    const query = { tenantId };
    
    if (bookingId) query.bookingId = bookingId;
    if (adjustmentType) query.adjustmentType = adjustmentType;
    if (status) query.status = status;
    
    if (startDate && endDate) {
      query.effectiveDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }
    
    const adjustments = await BookingAdjustment.find(query)
      .populate('bookingId', 'bookingNumber customerName')
      .populate('customerId', 'name email phone')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const count = await BookingAdjustment.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: adjustments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error('Get Adjustments Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching adjustments',
      error: error.message,
    });
  }
};

// @desc    Get single adjustment
// @route   GET /api/finance/adjustments/:id
// @access  Private (Finance)
exports.getAdjustment = async (req, res) => {
  try {
    const { tenantId } = req.user;
    
    const adjustment = await BookingAdjustment.findOne({
      _id: req.params.id,
      tenantId,
    })
      .populate('bookingId')
      .populate('itineraryId')
      .populate('customerId')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('invoiceId')
      .populate('paymentId');
    
    if (!adjustment) {
      return res.status(404).json({
        success: false,
        message: 'Adjustment not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: adjustment,
    });
  } catch (error) {
    console.error('Get Adjustment Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching adjustment',
      error: error.message,
    });
  }
};

// @desc    Create new adjustment
// @route   POST /api/finance/adjustments
// @access  Private (Finance)
exports.createAdjustment = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const {
      bookingId,
      adjustmentType,
      category,
      amount,
      impactType,
      description,
      reason,
      isTaxable,
      approvalThreshold,
      notifyCustomer,
    } = req.body;
    
    // Verify booking exists
    const booking = await Booking.findOne({
      _id: bookingId,
      tenantId,
    });
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }
    
    // Get tax settings
    const taxSettings = await TaxSettings.findOne({ tenantId, isActive: true });
    
    // Create adjustment
    const adjustment = await BookingAdjustment.create({
      tenantId,
      bookingId,
      itineraryId: booking.itineraryId,
      customerId: booking.customerId,
      adjustmentType,
      category,
      amount,
      impactType,
      description,
      reason,
      isTaxable: isTaxable !== false,
      taxRate: taxSettings?.globalTaxRate || 0,
      approvalThreshold: approvalThreshold || 500, // Default $500 threshold
      notifyCustomer: notifyCustomer !== false,
      createdBy: req.user._id,
      ...req.body,
    });
    
    // Send notification to customer if required
    if (adjustment.notifyCustomer && !adjustment.requiresApproval) {
      // TODO: Send email notification
      adjustment.customerNotified = true;
      adjustment.notificationSentAt = new Date();
      await adjustment.save();
    }
    
    res.status(201).json({
      success: true,
      data: adjustment,
      message: adjustment.requiresApproval 
        ? 'Adjustment created and pending approval'
        : 'Adjustment created successfully',
    });
  } catch (error) {
    console.error('Create Adjustment Error:', error);
    res.status(400).json({
      success: false,
      message: 'Error creating adjustment',
      error: error.message,
    });
  }
};

// @desc    Update adjustment
// @route   PUT /api/finance/adjustments/:id
// @access  Private (Finance)
exports.updateAdjustment = async (req, res) => {
  try {
    const { tenantId } = req.user;
    
    const adjustment = await BookingAdjustment.findOne({
      _id: req.params.id,
      tenantId,
    });
    
    if (!adjustment) {
      return res.status(404).json({
        success: false,
        message: 'Adjustment not found',
      });
    }
    
    // Only allow updates if status is draft or pending
    if (!['draft', 'pending'].includes(adjustment.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update adjustment in current status',
      });
    }
    
    Object.assign(adjustment, req.body);
    adjustment.updatedBy = req.user._id;
    
    await adjustment.save();
    
    res.status(200).json({
      success: true,
      data: adjustment,
      message: 'Adjustment updated successfully',
    });
  } catch (error) {
    console.error('Update Adjustment Error:', error);
    res.status(400).json({
      success: false,
      message: 'Error updating adjustment',
      error: error.message,
    });
  }
};

// @desc    Approve adjustment
// @route   POST /api/finance/adjustments/:id/approve
// @access  Private (Finance/Admin)
exports.approveAdjustment = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { notes } = req.body;
    
    const adjustment = await BookingAdjustment.findOne({
      _id: req.params.id,
      tenantId,
    });
    
    if (!adjustment) {
      return res.status(404).json({
        success: false,
        message: 'Adjustment not found',
      });
    }
    
    if (adjustment.approvalStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Adjustment is not pending approval',
      });
    }
    
    await adjustment.approve(req.user._id, notes);
    
    // Notify customer if required
    if (adjustment.notifyCustomer && !adjustment.customerNotified) {
      // TODO: Send email notification
      adjustment.customerNotified = true;
      adjustment.notificationSentAt = new Date();
      await adjustment.save();
    }
    
    res.status(200).json({
      success: true,
      data: adjustment,
      message: 'Adjustment approved successfully',
    });
  } catch (error) {
    console.error('Approve Adjustment Error:', error);
    res.status(400).json({
      success: false,
      message: 'Error approving adjustment',
      error: error.message,
    });
  }
};

// @desc    Reject adjustment
// @route   POST /api/finance/adjustments/:id/reject
// @access  Private (Finance/Admin)
exports.rejectAdjustment = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required',
      });
    }
    
    const adjustment = await BookingAdjustment.findOne({
      _id: req.params.id,
      tenantId,
    });
    
    if (!adjustment) {
      return res.status(404).json({
        success: false,
        message: 'Adjustment not found',
      });
    }
    
    await adjustment.reject(req.user._id, reason);
    
    res.status(200).json({
      success: true,
      data: adjustment,
      message: 'Adjustment rejected',
    });
  } catch (error) {
    console.error('Reject Adjustment Error:', error);
    res.status(400).json({
      success: false,
      message: 'Error rejecting adjustment',
      error: error.message,
    });
  }
};

// @desc    Reverse adjustment
// @route   POST /api/finance/adjustments/:id/reverse
// @access  Private (Finance)
exports.reverseAdjustment = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Reversal reason is required',
      });
    }
    
    const adjustment = await BookingAdjustment.findOne({
      _id: req.params.id,
      tenantId,
    });
    
    if (!adjustment) {
      return res.status(404).json({
        success: false,
        message: 'Adjustment not found',
      });
    }
    
    if (adjustment.status === 'reversed') {
      return res.status(400).json({
        success: false,
        message: 'Adjustment already reversed',
      });
    }
    
    const reversalAdjustment = await adjustment.reverse(req.user._id, reason);
    
    res.status(200).json({
      success: true,
      data: {
        original: adjustment,
        reversal: reversalAdjustment,
      },
      message: 'Adjustment reversed successfully',
    });
  } catch (error) {
    console.error('Reverse Adjustment Error:', error);
    res.status(400).json({
      success: false,
      message: 'Error reversing adjustment',
      error: error.message,
    });
  }
};

// @desc    Get adjustments for a booking
// @route   GET /api/finance/adjustments/booking/:bookingId
// @access  Private (Finance)
exports.getBookingAdjustments = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { bookingId } = req.params;
    
    const adjustments = await BookingAdjustment.find({
      bookingId,
      tenantId,
    })
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 });
    
    // Calculate totals
    const totals = await BookingAdjustment.calculateBookingTotal(bookingId);
    
    res.status(200).json({
      success: true,
      data: adjustments,
      totals,
    });
  } catch (error) {
    console.error('Get Booking Adjustments Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching booking adjustments',
      error: error.message,
    });
  }
};

// @desc    Get pending approvals
// @route   GET /api/finance/adjustments/pending-approvals
// @access  Private (Finance/Admin)
exports.getPendingApprovals = async (req, res) => {
  try {
    const { tenantId } = req.user;
    
    const pendingAdjustments = await BookingAdjustment.getPendingApprovals(tenantId);
    
    res.status(200).json({
      success: true,
      data: pendingAdjustments,
      count: pendingAdjustments.length,
    });
  } catch (error) {
    console.error('Get Pending Approvals Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending approvals',
      error: error.message,
    });
  }
};

// @desc    Get financial summary
// @route   GET /api/finance/adjustments/summary
// @access  Private (Finance)
exports.getFinancialSummary = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { startDate, endDate } = req.query;
    
    const summary = await BookingAdjustment.getFinancialSummary(
      tenantId,
      startDate,
      endDate
    );
    
    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Get Financial Summary Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating financial summary',
      error: error.message,
    });
  }
};

// @desc    Bulk approve adjustments
// @route   POST /api/finance/adjustments/bulk-approve
// @access  Private (Finance/Admin)
exports.bulkApprove = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { adjustmentIds, notes } = req.body;
    
    if (!adjustmentIds || !Array.isArray(adjustmentIds)) {
      return res.status(400).json({
        success: false,
        message: 'adjustmentIds array is required',
      });
    }
    
    const results = {
      approved: [],
      failed: [],
    };
    
    for (const id of adjustmentIds) {
      try {
        const adjustment = await BookingAdjustment.findOne({
          _id: id,
          tenantId,
          approvalStatus: 'pending',
        });
        
        if (adjustment) {
          await adjustment.approve(req.user._id, notes);
          results.approved.push(id);
        } else {
          results.failed.push({ id, reason: 'Not found or not pending' });
        }
      } catch (error) {
        results.failed.push({ id, reason: error.message });
      }
    }
    
    res.status(200).json({
      success: true,
      data: results,
      message: `Approved ${results.approved.length} adjustments`,
    });
  } catch (error) {
    console.error('Bulk Approve Error:', error);
    res.status(400).json({
      success: false,
      message: 'Error bulk approving adjustments',
      error: error.message,
    });
  }
};

module.exports = exports;
