const Queue = require('bull');
const InMemoryQueue = require('./InMemoryQueue');
const EmailLog = require('../models/EmailLog');
const openaiService = require('./openaiService');
const matchingEngine = require('./matchingEngine');
const itineraryMatchingService = require('./itineraryMatchingService');
const emailService = require('./emailService');
const emailTemplateService = require('./emailTemplateService');
const nodemailer = require('nodemailer');
const SupplierPackageCache = require('../models/SupplierPackageCache');
const ManualReviewQueue = require('../models/ManualReviewQueue');

class EmailProcessingQueue {
  constructor() {
    const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV !== 'production';
    const useRedis = process.env.USE_REDIS === 'true';
    
    // Always use InMemoryQueue when Redis is not explicitly enabled
    if (!useRedis || isDevelopment) {
      console.log('📝 Using in-memory queue (Redis disabled or development mode)');
      this.queue = new InMemoryQueue('email-processing');
      
      // Configure in-memory queue
      this.queue.process(3, this.processEmail.bind(this));
      
      // Event listeners
      this.queue.on('completed', (job, result) => {
        console.log(`✅ Email ${job.data.emailId} processed successfully`);
      });

      this.queue.on('failed', (job, err) => {
        console.error(`❌ Email ${job.data.emailId} processing failed:`, err.message);
      });

      this.queueType = 'memory';
      return;
    }
    
    // Try to initialize Bull queue with Redis (only if explicitly enabled)
    try {
      this.queue = new Queue('email-processing', {
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379,
          password: process.env.REDIS_PASSWORD || undefined
        }
      });

      // Configure queue settings
      this.queue.process(3, this.processEmail.bind(this));
      
      // Event listeners
      this.queue.on('completed', (job, result) => {
        console.log(`✅ Email ${job.data.emailId} processed successfully`);
      });

      this.queue.on('failed', (job, err) => {
        console.error(`❌ Email ${job.data.emailId} processing failed:`, err.message);
      });
      
      // Listen for connection errors
      this.queue.on('error', (error) => {
        console.error('❌ Redis queue error:', error.message);
        console.warn('⚠️  Falling back to synchronous processing');
        this.queueType = 'sync';
      });

      this.queueType = 'redis';
      console.log('✅ Email queue initialized with Redis');
    } catch (error) {
      console.warn('⚠️  Redis not available, using synchronous processing');
      console.warn('   For better performance: Install Redis and set USE_REDIS=true');
      this.queueType = 'sync';
    }
  }

  /**
   * Add email to processing queue
   */
  async addToQueue(emailId, tenantId, priority = 'normal') {
    const priorityMap = {
      urgent: 1,
      high: 2,
      normal: 3,
      low: 4
    };

    if (this.queueType === 'redis' || this.queueType === 'memory') {
      // Use queue (Redis or in-memory)
      await this.queue.add(
        { emailId, tenantId },
        {
          priority: priorityMap[priority] || 3,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000
          },
          removeOnComplete: false,
          removeOnFail: false
        }
      );

      console.log(`📧 Email ${emailId} added to ${this.queueType} queue (priority: ${priority})`);
    } else {
      // Process synchronously (fallback)
      console.log(`📧 Processing email ${emailId} synchronously`);
      try {
        await this.processEmail({ data: { emailId, tenantId } });
      } catch (error) {
        console.error(`❌ Failed to process email ${emailId}:`, error.message);
        throw error;
      }
    }
  }

  /**
   * Main email processing workflow
   */
  async processEmail(job) {
    const { emailId, tenantId } = job.data;
    
    try {
      // Get email from database
      const email = await EmailLog.findOne({ _id: emailId, tenantId });
      if (!email) {
        throw new Error(`Email ${emailId} not found`);
      }

      console.log(`Processing email ${emailId} from ${email.from.email}`);

      // Update progress
      job.progress(10);

      // STEP 1 (OPTIMIZED): Categorize AND Extract in ONE API call (saves 50% cost!)
      console.log('Step 1: Categorizing + Extracting data (combined for cost optimization)...');
      const result = await openaiService.categorizeAndExtract(email, tenantId);
      
      // Apply categorization results
      email.category = result.category;
      email.categoryConfidence = result.confidence;
      email.sentiment = result.sentiment;
      email.tags = [result.subcategory];
      email.openaiCost = (email.openaiCost || 0) + result.cost;
      email.tokensUsed = (email.tokensUsed || 0) + result.tokens.total_tokens;
      
      // Apply extraction results (if customer email)
      if (result.category === 'CUSTOMER' && result.extractedData) {
        email.extractedData = result.extractedData;
      }
      
      await email.save();
      job.progress(50); // Jump to 50% since we combined two steps

      // Check if confidence is too low
      if (result.confidence < 70) {
        await this.sendToReview(email, 'LOW_CONFIDENCE', {
          category: result.category,
          confidence: result.confidence,
          reasoning: result.reasoning
        });
        return { status: 'review', reason: 'Low confidence categorization' };
      }

      // STEP 2 (OPTIMIZED): Only extract from signature images if attachments exist
      let extractedData = result.extractedData;
      
      if (result.category === 'CUSTOMER' && email.attachments && email.attachments.length > 0) {
        console.log('Step 2: Extracting contact from signature images...');
        try {
          const visionResult = await openaiService.extractContactFromSignatureImages(email, tenantId);
          
          if (visionResult.success && visionResult.extractedContacts.length > 0) {
            // Merge extracted contact info with existing customerInfo
            const signatureContact = visionResult.extractedContacts[0]; // Use first/best match
            
            if (!email.extractedData.customerInfo) {
              email.extractedData.customerInfo = {};
            }
            
            // Merge data, preferring non-null values from signature
            const merged = { ...email.extractedData.customerInfo };
            
            if (signatureContact.name && !merged.name) merged.name = signatureContact.name;
            if (signatureContact.email && !merged.email) merged.email = signatureContact.email;
            if (signatureContact.phone && !merged.phone) merged.phone = signatureContact.phone;
            if (signatureContact.mobile && !merged.mobile) merged.mobile = signatureContact.mobile;
            if (signatureContact.workPhone && !merged.workPhone) merged.workPhone = signatureContact.workPhone;
            if (signatureContact.company && !merged.company) merged.company = signatureContact.company;
            if (signatureContact.jobTitle && !merged.jobTitle) merged.jobTitle = signatureContact.jobTitle;
            if (signatureContact.website && !merged.website) merged.website = signatureContact.website;
            
            if (signatureContact.address) {
              merged.address = { ...merged.address, ...signatureContact.address };
            }
            
            if (signatureContact.socialMedia) {
              merged.socialMedia = { ...merged.socialMedia, ...signatureContact.socialMedia };
            }
            
            email.extractedData.customerInfo = merged;
            email.extractedData.signatureImageProcessed = true;
            email.extractedData.signatureImageData = visionResult.extractedContacts;
            
            email.openaiCost += visionResult.cost;
            email.tokensUsed = (email.tokensUsed || 0) + visionResult.tokens.total;
            
            console.log(`✅ Extracted contact from ${visionResult.processedImages} signature image(s)`);
          }
        } catch (visionError) {
          console.error('Error extracting from signature images:', visionError.message);
          // Continue processing even if vision extraction fails
        }
        
        await email.save();
      }

      // Continue processing CUSTOMER emails
      if (result.category === 'CUSTOMER') {
        // Check for missing critical information
        if (extractedData.missingInfo?.length > 3) {
          await this.sendToReview(email, 'AMBIGUOUS_REQUEST', {
            extractedData,
            missingInfo: extractedData.missingInfo
          });
          return { status: 'review', reason: 'Too much missing information' };
        }

        // STEP 3: Itinerary Matching (New Workflow)
        console.log('Step 3: Matching with itineraries...');
        const itineraryMatching = await itineraryMatchingService.processItineraryMatching(
          extractedData,
          tenantId
        );
        
        email.itineraryMatching = {
          validation: itineraryMatching.validation,
          workflowAction: itineraryMatching.workflow.action,
          reason: itineraryMatching.workflow.reason,
          matchCount: itineraryMatching.matches?.length || 0,
          topMatches: itineraryMatching.matches?.slice(0, 3).map(m => ({
            itineraryId: m.itinerary._id,
            title: m.itinerary.title,
            score: m.score,
            gaps: m.gaps
          }))
        };
        await email.save();
        job.progress(60);

        // STEP 4: Match with packages (legacy/fallback)
        console.log('Step 4: Matching with packages...');
        const matches = await matchingEngine.matchPackages(extractedData, tenantId, email._id);
        
        email.matchingResults = matches.map(m => ({
          packageId: m.package._id,
          score: m.score,
          matchReasons: m.matchReasons,
          gaps: m.gaps
        }));
        await email.save();
        job.progress(70);

        // STEP 5: Generate response based on itinerary workflow
        console.log('Step 5: Generating response...');
        let response;
        const workflow = itineraryMatching.workflow;
        
        if (workflow.action === 'ASK_CUSTOMER') {
          // Missing required fields - use static template (no AI cost)
          console.log('📋 Using template for missing information request (cost savings)');
          response = await emailTemplateService.generateMissingInfoEmail({
            email,
            extractedData,
            missingFields: workflow.missingFields,
            tenantId
          });
        } else if (workflow.action === 'SEND_ITINERARIES') {
          // Good matches found (≥70%) - use template (no AI cost!)
          console.log('📋 Using template for itineraries (cost savings - Phase 3)');
          response = await emailTemplateService.generateItinerariesEmail({
            email,
            extractedData,
            itineraries: workflow.matches.slice(0, 3),
            tenantId
          });
        } else if (workflow.action === 'SEND_ITINERARIES_WITH_NOTE') {
          // Moderate matches (50-69%) - use template (no AI cost!)
          console.log('📋 Using template for moderate matches (cost savings - Phase 3)');
          response = await emailTemplateService.generateModerateMatchEmail({
            email,
            extractedData,
            itineraries: workflow.matches.slice(0, 3),
            note: workflow.reason,
            tenantId
          });
        } else if (workflow.action === 'FORWARD_TO_SUPPLIER') {
          // No good matches - custom quote needed - use template (no AI cost!)
          console.log('📋 Using template for custom request (cost savings - Phase 3)');
          response = await emailTemplateService.generateCustomRequestEmail({
            email,
            extractedData,
            note: workflow.reason,
            tenantId
          });
        } else {
          // Fallback to package matching if itinerary workflow fails
          if (matches.length > 0 && matches[0].score >= 60) {
            response = await openaiService.generateResponse(
              email, 
              { 
                matchedPackages: matches.slice(0, 3).map(m => m.package),
                extractedData 
              },
              'PACKAGE_FOUND',
              tenantId
            );
          } else {
            response = await openaiService.generateResponse(
              email,
              { extractedData },
              'PACKAGE_NOT_FOUND',
              tenantId
            );
          }
        }

        email.responseGenerated = true;
        email.generatedResponse = response;
        email.openaiCost += 0.03; // Approximate cost
        await email.save();
        job.progress(90);

        // STEP 6: Send the response email to customer automatically
        // Skip if email was already manually replied to from UI
        if (email.manuallyReplied) {
          console.log('⏭️  Skipping auto-reply - email was manually replied to from UI');
          email.processingStatus = 'completed';
          await email.save();
          return { status: 'completed', reason: 'Manually replied - skipped auto-send' };
        }

        console.log('Step 6: Sending response email to customer...');
        try {
          // Get tenant's email account for SMTP settings
          const EmailAccount = require('../models/EmailAccount');
          const emailAccount = await EmailAccount.findOne({ 
            tenantId,
            isActive: true,
            'smtp.enabled': true
          }).select('+smtp.password');

          if (!emailAccount) {
            console.error('❌ No active SMTP email account configured for tenant:', tenantId);
            email.processingError = 'No active SMTP account - cannot send auto-reply';
            email.processingStatus = 'failed';
            await email.save();
            return { status: 'failed', reason: 'No SMTP account configured' };
          }

          // Decrypt password using Mongoose getter
          const accountObj = emailAccount.toObject({ getters: true });

          // Create nodemailer transporter with tenant's SMTP settings
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

          console.log('📤 Sending auto-reply via tenant SMTP:', {
            host: accountObj.smtp.host,
            port: accountObj.smtp.port,
            from: accountObj.smtp.username,
            to: email.from.email
          });

          // Send auto-reply using tenant's SMTP
          const sendResult = await transporter.sendMail({
            from: accountObj.smtp.fromName 
              ? `"${accountObj.smtp.fromName}" <${accountObj.smtp.username}>`
              : accountObj.smtp.username,
            to: email.from.email,
            subject: response.subject,
            html: response.body,
            text: response.plainText,
            inReplyTo: email.messageId,
            references: email.references ? [...email.references, email.messageId] : [email.messageId],
            replyTo: accountObj.smtp.replyTo || accountObj.smtp.username
          });
          
          email.responseSentAt = new Date();
          email.responseMessageId = sendResult.messageId; // Store SMTP message ID
          email.responseType = 'auto'; // Mark as auto-sent
          await email.save();
          
          console.log(`✅ Auto-reply sent to ${email.from.email} via tenant SMTP. MessageId:`, sendResult.messageId);
        } catch (sendError) {
          console.error('❌ Failed to send auto-reply email:', sendError.message);
          // Don't fail the entire process if email sending fails
          // Just log it and continue
          email.processingError = `Response generated but failed to send: ${sendError.message}`;
          await email.save();
        }
        
        job.progress(95);

        // Check if high value customer (budget > $5000) - needs review
        if (extractedData.budget?.amount > 5000) {
          await this.sendToReview(email, 'HIGH_VALUE', {
            extractedData,
            matches: matches.slice(0, 3),
            suggestedResponse: response
          });
          return { status: 'review', reason: 'High value customer' };
        }

      } else if (result.category === 'SUPPLIER') {
        // Extract package information (if not already extracted)
        if (!result.extractedData) {
          extractedData = await openaiService.extractSupplierPackage(email, tenantId);
          email.extractedData = extractedData;
          email.openaiCost += 0.02;
        } else {
          extractedData = result.extractedData;
        }
        await email.save();
        job.progress(60);

        // Save packages to cache
        if (extractedData.packages && extractedData.packages.length > 0) {
          console.log('Saving packages to cache...');
          for (const pkg of extractedData.packages) {
            await SupplierPackageCache.create({
              ...pkg,
              sourceEmailId: email._id,
              supplierId: null, // TODO: Link to supplier if exists
              supplierEmail: email.from.email,
              extractedData: pkg,
              extractionConfidence: extractedData.confidence,
              status: 'pending_verification',
              tenantId
            });
          }
        }
        job.progress(90);

      } else if (result.category === 'SPAM') {
        // Mark as completed, no further action
        email.processingStatus = 'completed';
        await email.save();
        return { status: 'completed', action: 'ignored_spam' };
      }

      // Mark as completed
      email.processingStatus = 'completed';
      email.processedAt = new Date();
      await email.save();
      job.progress(100);

      return { 
        status: 'success', 
        category: result.category,
        matches: email.matchingResults?.length || 0,
        responseGenerated: email.responseGenerated
      };

    } catch (error) {
      console.error(`Error processing email ${emailId}:`, error);
      
      // Update email with error
      await EmailLog.findByIdAndUpdate(emailId, {
        processingStatus: 'failed',
        errorMessage: error.message
      });

      throw error; // Will trigger retry
    }
  }

  /**
   * Send email to manual review queue
   */
  async sendToReview(email, reason, aiSuggestion) {
    // Determine priority
    let priority = 'normal';
    if (reason === 'HIGH_VALUE') priority = 'high';
    if (reason === 'POLICY_VIOLATION') priority = 'urgent';

    // Determine customer value
    let customerValue = 'new';
    if (email.customerId) {
      // TODO: Check customer history
      customerValue = 'returning';
    }
    if (aiSuggestion?.extractedData?.budget?.amount > 5000) {
      customerValue = 'vip';
    }

    // Calculate SLA target (in minutes)
    const slaTargets = {
      urgent: 30,
      high: 120,
      normal: 480,
      low: 1440
    };

    await ManualReviewQueue.create({
      emailLogId: email._id,
      reason,
      priority,
      aiSuggestion,
      customerValue,
      slaTarget: slaTargets[priority],
      tenantId: email.tenantId
    });

    // Update email
    email.requiresReview = true;
    email.reviewReason = reason;
    await email.save();

    console.log(`Email ${email._id} sent to manual review: ${reason}`);
  }

  /**
   * Get queue statistics
   */
  async getStats() {
    if (this.queueType === 'sync') {
      return {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
        total: 0,
        mode: 'synchronous'
      };
    }

    try {
      const waiting = await this.queue.getWaitingCount();
      const active = await this.queue.getActiveCount();
      const completed = await this.queue.getCompletedCount();
      const failed = await this.queue.getFailedCount();
      const delayed = await this.queue.getDelayedCount();

      return {
        waiting,
        active,
        completed,
        failed,
        delayed,
        total: waiting + active + completed + failed + delayed,
        mode: this.queueType
      };
    } catch (error) {
      // Redis connection error - fallback to zero stats
      console.warn('⚠️  Queue stats unavailable (Redis connection error):', error.message);
      return {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
        total: 0,
        mode: this.queueType + ' (disconnected)',
        error: error.message
      };
    }
  }

  /**
   * Pause queue
   */
  async pause() {
    if (this.queueType !== 'sync') {
      await this.queue.pause();
      console.log(`⏸️  Email processing queue paused (${this.queueType} mode)`);
    }
  }

  /**
   * Resume queue
   */
  async resume() {
    if (this.queueType !== 'sync') {
      await this.queue.resume();
      console.log(`▶️  Email processing queue resumed (${this.queueType} mode)`);
    }
  }

  /**
   * Clean old jobs
   */
  async cleanOldJobs(grace = 7 * 24 * 60 * 60 * 1000) {
    if (this.queueType === 'sync') {
      return; // No cleanup needed in sync mode
    }
    // Clean completed and failed jobs older than grace period (default 7 days)
    await this.queue.clean(grace, 'completed');
    await this.queue.clean(grace, 'failed');
    console.log(`🧹 Old jobs cleaned from queue (${this.queueType} mode)`);
  }
}

module.exports = new EmailProcessingQueue();
