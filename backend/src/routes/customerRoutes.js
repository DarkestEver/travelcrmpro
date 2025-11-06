const express = require('express');
const router = express.Router();
const {
  getAllCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  addCustomerNote,
  getCustomerNotes,
  getCustomerStats,
  bulkImportCustomers,
} = require('../controllers/customerController');
const { protect, restrictTo, loadAgent, checkAgentOwnership } = require('../middleware/auth');
const { auditLogger } = require('../middleware/auditLogger');
const { Agent } = require('../models');

// All routes require authentication
router.use(protect);

// Stats route - MUST be before /:id routes
router.get('/stats', restrictTo('super_admin', 'operator'), getCustomerStats);

// Search route - MUST be before /:id routes
router.get('/search', restrictTo('super_admin', 'operator', 'agent'), loadAgent, async (req, res, next) => {
  try {
    const { query, status, email, phone, page = 1, limit = 10 } = req.query;
    const { Customer } = require('../models');
    
    // Build search query
    const searchQuery = {};
    
    // If agent, restrict to their customers
    if (req.user.role === 'agent' && req.agent) {
      searchQuery.agentId = req.agent._id;
    }
    
    // Text search across multiple fields
    if (query) {
      searchQuery.$or = [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } },
        { company: { $regex: query, $options: 'i' } }
      ];
    }
    
    // Filter by specific fields
    if (status) searchQuery.status = status;
    if (email) searchQuery.email = { $regex: email, $options: 'i' };
    if (phone) searchQuery.phone = { $regex: phone, $options: 'i' };
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute search
    const [customers, total] = await Promise.all([
      Customer.find(searchQuery)
        .populate('agentId', 'name email')
        .select('name email phone company status createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Customer.countDocuments(searchQuery)
    ]);
    
    res.json({
      success: true,
      data: customers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

// Bulk operations
router.post('/bulk-import', restrictTo('super_admin', 'operator', 'agent'), auditLogger('create', 'customer'), bulkImportCustomers);

// CRUD routes
router.get('/', restrictTo('super_admin', 'operator', 'agent'), loadAgent, getAllCustomers);
router.post('/', restrictTo('super_admin', 'operator', 'agent'), loadAgent, auditLogger('create', 'customer'), createCustomer);

router.get('/:id', getCustomer);
router.put('/:id', auditLogger('update', 'customer'), updateCustomer);
router.delete('/:id', auditLogger('delete', 'customer'), deleteCustomer);

// Additional routes
router.post('/:id/notes', auditLogger('update', 'customer'), addCustomerNote);
router.get('/:id/notes', getCustomerNotes);

// Preferences management
router.put('/:id/preferences', auditLogger('update', 'customer'), async (req, res, next) => {
  try {
    const { Customer } = require('../models');
    const { dietaryRestrictions, interests, budgetRange } = req.body;
    
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          'preferences.dietaryRestrictions': dietaryRestrictions || [],
          'preferences.interests': interests || [],
          'preferences.budgetRange': budgetRange
        }
      },
      { new: true, runValidators: true }
    );
    
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    
    res.json({ success: true, message: 'Preferences updated', data: { customer } });
  } catch (error) {
    next(error);
  }
});

// Documents management
router.get('/:id/documents', async (req, res, next) => {
  try {
    const { Customer } = require('../models');
    const customer = await Customer.findById(req.params.id).select('documents');
    
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    
    res.json({ success: true, data: customer.documents || [] });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/documents', auditLogger('update', 'customer'), async (req, res, next) => {
  try {
    const { Customer } = require('../models');
    const { documentType, documentNumber, documentUrl, expiryDate, notes } = req.body;
    
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          documents: {
            documentType,
            documentNumber,
            documentUrl,
            expiryDate,
            notes,
            uploadedAt: new Date()
          }
        }
      },
      { new: true }
    );
    
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    
    res.json({ success: true, message: 'Document added', data: { customer } });
  } catch (error) {
    next(error);
  }
});

// Travel history
router.get('/:id/travel-history', async (req, res, next) => {
  try {
    const { Booking } = require('../models');
    const bookings = await Booking.find({ 
      customerId: req.params.id,
      bookingStatus: { $in: ['completed', 'confirmed'] }
    })
      .populate('itineraryId', 'title destination duration')
      .populate('agentId', 'name')
      .select('bookingNumber travelDates bookingStatus financial.totalAmount createdAt')
      .sort({ 'travelDates.startDate': -1 });
    
    res.json({ 
      success: true, 
      data: bookings,
      summary: {
        totalTrips: bookings.length,
        totalSpent: bookings.reduce((sum, b) => sum + (b.financial?.totalAmount || 0), 0)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Related data routes
router.get('/:id/quotes', async (req, res) => {
  const { Quote } = require('../models');
  const quotes = await Quote.find({ customerId: req.params.id })
    .populate('agentId', 'name email')
    .populate('itineraryId', 'title destination')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: quotes });
});

router.get('/:id/bookings', async (req, res) => {
  const { Booking } = require('../models');
  const bookings = await Booking.find({ customerId: req.params.id })
    .populate('agentId', 'name email')
    .populate('quoteId', 'quoteNumber')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: bookings });
});

module.exports = router;
