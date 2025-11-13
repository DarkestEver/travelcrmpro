const nodemailer = require('nodemailer');
const { getAsync, setAsync } = require('../config/database');

// Determine if we should use mock email
const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
const isEmailEnabled = process.env.EMAIL_SERVICE_ENABLED === 'true';
const useMockEmail = isDevelopment && !isEmailEnabled;

// Create transporter
const createTransporter = () => {
  if (useMockEmail) {
    console.log('📧 Email Service: MOCK mode (development)');
    return {
      sendMail: async (mailOptions) => {
        console.log('\n' + '='.repeat(60));
        console.log('📧 MOCK EMAIL (DEV MODE)');
        console.log('='.repeat(60));
        console.log('To:', mailOptions.to);
        console.log('Subject:', mailOptions.subject);
        console.log('='.repeat(60) + '\n');
        return { messageId: `mock-${Date.now()}@travelcrm.local`, accepted: [mailOptions.to] };
      },
      verify: async () => true
    };
  }
  
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

const transporter = createTransporter();

// Verify transporter connection
if (!useMockEmail) {
  transporter.verify((error) => {
    if (error) {
      console.error('Email transporter error:', error.message);
    } else {
      console.log('✅ Email service is ready (production)');
    }
  });
} else {
  console.log('✅ Mock email service ready (development)');
}

// Send email with retry logic
const sendEmail = async (options) => {
  const mailOptions = {
    from: `${process.env.SMTP_FROM_NAME || 'Travel CRM'} <${process.env.SMTP_FROM_EMAIL}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
    attachments: options.attachments || [],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    if (!useMockEmail) {
      console.log('✅ Email sent:', info.messageId);
    }
    return { success: true, messageId: info.messageId };
  } catch (error) {
    // In development mode, log error but don't fail
    if (isDevelopment) {
      console.warn(`⚠️ Email error in development mode (ignored): ${error.message}`);
      console.warn('   To:', mailOptions.to);
      console.warn('   Subject:', mailOptions.subject);
      return { success: true, messageId: `dev-ignored-${Date.now()}@travelcrm.local` };
    }
    
    // In production, throw the error
    console.error('❌ Email send error:', error);
    throw new Error('Failed to send email');
  }
};

// Send verification email
const sendVerificationEmail = async (user, token) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Welcome to Travel CRM</h2>
      <p>Hi ${user.name},</p>
      <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" 
           style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Verify Email
        </a>
      </div>
      <p>Or copy and paste this link into your browser:</p>
      <p style="color: #6b7280; word-break: break-all;">${verificationUrl}</p>
      <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
        This link will expire in 24 hours. If you didn't create an account, please ignore this email.
      </p>
    </div>
  `;

  await sendEmail({
    to: user.email,
    subject: 'Verify Your Email - Travel CRM',
    html,
  });
};

// Send password reset email
const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Password Reset Request</h2>
      <p>Hi ${user.name},</p>
      <p>You requested to reset your password. Click the button below to proceed:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" 
           style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p>Or copy and paste this link into your browser:</p>
      <p style="color: #6b7280; word-break: break-all;">${resetUrl}</p>
      <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
        This link will expire in 10 minutes. If you didn't request a password reset, please ignore this email.
      </p>
    </div>
  `;

  await sendEmail({
    to: user.email,
    subject: 'Password Reset - Travel CRM',
    html,
  });
};

// Send quote email to customer
const sendQuoteEmail = async (quote, agent, customer) => {
  const quoteUrl = `${process.env.FRONTEND_URL}/quotes/${quote._id}/view`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">New Travel Quote</h2>
      <p>Dear ${customer.name},</p>
      <p>${agent.agencyName} has prepared a travel quote for you:</p>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Quote Number:</strong> ${quote.quoteNumber}</p>
        <p><strong>Destination:</strong> ${quote.itineraryId?.destination?.country || 'N/A'}</p>
        <p><strong>Travel Dates:</strong> ${new Date(quote.travelDates.startDate).toLocaleDateString()} - ${new Date(quote.travelDates.endDate).toLocaleDateString()}</p>
        <p><strong>Travelers:</strong> ${quote.numberOfTravelers}</p>
        <p><strong>Total Price:</strong> $${quote.pricing.totalPrice.toFixed(2)}</p>
        <p><strong>Valid Until:</strong> ${new Date(quote.validUntil).toLocaleDateString()}</p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${quoteUrl}" 
           style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
          View Full Quote
        </a>
      </div>

      <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
        If you have any questions, please contact ${agent.contactPerson} at ${agent.email}
      </p>
    </div>
  `;

  // Get tenant's email account for SMTP
  const EmailAccount = require('../models/EmailAccount');
  const emailAccount = await EmailAccount.findOne({ 
    tenantId: agent.tenantId || quote.tenantId,
    isActive: true,
    'smtp.enabled': true
  }).select('+smtp.password');

  if (!emailAccount) {
    console.error('❌ No active SMTP email account configured for tenant');
    throw new Error('No active SMTP email account configured. Please configure an email account in settings.');
  }

  // Decrypt password using Mongoose getter
  const accountObj = emailAccount.toObject({ getters: true });

  // Create nodemailer transporter with tenant's SMTP settings
  const nodemailer = require('nodemailer');
  const tenantTransporter = nodemailer.createTransport({
    host: accountObj.smtp.host,
    port: accountObj.smtp.port,
    secure: accountObj.smtp.secure,
    auth: {
      user: accountObj.smtp.username,
      pass: accountObj.smtp.password
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  // Send email using tenant's SMTP
  const mailOptions = {
    from: accountObj.smtp.fromName 
      ? `"${accountObj.smtp.fromName}" <${accountObj.smtp.username}>`
      : accountObj.smtp.username,
    to: customer.email,
    subject: `Travel Quote ${quote.quoteNumber} - ${agent.agencyName}`,
    html,
    attachments: quote.pdfUrl ? [
      {
        filename: `quote-${quote.quoteNumber}.pdf`,
        path: quote.pdfUrl,
      }
    ] : [],
  };

  // Add watchers to BCC (they should receive all outgoing emails)
  const watcherService = require('../services/watcherService');
  const watchers = await watcherService.collectAllWatchers({
    tenantId: agent.tenantId || quote.tenantId,
    emailAccount: accountObj,
    entityWatchers: quote.watchers || [], // If quote has specific watchers
    excludeEmails: [customer.email, accountObj.smtp.username]
  });
  
  if (watchers.length > 0) {
    mailOptions.bcc = watchers.join(', ');
    console.log(`👁️  Added ${watchers.length} watchers to BCC`);
  }

  console.log('📤 Sending quote email via tenant SMTP:', {
    host: accountObj.smtp.host,
    port: accountObj.smtp.port,
    from: accountObj.smtp.username,
    to: customer.email,
    bcc: mailOptions.bcc || 'none'
  });

  const info = await tenantTransporter.sendMail(mailOptions);
  console.log('✅ Quote email sent successfully. MessageId:', info.messageId);
  
  return { success: true, messageId: info.messageId };
};

// Send booking confirmation email
const sendBookingConfirmationEmail = async (booking, agent, customer) => {
  const bookingUrl = `${process.env.FRONTEND_URL}/bookings/${booking._id}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10b981;">Booking Confirmed!</h2>
      <p>Dear ${customer.name},</p>
      <p>Your travel booking has been confirmed:</p>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Booking Number:</strong> ${booking.bookingNumber}</p>
        <p><strong>Travel Dates:</strong> ${new Date(booking.travelDates.startDate).toLocaleDateString()} - ${new Date(booking.travelDates.endDate).toLocaleDateString()}</p>
        <p><strong>Travelers:</strong> ${booking.travelers.length}</p>
        <p><strong>Total Amount:</strong> $${booking.financial.totalAmount.toFixed(2)}</p>
        <p><strong>Paid Amount:</strong> $${booking.financial.paidAmount.toFixed(2)}</p>
        <p><strong>Pending Amount:</strong> $${booking.financial.pendingAmount.toFixed(2)}</p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${bookingUrl}" 
           style="background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
          View Booking Details
        </a>
      </div>

      <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
        Managed by ${agent.agencyName}. Contact: ${agent.contactPerson} at ${agent.email}
      </p>
    </div>
  `;

  // Get tenant's email account for SMTP
  const EmailAccount = require('../models/EmailAccount');
  const emailAccount = await EmailAccount.findOne({ 
    tenantId: agent.tenantId || booking.tenantId,
    isActive: true,
    'smtp.enabled': true
  }).select('+smtp.password');

  if (!emailAccount) {
    console.error('❌ No active SMTP email account configured for tenant');
    throw new Error('No active SMTP email account configured. Please configure an email account in settings.');
  }

  // Decrypt password using Mongoose getter
  const accountObj = emailAccount.toObject({ getters: true });

  // Create nodemailer transporter with tenant's SMTP settings
  const nodemailer = require('nodemailer');
  const tenantTransporter = nodemailer.createTransport({
    host: accountObj.smtp.host,
    port: accountObj.smtp.port,
    secure: accountObj.smtp.secure,
    auth: {
      user: accountObj.smtp.username,
      pass: accountObj.smtp.password
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  // Send email using tenant's SMTP
  const mailOptions = {
    from: accountObj.smtp.fromName 
      ? `"${accountObj.smtp.fromName}" <${accountObj.smtp.username}>`
      : accountObj.smtp.username,
    to: customer.email,
    subject: `Booking Confirmation ${booking.bookingNumber}`,
    html,
    attachments: booking.voucherUrl ? [
      {
        filename: `voucher-${booking.bookingNumber}.pdf`,
        path: booking.voucherUrl,
      }
    ] : [],
  };

  // Add watchers to BCC (they should receive all outgoing emails)
  const watcherService = require('../services/watcherService');
  const watchers = await watcherService.collectAllWatchers({
    tenantId: agent.tenantId || booking.tenantId,
    emailAccount: accountObj,
    entityWatchers: booking.watchers || [], // If booking has specific watchers
    excludeEmails: [customer.email, accountObj.smtp.username]
  });
  
  if (watchers.length > 0) {
    mailOptions.bcc = watchers.join(', ');
    console.log(`👁️  Added ${watchers.length} watchers to BCC`);
  }

  console.log('📤 Sending booking confirmation via tenant SMTP:', {
    host: accountObj.smtp.host,
    port: accountObj.smtp.port,
    from: accountObj.smtp.username,
    to: customer.email,
    bcc: mailOptions.bcc || 'none'
  });

  const info = await tenantTransporter.sendMail(mailOptions);
  console.log('✅ Booking confirmation sent successfully. MessageId:', info.messageId);
  
  return { success: true, messageId: info.messageId };
};

// Send agent approval email
const sendAgentApprovalEmail = async (agent, user) => {
  const loginUrl = `${process.env.FRONTEND_URL}/login`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10b981;">Agent Account Approved!</h2>
      <p>Hi ${user.name},</p>
      <p>Your agent account for <strong>${agent.agencyName}</strong> has been approved.</p>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Agency:</strong> ${agent.agencyName}</p>
        <p><strong>Credit Limit:</strong> $${agent.creditLimit.toFixed(2)}</p>
        <p><strong>Tier:</strong> ${agent.tier}</p>
      </div>

      <p>You can now log in and start managing your travel bookings:</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${loginUrl}" 
           style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Log In to Travel CRM
        </a>
      </div>
    </div>
  `;

  await sendEmail({
    to: user.email,
    subject: 'Agent Account Approved - Travel CRM',
    html,
  });
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendQuoteEmail,
  sendBookingConfirmationEmail,
  sendAgentApprovalEmail,
};
