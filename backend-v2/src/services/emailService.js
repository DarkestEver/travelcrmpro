const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');
const config = require('../config');
const logger = require('../lib/logger');
const EmailLog = require('../models/EmailLog');
const EmailTemplate = require('../models/EmailTemplate');
const { ServiceUnavailableError } = require('../lib/errors');

/**
 * Email Service - Comprehensive email sending with SMTP and SendGrid support
 */

// Initialize SendGrid if API key is available
if (config.email?.sendgridApiKey) {
  sgMail.setApiKey(config.email.sendgridApiKey);
}

/**
 * Create SMTP transporter
 */
const createSmtpTransporter = () => {
  const emailConfig = config.email || {};

  if (!emailConfig.smtp?.host || !emailConfig.smtp?.port) {
    logger.warn('SMTP configuration incomplete');
    return null;
  }

  const transportConfig = {
    host: emailConfig.smtp.host,
    port: emailConfig.smtp.port,
    secure: emailConfig.smtp.secure || false,
  };

  if (emailConfig.smtp.user && emailConfig.smtp.password) {
    transportConfig.auth = {
      user: emailConfig.smtp.user,
      pass: emailConfig.smtp.password,
    };
  }

  return nodemailer.createTransport(transportConfig);
};

// Lazy initialization - only create transporter when needed
let smtpTransporter = null;
const getSmtpTransporter = () => {
  if (!smtpTransporter) {
    smtpTransporter = createSmtpTransporter();
  }
  return smtpTransporter;
};

/**
 * Send email via SMTP
 */
const sendViaSmtp = async (emailData) => {
  const transporter = getSmtpTransporter();
  if (!transporter) {
    throw new ServiceUnavailableError('SMTP transporter not configured');
  }

  const info = await transporter.sendMail({
    from: emailData.from,
    to: emailData.to,
    cc: emailData.cc,
    bcc: emailData.bcc,
    subject: emailData.subject,
    html: emailData.html,
    text: emailData.text,
    replyTo: emailData.replyTo,
    attachments: emailData.attachments,
  });

  return {
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
    response: info.response,
  };
};

/**
 * Send email via SendGrid
 */
const sendViaSendGrid = async (emailData) => {
  if (!config.email?.sendgridApiKey) {
    throw new ServiceUnavailableError('SendGrid API key not configured');
  }

  const msg = {
    to: Array.isArray(emailData.to) ? emailData.to : [emailData.to],
    from: emailData.from,
    subject: emailData.subject,
    html: emailData.html,
    text: emailData.text,
  };

  if (emailData.cc) msg.cc = Array.isArray(emailData.cc) ? emailData.cc : [emailData.cc];
  if (emailData.bcc) msg.bcc = Array.isArray(emailData.bcc) ? emailData.bcc : [emailData.bcc];
  if (emailData.replyTo) msg.replyTo = emailData.replyTo;
  
  if (emailData.attachments) {
    msg.attachments = emailData.attachments.map((att) => ({
      content: att.content,
      filename: att.filename,
      type: att.contentType,
    }));
  }

  const result = await sgMail.send(msg);
  return {
    messageId: result[0]?.headers?.['x-message-id'],
    statusCode: result[0]?.statusCode,
  };
};

/**
 * Send email
 */
const sendEmail = async (options) => {
  const { to, subject, html, text, from, cc, bcc, replyTo, attachments, relatedTo, templateSlug, templateId, tenantId, userId, metadata } = options;

  if (!to || !subject || !html || !tenantId) {
    throw new Error('Missing required email fields');
  }

  const fromAddress = from || config.email?.from || 'noreply@travelcrm.com';
  const fromName = config.email?.fromName || 'Travel CRM';

  const emailData = {
    from: `${fromName} <${fromAddress}>`,
    to, cc, bcc, subject, html, text, replyTo, attachments,
  };

  const emailLog = await EmailLog.create({
    tenant: tenantId,
    template: templateId,
    templateSlug,
    to: Array.isArray(to) ? to : [to],
    cc: cc ? (Array.isArray(cc) ? cc : [cc]) : undefined,
    bcc: bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : undefined,
    from: { email: fromAddress, name: fromName },
    replyTo,
    subject,
    htmlBody: html,
    textBody: text,
    relatedTo,
    status: 'sending',
    provider: config.email?.provider || 'smtp',
    sentBy: userId,
    metadata,
  });

  try {
    const result = config.email?.provider === 'sendgrid' 
      ? await sendViaSendGrid(emailData)
      : await sendViaSmtp(emailData);

    await emailLog.markAsSent(result.messageId, result);
    logger.info('Email sent successfully', { to, subject });
    return emailLog;
  } catch (error) {
    await emailLog.markAsFailed(error.code || 'SEND_ERROR', error.message, error.response);
    logger.error('Failed to send email', { to, subject, error: error.message });
    throw error;
  }
};

/**
 * Send template email
 */
const sendTemplateEmail = async (options) => {
  const { to, templateSlug, templateData = {}, tenantId, userId, relatedTo, attachments, cc, bcc } = options;

  if (!to || !templateSlug || !tenantId) {
    throw new Error('Missing required fields: to, templateSlug, tenantId');
  }

  const template = await EmailTemplate.getBySlug(tenantId, templateSlug);
  if (!template) {
    throw new Error(`Email template not found: ${templateSlug}`);
  }

  const rendered = template.render(templateData);
  await template.incrementSendCount();

  return await sendEmail({
    to, cc, bcc,
    subject: rendered.subject,
    html: rendered.htmlBody,
    text: rendered.textBody,
    from: template.fromEmail,
    replyTo: template.replyTo,
    attachments,
    relatedTo,
    templateSlug: template.slug,
    templateId: template._id,
    tenantId,
    userId,
  });
};

