const Booking = require('../models/Booking');
const automationEngine = require('../services/automationEngine');
const logger = require('../lib/logger');

/**
 * Anniversary Email Job
 * Sends anniversary emails to customers on their booking anniversary
 * Includes special offers and discounts for repeat bookings
 * Runs daily at configured time
 */
async function anniversaryEmailJob(tenantId) {
  try {
    logger.info(`[Anniversary Email] Starting job for tenant ${tenantId}`);

    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    // Find all completed bookings with anniversary today
    // (bookings made on this day in previous years)
    const bookings = await Booking.find({
      tenant: tenantId,
      status: 'completed',
      $expr: {
        $and: [
          { $eq: [{ $month: '$createdAt' }, month] },
          { $eq: [{ $dayOfMonth: '$createdAt' }, day] },
          // Booking was at least 1 year ago
          { $lte: [{ $year: '$createdAt' }, today.getFullYear() - 1] },
        ],
      },
    }).populate('customer', 'firstName lastName email');

    logger.info(`[Anniversary Email] Found ${bookings.length} booking anniversaries today`);

    let totalSent = 0;

    for (const booking of bookings) {
      try {
        // Calculate years since booking
        const yearsSince = today.getFullYear() - booking.createdAt.getFullYear();

        // Generate anniversary offer (e.g., 10% discount)
        const offerPercentage = Math.min(yearsSince * 5, 20); // Max 20% discount

        // Trigger automation rules for anniversary
        await automationEngine.executeRules(
          'anniversary',
          {
            ...booking.toObject(),
            yearsSince,
            offerPercentage,
            anniversaryMessage: `It's been ${yearsSince} year${
              yearsSince > 1 ? 's' : ''
            } since your amazing trip!`,
          },
          tenantId
        );

        totalSent++;
        logger.info(
          `[Anniversary Email] Sent anniversary email for booking ${booking.bookingNumber}`
        );
      } catch (error) {
        logger.error(
          `[Anniversary Email] Failed to send anniversary email for booking ${booking.bookingNumber}:`,
          error
        );
      }
    }

    logger.info(`[Anniversary Email] Completed. Total sent: ${totalSent}`);

    return {
      success: true,
      totalSent,
      timestamp: new Date(),
    };
  } catch (error) {
    logger.error('[Anniversary Email] Job failed:', error);
    throw error;
  }
}

module.exports = anniversaryEmailJob;
