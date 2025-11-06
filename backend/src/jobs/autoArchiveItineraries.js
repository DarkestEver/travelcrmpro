const cron = require('node-cron');
const Itinerary = require('../models/Itinerary');
const logger = require('../utils/logger');

/**
 * Auto-archive itineraries cron job
 * Runs daily at 2:00 AM to check and archive expired itineraries
 * 
 * Cron schedule: '0 2 * * *'
 * - Minute: 0
 * - Hour: 2
 * - Day of Month: * (every day)
 * - Month: * (every month)
 * - Day of Week: * (every day)
 */

const autoArchiveItineraries = () => {
  // Run daily at 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    try {
      logger.info('Running auto-archive itineraries cron job...');

      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today

      // Find all itineraries that have ended and are not archived
      const result = await Itinerary.updateMany(
        {
          endDate: { $lt: today },
          status: { $ne: 'archived' },
          isArchived: { $ne: true }
        },
        {
          $set: {
            status: 'archived',
            isArchived: true,
            archivedAt: new Date(),
            archivedBy: 'system', // System auto-archive
            archiveReason: 'Auto-archived: End date passed'
          }
        }
      );

      if (result.modifiedCount > 0) {
        logger.info(`Auto-archived ${result.modifiedCount} expired itineraries`);
      } else {
        logger.info('No expired itineraries to archive');
      }
    } catch (error) {
      logger.error('Error in auto-archive cron job:', error);
    }
  });

  logger.info('Auto-archive itineraries cron job scheduled (daily at 2:00 AM)');
};

// Optional: Manual trigger function for testing
const manualArchiveExpired = async () => {
  try {
    logger.info('Manually triggering archive of expired itineraries...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await Itinerary.updateMany(
      {
        endDate: { $lt: today },
        status: { $ne: 'archived' },
        isArchived: { $ne: true }
      },
      {
        $set: {
          status: 'archived',
          isArchived: true,
          archivedAt: new Date(),
          archivedBy: 'system',
          archiveReason: 'Manual archive: End date passed'
        }
      }
    );

    logger.info(`Manually archived ${result.modifiedCount} expired itineraries`);
    return result;
  } catch (error) {
    logger.error('Error in manual archive:', error);
    throw error;
  }
};

module.exports = {
  autoArchiveItineraries,
  manualArchiveExpired
};
