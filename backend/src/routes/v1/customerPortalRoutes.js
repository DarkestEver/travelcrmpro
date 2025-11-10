/**
 * Customer Portal Routes
 * All customer-facing portal routes
 */

const express = require('express');
const router = express.Router();
const { customerAuth } = require('../../middleware/customerAuth');

// Import controllers
const authController = require('../../controllers/customerPortal/customerAuthController');
const dashboardController = require('../../controllers/customerPortal/customerDashboardController');
const bookingController = require('../../controllers/customerPortal/customerBookingController');
const invoiceController = require('../../controllers/customerPortal/customerInvoiceController');
const quoteController = require('../../controllers/customerPortal/customerQuoteController');
const profileController = require('../../controllers/customerPortal/customerProfileController');
const notificationController = require('../../controllers/customerPortal/customerNotificationController');
const paymentIntentController = require('../../controllers/payments/paymentIntentController');

// ==================== Authentication Routes ====================
// Public routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/forgot-password', authController.forgotPassword);
router.post('/auth/reset-password/:token', authController.resetPassword);
router.get('/auth/verify-email/:token', authController.verifyEmail);

// Protected routes
router.get('/auth/me', customerAuth, authController.getMe);
router.post('/auth/logout', customerAuth, authController.logout);

// ==================== Dashboard Routes ====================
router.get('/dashboard/summary', customerAuth, dashboardController.getDashboardSummary);
router.get('/dashboard/upcoming-trips', customerAuth, dashboardController.getUpcomingTrips);
router.get('/dashboard/recent-activity', customerAuth, dashboardController.getRecentActivity);

// ==================== Booking Routes ====================
router.get('/bookings', customerAuth, bookingController.getBookings);
router.get('/bookings/:id', customerAuth, bookingController.getBookingById);
router.get('/bookings/:id/voucher', customerAuth, bookingController.getBookingVoucher);
router.post('/bookings/:id/cancel-request', customerAuth, bookingController.requestCancellation);

// ==================== Invoice Routes ====================
router.get('/invoices', customerAuth, invoiceController.getInvoices);
router.get('/invoices/summary', customerAuth, invoiceController.getInvoiceSummary);
router.get('/invoices/payments/history', customerAuth, invoiceController.getPaymentHistory);
router.get('/invoices/:id', customerAuth, invoiceController.getInvoiceById);
router.get('/invoices/:id/pdf', customerAuth, invoiceController.getInvoicePDF);

// ==================== Quote Routes ====================
router.post('/quotes/request', customerAuth, quoteController.submitQuoteRequest);
router.get('/quotes', customerAuth, quoteController.getQuotes);
router.get('/quotes/:id', customerAuth, quoteController.getQuoteById);
router.post('/quotes/:id/accept', customerAuth, quoteController.acceptQuote);
router.post('/quotes/:id/decline', customerAuth, quoteController.declineQuote);

// ==================== Profile Routes ====================
router.get('/profile', customerAuth, profileController.getProfile);
router.put('/profile', customerAuth, profileController.updateProfile);
router.put('/profile/change-password', customerAuth, profileController.changePassword);
router.put('/profile/update-email', customerAuth, profileController.updateEmail);
router.post('/profile/documents', customerAuth, profileController.uploadDocument);
router.delete('/profile/documents/:documentId', customerAuth, profileController.deleteDocument);

// ==================== Notification Routes ====================
router.get('/notifications', customerAuth, notificationController.getNotifications);
router.get('/notifications/unread-count', customerAuth, notificationController.getUnreadCount);
router.put('/notifications/:id/read', customerAuth, notificationController.markAsRead);
router.put('/notifications/mark-all-read', customerAuth, notificationController.markAllAsRead);
router.delete('/notifications/:id', customerAuth, notificationController.deleteNotification);

// ==================== Payment Routes ====================
router.post('/payments/create-intent', customerAuth, paymentIntentController.createPaymentIntent);
router.get('/payments/history', customerAuth, paymentIntentController.getCustomerPayments);
router.get('/payments/invoice/:invoiceId', customerAuth, paymentIntentController.getInvoicePayments);
router.get('/payments/:id', customerAuth, paymentIntentController.getPaymentDetails);

module.exports = router;
