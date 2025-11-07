const Customer = require('../models/Customer');
const QuoteRequest = require('../models/QuoteRequest');
const Booking = require('../models/Booking');

/**
 * Agent Data Access Helper
 * Provides agent-scoped data access functions
 * Ensures agents can only access their own data
 */

/**
 * Get agent's customers
 * @param {string} agentId - Agent's user ID
 * @param {Object} filters - Additional filters (search, status, etc.)
 * @param {Object} options - Pagination options (page, limit, sort)
 * @returns {Promise<Object>} Customers with pagination
 */
exports.getAgentCustomers = async (agentId, filters = {}, options = {}) => {
  const {
    page = 1,
    limit = 10,
    sort = '-createdAt',
    search = '',
  } = options;

  // Build query
  const query = {
    agentId,
    ...filters,
  };

  // Add search if provided
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;

  const [customers, total] = await Promise.all([
    Customer.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Customer.countDocuments(query),
  ]);

  return {
    customers,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get agent's quote requests
 * @param {string} agentId - Agent's user ID
 * @param {Object} filters - Additional filters
 * @param {Object} options - Pagination options
 * @returns {Promise<Object>} Quote requests with pagination
 */
exports.getAgentQuoteRequests = async (agentId, filters = {}, options = {}) => {
  const {
    page = 1,
    limit = 10,
    sort = '-createdAt',
  } = options;

  const query = {
    agentId,
    ...filters,
  };

  const skip = (page - 1) * limit;

  const [quoteRequests, total] = await Promise.all([
    QuoteRequest.find(query)
      .populate('customerId', 'firstName lastName email')
      .populate('quotedBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    QuoteRequest.countDocuments(query),
  ]);

  return {
    quoteRequests,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get agent's bookings
 * @param {string} agentId - Agent's user ID
 * @param {Object} filters - Additional filters
 * @param {Object} options - Pagination options
 * @returns {Promise<Object>} Bookings with pagination
 */
exports.getAgentBookings = async (agentId, filters = {}, options = {}) => {
  const {
    page = 1,
    limit = 10,
    sort = '-createdAt',
  } = options;

  const query = {
    agentId,
    ...filters,
  };

  const skip = (page - 1) * limit;

  const [bookings, total] = await Promise.all([
    Booking.find(query)
      .populate('customerId', 'firstName lastName email')
      .populate('itineraryId', 'title destination')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Booking.countDocuments(query),
  ]);

  return {
    bookings,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Verify agent owns a customer
 * @param {string} agentId - Agent's user ID
 * @param {string} customerId - Customer ID to verify
 * @returns {Promise<boolean>} True if agent owns customer
 */
exports.verifyAgentOwnsCustomer = async (agentId, customerId) => {
  const customer = await Customer.findOne({
    _id: customerId,
    agentId,
  }).lean();

  return !!customer;
};

/**
 * Verify agent owns a quote request
 * @param {string} agentId - Agent's user ID
 * @param {string} quoteRequestId - Quote request ID to verify
 * @returns {Promise<boolean>} True if agent owns quote request
 */
exports.verifyAgentOwnsQuoteRequest = async (agentId, quoteRequestId) => {
  const quoteRequest = await QuoteRequest.findOne({
    _id: quoteRequestId,
    agentId,
  }).lean();

  return !!quoteRequest;
};
