const Quote = require('../models/Quote');
const User = require('../models/User');
const automationEngine = require('../services/automationEngine');
const logger = require('../lib/logger');

/**
 * Follow-up Campaign Job
 * Sends follow-up emails to customers who haven't responded to quotes
 * 
 * Follow-up Schedule:
 * - Day 3: First gentle reminder
 * - Day 7: Second reminder with additional value
 * - Day 14: Final reminder with urgency
 */
async function followUpCampaignJob(tenantId) {
  try {
    logger.info(`[Follow-up Campaign] Starting job for tenant ${tenantId}`);

    const now = new Date();
    const followUpDays = (process.env.QUOTE_FOLLOWUP_DAYS || '3,7,14')
      .split(',')
      .map((d) => parseInt(d.trim()));

    let totalSent = 0;

    for (const days of followUpDays) {
      // Calculate target date (quotes sent exactly X days ago)
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() - days);
      targetDate.setHours(0, 0, 0, 0);

      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      // Find quotes that need follow-up
      const quotes = await Quote.find({
        tenant: tenantId,
        status: 'sent',
        createdAt: {
          $gte: targetDate,
          $lt: nextDay,
        },
        // Avoid sending multiple follow-ups on same day
        $or: [
          { lastFollowUpSent: { $exists: false } },
          {
            lastFollowUpSent: {
              $lt: new Date(now - 24 * 60 * 60 * 1000), // Last follow-up was >24h ago
            },
          },
        ],
      }).populate('customer', 'firstName lastName email');

      logger.info(`[Follow-up Campaign] Found ${quotes.length} quotes for day ${days} follow-up`);

      // Send follow-up for each quote
      for (const quote of quotes) {
        try {
          // Determine follow-up type based on day
          let followUpType;
          if (days === 3) {
            followUpType = 'gentle_reminder';
          } else if (days === 7) {
            followUpType = 'value_addition';
          } else if (days === 14) {
            followUpType = 'final_reminder';
          } else {
            followUpType = 'custom_reminder';
          }

          // Trigger automation rules for follow-up
          await automationEngine.executeRules(
            'quote_follow_up',
            {
              ...quote.toObject(),
              followUpDay: days,
              followUpType,
            },
            tenantId
          );

          // Update quote with follow-up timestamp
          quote.lastFollowUpSent = now;
          quote.followUpCount = (quote.followUpCount || 0) + 1;
          await quote.save();

          totalSent++;
          logger.info(
            `[Follow-up Campaign] Sent day ${days} follow-up for quote ${quote.quoteNumber}`
          );
        } catch (error) {
          logger.error(
            `[Follow-up Campaign] Failed to send follow-up for quote ${quote.quoteNumber}:`,
            error
          );
        }
      }
    }

    logger.info(`[Follow-up Campaign] Completed. Total sent: ${totalSent}`);

    return {
      success: true,
      totalSent,
      timestamp: new Date(),
    };
  } catch (error) {
    logger.error('[Follow-up Campaign] Job failed:', error);
    throw error;
  }
}

module.exports = followUpCampaignJob;
