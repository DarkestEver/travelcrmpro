const User = require('../models/User');
const Lead = require('../models/Lead');
const Itinerary = require('../models/Itinerary');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const Quote = require('../models/Quote');
const EmailLog = require('../models/EmailLog');
const AuditLog = require('../models/AuditLog');
const logger = require('../lib/logger');

/**
 * GDPR Service - Data export and deletion
 */

/**
 * Export all user data (GDPR Article 15 - Right of Access)
 */
const exportUserData = async (userId, tenantId) => {
  try {
    // Get user data
    const user = await User.findOne({ _id: userId, tenant: tenantId });
    if (!user) {
      throw new Error('User not found');
    }

    // Get all related data
    const [leads, itineraries, bookings, payments, invoices, quotes, emailLogs, auditLogs] = await Promise.all([
      Lead.find({ tenant: tenantId, customer: userId }),
      Itinerary.find({ tenant: tenantId, createdBy: userId }),
      Booking.find({ tenant: tenantId, 'customer.email': user.email }),
      Payment.find({ tenant: tenantId, 'customer.email': user.email }),
      Invoice.find({ tenant: tenantId, 'customer.email': user.email }),
      Quote.find({ tenant: tenantId, 'customer.email': user.email }),
      EmailLog.find({ tenant: tenantId, to: user.email }),
      AuditLog.find({ tenant: tenantId, user: userId }),
    ]);

    // Compile all data
    const userData = {
      exportedAt: new Date(),
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
      leads: leads.map((lead) => ({
        id: lead._id,
        customer: lead.customer,
        status: lead.status,
        source: lead.source,
        budget: lead.budget,
        notes: lead.notes,
        createdAt: lead.createdAt,
      })),
      itineraries: itineraries.map((itinerary) => ({
        id: itinerary._id,
        title: itinerary.title,
        destination: itinerary.destination,
        startDate: itinerary.startDate,
        endDate: itinerary.endDate,
        numberOfTravelers: itinerary.numberOfTravelers,
        status: itinerary.status,
        createdAt: itinerary.createdAt,
      })),
      bookings: bookings.map((booking) => ({
        id: booking._id,
        bookingNumber: booking.bookingNumber,
        customer: booking.customer,
        travelDates: {
          start: booking.travelStartDate,
          end: booking.travelEndDate,
        },
        pricing: booking.pricing,
        status: booking.status,
        createdAt: booking.createdAt,
      })),
      payments: payments.map((payment) => ({
        id: payment._id,
        transactionId: payment.transactionId,
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method,
        status: payment.status,
        createdAt: payment.createdAt,
      })),
      invoices: invoices.map((invoice) => ({
        id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        total: invoice.total,
        status: invoice.status,
        dueDate: invoice.dueDate,
        createdAt: invoice.createdAt,
      })),
      quotes: quotes.map((quote) => ({
        id: quote._id,
        quoteNumber: quote.quoteNumber,
        customer: quote.customer,
        destination: quote.destination,
        pricing: quote.pricing,
        status: quote.status,
        createdAt: quote.createdAt,
      })),
      emails: emailLogs.map((email) => ({
        id: email._id,
        subject: email.subject,
        sentAt: email.sentAt,
        status: email.status,
      })),
      auditLogs: auditLogs.map((log) => ({
        action: log.action,
        entity: log.entity,
        timestamp: log.timestamp,
        ipAddress: log.metadata?.ipAddress,
      })),
    };

    logger.info('User data exported', { userId, tenantId });
    return userData;
  } catch (error) {
    logger.error('Failed to export user data', {
      userId,
      tenantId,
      error: error.message,
    });
    throw error;
  }
};

/**
 * Delete all user data (GDPR Article 17 - Right to Erasure / Right to be Forgotten)
 */
