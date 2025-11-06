const express = require('express');
const router = express.Router();
const {
  getAllAgents,
  getAgent,
  createAgent,
  updateAgent,
  approveAgent,
  suspendAgent,
  reactivateAgent,
  deleteAgent,
  getAgentStats,
} = require('../controllers/agentController');
const { protect, restrictTo, loadAgent } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const { auditLogger } = require('../middleware/auditLogger');
const {
  createAgentValidation,
  updateAgentValidation,
  approveAgentValidation,
} = require('../validations/agentValidation');

// All routes require authentication
router.use(protect);

// Stats route - MUST be before /:id routes
router.get('/stats', restrictTo('super_admin', 'operator'), getAgentStats);

// Routes accessible by agents (for their own profile)
router.post('/', createAgentValidation, validate, auditLogger('create', 'agent'), createAgent);

// Routes requiring admin access
router.get('/', restrictTo('super_admin', 'operator'), getAllAgents);

// Routes with mixed access
router.get('/:id', getAgent);
router.put('/:id', updateAgentValidation, validate, auditLogger('update', 'agent'), updateAgent);

// Admin-only routes
router.patch('/:id/approve', restrictTo('super_admin', 'operator'), approveAgentValidation, validate, auditLogger('update', 'agent'), approveAgent);
router.patch('/:id/suspend', restrictTo('super_admin', 'operator'), auditLogger('update', 'agent'), suspendAgent);
router.patch('/:id/reactivate', restrictTo('super_admin', 'operator'), auditLogger('update', 'agent'), reactivateAgent);
router.delete('/:id', restrictTo('super_admin'), auditLogger('delete', 'agent'), deleteAgent);

// Additional routes for agent management
router.get('/:id/performance', restrictTo('super_admin', 'operator', 'agent'), async (req, res) => {
  const { Quote, Booking } = require('../models');
  const agentId = req.params.id;
  
  const quotes = await Quote.find({ agentId }).countDocuments();
  const acceptedQuotes = await Quote.find({ agentId, status: 'accepted' }).countDocuments();
  const bookings = await Booking.find({ agentId });
  
  const totalRevenue = bookings.reduce((sum, booking) => {
    return sum + (booking.pricing?.totalPrice || 0);
  }, 0);
  
  res.json({
    success: true,
    data: {
      totalQuotes: quotes,
      acceptedQuotes,
      conversionRate: quotes > 0 ? (acceptedQuotes / quotes * 100).toFixed(2) : 0,
      totalBookings: bookings.length,
      totalRevenue,
      averageBookingValue: bookings.length > 0 ? (totalRevenue / bookings.length).toFixed(2) : 0,
    }
  });
});

router.patch('/:id/status', restrictTo('super_admin', 'operator'), async (req, res) => {
  const { Agent } = require('../models');
  const { status, notes } = req.body;
  
  const agent = await Agent.findByIdAndUpdate(
    req.params.id,
    { status, $push: { statusHistory: { status, notes, changedAt: Date.now() } } },
    { new: true, runValidators: true }
  );
  
  if (!agent) {
    return res.status(404).json({ success: false, message: 'Agent not found' });
  }
  
  res.json({ success: true, message: 'Agent status updated', data: { agent } });
});

router.get('/:id/customers', restrictTo('super_admin', 'operator', 'agent'), async (req, res) => {
  const { Customer } = require('../models');
  const customers = await Customer.find({ agentId: req.params.id })
    .select('name email phone company createdAt')
    .sort({ createdAt: -1 });
  
  res.json({ success: true, data: customers });
});

// Get agent commission details
router.get('/:id/commission', restrictTo('super_admin', 'operator', 'agent'), async (req, res, next) => {
  try {
    const { Agent, Booking } = require('../models');
    const agent = await Agent.findById(req.params.id).select('commissionStructure');
    
    if (!agent) {
      return res.status(404).json({ success: false, message: 'Agent not found' });
    }
    
    // Calculate total earnings from completed bookings
    const bookings = await Booking.find({ 
      agentId: req.params.id, 
      bookingStatus: 'completed' 
    });
    
    let totalEarned = 0;
    let pendingPayments = 0;
    
    bookings.forEach(booking => {
      const bookingTotal = booking.pricing?.totalPrice || 0;
      const baseRate = agent.commissionStructure?.baseCommission || 10;
      const commission = bookingTotal * (baseRate / 100);
      
      if (booking.paymentStatus === 'paid') {
        totalEarned += commission;
      } else {
        pendingPayments += commission;
      }
    });
    
    res.json({
      success: true,
      data: {
        commissionStructure: agent.commissionStructure,
        totalEarned: totalEarned.toFixed(2),
        pendingPayments: pendingPayments.toFixed(2),
        totalBookings: bookings.length
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update agent commission structure
router.put('/:id/commission', restrictTo('super_admin', 'operator'), auditLogger('update', 'agent'), async (req, res, next) => {
  try {
    const { Agent } = require('../models');
    const { baseCommission, bonusThreshold, bonusPercentage } = req.body;
    
    const agent = await Agent.findByIdAndUpdate(
      req.params.id,
      {
        commissionStructure: {
          baseCommission,
          bonusThreshold,
          bonusPercentage
        }
      },
      { new: true, runValidators: true }
    );
    
    if (!agent) {
      return res.status(404).json({ success: false, message: 'Agent not found' });
    }
    
    res.json({ success: true, message: 'Commission structure updated', data: { agent } });
  } catch (error) {
    next(error);
  }
});

// Get agent's bookings
router.get('/:id/bookings', restrictTo('super_admin', 'operator', 'agent'), async (req, res, next) => {
  try {
    const { Booking } = require('../models');
    const { page = 1, limit = 20, status } = req.query;
    
    const query = { agentId: req.params.id };
    if (status) query.bookingStatus = status;
    
    const bookings = await Booking.find(query)
      .populate('customerId', 'name email')
      .populate('itineraryId', 'title destination')
      .select('bookingNumber bookingStatus paymentStatus pricing travelDates createdAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Booking.countDocuments(query);
    
    // Calculate revenue stats
    const allBookings = await Booking.find(query);
    const totalRevenue = allBookings.reduce((sum, b) => sum + (b.pricing?.totalPrice || 0), 0);
    
    res.json({
      success: true,
      data: bookings,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      },
      stats: {
        totalBookings: total,
        totalRevenue: totalRevenue.toFixed(2)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get agent's quotes
router.get('/:id/quotes', restrictTo('super_admin', 'operator', 'agent'), async (req, res, next) => {
  try {
    const { Quote } = require('../models');
    const { page = 1, limit = 20, status } = req.query;
    
    const query = { agentId: req.params.id };
    if (status) query.status = status;
    
    const quotes = await Quote.find(query)
      .populate('customerId', 'name email')
      .populate('itineraryId', 'title destination')
      .select('quoteNumber status totalPrice validUntil createdAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Quote.countDocuments(query);
    
    // Calculate conversion stats
    const acceptedQuotes = await Quote.countDocuments({ agentId: req.params.id, status: 'accepted' });
    const conversionRate = total > 0 ? ((acceptedQuotes / total) * 100).toFixed(2) : 0;
    
    res.json({
      success: true,
      data: quotes,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      },
      stats: {
        totalQuotes: total,
        acceptedQuotes,
        conversionRate: `${conversionRate}%`
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
