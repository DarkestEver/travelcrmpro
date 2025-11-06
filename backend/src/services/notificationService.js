const logger = require('../utils/logger');
const sendEmail = require('../utils/email');

class NotificationService {
  constructor() {
    // In-memory storage (will be replaced with Redis later)
    this.notifications = new Map(); // userId => [notifications]
    this.unreadCounts = new Map(); // userId => count
  }

  /**
   * Create a notification
   */
  async createNotification(userId, notification) {
    try {
      const notificationData = {
        id: `notification:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`,
        userId,
        ...notification,
        createdAt: new Date().toISOString(),
        read: false,
      };

      // Store in user's notification list
      if (!this.notifications.has(userId)) {
        this.notifications.set(userId, []);
      }
      
      const userNotifications = this.notifications.get(userId);
      userNotifications.unshift(notificationData);

      // Keep only last 100 notifications
      if (userNotifications.length > 100) {
        this.notifications.set(userId, userNotifications.slice(0, 100));
      }

      // Increment unread count
      const currentCount = this.unreadCounts.get(userId) || 0;
      this.unreadCounts.set(userId, currentCount + 1);

      logger.info(`Notification created for user ${userId}`);

      return notificationData;
    } catch (error) {
      logger.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Get user notifications with pagination
   */
  async getUserNotifications(userId, page = 1, limit = 20) {
    try {
      const userNotifications = this.notifications.get(userId) || [];
      const unreadCount = this.unreadCounts.get(userId) || 0;

      const start = (page - 1) * limit;
      const end = start + limit;
      const paginatedNotifications = userNotifications.slice(start, end);

      return {
        notifications: paginatedNotifications,
        pagination: {
          page,
          limit,
          total: userNotifications.length,
          totalPages: Math.ceil(userNotifications.length / limit),
        },
        unreadCount: parseInt(unreadCount),
      };
    } catch (error) {
      logger.error('Error fetching notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(userId, notificationId) {
    try {
      const userNotifications = this.notifications.get(userId) || [];

      for (let i = 0; i < userNotifications.length; i++) {
        if (userNotifications[i].id === notificationId && !userNotifications[i].read) {
          userNotifications[i].read = true;

          // Decrement unread count
          const count = this.unreadCounts.get(userId) || 0;
          if (count > 0) {
            this.unreadCounts.set(userId, count - 1);
          }
          break;
        }
      }

      return { success: true };
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId) {
    try {
      const userNotifications = this.notifications.get(userId) || [];

      userNotifications.forEach(notification => {
        notification.read = true;
      });

      // Reset unread count
      this.unreadCounts.set(userId, 0);

      return { success: true, count: userNotifications.length };
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(userId, notificationId) {
    try {
      const userNotifications = this.notifications.get(userId) || [];

      for (let i = 0; i < userNotifications.length; i++) {
        if (userNotifications[i].id === notificationId) {
          const wasUnread = !userNotifications[i].read;
          
          // Remove notification
          userNotifications.splice(i, 1);

          // Decrement unread count if it was unread
          if (wasUnread) {
            const count = this.unreadCounts.get(userId) || 0;
            if (count > 0) {
              this.unreadCounts.set(userId, count - 1);
            }
          }
          break;
        }
      }

      return { success: true };
    } catch (error) {
      logger.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId) {
    try {
      return this.unreadCounts.get(userId) || 0;
    } catch (error) {
      logger.error('Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Send booking confirmation notification
   */
  async sendBookingConfirmation(booking) {
    try {
      const notification = {
        type: 'booking_confirmed',
        title: 'Booking Confirmed',
        message: `Your booking #${booking.bookingNumber} has been confirmed`,
        data: {
          bookingId: booking._id,
          bookingNumber: booking.bookingNumber,
        },
      };

      await this.createNotification(booking.customer._id || booking.customer, notification);

      // Send email if customer has email
      if (booking.customer.email) {
        await sendEmail({
          to: booking.customer.email,
          subject: 'Booking Confirmation',
          template: 'booking-confirmation',
          data: { booking },
        });
      }

      return { success: true };
    } catch (error) {
      logger.error('Error sending booking confirmation:', error);
      throw error;
    }
  }

  /**
   * Send quote sent notification
   */
  async sendQuoteSent(quote) {
    try {
      const notification = {
        type: 'quote_sent',
        title: 'New Quote Available',
        message: `Quote #${quote.quoteNumber} is ready for review`,
        data: {
          quoteId: quote._id,
          quoteNumber: quote.quoteNumber,
        },
      };

      await this.createNotification(quote.customer._id || quote.customer, notification);

      return { success: true };
    } catch (error) {
      logger.error('Error sending quote notification:', error);
      throw error;
    }
  }

  /**
   * Send payment received notification
   */
  async sendPaymentReceived(payment) {
    try {
      const notification = {
        type: 'payment_received',
        title: 'Payment Received',
        message: `Payment of $${payment.amount} has been received`,
        data: {
          paymentId: payment._id,
          bookingId: payment.booking,
        },
      };

      await this.createNotification(payment.customerId, notification);

      return { success: true };
    } catch (error) {
      logger.error('Error sending payment notification:', error);
      throw error;
    }
  }

  /**
   * Send booking cancelled notification
   */
  async sendBookingCancelled(booking) {
    try {
      const notification = {
        type: 'booking_cancelled',
        title: 'Booking Cancelled',
        message: `Booking #${booking.bookingNumber} has been cancelled`,
        data: {
          bookingId: booking._id,
          bookingNumber: booking.bookingNumber,
        },
      };

      await this.createNotification(booking.customer._id || booking.customer, notification);

      return { success: true };
    } catch (error) {
      logger.error('Error sending cancellation notification:', error);
      throw error;
    }
  }

  /**
   * Send agent assignment notification
   */
  async sendAgentAssignment(booking, agent) {
    try {
      const notification = {
        type: 'agent_assigned',
        title: 'New Booking Assignment',
        message: `You have been assigned to booking #${booking.bookingNumber}`,
        data: {
          bookingId: booking._id,
          bookingNumber: booking.bookingNumber,
        },
      };

      await this.createNotification(agent._id || agent, notification);

      return { success: true };
    } catch (error) {
      logger.error('Error sending agent assignment notification:', error);
      throw error;
    }
  }
}

// Singleton instance
const notificationService = new NotificationService();

module.exports = notificationService;
