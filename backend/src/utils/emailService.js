/**
 * Email Service with Development Mock Support
 * 
 * In development/test mode, emails are mocked and logged to console
 * In production, actual email service is used
 * 
 * Environment Variables:
 * - NODE_ENV: 'development' | 'test' | 'production'
 * - EMAIL_SERVICE_ENABLED: 'true' | 'false' (default: false in dev/test)
 */

const nodemailer = require('nodemailer');

// Determine if we should use mock email
const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
const isEmailEnabled = process.env.EMAIL_SERVICE_ENABLED === 'true';
const useMockEmail = isDevelopment && !isEmailEnabled;

/**
 * Create email transporter
 * In dev/test mode without EMAIL_SERVICE_ENABLED, returns mock transporter
 * In production or when EMAIL_SERVICE_ENABLED=true, returns real transporter
 */
const createTransporter = () => {
  if (useMockEmail) {
    // Mock transporter for development/testing
    console.log('📧 Using MOCK email service (development mode)');
    
    return {
      sendMail: async (mailOptions) => {
        // Log the email instead of sending
        console.log('\n' + '='.repeat(60));
        console.log('📧 MOCK EMAIL SENT (DEV MODE)');
        console.log('='.repeat(60));
        console.log('From:', mailOptions.from || process.env.EMAIL_FROM);
        console.log('To:', mailOptions.to);
        console.log('Subject:', mailOptions.subject);
        console.log('Body:', mailOptions.text || mailOptions.html?.substring(0, 200) + '...');
        console.log('='.repeat(60) + '\n');
        
        // Return success response
        return {
          messageId: `mock-${Date.now()}@travelcrm.local`,
          response: 'Mock email sent successfully',
          accepted: [mailOptions.to],
          rejected: [],
          pending: [],
        };
      },
      verify: async () => {
        console.log('✅ Mock email service verified (development mode)');
        return true;
      }
    };
  }

  // Real email transporter for production
  console.log('📧 Using REAL email service (production mode)');
  
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

const transporter = createTransporter();

/**
 * Send email with automatic mock/real switching
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text body
 * @param {string} options.html - HTML body
 * @returns {Promise<Object>} Email send result
 */
const sendEmail = async (options) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'Travel CRM <noreply@travelcrm.com>',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    const result = await transporter.sendMail(mailOptions);
    
    if (!useMockEmail) {
      console.log(`✅ Email sent successfully to ${options.to}`);
    }
    
    return result;
  } catch (error) {
    if (useMockEmail) {
      // In mock mode, don't throw errors
      console.warn(`⚠️ Mock email error (ignored in dev): ${error.message}`);
      return {
        messageId: `mock-error-${Date.now()}@travelcrm.local`,
        response: 'Mock email sent despite error',
        accepted: [options.to],
        rejected: [],
        pending: [],
      };
    }
    
    console.error('❌ Email send error:', error.message);
    throw error;
  }
};

/**
 * Verify email service connection
 * @returns {Promise<boolean>} Connection status
 */
const verifyConnection = async () => {
  try {
    await transporter.verify();
    return true;
  } catch (error) {
    if (useMockEmail) {
      // Mock always succeeds
      return true;
    }
    console.error('❌ Email service connection failed:', error.message);
    return false;
  }
};

/**
 * Send password reset email
 * @param {string} email - User email
 * @param {string} resetToken - Password reset token
 * @param {string} resetUrl - Reset URL
 */
const sendPasswordResetEmail = async (email, resetToken, resetUrl) => {
  const subject = 'Password Reset Request - Travel CRM';
  const text = `
You have requested to reset your password for Travel CRM.

Please use the following link to reset your password:
${resetUrl}

This link will expire in 10 minutes.

If you did not request this, please ignore this email.

Best regards,
Travel CRM Team
  `;
  
  const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>Password Reset Request</h2>
  <p>You have requested to reset your password for Travel CRM.</p>
  <p>Please click the button below to reset your password:</p>
  <p style="text-align: center; margin: 30px 0;">
    <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
  </p>
  <p>Or copy and paste this link in your browser:</p>
  <p style="word-break: break-all; color: #666;">${resetUrl}</p>
  <p style="color: #999; font-size: 12px;">This link will expire in 10 minutes.</p>
  <p>If you did not request this, please ignore this email.</p>
  <p>Best regards,<br>Travel CRM Team</p>
</div>
  `;

  return sendEmail({ to: email, subject, text, html });
};

/**
 * Send quote email to customer
 * @param {string} email - Customer email
 * @param {Object} quote - Quote object
 * @param {string} message - Custom message
 */
const sendQuoteEmail = async (email, quote, message) => {
  const subject = `Your Travel Quote #${quote.quoteNumber} - Travel CRM`;
  const text = `
Dear Customer,

${message || 'Your travel quote is ready!'}

Quote Number: ${quote.quoteNumber}
Total Amount: ${quote.pricing.currency} ${quote.pricing.totalPrice}
Valid Until: ${new Date(quote.validity.validUntil).toLocaleDateString()}

Please contact us if you have any questions.

Best regards,
Travel CRM Team
  `;
  
  const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>Your Travel Quote is Ready!</h2>
  <p>${message || 'Your travel quote is ready!'}</p>
  <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
    <p><strong>Quote Number:</strong> ${quote.quoteNumber}</p>
    <p><strong>Total Amount:</strong> ${quote.pricing.currency} ${quote.pricing.totalPrice}</p>
    <p><strong>Valid Until:</strong> ${new Date(quote.validity.validUntil).toLocaleDateString()}</p>
  </div>
  <p>Please contact us if you have any questions.</p>
  <p>Best regards,<br>Travel CRM Team</p>
</div>
  `;

  return sendEmail({ to: email, subject, text, html });
};

/**
 * Send booking confirmation email
 * @param {string} email - Customer email
 * @param {Object} booking - Booking object
 */
const sendBookingConfirmationEmail = async (email, booking) => {
  const subject = `Booking Confirmation #${booking.bookingNumber} - Travel CRM`;
  const text = `
Dear Customer,

Your booking has been confirmed!

Booking Number: ${booking.bookingNumber}
Status: ${booking.status}
Travel Dates: ${new Date(booking.travelDates.startDate).toLocaleDateString()} - ${new Date(booking.travelDates.endDate).toLocaleDateString()}

Thank you for choosing Travel CRM!

Best regards,
Travel CRM Team
  `;
  
  const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>Booking Confirmed!</h2>
  <div style="background-color: #d4edda; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
    <p><strong>Booking Number:</strong> ${booking.bookingNumber}</p>
    <p><strong>Status:</strong> ${booking.status}</p>
    <p><strong>Travel Dates:</strong> ${new Date(booking.travelDates.startDate).toLocaleDateString()} - ${new Date(booking.travelDates.endDate).toLocaleDateString()}</p>
  </div>
  <p>Thank you for choosing Travel CRM!</p>
  <p>Best regards,<br>Travel CRM Team</p>
</div>
  `;

  return sendEmail({ to: email, subject, text, html });
};

module.exports = {
  sendEmail,
  verifyConnection,
  sendPasswordResetEmail,
  sendQuoteEmail,
  sendBookingConfirmationEmail,
  useMockEmail, // Export for testing
};