const deleteUserData = async (userId, tenantId) => {
  try {
    const user = await User.findOne({ _id: userId, tenant: tenantId });
    if (!user) {
      throw new Error('User not found');
    }

    // Anonymize or delete data
    // Note: Some data may need to be retained for legal/tax purposes
    // In such cases, we anonymize instead of delete

    const deletionSummary = {
      deletedAt: new Date(),
      userId,
      email: user.email,
      itemsProcessed: {},
    };

    // Delete email logs
    const emailLogsDeleted = await EmailLog.deleteMany({
      tenant: tenantId,
      to: user.email,
    });
    deletionSummary.itemsProcessed.emailLogs = emailLogsDeleted.deletedCount;

    // Anonymize audit logs (keep for compliance but remove PII)
    const auditLogsUpdated = await AuditLog.updateMany(
      { tenant: tenantId, user: userId },
      {
        $set: {
          'metadata.ipAddress': 'anonymized',
          'metadata.userAgent': 'anonymized',
        },
      }
    );
    deletionSummary.itemsProcessed.auditLogs = auditLogsUpdated.modifiedCount;

    // Anonymize bookings (keep for financial records but remove PII)
    const bookingsUpdated = await Booking.updateMany(
      { tenant: tenantId, 'customer.email': user.email },
      {
        $set: {
          'customer.name': 'Deleted User',
          'customer.email': `deleted_${Date.now()}@privacy.local`,
          'customer.phone': 'DELETED',
          'customer.address': {},
        },
      }
    );
    deletionSummary.itemsProcessed.bookings = bookingsUpdated.modifiedCount;

    // Anonymize payments (keep for financial records)
    const paymentsUpdated = await Payment.updateMany(
      { tenant: tenantId, 'customer.email': user.email },
      {
        $set: {
          'customer.name': 'Deleted User',
          'customer.email': `deleted_${Date.now()}@privacy.local`,
        },
      }
    );
    deletionSummary.itemsProcessed.payments = paymentsUpdated.modifiedCount;

    // Anonymize invoices (keep for tax purposes)
    const invoicesUpdated = await Invoice.updateMany(
      { tenant: tenantId, 'customer.email': user.email },
      {
        $set: {
          'customer.name': 'Deleted User',
          'customer.email': `deleted_${Date.now()}@privacy.local`,
          'customer.phone': 'DELETED',
          'customer.address': {},
        },
      }
    );
    deletionSummary.itemsProcessed.invoices = invoicesUpdated.modifiedCount;

    // Delete quotes (unless converted to bookings)
    const quotesDeleted = await Quote.deleteMany({
      tenant: tenantId,
      'customer.email': user.email,
      status: { $nin: ['approved', 'converted'] },
    });
    deletionSummary.itemsProcessed.quotesDeleted = quotesDeleted.deletedCount;

    // Anonymize converted quotes
    const quotesAnonymized = await Quote.updateMany(
      { tenant: tenantId, 'customer.email': user.email, status: { $in: ['approved', 'converted'] } },
      {
        $set: {
          'customer.name': 'Deleted User',
          'customer.email': `deleted_${Date.now()}@privacy.local`,
          'customer.phone': 'DELETED',
        },
      }
    );
    deletionSummary.itemsProcessed.quotesAnonymized = quotesAnonymized.modifiedCount;

    // Delete leads
    const leadsDeleted = await Lead.deleteMany({
      tenant: tenantId,
      'customer.email': user.email,
    });
    deletionSummary.itemsProcessed.leads = leadsDeleted.deletedCount;

    // Delete itineraries created by user
    const itinerariesDeleted = await Itinerary.deleteMany({
      tenant: tenantId,
      createdBy: userId,
    });
    deletionSummary.itemsProcessed.itineraries = itinerariesDeleted.deletedCount;

    // Delete the user account
    await User.deleteOne({ _id: userId, tenant: tenantId });
    deletionSummary.itemsProcessed.user = 1;

    logger.info('User data deleted/anonymized', deletionSummary);
    return deletionSummary;
  } catch (error) {
    logger.error('Failed to delete user data', {
      userId,
      tenantId,
      error: error.message,
    });
    throw error;
  }
};

/**
 * Anonymize user data (GDPR Article 17 - partial deletion)
 */
const anonymizeUserData = async (userId, tenantId) => {
  try {
    const user = await User.findOne({ _id: userId, tenant: tenantId });
    if (!user) {
      throw new Error('User not found');
    }

    // Anonymize user account
    user.firstName = 'Anonymized';
    user.lastName = 'User';
    user.email = `anonymized_${Date.now()}@privacy.local`;
    user.phone = 'ANONYMIZED';
    user.status = 'deleted';
    user.isActive = false;
    await user.save();

    logger.info('User anonymized', { userId, tenantId });
    return { success: true, message: 'User data anonymized' };
  } catch (error) {
    logger.error('Failed to anonymize user', {
      userId,
      tenantId,
      error: error.message,
    });
    throw error;
  }
};

module.exports = {
  exportUserData,
  deleteUserData,
  anonymizeUserData,
};
