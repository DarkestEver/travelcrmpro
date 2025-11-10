/**
 * Email Service
 * Handles all email sending operations
 */

const { createTransporter, defaultSender } = require('../config/emailConfig');
const path = require('path');
const fs = require('fs').promises;

class EmailService {
  constructor() {
    this.transporter = createTransporter();
  }

  /**
   * Send email
   * @param {Object} options - Email options
   * @returns {Promise}
   */
  async sendEmail({ to, subject, html, text, attachments = [] }) {
    try {
      const mailOptions = {
        from: `"${defaultSender.name}" <${defaultSender.email}>`,
        to,
        subject,
        html,
        text,
        attachments
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✉️  Email sent successfully:', info.messageId);
      return {
        success: true,
        messageId: info.messageId
      };
    } catch (error) {
      console.error('❌ Email send failed:', error);
      throw error;
    }
  }

  /**
   * Send invoice email
   * @param {Object} params - Invoice email parameters
   */
  async sendInvoiceEmail({ to, customerName, invoice, pdfPath }) {
    const subject = `Invoice ${invoice.invoiceNumber} from ${defaultSender.name}`;
    
    const html = await this.renderInvoiceTemplate({
      customerName,
      invoice
    });

    const attachments = [];
    if (pdfPath) {
      attachments.push({
        filename: `invoice-${invoice.invoiceNumber}.pdf`,
        path: pdfPath
      });
    }

    return this.sendEmail({ to, subject, html, attachments });
  }

  /**
   * Send payment receipt email
   * @param {Object} params - Payment receipt parameters
   */
  async sendPaymentReceiptEmail({ to, customerName, payment, invoice }) {
    const subject = `Payment Receipt - ${invoice.invoiceNumber}`;
    
    const html = await this.renderPaymentReceiptTemplate({
      customerName,
      payment,
      invoice
    });

    return this.sendEmail({ to, subject, html });
  }

  /**
   * Send booking confirmation email
   * @param {Object} params - Booking confirmation parameters
   */
  async sendBookingConfirmationEmail({ to, customerName, booking }) {
    const subject = `Booking Confirmation - ${booking.bookingNumber}`;
    
    const html = await this.renderBookingConfirmationTemplate({
      customerName,
      booking
    });

    return this.sendEmail({ to, subject, html });
  }

  /**
   * Send commission notification email
   * @param {Object} params - Commission notification parameters
   */
  async sendCommissionNotificationEmail({ to, agentName, commission }) {
    const subject = `Commission Earned - ${commission.bookingNumber}`;
    
    const html = await this.renderCommissionNotificationTemplate({
      agentName,
      commission
    });

    return this.sendEmail({ to, subject, html });
  }

  /**
   * Send credit limit alert email
   * @param {Object} params - Credit alert parameters
   */
  async sendCreditLimitAlertEmail({ to, agentName, creditStatus }) {
    const subject = `Credit Limit Alert - ${creditStatus.status.toUpperCase()}`;
    
    const html = await this.renderCreditAlertTemplate({
      agentName,
      creditStatus
    });

    return this.sendEmail({ to, subject, html });
  }

  /**
   * Send overdue invoice reminder
   * @param {Object} params - Overdue invoice parameters
   */
  async sendOverdueInvoiceEmail({ to, customerName, invoice, daysOverdue }) {
    const subject = `Payment Reminder - Invoice ${invoice.invoiceNumber} Overdue`;
    
    const html = await this.renderOverdueInvoiceTemplate({
      customerName,
      invoice,
      daysOverdue
    });

    return this.sendEmail({ to, subject, html });
  }

  /**
   * Send welcome email
   * @param {Object} params - Welcome email parameters
   */
  async sendWelcomeEmail({ to, name, role }) {
    const subject = `Welcome to ${defaultSender.name}!`;
    
    const html = await this.renderWelcomeTemplate({
      name,
      role
    });

    return this.sendEmail({ to, subject, html });
  }

  /**
   * Send password reset email
   * @param {Object} params - Password reset parameters
   */
  async sendPasswordResetEmail({ to, name, resetToken, resetUrl }) {
    const subject = 'Password Reset Request';
    
    const html = await this.renderPasswordResetTemplate({
      name,
      resetToken,
      resetUrl
    });

    return this.sendEmail({ to, subject, html });
  }

  /**
   * Render invoice email template
   */
  async renderInvoiceTemplate({ customerName, invoice }) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; }
            .invoice-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .total { font-size: 20px; font-weight: bold; color: #2563eb; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Invoice ${invoice.invoiceNumber}</h1>
            </div>
            <div class="content">
              <p>Dear ${customerName},</p>
              <p>Thank you for your business! Please find your invoice attached to this email.</p>
              
              <div class="invoice-details">
                <div class="detail-row">
                  <span>Invoice Number:</span>
                  <strong>${invoice.invoiceNumber}</strong>
                </div>
                <div class="detail-row">
                  <span>Invoice Date:</span>
                  <span>${new Date(invoice.invoiceDate).toLocaleDateString()}</span>
                </div>
                <div class="detail-row">
                  <span>Due Date:</span>
                  <span>${new Date(invoice.dueDate).toLocaleDateString()}</span>
                </div>
                <div class="detail-row">
                  <span>Subtotal:</span>
                  <span>$${invoice.subtotal.toFixed(2)}</span>
                </div>
                ${invoice.tax > 0 ? `
                <div class="detail-row">
                  <span>Tax (${invoice.tax}%):</span>
                  <span>$${((invoice.subtotal * invoice.tax) / 100).toFixed(2)}</span>
                </div>
                ` : ''}
                ${invoice.discount > 0 ? `
                <div class="detail-row">
                  <span>Discount (${invoice.discount}%):</span>
                  <span class="text-red-600">-$${((invoice.subtotal * invoice.discount) / 100).toFixed(2)}</span>
                </div>
                ` : ''}
                <div class="detail-row total">
                  <span>Total Amount:</span>
                  <span>$${invoice.total.toFixed(2)}</span>
                </div>
                <div class="detail-row">
                  <span>Amount Due:</span>
                  <strong class="total">$${invoice.amountDue.toFixed(2)}</strong>
                </div>
              </div>

              ${invoice.notes ? `<p><strong>Notes:</strong> ${invoice.notes}</p>` : ''}
              
              <p>Please make payment by the due date. If you have any questions, feel free to contact us.</p>
              
              <p>Thank you for your business!</p>
            </div>
            <div class="footer">
              <p>${defaultSender.name}</p>
              <p>This is an automated email. Please do not reply directly.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Render payment receipt template
   */
  async renderPaymentReceiptTemplate({ customerName, payment, invoice }) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; }
            .receipt-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #10b981; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .success-badge { background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; margin: 10px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✓ Payment Received</h1>
            </div>
            <div class="content">
              <p>Dear ${customerName},</p>
              <p>We have successfully received your payment. Thank you!</p>
              
