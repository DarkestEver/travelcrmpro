const Commission = require('../models/Commission');
const Booking = require('../models/Booking');
const User = require('../models/User');

/**
 * Create commission record when booking is completed
 * @param {String} bookingId - The booking ID
 * @returns {Object} Created commission record
 */
exports.createCommissionForBooking = async (bookingId) => {
  try {
    console.log('💰 Creating commission for booking:', bookingId);

    // Get booking details with populated agent
    const booking = await Booking.findById(bookingId).populate('agentId');

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Only create commission if booking has an agent
    if (!booking.agentId) {
      console.log('📌 Booking has no agent, skipping commission creation');
      return null;
    }

    // Only create commission for completed bookings
    if (booking.bookingStatus !== 'completed') {
      console.log('📌 Booking not completed yet, skipping commission creation');
      return null;
    }

    // Check if commission already exists
    const existingCommission = await Commission.findOne({ bookingId });
    if (existingCommission) {
      console.log('⚠️ Commission already exists for this booking');
      return existingCommission;
    }

    // Get booking amount from financial data
    const bookingAmount = booking.financial?.totalAmount || 0;

    if (bookingAmount <= 0) {
      console.log('⚠️ Booking amount is zero or negative, skipping commission');
      return null;
    }

    // Get commission rate from agent
    const commissionRate = booking.agentId.commissionRate || 10;

    // Calculate commission amount
    const commissionAmount = Commission.calculateCommission(bookingAmount, commissionRate);

    // Set due date (30 days from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    // Create commission record
    const commission = await Commission.create({
      tenantId: booking.tenantId,
      agentId: booking.agentId._id,
      bookingId: booking._id,
      customerId: booking.customerId,
      bookingAmount,
      commissionRate,
      commissionAmount,
      currency: booking.financial?.currency || 'USD',
      bookingDate: booking.createdAt,
      dueDate,
      status: 'pending',
      notes: `Auto-generated commission for booking ${booking.bookingNumber}`,
    });

    console.log('✅ Commission created successfully:', commission._id);
    console.log(`   Amount: ${commissionAmount} ${commission.currency}`);
    console.log(`   Rate: ${commissionRate}%`);

    return commission;
  } catch (error) {
    console.error('❌ Error creating commission:', error.message);
    throw error;
  }
};

/**
 * Create commission for multiple bookings (bulk operation)
 * @param {Array} bookingIds - Array of booking IDs
 * @returns {Object} Summary of created commissions
 */
exports.createCommissionsForBookings = async (bookingIds) => {
  const results = {
    success: [],
    failed: [],
    skipped: [],
  };

  for (const bookingId of bookingIds) {
    try {
      const commission = await exports.createCommissionForBooking(bookingId);
      
      if (commission) {
        results.success.push({
          bookingId,
          commissionId: commission._id,
          amount: commission.commissionAmount,
        });
      } else {
        results.skipped.push({
          bookingId,
          reason: 'No agent or not completed',
        });
      }
    } catch (error) {
      results.failed.push({
        bookingId,
        error: error.message,
      });
    }
  }

  console.log('📊 Bulk commission creation summary:');
  console.log(`   Success: ${results.success.length}`);
  console.log(`   Failed: ${results.failed.length}`);
  console.log(`   Skipped: ${results.skipped.length}`);

  return results;
};

/**
 * Recalculate commission when booking amount changes
 * @param {String} bookingId - The booking ID
 * @returns {Object} Updated commission record
 */
exports.recalculateCommission = async (bookingId) => {
  try {
    const commission = await Commission.findOne({ bookingId });
    
    if (!commission) {
      console.log('⚠️ No commission found for booking:', bookingId);
      return null;
    }

    // Don't recalculate if already paid
    if (commission.status === 'paid') {
      console.log('⚠️ Commission already paid, cannot recalculate');
      return commission;
    }

    // Get updated booking details
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      throw new Error('Booking not found');
    }

    // Update commission amount
    const newBookingAmount = booking.financial?.totalAmount || 0;
    commission.bookingAmount = newBookingAmount;
    
    // Commission amount will be recalculated by pre-save hook
    await commission.save();

    console.log('✅ Commission recalculated:', commission._id);
    console.log(`   New amount: ${commission.commissionAmount} ${commission.currency}`);

    return commission;
  } catch (error) {
    console.error('❌ Error recalculating commission:', error.message);
    throw error;
  }
};

/**
 * Cancel commission when booking is cancelled
 * @param {String} bookingId - The booking ID
 * @returns {Object} Updated commission record
 */
exports.cancelCommission = async (bookingId) => {
  try {
    const commission = await Commission.findOne({ bookingId });
    
    if (!commission) {
      console.log('⚠️ No commission found for booking:', bookingId);
      return null;
    }

    // Don't cancel if already paid
    if (commission.status === 'paid') {
      console.log('⚠️ Commission already paid, cannot cancel');
      return commission;
    }

    await commission.cancel();

    console.log('✅ Commission cancelled:', commission._id);

    return commission;
  } catch (error) {
    console.error('❌ Error cancelling commission:', error.message);
    throw error;
  }
};

module.exports = exports;
