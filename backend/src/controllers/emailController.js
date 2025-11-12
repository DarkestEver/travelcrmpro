const EmailLog = require('../models/EmailLog');
const emailProcessingQueue = require('../services/emailProcessingQueue');
const EmailThreadingService = require('../services/emailThreadingService');
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

      // Get email account for tenant (or use first available)
      const EmailAccount = require('../models/EmailAccount');
      let emailAccount = await EmailAccount.findOne({ 
        tenantId: emailData.tenantId
      });

      if (!emailAccount) {
        // If no email account exists, create a minimal webhook entry
        // or just use a placeholder ObjectId for testing
        const mongoose = require('mongoose');
        emailData.emailAccountId = req.body.emailAccountId || new mongoose.Types.ObjectId();
        console.log(`⚠️  No email account found for tenant. Using placeholder: ${emailData.emailAccountId}`);
      } else {
        emailData.emailAccountId = emailAccount._id;
      }

      // 🆕 CHECK FOR DUPLICATE EMAIL (same as IMAP)
      const existingEmail = await EmailLog.findOne({
        messageId: emailData.messageId
      });

      if (existingEmail) {
        console.log(`ℹ️  Email already processed: ${emailData.messageId}`);
        return res.status(200).json({
          success: true,
          message: 'Email already processed',
          emailId: existingEmail._id,
          duplicate: true
        });
      }

      // Save to database
      const email = await EmailLog.create(emailData);

      // Process email threading (detect replies/forwards)
      try {
        await EmailThreadingService.processEmailThreading(email, email.tenantId.toString());
        console.log(`🔗 Threading processed for email: ${email._id}`);
      } catch (threadError) {
        console.error(`⚠️  Threading error for ${email._id}:`, threadError.message);
        // Don't fail the whole process if threading fails
      }

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

      console.log('\n🔍 DEBUG: Matches returned from engine:', matches.length);
      console.log('🔍 DEBUG: First match structure:', JSON.stringify(matches[0], null, 2));

      // Update email with full itinerary details
      email.matchingResults = matches.map(m => {
        console.log('\n📦 Processing match:', m.package._id);
        console.log('   Title:', m.package.title);
        console.log('   Destination:', m.package.destination);
        console.log('   Duration:', m.package.duration);
        console.log('   EstimatedCost:', m.package.estimatedCost);
        
        const result = {
          packageId: m.package._id,
          itineraryTitle: m.package.title,
          destination: m.package.destination?.city || m.package.destination?.country || m.package.destination,
          duration: m.package.duration?.days || m.package.duration,
          price: m.package.estimatedCost?.baseCost || m.package.estimatedCost?.totalCost || m.package.estimatedCost,
          currency: m.package.estimatedCost?.currency || 'USD',
          travelStyle: m.package.travelStyle,
          themes: m.package.themes,
          overview: m.package.overview,
          score: m.score,
          matchReasons: m.matchReasons,
          gaps: m.gaps
        };
        
        console.log('💾 Will save:', JSON.stringify(result, null, 2));
        return result;
      });
      
      console.log('\n💾 Saving email with', email.matchingResults.length, 'matches...');
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
      const { subject, body, plainText, cc, bcc } = req.body;
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

      // 🆕 Generate tracking ID for this email
      const EmailTrackingService = require('../services/emailTrackingService');
      const trackingId = await EmailTrackingService.generateTrackingId(tenantId, email.from.email);
      
      // Inject tracking ID into email body
      let emailBodyWithTracking = body;
      let plainTextWithTracking = plainText || body.replace(/<[^>]*>/g, '');
      
      if (trackingId) {
        emailBodyWithTracking = EmailTrackingService.injectTrackingId(body, trackingId);
        plainTextWithTracking = EmailTrackingService.injectTrackingIdPlainText(
          plainText || body.replace(/<[^>]*>/g, ''),
          trackingId
        );
        console.log(`📋 Generated tracking ID: ${trackingId}`);
      }

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

      // Prepare CC and BCC arrays
      const ccEmails = Array.isArray(cc) ? cc : (cc ? [cc] : []);
      const bccEmails = Array.isArray(bcc) ? bcc : (bcc ? [bcc] : []);

      // Send reply email using tenant's SMTP
      console.log('📤 Sending reply via tenant SMTP:', {
        host: accountObj.smtp.host,
        port: accountObj.smtp.port,
        secure: accountObj.smtp.secure,
        from: accountObj.smtp.username,
        to: email.from.email,
        cc: ccEmails,
        bcc: bccEmails
      });

      const mailOptions = {
        from: accountObj.smtp.fromName 
          ? `"${accountObj.smtp.fromName}" <${accountObj.smtp.username}>`
          : accountObj.smtp.username,
        to: email.from.email,
        subject: subject,
        html: emailBodyWithTracking,
        text: plainTextWithTracking,
        inReplyTo: email.messageId,
        references: email.references ? [...email.references, email.messageId] : [email.messageId],
        replyTo: accountObj.smtp.replyTo || accountObj.smtp.username
      };

      // Add CC if provided
      if (ccEmails.length > 0) {
        mailOptions.cc = ccEmails.join(', ');
      }

      // Add BCC if provided
      if (bccEmails.length > 0) {
        mailOptions.bcc = bccEmails.join(', ');
      }

      const sendResult = await transporter.sendMail(mailOptions);

      // Ensure we have a Message-ID (generate one if SMTP didn't return it)
      const sentMessageId = sendResult.messageId || `<${Date.now()}.${Math.random().toString(36).substr(2, 9)}@${accountObj.smtp.host}>`;
      
      console.log('✅ Reply sent successfully via tenant SMTP. MessageId:', sentMessageId);

      // Mark original email as manually replied
      email.manuallyReplied = true;
      email.responseType = 'manual';
      email.responseSentAt = new Date();
      email.repliedBy = userId;
      email.responseMessageId = sentMessageId; // Store SMTP message ID
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

      // 🆕 SAVE THE SENT REPLY AS A NEW EMAIL LOG ENTRY
      try {
        // Prepare CC and BCC for saving
        const ccForLog = ccEmails.map(email => ({ email, name: email }));
        const bccForLog = bccEmails.map(email => ({ email, name: email }));
        
        const sentReplyEmail = await EmailLog.create({
          messageId: sentMessageId,
          trackingId: trackingId, // 🆕 Store tracking ID
          emailAccountId: emailAccount._id,
          tenantId: tenantId,
          from: {
            email: accountObj.smtp.username,
            name: accountObj.smtp.fromName || 'Support Team'
          },
          to: [{
            email: email.from.email,
            name: email.from.name || email.from.email
          }],
          cc: ccForLog,
          bcc: bccForLog,
          subject: subject,
          bodyHtml: emailBodyWithTracking, // Use tracking-injected body
          bodyText: plainTextWithTracking, // Use tracking-injected text
          snippet: plainTextWithTracking.substring(0, 200),
          receivedAt: new Date(),
          processingStatus: 'completed',
          source: 'manual', // Mark as manual reply
          sentBy: userId,
          inReplyTo: email.messageId,
          references: email.references ? [...email.references, email.messageId] : [email.messageId],
          
          // Threading metadata - link to parent
          threadMetadata: {
            isReply: true,
            isForward: false,
            parentEmailId: email._id,
            threadId: email.threadMetadata?.threadId || email._id,
            messageId: sentMessageId,
            inReplyTo: email.messageId,
            references: email.references ? [...email.references, email.messageId] : [email.messageId]
          },
          
          conversationParticipants: [
            accountObj.smtp.username,
            email.from.email,
            ...ccEmails,
            ...bccEmails
          ]
        });

        // Process threading (this will handle any additional threading logic)
        await EmailThreadingService.processEmailThreading(sentReplyEmail, tenantId.toString());

        // Add this sent reply to parent's replies array
        if (!email.replies) {
          email.replies = [];
        }
        email.replies.push({
          emailId: sentReplyEmail._id,
          from: {
            email: accountObj.smtp.username,
            name: accountObj.smtp.fromName || 'Support Team'
          },
          subject: subject,
          receivedAt: new Date(),
          snippet: (plainText || body.replace(/<[^>]*>/g, '')).substring(0, 150)
        });
        
        await email.save();

        console.log(`🔗 Saved sent reply as EmailLog: ${sentReplyEmail._id}, linked to parent: ${email._id}`);
      } catch (saveError) {
        console.error('⚠️  Failed to save sent reply to EmailLog:', saveError.message);
        console.error('   Email was sent successfully but not logged in database');
        // Don't fail the request - email was sent successfully
      }

      res.json({
        success: true,
        message: 'Reply sent successfully',
        data: {
          emailId: email._id,
          responseSentAt: email.responseSentAt,
          responseId: sentMessageId
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

  /**
   * Forward email to another recipient
   * POST /api/v1/emails/:id/forward
   */
  async forwardEmail(req, res) {
    try {
      const { id } = req.params;
      const { to, subject, body, plainText, includeOriginal = true } = req.body;
      const userId = req.user?.id;
      const tenantId = req.user?.tenantId;

      // Validate input
      if (!to || !subject) {
        return res.status(400).json({
          success: false,
          message: 'Recipient (to) and subject are required'
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
      }).select('+smtp.password');

      if (!emailAccount) {
        return res.status(400).json({
          success: false,
          message: 'No active SMTP email account configured for your tenant'
        });
      }

      // Decrypt password
      const accountObj = emailAccount.toObject({ getters: true });

      // Build forward body
      let forwardBody = body || '';
      if (includeOriginal) {
        forwardBody += `
          <br><br>
          <div style="border-left: 3px solid #ccc; padding-left: 15px; margin-left: 10px;">
            <p><strong>-------- Forwarded Message --------</strong></p>
            <p><strong>From:</strong> ${email.from.name || email.from.email}</p>
            <p><strong>Date:</strong> ${email.receivedAt?.toLocaleString()}</p>
            <p><strong>Subject:</strong> ${email.subject}</p>
            <br>
            ${email.bodyHtml || email.bodyText || 'No content'}
          </div>
        `;
      }

      // Generate and inject tracking ID
      const EmailTrackingService = require('../services/emailTrackingService');
      const recipientEmail = Array.isArray(to) ? to[0] : to;
      const trackingId = await EmailTrackingService.generateTrackingId(tenantId, recipientEmail);
      
      let emailBodyWithTracking = forwardBody;
      let plainTextWithTracking = plainText || forwardBody.replace(/<[^>]*>/g, '');
      
      if (trackingId) {
        emailBodyWithTracking = EmailTrackingService.injectTrackingId(forwardBody, trackingId);
        plainTextWithTracking = EmailTrackingService.injectTrackingIdPlainText(
          plainText || forwardBody.replace(/<[^>]*>/g, ''),
          trackingId
        );
        console.log(`📋 Generated tracking ID for forward: ${trackingId}`);
      }

      // Create nodemailer transporter
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
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

      // Send forward email
      console.log('📤 Forwarding email to:', to);

      const sendResult = await transporter.sendMail({
        from: accountObj.smtp.fromName 
          ? `"${accountObj.smtp.fromName}" <${accountObj.smtp.username}>`
          : accountObj.smtp.username,
        to: to,
        subject: subject,
        html: emailBodyWithTracking,
        text: plainTextWithTracking,
        replyTo: accountObj.smtp.replyTo || accountObj.smtp.username
      });

      console.log('✅ Email forwarded successfully. MessageId:', sendResult.messageId);

      // Save the forwarded email as a new EmailLog entry
      try {
        const forwardedEmail = await EmailLog.create({
          messageId: sendResult.messageId,
          emailAccountId: emailAccount._id,
          tenantId: tenantId,
          from: {
            email: accountObj.smtp.username,
            name: accountObj.smtp.fromName || 'Support Team'
          },
          to: Array.isArray(to) ? to.map(t => ({ email: t, name: t })) : [{ email: to, name: to }],
          cc: [],
          bcc: [],
          subject: subject,
          bodyHtml: emailBodyWithTracking,
          bodyText: plainTextWithTracking,
          snippet: plainTextWithTracking.substring(0, 200),
          trackingId: trackingId,
          receivedAt: new Date(),
          processingStatus: 'completed',
          source: 'outbound',
          sentBy: userId,
          
          // Threading metadata - mark as forward
          threadMetadata: {
            isReply: false,
            isForward: true,
            parentEmailId: email._id,
            threadId: email.threadMetadata?.threadId || email._id,
            messageId: sendResult.messageId
          },
          
          conversationParticipants: [
            accountObj.smtp.username,
            ...(Array.isArray(to) ? to : [to])
          ]
        });

        // Add to original email's replies (even though it's a forward)
        if (!email.replies) {
          email.replies = [];
        }
        email.replies.push({
          emailId: forwardedEmail._id,
          from: {
            email: accountObj.smtp.username,
            name: accountObj.smtp.fromName || 'Support Team'
          },
          subject: subject,
          receivedAt: new Date(),
          snippet: 'Forwarded to: ' + (Array.isArray(to) ? to.join(', ') : to)
        });
        
        await email.save();

        console.log(`🔗 Saved forwarded email as EmailLog: ${forwardedEmail._id}, linked to original: ${email._id}`);

        // Process threading for the forwarded email
        try {
          const EmailThreadingService = require('../services/emailThreadingService');
          await EmailThreadingService.processEmailThreading(forwardedEmail, tenantId);
          console.log(`🧵 Processed threading for forwarded email: ${forwardedEmail._id}`);
        } catch (threadError) {
          console.error('⚠️  Threading failed for forwarded email:', threadError.message);
          // Don't fail the request, threading is not critical
        }

        res.json({
          success: true,
          message: 'Email forwarded successfully',
          data: {
            originalEmailId: email._id,
            forwardedEmailId: forwardedEmail._id,
            forwardedTo: to,
            trackingId: trackingId,
            messageId: sendResult.messageId
          }
        });
      } catch (saveError) {
        console.error('⚠️  Failed to save forwarded email to EmailLog:', saveError.message);
        // Still return success since email was sent
        res.json({
          success: true,
          message: 'Email forwarded successfully (but not saved to conversation)',
          data: {
            originalEmailId: email._id,
            forwardedTo: to,
            messageId: sendResult.messageId
          }
        });
      }
    } catch (error) {
      console.error('Forward email error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to forward email',
        error: error.message
      });
    }
  }

  /**
   * Update extracted data from email
   */
  async updateExtractedData(req, res) {
    try {
      const { id } = req.params;
      const { extractedData } = req.body;
      const userId = req.user._id;
      const tenantId = req.user.tenantId;

      const email = await EmailLog.findOne({ _id: id, tenantId });
      if (!email) {
        return res.status(404).json({
          success: false,
          message: 'Email not found'
        });
      }

      // Update extracted data
      email.extractedData = {
        ...email.extractedData,
        ...extractedData,
        manuallyEdited: true,
        editedBy: userId,
        editedAt: new Date()
      };

      await email.save();

      res.json({
        success: true,
        message: 'Extracted data updated successfully',
        data: email
      });
    } catch (error) {
      console.error('Update extracted data error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update extracted data',
        error: error.message
      });
    }
  }

  /**
   * Get full email thread (conversation)
   * GET /api/v1/emails/:id/thread
   */
  async getEmailThread(req, res) {
    try {
      const { id } = req.params;

      const thread = await EmailThreadingService.getConversationThread(id);

      if (!thread || thread.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Email or thread not found'
        });
      }

      res.json({
        success: true,
        data: {
          threadCount: thread.length,
          emails: thread
        }
      });
    } catch (error) {
      console.error('Get email thread error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get email thread',
        error: error.message
      });
    }
  }

  /**
   * Rebuild thread for specific email
   * POST /api/v1/emails/:id/rebuild-thread
   */
  async rebuildEmailThread(req, res) {
    try {
      const { id } = req.params;

      const email = await EmailLog.findById(id);
      if (!email) {
        return res.status(404).json({
          success: false,
          message: 'Email not found'
        });
      }

      // Process threading for this email
      const result = await EmailThreadingService.processEmailThreading(
        email, 
        email.tenantId.toString()
      );

      res.json({
        success: true,
        message: 'Thread rebuilt successfully',
        data: result
      });
    } catch (error) {
      console.error('Rebuild email thread error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to rebuild thread',
        error: error.message
      });
    }
  }
}

module.exports = new EmailController();