              <div class="receipt-box">
                <div class="success-badge">Payment Confirmed</div>
                <div class="detail-row">
                  <span>Invoice Number:</span>
                  <strong>${invoice.invoiceNumber}</strong>
                </div>
                <div class="detail-row">
                  <span>Payment Date:</span>
                  <span>${new Date(payment.paymentDate).toLocaleDateString()}</span>
                </div>
                <div class="detail-row">
                  <span>Amount Paid:</span>
                  <strong style="color: #10b981; font-size: 20px;">$${payment.amount.toFixed(2)}</strong>
                </div>
                <div class="detail-row">
                  <span>Payment Method:</span>
                  <span>${payment.method || 'N/A'}</span>
                </div>
                ${invoice.amountDue > 0 ? `
                <div class="detail-row">
                  <span>Remaining Balance:</span>
                  <strong>$${invoice.amountDue.toFixed(2)}</strong>
                </div>
                ` : ''}
              </div>

              ${invoice.amountDue === 0 ? 
                '<p><strong>Your invoice is now fully paid. Thank you!</strong></p>' :
                '<p>Please note that there is still a remaining balance on this invoice.</p>'
              }
              
              <p>If you have any questions about this payment, please contact us.</p>
            </div>
            <div class="footer">
              <p>${defaultSender.name}</p>
              <p>This is an automated email. Please do not reply directly.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Render booking confirmation template
   */
  async renderBookingConfirmationTemplate({ customerName, booking }) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #8b5cf6; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; }
            .booking-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Booking Confirmed!</h1>
            </div>
            <div class="content">
              <p>Dear ${customerName},</p>
              <p>Your booking has been confirmed. We're excited to serve you!</p>
              