/**
 * Send quote email
 */
const sendQuoteEmail = async (quote, tenantId, userId) => {
  const templateData = {
    customer_name: quote.customer?.name || 'Valued Customer',
    quote_number: quote.quoteNumber,
    destination: quote.destination || 'Your Destination',
    start_date: quote.travelDates?.start ? new Date(quote.travelDates.start).toLocaleDateString() : 'TBD',
    end_date: quote.travelDates?.end ? new Date(quote.travelDates.end).toLocaleDateString() : 'TBD',
    travelers: quote.numberOfTravelers || 1,
    total_price: `$${quote.pricing?.totalPrice?.toLocaleString() || '0'}`,
    valid_until: quote.validUntil ? new Date(quote.validUntil).toLocaleDateString() : 'Contact us',
    quote_link: `${config.app?.url}/quotes/${quote._id}`,
    company_name: tenantId.name || 'Travel Agency',
  };

  return await sendTemplateEmail({
    to: quote.customer.email,
    templateSlug: 'quote-sent',
    templateData,
    tenantId,
    userId,
    relatedTo: { entityType: 'quote', entityId: quote._id },
  });
};

/**
 * Send booking confirmation
 */
const sendBookingConfirmationEmail = async (booking, tenantId, userId) => {
  const templateData = {
    customer_name: booking.customer?.name || 'Valued Customer',
    booking_number: booking.bookingNumber,
    destination: booking.destination || 'Your Destination',
    start_date: booking.travelStartDate ? new Date(booking.travelStartDate).toLocaleDateString() : 'TBD',
    end_date: booking.travelEndDate ? new Date(booking.travelEndDate).toLocaleDateString() : 'TBD',
    travelers: booking.travelers?.length || 1,
    total_amount: `$${booking.pricing?.totalPrice?.toLocaleString() || '0'}`,
    amount_paid: `$${booking.amountPaid?.toLocaleString() || '0'}`,
    amount_due: `$${booking.amountDue?.toLocaleString() || '0'}`,
    company_name: tenantId.name || 'Travel Agency',
  };

  return await sendTemplateEmail({
    to: booking.customer.email,
    templateSlug: 'booking-confirmation',
    templateData,
    tenantId,
    userId,
    relatedTo: { entityType: 'booking', entityId: booking._id },
  });
};

/**
 * Send payment receipt
 */
const sendPaymentReceiptEmail = async (payment, booking, tenantId, userId) => {
  const templateData = {
    customer_name: payment.customer?.name || 'Valued Customer',
    transaction_id: payment.transactionId,
    amount_paid: `$${payment.amount?.toLocaleString() || '0'}`,
    payment_method: payment.method,
    payment_date: payment.completedAt ? new Date(payment.completedAt).toLocaleDateString() : new Date().toLocaleDateString(),
    booking_number: booking.bookingNumber,
    total_amount: `$${booking.pricing?.totalPrice?.toLocaleString() || '0'}`,
    total_paid: `$${booking.amountPaid?.toLocaleString() || '0'}`,
    balance_due: `$${booking.amountDue?.toLocaleString() || '0'}`,
    company_name: tenantId.name || 'Travel Agency',
  };

  return await sendTemplateEmail({
    to: payment.customer.email,
    templateSlug: 'payment-receipt',
    templateData,
    tenantId,
    userId,
    relatedTo: { entityType: 'payment', entityId: payment._id },
  });
};

/**
 * Send invoice email
 */
const sendInvoiceEmail = async (invoice, tenantId, userId) => {
  const templateData = {
    customer_name: invoice.customer?.name || 'Valued Customer',
    invoice_number: invoice.invoiceNumber,
    description: invoice.lineItems?.[0]?.description || 'Travel Services',
    issue_date: invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString() : new Date().toLocaleDateString(),
    due_date: invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'Upon receipt',
    total_amount: `$${invoice.total?.toLocaleString() || '0'}`,
    amount_due: `$${invoice.paymentStatus?.amountDue?.toLocaleString() || '0'}`,
    payment_link: `${config.app?.url}/invoices/${invoice._id}/pay`,
    company_name: tenantId.name || 'Travel Agency',
  };

  return await sendTemplateEmail({
    to: invoice.customer.email,
    templateSlug: 'invoice-sent',
    templateData,
    tenantId,
    userId,
    relatedTo: { entityType: 'invoice', entityId: invoice._id },
  });
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (to, resetToken, context = {}) => {
  const resetUrl = `${config.app?.url}/reset-password?token=${resetToken}`;
  
  const templateData = {
    first_name: context.firstName || 'User',
    reset_link: resetUrl,
    company_name: context.tenantName || 'Travel CRM',
  };

  // Try to use template, fallback to direct email
  try {
    return await sendTemplateEmail({
      to,
      templateSlug: 'password-reset',
      templateData,
      tenantId: context.tenantId,
    });
  } catch (error) {
    // Fallback: send direct email
    logger.warn('Password reset template not found, sending direct email', { error: error.message });
    
    return await sendEmail({
      to,
      subject: 'Password Reset Request',
      html: `
        <p>Hello ${templateData.first_name},</p>
        <p>You have requested to reset your password. Please click the link below:</p>
        <p><a href="${resetUrl}">Reset Password</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request this, please ignore this email.</p>
        <p>Best regards,<br>${templateData.company_name}</p>
      `,
      tenantId: context.tenantId,
    });
  }
};

module.exports = {
  sendEmail,
  sendTemplateEmail,
  sendQuoteEmail,
  sendBookingConfirmationEmail,
  sendPaymentReceiptEmail,
  sendInvoiceEmail,
  sendPasswordResetEmail,
};
