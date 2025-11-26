const EmailTemplate = require('../models/EmailTemplate');
const EmailLog = require('../models/EmailLog');
const emailService = require('../services/emailService');
const { ValidationError, NotFoundError } = require('../lib/errors');
const logger = require('../lib/logger');

/**
 * Get all email templates
 * GET /api/v1/emails/templates
 */
const getAllTemplates = async (req, res) => {
  const tenantId = req.user.tenant;
  const { category, isActive } = req.query;

  const filter = { tenant: tenantId };
  if (category) filter.category = category;
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  const templates = await EmailTemplate.find(filter)
    .populate('createdBy', 'firstName lastName')
    .populate('lastModifiedBy', 'firstName lastName')
    .sort({ category: 1, name: 1 });

  res.json({
    success: true,
    data: templates,
  });
};

/**
 * Get single template
 * GET /api/v1/emails/templates/:id
 */
const getTemplate = async (req, res) => {
  const { id } = req.params;
  const tenantId = req.user.tenant;

  const template = await EmailTemplate.findOne({ _id: id, tenant: tenantId })
    .populate('createdBy', 'firstName lastName')
    .populate('lastModifiedBy', 'firstName lastName');

  if (!template) {
    throw new NotFoundError('Email template not found');
  }

  res.json({
    success: true,
    data: template,
  });
};

/**
 * Create email template
 * POST /api/v1/emails/templates
 */
const createTemplate = async (req, res) => {
  const userId = req.userId;
  const tenantId = req.user.tenant;
  const templateData = req.body;

  // Generate slug from name
  const slug = templateData.slug || templateData.name.toLowerCase().replace(/\s+/g, '-');

  // Check if slug exists
  const existing = await EmailTemplate.findOne({ tenant: tenantId, slug });
  if (existing) {
    throw new ValidationError('Template with this slug already exists', 'SLUG_EXISTS');
  }

  const template = await EmailTemplate.create({
    ...templateData,
    slug,
    tenant: tenantId,
    createdBy: userId,
  });

  const populated = await EmailTemplate.findById(template._id)
    .populate('createdBy', 'firstName lastName');

  logger.info('Email template created', {
    templateId: template._id,
    slug,
    userId,
    requestId: req.id,
  });

  res.status(201).json({
    success: true,
    data: populated,
  });
};

/**
 * Update email template
 * PUT /api/v1/emails/templates/:id
 */
const updateTemplate = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;
  const tenantId = req.user.tenant;
  const updates = req.body;

  const template = await EmailTemplate.findOne({ _id: id, tenant: tenantId });

  if (!template) {
    throw new NotFoundError('Email template not found');
  }

  if (template.isSystem) {
    throw new ValidationError('Cannot modify system templates', 'SYSTEM_TEMPLATE');
  }

  // Update fields
  const allowedFields = ['name', 'subject', 'htmlContent', 'textContent', 'variables', 'category', 'isActive'];
  allowedFields.forEach(field => {
    if (updates[field] !== undefined) {
      template[field] = updates[field];
    }
  });

  template.lastModifiedBy = userId;
  await template.save();

  const populated = await EmailTemplate.findById(template._id)
    .populate('createdBy', 'firstName lastName')
    .populate('lastModifiedBy', 'firstName lastName');

  logger.info('Email template updated', {
    templateId: template._id,
    userId,
    requestId: req.id,
  });

  res.json({
    success: true,
    data: populated,
  });
};

/**
 * Delete email template
 * DELETE /api/v1/emails/templates/:id
 */
const deleteTemplate = async (req, res) => {
  const { id } = req.params;
  const tenantId = req.user.tenant;

  const template = await EmailTemplate.findOne({ _id: id, tenant: tenantId });

  if (!template) {
    throw new NotFoundError('Email template not found');
  }

  if (template.isSystem) {
    throw new ValidationError('Cannot delete system templates', 'SYSTEM_TEMPLATE');
  }

  await template.deleteOne();

  logger.info('Email template deleted', {
    templateId: id,
    userId: req.userId,
    requestId: req.id,
  });

  res.json({
    success: true,
    message: 'Email template deleted successfully',
  });
};

/**
 * Send email using template
 * POST /api/v1/emails/send
 */
const sendEmail = async (req, res) => {
  const userId = req.userId;
  const tenantId = req.user.tenant;
  const { templateId, to, cc, bcc, variables, relatedTo } = req.body;

  // Get template
  const template = await EmailTemplate.findOne({
    _id: templateId,
    tenant: tenantId,
    isActive: true,
  });

  if (!template) {
    throw new NotFoundError('Email template not found or inactive');
  }

  // Render template
  const rendered = template.render(variables);

  // Create email log
  const emailLog = await EmailLog.create({
    tenant: tenantId,
    to,
    cc,
    bcc,
    subject: rendered.subject,
    htmlContent: rendered.html,
    textContent: rendered.text,
    template: templateId,
    relatedTo,
    sentBy: userId,
    status: 'pending',
  });

  try {
    // Send email
    const result = await emailService.sendEmail({
      to,
      cc,
      bcc,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });

    // Update log
    emailLog.status = 'sent';
    emailLog.sentAt = new Date();
    emailLog.messageId = result.messageId;
    await emailLog.save();

    // Track template usage
    await template.trackUsage();

    logger.info('Email sent', {
      emailLogId: emailLog._id,
      to,
      templateId,
      userId,
      requestId: req.id,
    });

    res.json({
      success: true,
      data: emailLog,
      message: 'Email sent successfully',
    });
  } catch (error) {
    // Update log with failure
    emailLog.status = 'failed';
    emailLog.failedAt = new Date();
    emailLog.errorMessage = error.message;
    await emailLog.save();

    logger.error('Email send failed', {
      emailLogId: emailLog._id,
      error: error.message,
      requestId: req.id,
    });

    throw error;
  }
};

/**
 * Get email logs
 * GET /api/v1/emails/logs
 */
const getEmailLogs = async (req, res) => {
  const tenantId = req.user.tenant;
  const { status, startDate, endDate, page = 1, limit = 20 } = req.query;

  const filter = { tenant: tenantId };
  if (status) filter.status = status;

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    EmailLog.find(filter)
      .populate('template', 'name slug')
      .populate('sentBy', 'firstName lastName')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 }),
    EmailLog.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: logs,
    meta: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
};

/**
 * Get email statistics
 * GET /api/v1/emails/stats
 */
const getEmailStats = async (req, res) => {
  const tenantId = req.user.tenant;
  const { startDate, endDate } = req.query;

  const stats = await EmailLog.getStats(tenantId, startDate, endDate);

  res.json({
    success: true,
    data: stats,
  });
};

module.exports = {
  getAllTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  sendEmail,
  getEmailLogs,
  getEmailStats,
};