              <div class="booking-card">
                <h3>Booking Details</h3>
                <div class="detail-row">
                  <strong>Booking Number:</strong> ${booking.bookingNumber}
                </div>
                <div class="detail-row">
                  <strong>Destination:</strong> ${booking.destination || 'N/A'}
                </div>
                <div class="detail-row">
                  <strong>Travel Dates:</strong> ${booking.startDate ? new Date(booking.startDate).toLocaleDateString() : 'N/A'} - ${booking.endDate ? new Date(booking.endDate).toLocaleDateString() : 'N/A'}
                </div>
                <div class="detail-row">
                  <strong>Total Amount:</strong> $${booking.totalAmount?.toFixed(2) || '0.00'}
                </div>
                <div class="detail-row">
                  <strong>Status:</strong> ${booking.status}
                </div>
              </div>

              <p>We'll be in touch with more details soon. If you have any questions, please don't hesitate to contact us.</p>
            </div>
            <div class="footer">
              <p>${defaultSender.name}</p>
              <p>This is an automated email. Please do not reply directly.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Render commission notification template
   */
  async renderCommissionNotificationTemplate({ agentName, commission }) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f59e0b; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; }
            .commission-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
            .amount { font-size: 36px; font-weight: bold; color: #f59e0b; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💰 Commission Earned!</h1>
            </div>
            <div class="content">
              <p>Dear ${agentName},</p>
              <p>Congratulations! You've earned a new commission.</p>
              
              <div class="commission-box">
                <p>Commission Amount</p>
                <div class="amount">$${commission.amount.toFixed(2)}</div>
                <p><strong>Booking:</strong> ${commission.bookingNumber}</p>
                <p><strong>Rate:</strong> ${commission.rate}%</p>
                <p><strong>Status:</strong> ${commission.status}</p>
              </div>

              <p>Keep up the great work! Your commission will be processed according to our payment schedule.</p>
            </div>
            <div class="footer">
              <p>${defaultSender.name}</p>
              <p>This is an automated email. Please do not reply directly.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Render credit alert template
   */
  async renderCreditAlertTemplate({ agentName, creditStatus }) {
    const alertColor = creditStatus.status === 'critical' ? '#ef4444' : '#f59e0b';
    const alertIcon = creditStatus.status === 'critical' ? '⚠️' : '⚡';
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${alertColor}; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; }
            .alert-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${alertColor}; }
            .progress-bar { background: #e5e7eb; height: 20px; border-radius: 10px; overflow: hidden; margin: 10px 0; }
            .progress-fill { background: ${alertColor}; height: 100%; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${alertIcon} Credit Limit Alert</h1>
            </div>
            <div class="content">
              <p>Dear ${agentName},</p>
              <p><strong>Your credit limit utilization is ${creditStatus.status === 'critical' ? 'critically' : 'significantly'} high.</strong></p>
              
              <div class="alert-box">
                <p><strong>Credit Status:</strong> ${creditStatus.status.toUpperCase()}</p>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${creditStatus.utilization}%"></div>
                </div>
                <p><strong>Credit Limit:</strong> $${creditStatus.creditLimit.toFixed(2)}</p>
                <p><strong>Credit Used:</strong> $${creditStatus.creditUsed.toFixed(2)}</p>
                <p><strong>Available:</strong> $${creditStatus.availableCredit.toFixed(2)}</p>
                <p><strong>Utilization:</strong> ${creditStatus.utilization.toFixed(1)}%</p>
              </div>

              ${creditStatus.status === 'critical' ? 
                '<p><strong>Action Required:</strong> Your credit limit is almost exhausted. Please complete pending bookings or request a credit limit increase to continue operations.</p>' :
                '<p><strong>Recommendation:</strong> Consider completing pending bookings or requesting a credit limit increase soon.</p>'
              }
            </div>
            <div class="footer">
              <p>${defaultSender.name}</p>
              <p>This is an automated email. Please do not reply directly.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Render overdue invoice template
   */
  async renderOverdueInvoiceTemplate({ customerName, invoice, daysOverdue }) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ef4444; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; }
            .overdue-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #ef4444; }
            .urgent { color: #ef4444; font-weight: bold; font-size: 18px; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⏰ Payment Reminder</h1>
            </div>
            <div class="content">
              <p>Dear ${customerName},</p>
              <p class="urgent">Your invoice is ${daysOverdue} day(s) overdue.</p>
              
              <div class="overdue-box">
                <p><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
                <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
                <p><strong>Days Overdue:</strong> ${daysOverdue}</p>
                <p><strong>Amount Due:</strong> <span style="color: #ef4444; font-size: 24px; font-weight: bold;">$${invoice.amountDue.toFixed(2)}</span></p>
              </div>

              <p>Please arrange payment as soon as possible to avoid any service interruption.</p>
              <p>If you have already made payment, please disregard this notice.</p>
              <p>For any questions or concerns, please contact us immediately.</p>
            </div>
            <div class="footer">
              <p>${defaultSender.name}</p>
              <p>This is an automated email. Please do not reply directly.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Render welcome template
   */
  async renderWelcomeTemplate({ name, role }) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; }
            .welcome-box { background: white; padding: 30px; border-radius: 8px; margin: 20px 0; text-align: center; }
            .button { display: inline-block; background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to ${defaultSender.name}!</h1>
            </div>
            <div class="content">
              <div class="welcome-box">
                <h2>Hello ${name}!</h2>
                <p>We're thrilled to have you on board as ${role === 'agent' ? 'an Agent' : 'a member'}.</p>
                <p>Your account has been successfully created and you can now access all the features of our platform.</p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" class="button">Get Started</a>
              </div>

              <h3>What's Next?</h3>
              <ul>
                <li>Complete your profile</li>
                <li>Explore the dashboard</li>
                ${role === 'agent' ? '<li>Start managing your bookings</li><li>Track your commissions</li>' : ''}
                <li>Contact support if you need help</li>
              </ul>

              <p>If you have any questions, our support team is here to help!</p>
            </div>
            <div class="footer">
              <p>${defaultSender.name}</p>
              <p>This is an automated email. Please do not reply directly.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Render password reset template
   */
  async renderPasswordResetTemplate({ name, resetToken, resetUrl }) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3b82f6; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; }
            .reset-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 15px 40px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .token { background: #f3f4f6; padding: 15px; border-radius: 4px; font-family: monospace; word-break: break-all; margin: 10px 0; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello ${name},</p>
              <p>We received a request to reset your password. Click the button below to reset it:</p>
              
              <div class="reset-box" style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>

              <div class="warning">
                <strong>⚠️ Security Notice:</strong><br>
                This link will expire in 1 hour. If you didn't request this reset, please ignore this email and your password will remain unchanged.
              </div>

              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <div class="token">${resetUrl}</div>
            </div>
            <div class="footer">
              <p>${defaultSender.name}</p>
              <p>This is an automated email. Please do not reply directly.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

module.exports = new EmailService();
