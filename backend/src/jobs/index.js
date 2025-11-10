const logger = require('../utils/logger');
const { autoArchiveItineraries } = require('./autoArchiveItineraries');
const { initEmailPolling } = require('./pollEmails');

/**
 * Initialize all cron jobs
 */
const initCronJobs = () => {
  logger.info('Initializing cron jobs...');

  // Start auto-archive itineraries cron job
  autoArchiveItineraries();

  // Start email polling cron job
  initEmailPolling();

  // Add more cron jobs here as needed
  // Example:
  // sendReminderEmails();
  // cleanupOldLogs();
  // generateDailyReports();

  logger.info('All cron jobs initialized successfully');
};

module.exports = { initCronJobs };
