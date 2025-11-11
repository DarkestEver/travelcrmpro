const EmailLog = require('../models/EmailLog');
const emailProcessingQueue = require('../services/emailProcessingQueue');
const openaiService = require('../services/openaiService');
const matchingEngine = require('../services/matchingEngine');
const emailToQuoteService = require('../services/emailToQuoteService');
const { simpleParser } = require('mailparser');

class EmailController {
  /**
   * Webhook endpoint to receive incoming emails
   * POST /api/v1/emails/webhook
   */
  async receiveEmail(req, res) {
    try {
      const { rawEmail, from, to, subject, tenantId } = req.body;
      
      // Parse email
      let parsed;
      if (rawEmail) {
        parsed = await simpleParser(rawEmail);
      } else {
        parsed = {
          from: { value: [{ address: from }] },
          to: { value: [{ address: to }] },
          subject,
          html: req.body.html || '',
          text: req.body.text || '',
          attachments: req.body.attachments || []
        };
      }

      // Extract email data
      const emailData = {
        messageId: parsed.messageId || `${Date.now()}@travel-crm.local`,
        threadId: parsed.inReplyTo || null,
        from: {
          email: parsed.from?.value?.[0]?.address || from,
          name: parsed.from?.value?.[0]?.name || null
        },
        to: parsed.to?.value?.map(t => ({
          email: t.address,
          name: t.name || null
        })) || [{ email: to, name: null }],
        cc: parsed.cc?.value?.map(c => ({
          email: c.address,
          name: c.name || null
        })) || [],
        bcc: parsed.bcc?.value?.map(b => ({
          email: b.address,
          name: b.name || null
        })) || [],
        subject: parsed.subject || subject || '(No Subject)',
        bodyHtml: parsed.html || req.body.html || '',
        bodyText: parsed.text || req.body.text || '',
        snippet: (parsed.text || req.body.text || '').substring(0, 200),
        attachments: parsed.attachments?.map(att => ({
          filename: att.filename,
          contentType: att.contentType,
          size: att.size,
          url: null // TODO: Store attachments
        })) || [],
        headers: parsed.headers || {},
        receivedAt: new Date(),
        processingStatus: 'pending',
        tenantId: tenantId || req.user.tenantId
      };

      // Save to database
      const email = await EmailLog.create(emailData);

      // Add to processing queue
      await emailProcessingQueue.addToQueue(email._id, email.tenantId);

      res.status(200).json({
        success: true,
        message: 'Email received and queued for processing',
        emailId: email._id
      });
    } catch (error) {
      console.error('Email webhook error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process email',
        error: error.message
      });
    }
  }

  /**
   * Get all emails with filters and pagination
   * GET /api/v1/emails
   */
  async getEmails(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        category,
        status,
        searchTerm,
        startDate,
        endDate,
        requiresReview
      } = req.query;

      const tenantId = req.user.tenantId;
      const skip = (page - 1) * limit;

      // Build filter
      const filter = { tenantId };

      if (category) {
        filter.category = category;
      }

      if (status) {
        filter.processingStatus = status;
      }

      if (requiresReview === 'true') {
        filter.requiresReview = true;
      }

      if (searchTerm) {
        filter.$or = [
          { subject: { $regex: searchTerm, $options: 'i' } },
          { 'from.email': { $regex: searchTerm, $options: 'i' } },
          { 'from.name': { $regex: searchTerm, $options: 'i' } },
          { bodyText: { $regex: searchTerm, $options: 'i' } }
        ];
      }

      if (startDate || endDate) {
        filter.receivedAt = {};
        if (startDate) filter.receivedAt.$gte = new Date(startDate);
        if (endDate) filter.receivedAt.$lte = new Date(endDate);
      }

      // Execute query
      const [emails, total] = await Promise.all([
        EmailLog.find(filter)
          .sort({ receivedAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .select('-bodyHtml -bodyText -headers')
          .lean(), // Faster query, returns plain objects
        EmailLog.countDocuments(filter)
      ]);

      res.json({
        success: true,
        data: emails,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get emails error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch emails',
        error: error.message
      });
    }
  }

  /**
   * Get single email by ID
   * GET /api/v1/emails/:id
   */
  async getEmailById(req, res) {
    try {
      const { id } = req.params;
      const tenantId = req.user.tenantId;

      const email = await EmailLog.findOne({ _id: id, tenantId });

      if (!email) {
        return res.status(404).json({
          success: false,
          message: 'Email not found'
        });
      }

      // Populate related data if needed
      // TODO: Populate customer, booking, quote data

      res.json({
        success: true,
        data: email
      });
    } catch (error) {
      console.error('Get email error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch email',
        error: error.message
      });
    }
  }

  /**
   * Manually trigger categorization
   * POST /api/v1/emails/:id/categorize
   */
  async categorizeEmail(req, res) {
    try {
      const { id } = req.params;
      const tenantId = req.user.tenantId;

      const email = await EmailLog.findOne({ _id: id, tenantId });

      if (!email) {
        return res.status(404).json({
          success: false,
          message: 'Email not found'
        });
      }

      // Categorize
      const result = await openaiService.categorizeEmail(email, tenantId);

      // Update email
      email.category = result.category;
      email.categoryConfidence = result.confidence;
      email.sentiment = result.sentiment;
      email.openaiCost = (email.openaiCost || 0) + result.cost;
      email.tokensUsed = (email.tokensUsed || 0) + result.tokens;
      await email.save();

      res.json({
        success: true,
        data: {
          category: result.category,
          confidence: result.confidence,
          reasoning: result.reasoning,
          sentiment: result.sentiment
        }
      });
    } catch (error) {
      console.error('Categorize email error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to categorize email',
        error: error.message
      });
    }
  }

  /**
   * Extract data from email
   * POST /api/v1/emails/:id/extract
   */
  async extractData(req, res) {
    try {
      const { id } = req.params;
      const { type } = req.body; // 'customer' or 'supplier'
      const tenantId = req.user.tenantId;

      const email = await EmailLog.findOne({ _id: id, tenantId });

      if (!email) {
        return res.status(404).json({
          success: false,
          message: 'Email not found'
        });
      }

      let extractedData;
      
      if (type === 'customer' || email.category === 'CUSTOMER') {
        extractedData = await openaiService.extractCustomerInquiry(email, tenantId);
      } else if (type === 'supplier' || email.category === 'SUPPLIER') {
        extractedData = await openaiService.extractSupplierPackage(email, tenantId);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid extraction type'
        });
      }

      // Update email
      email.extractedData = extractedData;
      email.openaiCost = (email.openaiCost || 0) + 0.02;
      await email.save();

      res.json({
        success: true,
        data: extractedData
      });
    } catch (error) {
      console.error('Extract data error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to extract data',
        error: error.message
      });
    }
  }

  /**
   * Find matching packages
   * POST /api/v1/emails/:id/match
   */
  async matchPackages(req, res) {
    try {
      const { id } = req.params;
      const tenantId = req.user.tenantId;

      const email = await EmailLog.findOne({ _id: id, tenantId });

      if (!email) {
        return res.status(404).json({
          success: false,
          message: 'Email not found'
        });
      }

      if (!email.extractedData) {
        return res.status(400).json({
          success: false,
          message: 'Email data not extracted yet'
        });
      }

      // Match packages
      const matches = await matchingEngine.matchPackages(email.extractedData, tenantId);

      // Update email
      email.matchingResults = matches.map(m => ({
        packageId: m.package._id,
        score: m.score,
        matchReasons: m.matchReasons,
        gaps: m.gaps
      }));
      await email.save();

      res.json({
        success: true,
        data: matches
      });
    } catch (error) {
      console.error('Match packages error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to match packages',
        error: error.message
      });
    }
  }

  /**
   * Generate response
   * POST /api/v1/emails/:id/respond
   */
  async generateResponse(req, res) {
    try {
      const { id } = req.params;
      const { templateType, context } = req.body;
      const tenantId = req.user.tenantId;

      const email = await EmailLog.findOne({ _id: id, tenantId });

      if (!email) {
        return res.status(404).json({
          success: false,
          message: 'Email not found'
        });
      }

      // Generate response
      const response = await openaiService.generateResponse(
        email,
        context || { extractedData: email.extractedData },
        templateType,
        tenantId
      );

      // Update email
      email.responseGenerated = true;
      email.generatedResponse = response;
      email.openaiCost = (email.openaiCost || 0) + 0.03;
      await email.save();

      res.json({
        success: true,
        data: response
      });
    } catch (error) {
      console.error('Generate response error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate response',
        error: error.message
      });
    }
  }

  /**
   * Delete email
   * DELETE /api/v1/emails/:id
   */
  async deleteEmail(req, res) {
    try {
      const { id } = req.params;
      const tenantId = req.user.tenantId;

      const email = await EmailLog.findOneAndDelete({ _id: id, tenantId });

      if (!email) {
        return res.status(404).json({
          success: false,
          message: 'Email not found'
        });
      }

      res.json({
        success: true,
        message: 'Email deleted successfully'
      });
    } catch (error) {
      console.error('Delete email error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete email',
        error: error.message
      });
    }
  }

  /**
   * Get email statistics
   * GET /api/v1/emails/stats
   */
  async getStats(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const { startDate, endDate } = req.query;

      const dateFilter = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) dateFilter.$lte = new Date(endDate);

      const filter = { tenantId };
      if (Object.keys(dateFilter).length > 0) {
        filter.receivedAt = dateFilter;
      }

      // Get counts by category
      const categoryStats = await EmailLog.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            avgConfidence: { $avg: '$categoryConfidence' }
          }
        }
      ]);

      // Get counts by status
      const statusStats = await EmailLog.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$processingStatus',
            count: { $sum: 1 }
          }
        }
      ]);

      // Get total costs
      const costStats = await EmailLog.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalCost: { $sum: '$openaiCost' },
            totalTokens: { $sum: '$tokensUsed' },
            avgCostPerEmail: { $avg: '$openaiCost' }
          }
        }
      ]);

      // Get queue stats
      const queueStats = await emailProcessingQueue.getStats();

      // Get review queue count
      const reviewQueueCount = await EmailLog.countDocuments({
        tenantId,
        requiresReview: true,
        reviewedAt: null
      });

      res.json({
        success: true,
        data: {
          categories: categoryStats,
          statuses: statusStats,
          costs: costStats[0] || { totalCost: 0, totalTokens: 0, avgCostPerEmail: 0 },
          queue: queueStats,
          reviewQueue: reviewQueueCount
        }
      });
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch statistics',
        error: error.message
      });
    }
  }

  /**
   * Convert email to quote (NEW - Complete workflow)
   * POST /api/v1/emails/:id/convert-to-quote
   */
  async convertEmailToQuote(req, res) {
    try {
      const { id } = req.params;
      const tenantId = req.user.tenantId;

      // Run the complete workflow
      const result = await emailToQuoteService.processEmailToQuote(id, tenantId);

      res.json({
        success: true,
        message: 'Email successfully converted to quote',
        data: {
          email: result.email,
          extractedData: result.extractedData,
          validation: result.validation,
          quote: result.quote,
          itinerarySearch: result.itinerarySearch
        }
      });
    } catch (error) {
      console.error('Convert email to quote error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to convert email to quote',
        error: error.message
      });
    }
  }

  /**
   * Get email processing stats
   * GET /api/v1/emails/stats
   */
  async getEmailStats(req, res) {
    try {
      const tenantId = req.user.tenantId;

      const [statusCounts, sourceCounts, categoryCounts, total] = await Promise.all([
        // Count by status
        EmailLog.aggregate([
          { $match: { tenantId } },
          {
            $group: {
              _id: '$processingStatus',
              count: { $sum: 1 }
            }
          }
        ]),
        // Count by source
        EmailLog.aggregate([
          { $match: { tenantId } },
          {
            $group: {
              _id: '$source',
              count: { $sum: 1 }
            }
          }
        ]),
        // Count by category
        EmailLog.aggregate([
          { $match: { tenantId } },
          {
            $group: {
              _id: '$category',
              count: { $sum: 1 }
            }
          }
        ]),
        // Total count
        EmailLog.countDocuments({ tenantId })
      ]);

      // Format results
      const stats = {
        total,
        byStatus: {
          pending: 0,
          processing: 0,
          completed: 0,
          failed: 0,
          converted_to_quote: 0,
          duplicate_detected: 0
        },
        bySource: {
          imap: 0,
          webhook: 0,
          manual: 0,
          api: 0
        },
        byCategory: {
          CUSTOMER: 0,
          SUPPLIER: 0,
          AGENT: 0,
          FINANCE: 0,
          OTHER: 0,
          SPAM: 0
        }
      };

      statusCounts.forEach(item => {
        if (item._id && stats.byStatus.hasOwnProperty(item._id)) {
          stats.byStatus[item._id] = item.count;
        }
      });

      sourceCounts.forEach(item => {
        if (item._id && stats.bySource.hasOwnProperty(item._id)) {
          stats.bySource[item._id] = item.count;
        }
      });

      categoryCounts.forEach(item => {
        if (item._id && stats.byCategory.hasOwnProperty(item._id)) {
          stats.byCategory[item._id] = item.count;
        }
      });

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get email stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch email stats',
        error: error.message
      });
    }
  }

  /**
   * Retry failed email processing
   * POST /api/v1/emails/:id/retry
   */
  async retryProcessing(req, res) {
    try {
      const { id } = req.params;
      const tenantId = req.user.tenantId;

      const email = await EmailLog.findOne({ _id: id, tenantId });

      if (!email) {
        return res.status(404).json({
          success: false,
          message: 'Email not found'
        });
      }

      // Reset status
      email.processingStatus = 'pending';
      email.processingError = null;
      await email.save();

      // Re-add to queue
      await emailProcessingQueue.addToQueue(email._id.toString(), tenantId.toString(), 'high');

      res.json({
        success: true,
        message: 'Email re-queued for processing',
        emailId: email._id
      });
    } catch (error) {
      console.error('Retry processing error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retry processing',
        error: error.message
      });
    }
  }

  /**
   * Send manual reply to an email
   * POST /api/v1/emails/:id/reply
   */
  async replyToEmail(req, res) {
    try {
      const { id } = req.params;
      const { subject, body, plainText } = req.body;
      const userId = req.user?.id;
      const tenantId = req.user?.tenantId;

      // Validate input
      if (!subject || !body) {
        return res.status(400).json({
          success: false,
          message: 'Subject and body are required'
        });
      }

      // Get original email
      const email = await EmailLog.findOne({ _id: id, tenantId });
      if (!email) {
        return res.status(404).json({
          success: false,
          message: 'Email not found'
        });
      }

      // Get tenant's email account for SMTP settings
      const EmailAccount = require('../models/EmailAccount');
      const emailAccount = await EmailAccount.findOne({ 
        tenantId,
        isActive: true,
        'smtp.enabled': true
      }).select('+smtp.password'); // Include encrypted password

      if (!emailAccount) {
        return res.status(400).json({
          success: false,
          message: 'No active SMTP email account configured for your tenant'
        });
      }

      // Decrypt password using Mongoose getter
      const accountObj = emailAccount.toObject({ getters: true });

      // Create nodemailer transporter with tenant's SMTP settings
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: accountObj.smtp.host,
        port: accountObj.smtp.port,
        secure: accountObj.smtp.secure, // true for SSL, false for STARTTLS
        auth: {
          user: accountObj.smtp.username,
          pass: accountObj.smtp.password // Decrypted by getter
        },
        tls: {
          rejectUnauthorized: false // Allow self-signed certs
        }
      });

      // Send reply email using tenant's SMTP
      console.log('📤 Sending reply via tenant SMTP:', {
        host: accountObj.smtp.host,
        port: accountObj.smtp.port,
        secure: accountObj.smtp.secure,
        from: accountObj.smtp.username,
        to: email.from.email
      });

      const sendResult = await transporter.sendMail({
        from: accountObj.smtp.fromName 
          ? `"${accountObj.smtp.fromName}" <${accountObj.smtp.username}>`
          : accountObj.smtp.username,
        to: email.from.email,
        subject: subject,
        html: body,
        text: plainText || body.replace(/<[^>]*>/g, ''), // Strip HTML if no plain text
        inReplyTo: email.messageId,
        references: email.references ? [...email.references, email.messageId] : [email.messageId],
        replyTo: accountObj.smtp.replyTo || accountObj.smtp.username
      });

      console.log('✅ Reply sent successfully via tenant SMTP. MessageId:', sendResult.messageId);

      // Mark email as manually replied
      email.manuallyReplied = true;
      email.responseType = 'manual';
      email.responseSentAt = new Date();
      email.repliedBy = userId;
      email.responseMessageId = sendResult.messageId; // Store SMTP message ID
      email.processingStatus = 'completed';
      
      // Store the manual reply in generatedResponse for history
      if (!email.generatedResponse) {
        email.generatedResponse = {};
      }
      email.generatedResponse.manualReply = {
        subject,
        body,
        plainText,
        sentAt: new Date(),
        sentBy: userId
      };

      await email.save();

      res.json({
        success: true,
        message: 'Reply sent successfully',
        data: {
          emailId: email._id,
          responseSentAt: email.responseSentAt,
          responseId: sendResult.messageId
        }
      });
    } catch (error) {
      console.error('Reply email error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send reply',
        error: error.message
      });
    }
  }
}

module.exports = new EmailController();
