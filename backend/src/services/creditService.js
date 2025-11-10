const User = require('../models/User');
const Booking = require('../models/Booking');

/**
 * Get agent's credit status
 * @param {String} agentId - The agent's user ID
 * @returns {Object} Credit status information
 */
exports.getCreditStatus = async (agentId) => {
  const agent = await User.findById(agentId);
  
  if (!agent || agent.role !== 'agent') {
    throw new Error('Agent not found');
  }

  // Calculate pending bookings total
  const pendingBookings = await Booking.aggregate([
    {
      $match: {
        agentId: agent._id,
        bookingStatus: { $in: ['pending', 'confirmed'] },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$financial.totalAmount' },
        count: { $sum: 1 },
      },
    },
  ]);

  const creditLimit = agent.creditLimit || 0;
  const creditUsed = agent.creditUsed || 0;
  const availableCredit = Math.max(0, creditLimit - creditUsed);
  const pendingAmount = pendingBookings[0]?.total || 0;
  const utilizationPercentage = creditLimit > 0 ? (creditUsed / creditLimit) * 100 : 0;

  return {
    creditLimit,
    creditUsed,
    availableCredit,
    pendingAmount,
    pendingBookingsCount: pendingBookings[0]?.count || 0,
    utilizationPercentage: Math.round(utilizationPercentage * 100) / 100,
    status: utilizationPercentage >= 90 ? 'critical' : utilizationPercentage >= 75 ? 'warning' : 'healthy',
  };
};

/**
 * Check if agent can make a booking with given amount
 * @param {String} agentId - The agent's user ID
 * @param {Number} amount - The booking amount to check
 * @returns {Object} Result with canBook flag and reason
 */
exports.canMakeBooking = async (agentId, amount) => {
  const agent = await User.findById(agentId);
  
  if (!agent || agent.role !== 'agent') {
    return { canBook: false, reason: 'Agent not found' };
  }

  const availableCredit = agent.creditLimit - agent.creditUsed;

  if (amount > availableCredit) {
    return {
      canBook: false,
      reason: 'Insufficient credit',
      required: amount,
      available: availableCredit,
      shortfall: amount - availableCredit,
    };
  }

  return {
    canBook: true,
    available: availableCredit,
  };
};

/**
 * Reserve credit for a booking
 * @param {String} agentId - The agent's user ID
 * @param {Number} amount - The amount to reserve
 * @param {String} bookingId - The booking ID
 * @returns {Boolean} Success status
 */
exports.reserveCredit = async (agentId, amount, bookingId) => {
  const agent = await User.findById(agentId);
  
  if (!agent || agent.role !== 'agent') {
    throw new Error('Agent not found');
  }

  const canBook = await exports.canMakeBooking(agentId, amount);
  
  if (!canBook.canBook) {
    throw new Error(`Cannot reserve credit: ${canBook.reason}`);
  }

  agent.creditUsed += amount;
  await agent.save();

  console.log(`💳 Reserved ${amount} credit for agent ${agent.agentCode} (Booking: ${bookingId})`);
  console.log(`   Credit Used: ${agent.creditUsed} / ${agent.creditLimit}`);

  return true;
};

/**
 * Release credit when booking is cancelled or completed
 * @param {String} agentId - The agent's user ID
 * @param {Number} amount - The amount to release
 * @param {String} bookingId - The booking ID
 * @returns {Boolean} Success status
 */
exports.releaseCredit = async (agentId, amount, bookingId) => {
  const agent = await User.findById(agentId);
  
  if (!agent || agent.role !== 'agent') {
    throw new Error('Agent not found');
  }

  agent.creditUsed = Math.max(0, agent.creditUsed - amount);
  await agent.save();

  console.log(`💳 Released ${amount} credit for agent ${agent.agentCode} (Booking: ${bookingId})`);
  console.log(`   Credit Used: ${agent.creditUsed} / ${agent.creditLimit}`);

  return true;
};

/**
 * Get credit usage history for agent
 * @param {String} agentId - The agent's user ID
 * @param {Object} options - Query options (startDate, endDate, limit)
 * @returns {Array} Credit usage history
 */
exports.getCreditHistory = async (agentId, options = {}) => {
  const { startDate, endDate, limit = 50 } = options;

  const query = {
    agentId,
  };

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  // Get bookings that affected credit
  const bookings = await Booking.find(query)
    .select('bookingNumber bookingStatus financial.totalAmount createdAt updatedAt')
    .sort('-createdAt')
    .limit(limit)
    .lean();

  // Transform into credit history entries
  const history = bookings.map((booking) => ({
    bookingId: booking._id,
    bookingNumber: booking.bookingNumber,
    type: booking.bookingStatus === 'cancelled' ? 'release' : 'reserve',
    amount: booking.financial?.totalAmount || 0,
    status: booking.bookingStatus,
    date: booking.createdAt,
  }));

  return history;
};

/**
 * Update agent's credit limit (admin function)
 * @param {String} agentId - The agent's user ID
 * @param {Number} newLimit - The new credit limit
 * @param {String} updatedBy - User ID who updated the limit
 * @returns {Object} Updated agent info
 */
exports.updateCreditLimit = async (agentId, newLimit, updatedBy) => {
  const agent = await User.findById(agentId);
  
  if (!agent || agent.role !== 'agent') {
    throw new Error('Agent not found');
  }

  const oldLimit = agent.creditLimit;
  agent.creditLimit = newLimit;
  await agent.save();

  console.log(`💳 Credit limit updated for agent ${agent.agentCode}`);
  console.log(`   Old Limit: ${oldLimit} → New Limit: ${newLimit}`);
  console.log(`   Updated by: ${updatedBy}`);

  return {
    agentId: agent._id,
    agentCode: agent.agentCode,
    oldLimit,
    newLimit,
    creditUsed: agent.creditUsed,
    availableCredit: Math.max(0, newLimit - agent.creditUsed),
  };
};

/**
 * Recalculate credit used for an agent (reconciliation)
 * @param {String} agentId - The agent's user ID
 * @returns {Object} Reconciliation result
 */
exports.recalculateCreditUsed = async (agentId) => {
  const agent = await User.findById(agentId);
  
  if (!agent || agent.role !== 'agent') {
    throw new Error('Agent not found');
  }

  // Calculate actual credit used from active bookings
  const activeBookings = await Booking.aggregate([
    {
      $match: {
        agentId: agent._id,
        bookingStatus: { $in: ['pending', 'confirmed'] },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$financial.totalAmount' },
      },
    },
  ]);

  const actualCreditUsed = activeBookings[0]?.total || 0;
  const oldCreditUsed = agent.creditUsed;
  const difference = actualCreditUsed - oldCreditUsed;

  agent.creditUsed = actualCreditUsed;
  await agent.save();

  console.log(`💳 Credit reconciliation for agent ${agent.agentCode}`);
  console.log(`   Old Credit Used: ${oldCreditUsed}`);
  console.log(`   Actual Credit Used: ${actualCreditUsed}`);
  console.log(`   Difference: ${difference}`);

  return {
    agentId: agent._id,
    agentCode: agent.agentCode,
    oldCreditUsed,
    actualCreditUsed,
    difference,
    status: difference === 0 ? 'in-sync' : 'adjusted',
  };
};

module.exports = exports;
