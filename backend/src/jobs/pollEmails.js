/**
 * Email Polling Cron Job
 * 
 * Periodically polls IMAP servers to fetch new emails from configured email accounts.
 * Runs every 2 minutes by default.
 */

const cron = require('node-cron');
const emailPollingService = require('../services/emailPollingService');
const logger = require('../utils/logger');

/**
 * Initialize email polling cron job
 * Runs every 2 minutes (cron: star-slash-2 star star star star)
 */
const initEmailPolling = () => {
  // Run every 2 minutes
  const schedule = '*/2 * * * *';
  
  logger.info(`📧 Scheduling email polling job: ${schedule}`);
  
  cron.schedule(schedule, async () => {
    logger.info('⏰ Email polling cron job triggered');
    
    try {
      await emailPollingService.pollAllAccounts();
    } catch (error) {
      logger.error('❌ Email polling cron job error:', error);
    }
  });
  
  logger.info('✅ Email polling cron job initialized (runs every 2 minutes)');
};

module.exports = { initEmailPolling };
