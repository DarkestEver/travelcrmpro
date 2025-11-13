const express = require('express');
const router = express.Router();
const {
  getAllBookings,
  getBooking,
  createBooking,
  updateBooking,
  addPayment,
  confirmBooking,
  cancelBooking,
  completeBooking,
  getBookingStats,
} = require('../controllers/bookingController');
const shareService = require('../services/shareService');
const { asyncHandler } = require('../middleware/errorHandler');
const { successResponse } = require('../utils/response');
const { protect, restrictTo, loadAgent } = require('../middleware/auth');
const { auditLogger } = require('../middleware/auditLogger');

// All routes require authentication
router.use(protect);

// Stats route
router.get('/stats', restrictTo('super_admin', 'operator', 'agent'), loadAgent, getBookingStats);

// CRUD routes
router.get('/', restrictTo('super_admin', 'operator', 'agent'), loadAgent, getAllBookings);
router.post('/', restrictTo('super_admin', 'operator', 'agent'), loadAgent, auditLogger('create', 'booking'), createBooking);

router.get('/:id', getBooking);
router.put('/:id', auditLogger('update', 'booking'), updateBooking);

// Share booking
router.post('/:id/share', asyncHandler(async (req, res) => {
  const { expiresInDays = 30, password, singleUse = false } = req.body;
  
  const shareToken = await shareService.generateShareToken({
    entityType: 'Booking',
    entityId: req.params.id,
    tenantId: req.user.tenantId,
    createdBy: req.user._id,
    expiresInDays,
    password,
    singleUse,
    allowedActions: ['view', 'download'],
    requireEmail: false
  });

  // Don't send shareUrl - let frontend construct it with correct domain
  successResponse(res, 200, 'Shareable link generated successfully', {
    token: shareToken.token,
    expiresAt: shareToken.expiresAt,
    hasPassword: !!password,
    singleUse: singleUse
  });
}));

// Booking actions
router.post('/:id/payment', auditLogger('payment', 'booking'), addPayment);
router.patch('/:id/confirm', auditLogger('update', 'booking'), confirmBooking);
router.patch('/:id/cancel', auditLogger('update', 'booking'), cancelBooking);
router.patch('/:id/complete', restrictTo('super_admin', 'operator'), auditLogger('update', 'booking'), completeBooking);

// Generate voucher
router.post('/:id/generate-voucher', auditLogger('view', 'booking'), async (req, res, next) => {
  try {
    const { Booking, Customer } = require('../models');
    const { generateVoucherPDF } = require('../utils/pdfGenerator');
    
    const booking = await Booking.findById(req.params.id)
      .populate('itineraryId')
      .populate('customerId');
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    const pdfBuffer = await generateVoucherPDF(booking, booking.customerId);
    
    // Save voucher URL (in real app, save to S3/storage)
    booking.voucherUrl = `/vouchers/${booking.bookingNumber}.pdf`;
    booking.voucherGeneratedAt = new Date();
    await booking.save();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=voucher-${booking.bookingNumber}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
});

// Get booking documents
router.get('/:id/documents', async (req, res, next) => {
  try {
    const { Booking } = require('../models');
    const booking = await Booking.findById(req.params.id).select('documents voucherUrl');
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    const documents = [];
    if (booking.voucherUrl) {
      documents.push({
        type: 'voucher',
        url: booking.voucherUrl,
        name: `Voucher-${booking.bookingNumber}`
      });
    }
    
    res.json({ success: true, data: documents });
  } catch (error) {
    next(error);
  }
});

// Add booking notes
router.post('/:id/notes', auditLogger('update', 'booking'), async (req, res, next) => {
  try {
    const { Booking } = require('../models');
    const { note, type = 'internal' } = req.body;
    
    if (!note) {
      return res.status(400).json({ success: false, message: 'Note content is required' });
    }
    
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          internalNotes: note,
          updatedAt: new Date()
        }
      },
      { new: true }
    );
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    res.json({ success: true, message: 'Note added', data: { booking } });
  } catch (error) {
    next(error);
  }
});

// Get booking timeline
router.get('/:id/timeline', async (req, res, next) => {
  try {
    const { Booking } = require('../models');
    const booking = await Booking.findById(req.params.id)
      .select('bookingStatus paymentStatus paymentRecords createdAt updatedAt');
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    const timeline = [
      {
        event: 'Booking Created',
        timestamp: booking.createdAt,
        status: 'created'
      }
    ];
    
    // Add payment events
    if (booking.paymentRecords && booking.paymentRecords.length > 0) {
      booking.paymentRecords.forEach(payment => {
        timeline.push({
          event: `Payment Received`,
          amount: payment.amount,
          method: payment.method,
          timestamp: payment.paidAt,
          status: 'payment'
        });
      });
    }
    
    // Add status changes
    if (booking.bookingStatus !== 'pending') {
      timeline.push({
        event: `Booking ${booking.bookingStatus}`,
        timestamp: booking.updatedAt,
        status: booking.bookingStatus
      });
    }
    
    // Sort by timestamp
    timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    res.json({ success: true, data: timeline });
  } catch (error) {
    next(error);
  }
});

// Export booking as PDF
router.get('/:id/export', auditLogger('view', 'booking'), async (req, res, next) => {
  try {
    const { Booking } = require('../models');
    const { generateBookingPDF } = require('../utils/pdfGenerator');
    
    const booking = await Booking.findById(req.params.id)
      .populate('customerId')
      .populate('itineraryId')
      .populate('agentId', 'name email');
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    const pdfBuffer = await generateBookingPDF(booking, booking.customerId);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=booking-${booking.bookingNumber}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
