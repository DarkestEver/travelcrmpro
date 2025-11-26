const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Email Template Schema
 * Stores customizable email templates for automated communications
 */
const emailTemplateSchema = new Schema(
  {
    // Multi-tenancy
    tenant: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },

    // Template identification
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    // Template content
    subject: {
      type: String,
      required: true,
      maxlength: 200,
    },

    htmlBody: {
      type: String,
      required: true,
    },

    textBody: {
      type: String,
    },

    // Variables/placeholders available in this template
    variables: [
      {
        key: {
          type: String,
          required: true,
        },
        description: String,
        example: String,
      },
    ],

    // Template category
    category: {
      type: String,
      enum: [
        'quote',
        'booking',
        'payment',
        'invoice',
        'lead',
        'general',
        'notification',
        'marketing',
      ],
      required: true,
      index: true,
    },

    // Status
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // Is this a system template (cannot be deleted)
    isSystem: {
      type: Boolean,
      default: false,
    },

    // Email settings
    fromName: {
      type: String,
      default: function () {
        return this.tenant?.name || 'Travel CRM';
      },
    },

    fromEmail: String,

    replyTo: String,

    // Attachments configuration
    attachments: [
      {
        type: {
          type: String,
          enum: ['pdf', 'document', 'image', 'other'],
        },
        source: {
          type: String,
          enum: ['quote_pdf', 'itinerary_pdf', 'invoice_pdf', 'manual'],
        },
        filename: String,
      },
    ],

    // Usage statistics
    stats: {
      timesSent: {
        type: Number,
        default: 0,
      },
      lastSent: Date,
      openRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      clickRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
    },

    // Audit
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    lastModifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
emailTemplateSchema.index({ tenant: 1, slug: 1 }, { unique: true });
emailTemplateSchema.index({ tenant: 1, category: 1, isActive: 1 });

// Instance method: Render template with variables
emailTemplateSchema.methods.render = function (data = {}) {
  let subject = this.subject;
  let htmlBody = this.htmlBody;
  let textBody = this.textBody || '';

  // Replace all {{variable}} placeholders with actual data
  Object.keys(data).forEach((key) => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    const value = data[key] !== null && data[key] !== undefined ? data[key] : '';
    
    subject = subject.replace(regex, value);
    htmlBody = htmlBody.replace(regex, value);
    textBody = textBody.replace(regex, value);
  });

  return {
    subject,
    htmlBody,
    textBody,
  };
};

// Instance method: Increment send count
emailTemplateSchema.methods.incrementSendCount = async function () {
  this.stats.timesSent += 1;
  this.stats.lastSent = new Date();
  await this.save();
};

// Static method: Get active templates by category
emailTemplateSchema.statics.getActiveByCategory = function (tenantId, category) {
  return this.find({
    tenant: tenantId,
    category,
    isActive: true,
  }).sort({ name: 1 });
};

// Static method: Get template by slug
emailTemplateSchema.statics.getBySlug = function (tenantId, slug) {
  return this.findOne({
    tenant: tenantId,
    slug,
    isActive: true,
  });
};

