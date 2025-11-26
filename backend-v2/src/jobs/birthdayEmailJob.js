const User = require('../models/User');
const automationEngine = require('../services/automationEngine');
const logger = require('../lib/logger');

/**
 * Birthday Email Job
 * Sends birthday wishes to customers on their birthday
 * Runs daily at configured time (default: 9 AM tenant timezone)
 */
async function birthdayEmailJob(tenantId) {
  try {
    logger.info(`[Birthday Email] Starting job for tenant ${tenantId}`);

    const today = new Date();
    const month = today.getMonth() + 1; // JavaScript months are 0-indexed
    const day = today.getDate();

    // Find all customers with birthdays today
    const customers = await User.find({
      tenant: tenantId,
      role: 'customer',
      isActive: true,
      $expr: {
        $and: [
          { $eq: [{ $month: '$dateOfBirth' }, month] },
          { $eq: [{ $dayOfMonth: '$dateOfBirth' }, day] },
        ],
      },
    });

    logger.info(`[Birthday Email] Found ${customers.length} customers with birthdays today`);

    let totalSent = 0;

    for (const customer of customers) {
      try {
        // Calculate age
        const age = today.getFullYear() - customer.dateOfBirth.getFullYear();

        // Trigger automation rules for birthday
        await automationEngine.executeRules(
          'birthday',
          {
            ...customer.toObject(),
            age,
            birthdayMessage: `Happy ${age}th Birthday, ${customer.firstName}!`,
          },
          tenantId
        );

        totalSent++;
        logger.info(`[Birthday Email] Sent birthday email to ${customer.email}`);
      } catch (error) {
        logger.error(`[Birthday Email] Failed to send birthday email to ${customer.email}:`, error);
      }
    }

    logger.info(`[Birthday Email] Completed. Total sent: ${totalSent}`);

    return {
      success: true,
      totalSent,
      timestamp: new Date(),
    };
  } catch (error) {
    logger.error('[Birthday Email] Job failed:', error);
    throw error;
  }
}

module.exports = birthdayEmailJob;
