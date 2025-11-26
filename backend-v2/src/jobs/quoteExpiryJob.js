const Quote = require('../models/Quote');
const automationEngine = require('../services/automationEngine');
const logger = require('../lib/logger');

/**
 * Quote Expiry Job
 * Handles quote expiration warnings and marking quotes as expired
 * 
 * Actions:
 * 1. Send warning email 24 hours before expiry
 * 2. Mark quotes as expired after validUntil date
 * 3. Notify assigned agent of expired quotes
 * 
 * Runs daily
 */
async function quoteExpiryJob(tenantId) {
  try {
    logger.info(`[Quote Expiry] Starting job for tenant ${tenantId}`);

    const now = new Date();
    const warningHours = parseInt(process.env.QUOTE_EXPIRY_WARNING_HOURS) || 24;
    const warningThreshold = new Date(now.getTime() + warningHours * 60 * 60 * 1000);

    let totalWarnings = 0;
    let totalExpired = 0;

    // === Step 1: Send expiry warnings ===
    const quotesNearExpiry = await Quote.find({
      tenant: tenantId,
      status: 'sent',
      validUntil: {
        $gte: now,
        $lte: warningThreshold,
      },
      // Avoid sending multiple warnings
      expiryWarningSent: { $ne: true },
    }).populate('customer', 'firstName lastName email');

    logger.info(`[Quote Expiry] Found ${quotesNearExpiry.length} quotes near expiry`);

    for (const quote of quotesNearExpiry) {
      try {
        const hoursUntilExpiry = Math.round((quote.validUntil - now) / (1000 * 60 * 60));

        // Trigger automation rules for quote expiry warning
        await automationEngine.executeRules(
          'quote_expiring',
          {
            ...quote.toObject(),
            hoursUntilExpiry,
            expiryWarning: true,
          },
          tenantId
        );

        // Mark warning as sent
        quote.expiryWarningSent = true;
        await quote.save();

        totalWarnings++;
        logger.info(`[Quote Expiry] Sent expiry warning for quote ${quote.quoteNumber}`);
      } catch (error) {
        logger.error(
          `[Quote Expiry] Failed to send expiry warning for quote ${quote.quoteNumber}:`,
          error
        );
      }
    }

    // === Step 2: Mark expired quotes ===
    const expiredQuotes = await Quote.find({
      tenant: tenantId,
      status: 'sent',
      validUntil: { $lt: now },
    }).populate('createdBy', 'firstName lastName email');

    logger.info(`[Quote Expiry] Found ${expiredQuotes.length} expired quotes`);

    for (const quote of expiredQuotes) {
      try {
        // Update quote status
        quote.status = 'expired';
        quote.expiredAt = now;
        await quote.save();

        // Trigger automation rules for quote expired
        await automationEngine.executeRules(
          'quote_expired',
          {
            ...quote.toObject(),
            daysExpired: Math.floor((now - quote.validUntil) / (1000 * 60 * 60 * 24)),
          },
          tenantId
        );

        totalExpired++;
        logger.info(`[Quote Expiry] Marked quote ${quote.quoteNumber} as expired`);
      } catch (error) {
        logger.error(`[Quote Expiry] Failed to expire quote ${quote.quoteNumber}:`, error);
      }
    }

    logger.info(
      `[Quote Expiry] Completed. Warnings sent: ${totalWarnings}, Expired: ${totalExpired}`
    );

    return {
      success: true,
      totalWarnings,
      totalExpired,
      timestamp: new Date(),
    };
  } catch (error) {
    logger.error('[Quote Expiry] Job failed:', error);
    throw error;
  }
}

module.exports = quoteExpiryJob;
