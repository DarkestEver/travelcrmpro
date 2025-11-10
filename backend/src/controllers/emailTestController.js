/**
 * Email Test Controller
 * For testing email functionality in development
 */

const { asyncHandler, AppError } = require('../middleware/errorHandler');
const emailService = require('../services/emailService');

/**
 * @desc    Send test email
 * @route   POST /api/v1/test/email
 * @access  Private
 */
exports.sendTestEmail = asyncHandler(async (req, res) => {
  const { to, type = 'welcome' } = req.body;

  if (!to) {
    throw new AppError('Email address is required', 400);
  }

  let result;

  try {
    switch (type) {
      case 'welcome':
        result = await emailService.sendWelcomeEmail({
          to,
          name: req.user.name || 'Test User',
          role: req.user.role || 'agent'
        });
        break;

      case 'invoice':
        // Create mock invoice data
        const mockInvoice = {
          invoiceNumber: 'INV-TEST-001',
          invoiceDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          subtotal: 1000,
          tax: 10,
          discount: 5,
          total: 1050,
          amountDue: 1050,
          notes: 'This is a test invoice email'
        };
        result = await emailService.sendInvoiceEmail({
          to,
          customerName: 'Test Customer',
          invoice: mockInvoice,
          pdfPath: null // No PDF for test
        });
        break;

      case 'payment':
        const mockPayment = {
          amount: 500,
          paymentDate: new Date(),
          method: 'Credit Card'
        };
        const mockInvoiceForPayment = {
          invoiceNumber: 'INV-TEST-001',
          amountDue: 0
        };
        result = await emailService.sendPaymentReceiptEmail({
          to,
          customerName: 'Test Customer',
          payment: mockPayment,
          invoice: mockInvoiceForPayment
        });
        break;

      case 'booking':
        const mockBooking = {
          bookingNumber: 'BKG-TEST-001',
          destination: 'Paris, France',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          totalAmount: 2500,
          status: 'confirmed'
        };
        result = await emailService.sendBookingConfirmationEmail({
          to,
          customerName: 'Test Customer',
          booking: mockBooking
        });
        break;

      case 'commission':
        const mockCommission = {
          amount: 250,
          bookingNumber: 'BKG-TEST-001',
          rate: 10,
          status: 'approved'
        };
        result = await emailService.sendCommissionNotificationEmail({
          to,
          agentName: req.user.name || 'Test Agent',
          commission: mockCommission
        });
        break;

      case 'credit-alert':
        const mockCreditStatus = {
          status: 'warning',
          utilization: 78.5,
          creditLimit: 10000,
          creditUsed: 7850,
          availableCredit: 2150
        };
        result = await emailService.sendCreditLimitAlertEmail({
          to,
          agentName: req.user.name || 'Test Agent',
          creditStatus: mockCreditStatus
        });
        break;

      case 'overdue':
        const mockOverdueInvoice = {
          invoiceNumber: 'INV-TEST-001',
          dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          amountDue: 1050
        };
        result = await emailService.sendOverdueInvoiceEmail({
          to,
          customerName: 'Test Customer',
          invoice: mockOverdueInvoice,
          daysOverdue: 5
        });
        break;

      default:
        throw new AppError('Invalid email type', 400);
    }

    res.status(200).json({
      success: true,
      message: `Test ${type} email sent successfully to ${to}`,
      data: {
        messageId: result.messageId,
        type,
        to
      }
    });
  } catch (error) {
    throw new AppError(`Failed to send email: ${error.message}`, 500);
  }
});

/**
 * @desc    Get available email types
 * @route   GET /api/v1/test/email/types
 * @access  Private
 */
exports.getEmailTypes = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      types: [
        { value: 'welcome', label: 'Welcome Email', description: 'Welcome message for new users' },
        { value: 'invoice', label: 'Invoice Email', description: 'Professional invoice with details' },
        { value: 'payment', label: 'Payment Receipt', description: 'Payment confirmation receipt' },
        { value: 'booking', label: 'Booking Confirmation', description: 'Booking details and confirmation' },
        { value: 'commission', label: 'Commission Notification', description: 'Commission earned notification' },
        { value: 'credit-alert', label: 'Credit Alert', description: 'Credit limit warning/alert' },
        { value: 'overdue', label: 'Overdue Invoice', description: 'Payment reminder for overdue invoice' }
      ]
    }
  });
});