// Static method: Create default system templates for a tenant
emailTemplateSchema.statics.createDefaultTemplates = async function (tenantId, userId) {
  const defaultTemplates = [
    {
      name: 'Quote Sent',
      slug: 'quote-sent',
      category: 'quote',
      subject: 'Your Travel Quote - {{quote_number}}',
      htmlBody: `
        <h2>Hello {{customer_name}},</h2>
        <p>Thank you for your interest in {{destination}}!</p>
        <p>Please find attached your personalized travel quote ({{quote_number}}).</p>
        <p><strong>Quote Details:</strong></p>
        <ul>
          <li>Destination: {{destination}}</li>
          <li>Travel Dates: {{start_date}} to {{end_date}}</li>
          <li>Number of Travelers: {{travelers}}</li>
          <li>Total Price: {{total_price}}</li>
        </ul>
        <p>This quote is valid until {{valid_until}}.</p>
        <p><a href="{{quote_link}}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-align: center; text-decoration: none; display: inline-block; border-radius: 4px;">View Quote</a></p>
        <p>If you have any questions, please don't hesitate to contact us.</p>
        <p>Best regards,<br>{{company_name}}</p>
      `,
      textBody: 'Hello {{customer_name}}, Thank you for your interest. Please find attached your travel quote ({{quote_number}}) for {{destination}}. Valid until {{valid_until}}.',
      variables: [
        { key: 'customer_name', description: 'Customer name', example: 'John Doe' },
        { key: 'quote_number', description: 'Quote reference number', example: 'QT-202501-0001' },
        { key: 'destination', description: 'Travel destination', example: 'Paris, France' },
        { key: 'start_date', description: 'Start date', example: '2025-06-01' },
        { key: 'end_date', description: 'End date', example: '2025-06-10' },
        { key: 'travelers', description: 'Number of travelers', example: '2' },
        { key: 'total_price', description: 'Total price', example: '$5,000' },
        { key: 'valid_until', description: 'Quote expiry date', example: '2025-02-01' },
        { key: 'quote_link', description: 'Link to view quote', example: 'https://...' },
        { key: 'company_name', description: 'Company name', example: 'Travel Agency' },
      ],
      attachments: [{ type: 'pdf', source: 'quote_pdf' }],
      isSystem: true,
    },
    {
      name: 'Booking Confirmation',
      slug: 'booking-confirmation',
      category: 'booking',
      subject: 'Booking Confirmed - {{booking_number}}',
      htmlBody: `
        <h2>Booking Confirmed!</h2>
        <p>Dear {{customer_name}},</p>
        <p>We're excited to confirm your booking for {{destination}}!</p>
        <p><strong>Booking Details:</strong></p>
        <ul>
          <li>Booking Number: {{booking_number}}</li>
          <li>Destination: {{destination}}</li>
          <li>Travel Dates: {{start_date}} to {{end_date}}</li>
          <li>Number of Travelers: {{travelers}}</li>
          <li>Total Amount: {{total_amount}}</li>
          <li>Amount Paid: {{amount_paid}}</li>
          <li>Amount Due: {{amount_due}}</li>
        </ul>
        <p>Your detailed itinerary is attached to this email.</p>
        <p>We'll be in touch with additional details as your travel date approaches.</p>
        <p>Safe travels,<br>{{company_name}}</p>
      `,
      textBody: 'Dear {{customer_name}}, Your booking ({{booking_number}}) for {{destination}} is confirmed! Travel dates: {{start_date}} to {{end_date}}. Total: {{total_amount}}.',
      variables: [
        { key: 'customer_name', description: 'Customer name' },
        { key: 'booking_number', description: 'Booking reference' },
        { key: 'destination', description: 'Travel destination' },
        { key: 'start_date', description: 'Start date' },
        { key: 'end_date', description: 'End date' },
        { key: 'travelers', description: 'Number of travelers' },
        { key: 'total_amount', description: 'Total booking amount' },
        { key: 'amount_paid', description: 'Amount paid' },
        { key: 'amount_due', description: 'Amount remaining' },
        { key: 'company_name', description: 'Company name' },
      ],
      attachments: [{ type: 'pdf', source: 'itinerary_pdf' }],
      isSystem: true,
    },
    {
      name: 'Payment Receipt',
      slug: 'payment-receipt',
      category: 'payment',
      subject: 'Payment Received - Receipt {{transaction_id}}',
      htmlBody: `
        <h2>Payment Received</h2>
        <p>Dear {{customer_name}},</p>
        <p>Thank you for your payment!</p>
        <p><strong>Payment Details:</strong></p>
        <ul>
          <li>Transaction ID: {{transaction_id}}</li>
          <li>Amount Paid: {{amount_paid}}</li>
          <li>Payment Method: {{payment_method}}</li>
          <li>Date: {{payment_date}}</li>
          <li>Booking Number: {{booking_number}}</li>
        </ul>
        <p><strong>Balance Information:</strong></p>
        <ul>
          <li>Total Amount: {{total_amount}}</li>
          <li>Amount Paid to Date: {{total_paid}}</li>
          <li>Remaining Balance: {{balance_due}}</li>
        </ul>
        <p>Your receipt is attached to this email for your records.</p>
        <p>Thank you for your business!</p>
        <p>Best regards,<br>{{company_name}}</p>
      `,
      textBody: 'Payment received! Transaction {{transaction_id}}: {{amount_paid}} on {{payment_date}}. Remaining balance: {{balance_due}}.',
      variables: [
        { key: 'customer_name', description: 'Customer name' },
        { key: 'transaction_id', description: 'Transaction ID' },
        { key: 'amount_paid', description: 'Payment amount' },
        { key: 'payment_method', description: 'Payment method' },
        { key: 'payment_date', description: 'Payment date' },
        { key: 'booking_number', description: 'Booking reference' },
        { key: 'total_amount', description: 'Total booking amount' },
        { key: 'total_paid', description: 'Total paid' },
        { key: 'balance_due', description: 'Remaining balance' },
        { key: 'company_name', description: 'Company name' },
      ],
      isSystem: true,
    },
    {
      name: 'Invoice Sent',
      slug: 'invoice-sent',
      category: 'invoice',
      subject: 'Invoice {{invoice_number}} - Payment Due {{due_date}}',
      htmlBody: `
        <h2>Invoice {{invoice_number}}</h2>
        <p>Dear {{customer_name}},</p>
        <p>Please find attached your invoice for {{description}}.</p>
        <p><strong>Invoice Details:</strong></p>
        <ul>
          <li>Invoice Number: {{invoice_number}}</li>
          <li>Issue Date: {{issue_date}}</li>
          <li>Due Date: {{due_date}}</li>
          <li>Total Amount: {{total_amount}}</li>
          <li>Amount Due: {{amount_due}}</li>
        </ul>
        <p><a href="{{payment_link}}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-align: center; text-decoration: none; display: inline-block; border-radius: 4px;">Pay Now</a></p>
        <p>Payment is due by {{due_date}}. Please contact us if you have any questions.</p>
        <p>Thank you,<br>{{company_name}}</p>
      `,
      textBody: 'Invoice {{invoice_number}} attached. Amount due: {{amount_due}} by {{due_date}}.',
      variables: [
        { key: 'customer_name', description: 'Customer name' },
        { key: 'invoice_number', description: 'Invoice number' },
        { key: 'description', description: 'Invoice description' },
        { key: 'issue_date', description: 'Issue date' },
        { key: 'due_date', description: 'Due date' },
        { key: 'total_amount', description: 'Total amount' },
        { key: 'amount_due', description: 'Amount due' },
        { key: 'payment_link', description: 'Payment link' },
        { key: 'company_name', description: 'Company name' },
      ],
      attachments: [{ type: 'pdf', source: 'invoice_pdf' }],
      isSystem: true,
    },
  ];

  const templates = defaultTemplates.map((template) => ({
    ...template,
    tenant: tenantId,
    createdBy: userId,
  }));

  return await this.insertMany(templates);
};

const EmailTemplate = mongoose.model('EmailTemplate', emailTemplateSchema);

module.exports = EmailTemplate;
