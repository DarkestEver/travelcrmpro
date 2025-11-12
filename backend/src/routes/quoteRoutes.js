const express = require('express');
const router = express.Router();
const {
  getAllQuotes,
  getQuote,
  createQuote,
  updateQuote,
  sendQuote,
  acceptQuote,
  rejectQuote,
  deleteQuote,
  getQuoteStats,
  createQuoteFromEmail,
  sendMultipleQuotes,
} = require('../controllers/quoteController');
const { protect, restrictTo, loadAgent } = require('../middleware/auth');
const { auditLogger } = require('../middleware/auditLogger');

// All routes require authentication
router.use(protect);

// Stats route
router.get('/stats', restrictTo('super_admin', 'operator', 'agent'), loadAgent, getQuoteStats);

// Create quote from email match
router.post('/from-email', restrictTo('super_admin', 'operator', 'admin'), auditLogger('create', 'quote'), createQuoteFromEmail);

// Send multiple quotes in single email
router.post('/send-multiple', restrictTo('super_admin', 'operator', 'admin'), auditLogger('update', 'quote'), sendMultipleQuotes);

// CRUD routes
router.get('/', restrictTo('super_admin', 'operator', 'agent'), loadAgent, getAllQuotes);
router.post('/', restrictTo('super_admin', 'operator', 'agent'), loadAgent, auditLogger('create', 'quote'), createQuote);

router.get('/:id', getQuote);
router.put('/:id', auditLogger('update', 'quote'), updateQuote);
router.delete('/:id', auditLogger('delete', 'quote'), deleteQuote);

// Quote actions
router.post('/:id/send', auditLogger('update', 'quote'), sendQuote);
router.patch('/:id/accept', auditLogger('update', 'quote'), acceptQuote);
router.patch('/:id/reject', auditLogger('update', 'quote'), rejectQuote);

// Quote duplicate
router.post('/:id/duplicate', auditLogger('create', 'quote'), async (req, res, next) => {
  try {
    const { Quote } = require('../models');
    const originalQuote = await Quote.findById(req.params.id).populate('itineraryId customerId agentId');
    
    if (!originalQuote) {
      return res.status(404).json({ success: false, message: 'Quote not found' });
    }
    
    // Generate new quote number
    const count = await Quote.countDocuments();
    const year = new Date().getFullYear();
    const newQuoteNumber = `Q${year}-${String(count + 1).padStart(6, '0')}`;
    
    // Create duplicate with only necessary fields
    const newQuoteData = {
      quoteNumber: newQuoteNumber,
      customerId: originalQuote.customerId._id,
      itineraryId: originalQuote.itineraryId._id,
      agentId: originalQuote.agentId,
      createdBy: req.user._id, // Add the current user as creator
      numberOfTravelers: originalQuote.numberOfTravelers,
      travelDates: originalQuote.travelDates,
      pricing: originalQuote.pricing,
      specialRequests: originalQuote.specialRequests,
      internalNotes: originalQuote.internalNotes,
      status: 'draft',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    };
    
    const newQuote = await Quote.create(newQuoteData);
    await newQuote.populate('itineraryId customerId agentId');
    
    res.status(201).json({ success: true, message: 'Quote duplicated', data: { quote: newQuote } });
  } catch (error) {
    next(error);
  }
});

// Quote revisions (history)
router.get('/:id/revisions', async (req, res, next) => {
  try {
    const { Quote } = require('../models');
    const quote = await Quote.findById(req.params.id);
    
    if (!quote) {
      return res.status(404).json({ success: false, message: 'Quote not found' });
    }
    
    // Find all quotes for the same customer with similar itinerary
    const revisions = await Quote.find({
      customerId: quote.customerId,
      itineraryId: quote.itineraryId,
      _id: { $ne: quote._id }
    })
      .select('quoteNumber status pricing.totalPrice createdAt updatedAt')
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.json({ success: true, data: revisions });
  } catch (error) {
    next(error);
  }
});

// Export quote as PDF
router.get('/:id/export', async (req, res, next) => {
  try {
    const { Quote, Customer } = require('../models');
    const { generateQuotePDF } = require('../utils/pdfGenerator');
    
    const quote = await Quote.findById(req.params.id)
      .populate('itineraryId')
      .populate('customerId')
      .populate('agentId', 'name email');
    
    if (!quote) {
      return res.status(404).json({ success: false, message: 'Quote not found' });
    }
    
    const pdfBuffer = await generateQuotePDF(quote, quote.customerId);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=quote-${quote.quoteNumber}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
