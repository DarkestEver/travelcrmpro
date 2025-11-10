/**
 * Advanced Notification Service
 * Handles creation and management of database-persisted notifications
 */

const Notification = require('../models/Notification');

class AdvancedNotificationService {
  /**
   * Create invoice notification
   */
  async createInvoiceNotification({ tenant, user, invoice, action }) {
    const titles = {
      created: 'New Invoice Created',
      sent: 'Invoice Sent',
      paid: 'Invoice Paid',
      overdue: 'Invoice Overdue'
    };

    const messages = {
      created: `Invoice ${invoice.invoiceNumber} has been created for $${invoice.total.toFixed(2)}`,
      sent: `Invoice ${invoice.invoiceNumber} has been sent to the customer`,
      paid: `Invoice ${invoice.invoiceNumber} has been fully paid`,
      overdue: `Invoice ${invoice.invoiceNumber} is overdue. Amount: $${invoice.amountDue.toFixed(2)}`
    };

    const colors = {
      created: 'blue',
      sent: 'purple',
      paid: 'green',
      overdue: 'red'
    };

    return await Notification.createForUser({
      tenant,
      user,
      type: 'invoice',
      title: titles[action],
      message: messages[action],
      priority: action === 'overdue' ? 'high' : 'normal',
      data: { invoiceId: invoice._id, invoiceNumber: invoice.invoiceNumber },
      link: `/agent/invoices`,
      icon: 'receipt',
      color: colors[action],
      actionRequired: action === 'overdue'
    });
  }

  /**
   * Create payment notification
   */
  async createPaymentNotification({ tenant, user, payment, type }) {
    const titles = {
      received: 'Payment Received',
      payout: 'Commission Payout',
      refund: 'Refund Processed'
    };

    const messages = {
      received: `Payment of $${payment.amount.toFixed(2)} received`,
      payout: `Commission payout of $${payment.amount.toFixed(2)} processed`,
      refund: `Refund of $${payment.amount.toFixed(2)} has been processed`
    };

    return await Notification.createForUser({
      tenant,
      user,
      type: 'payment',
      title: titles[type],
      message: messages[type],
      priority: 'normal',
      data: { paymentId: payment._id, amount: payment.amount },
      link: `/agent/payments`,
      icon: 'dollar-sign',
      color: 'green'
    });
  }

  /**
   * Create booking notification
   */
  async createBookingNotification({ tenant, user, booking, action }) {
    const titles = {
      created: 'New Booking Created',
      confirmed: 'Booking Confirmed',
      completed: 'Booking Completed',
      cancelled: 'Booking Cancelled'
    };

    const messages = {
      created: `Booking ${booking.bookingNumber} created for ${booking.destination || 'N/A'}`,
      confirmed: `Booking ${booking.bookingNumber} has been confirmed`,
      completed: `Booking ${booking.bookingNumber} has been completed`,
      cancelled: `Booking ${booking.bookingNumber} has been cancelled`
    };

    const colors = {
      created: 'blue',
      confirmed: 'purple',
      completed: 'green',
      cancelled: 'gray'
    };

    return await Notification.createForUser({
      tenant,
      user,
      type: 'booking',
      title: titles[action],
      message: messages[action],
      priority: action === 'created' ? 'high' : 'normal',
      data: { bookingId: booking._id, bookingNumber: booking.bookingNumber },
      link: `/agent/bookings`,
      icon: 'calendar',
      color: colors[action]
    });
  }

  /**
   * Create commission notification
   */
  async createCommissionNotification({ tenant, user, commission, action }) {
    const titles = {
      earned: 'Commission Earned',
      approved: 'Commission Approved',
      paid: 'Commission Paid',
      cancelled: 'Commission Cancelled'
    };

    const messages = {
      earned: `You earned $${commission.amount.toFixed(2)} commission on booking ${commission.bookingNumber}`,
      approved: `Commission of $${commission.amount.toFixed(2)} has been approved`,
      paid: `Commission of $${commission.amount.toFixed(2)} has been paid`,
      cancelled: `Commission on booking ${commission.bookingNumber} has been cancelled`
    };

    const colors = {
      earned: 'yellow',
      approved: 'blue',
      paid: 'green',
      cancelled: 'gray'
    };

    return await Notification.createForUser({
      tenant,
      user,
      type: 'commission',
      title: titles[action],
      message: messages[action],
      priority: action === 'earned' || action === 'paid' ? 'high' : 'normal',
      data: { commissionId: commission._id, amount: commission.amount },
      link: `/agent/commissions`,
      icon: 'trending-up',
      color: colors[action]
    });
  }

  /**
   * Create credit alert notification
   */
  async createCreditAlertNotification({ tenant, user, creditStatus }) {
    const titles = {
      warning: 'Credit Limit Warning',
      critical: 'Critical: Credit Limit Alert',
      exceeded: 'Credit Limit Exceeded'
    };

    const messages = {
      warning: `Your credit utilization is at ${creditStatus.utilization.toFixed(1)}%. Available: $${creditStatus.availableCredit.toFixed(2)}`,
      critical: `URGENT: Credit utilization at ${creditStatus.utilization.toFixed(1)}%. Only $${creditStatus.availableCredit.toFixed(2)} remaining`,
      exceeded: `Credit limit exceeded! Please complete bookings or request increase.`
    };

    const priority = {
      warning: 'normal',
      critical: 'high',
      exceeded: 'urgent'
    };

    return await Notification.createForUser({
      tenant,
      user,
      type: 'credit_alert',
      title: titles[creditStatus.status] || titles.warning,
      message: messages[creditStatus.status] || messages.warning,
      priority: priority[creditStatus.status] || 'normal',
      data: creditStatus,
      link: `/agent/dashboard`,
      icon: 'alert-circle',
      color: creditStatus.status === 'critical' || creditStatus.status === 'exceeded' ? 'red' : 'yellow',
      actionRequired: creditStatus.status === 'critical' || creditStatus.status === 'exceeded'
    });
  }

  /**
   * Create system notification
   */
  async createSystemNotification({ tenant, user, title, message, priority = 'normal', link, actionRequired = false }) {
    return await Notification.createForUser({
      tenant,
      user,
      type: 'system',
      title,
      message,
      priority,
      link,
      icon: 'bell',
      color: 'blue',
      actionRequired
    });
  }

  /**
   * Create general notification
   */
  async createGeneralNotification({ tenant, user, title, message, data = {}, link, icon = 'info', color = 'gray' }) {
    return await Notification.createForUser({
      tenant,
      user,
      type: 'general',
      title,
      message,
      priority: 'normal',
      data,
      link,
      icon,
      color
    });
  }

  /**
   * Send notification to multiple users
   */
  async sendToMultipleUsers({ tenant, users, type, title, message, data = {}, link, priority = 'normal' }) {
    const notifications = users.map(userId => ({
      tenant,
      user: userId,
      type,
      title,
      message,
      priority,
      data,
      link
    }));

    return await Notification.insertMany(notifications);
  }
}

module.exports = new AdvancedNotificationService();
