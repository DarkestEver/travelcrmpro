/**
 * Email Threading Service
 * Identifies replies, forwards, and creates conversation threads
 */

const { EmailLog } = require('../models');
const EmailTrackingService = require('./emailTrackingService');

class EmailThreadingService {
  /**
   * Extract email threading metadata from headers
   */
  static parseEmailHeaders(parsedEmail) {
    const headers = parsedEmail.headers || {};
    
    return {
      messageId: headers['message-id']?.[0] || parsedEmail.messageId,
      inReplyTo: headers['in-reply-to']?.[0] || null,
      references: headers['references']?.[0]?.split(/\s+/).filter(Boolean) || [],
      subject: parsedEmail.subject || '',
    };
  }

  /**
   * Detect if email is a reply based on multiple signals
   */
  static isReply(parsedEmail, metadata = null) {
    if (!metadata) {
      metadata = this.parseEmailHeaders(parsedEmail);
    }

    // Check 1: Has In-Reply-To header
    if (metadata.inReplyTo) {
      return true;
    }

    // Check 2: Has References header (email chain)
    if (metadata.references && metadata.references.length > 0) {
      return true;
    }

    // Check 3: Subject starts with Re: or RE:
    const subjectLower = metadata.subject.toLowerCase();
    if (subjectLower.startsWith('re:') || subjectLower.startsWith('re :')) {
      return true;
    }

    // Check 4: Subject contains reply indicators in other languages
    const replyIndicators = [
      're:', 'aw:', 'sv:', 'ref:', 'r:', 'रे:', // English, German, Swedish, French, Spanish, Hindi
      'res:', 'odp:', 'vá:', 'ynt:', 'ant:', // Portuguese, Polish, Czech, Turkish, Catalan
    ];
    
    if (replyIndicators.some(indicator => subjectLower.startsWith(indicator))) {
      return true;
    }

    return false;
  }

  /**
   * Detect if email is a forward
   */
  static isForward(parsedEmail, metadata = null) {
    if (!metadata) {
      metadata = this.parseEmailHeaders(parsedEmail);
    }

    const subjectLower = metadata.subject.toLowerCase();

    // Check subject for forward indicators
    const forwardIndicators = [
      'fwd:', 'fw:', 'forward:', 'forwarded:', 'enc:', 'encaminhar:', 
      'tr:', 'wg:', 'doorst:', 'vs:', 'i:', 'fs:', 'vl:', 'pd:', 'rv:'
    ];

    if (forwardIndicators.some(indicator => subjectLower.startsWith(indicator))) {
      return true;
    }

    // Check body for forward patterns
    const bodyText = parsedEmail.bodyText || parsedEmail.text || '';
    const forwardPatterns = [
      /^-+\s*forwarded message\s*-+/im,
      /^begin forwarded message:/im,
      /^---------- forwarded message ----------/im,
      /^-------- original message --------/im,
    ];

    if (forwardPatterns.some(pattern => pattern.test(bodyText))) {
      return true;
    }

    return false;
  }

  /**
   * Clean subject line (remove Re:, Fwd:, etc.)
   */
  static cleanSubject(subject) {
    if (!subject) return '';
    
    // Remove reply/forward prefixes
    let cleaned = subject;
    const prefixPattern = /^(re|aw|sv|ref|r|res|odp|vá|ynt|ant|fwd|fw|forward|enc|tr|wg|vs|fs|vl|pd|rv):\s*/i;
    
    // Keep removing prefixes until none left (handles Re: Re: Re:)
    while (prefixPattern.test(cleaned)) {
      cleaned = cleaned.replace(prefixPattern, '');
    }
    
    return cleaned.trim();
  }

  /**
   * Find parent email (original email this is replying to)
   */
  static async findParentEmail(parsedEmail, tenantId) {
    const metadata = this.parseEmailHeaders(parsedEmail);
    
    // Strategy 1: Find by In-Reply-To message ID
    if (metadata.inReplyTo) {
      const parent = await EmailLog.findOne({
        messageId: metadata.inReplyTo,
        tenantId
      });
      
      if (parent) {
        return parent;
      }
    }

    // Strategy 2: Find by References (check all referenced message IDs)
    if (metadata.references && metadata.references.length > 0) {
      // Try each reference, starting from most recent
      for (let i = metadata.references.length - 1; i >= 0; i--) {
        const parent = await EmailLog.findOne({
          messageId: metadata.references[i],
          tenantId
        });
        
        if (parent) {
          return parent;
        }
      }
    }

    // Strategy 3: Find by cleaned subject and participants (within last 30 days)
    const cleanedSubject = this.cleanSubject(metadata.subject);
    if (cleanedSubject) {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const parent = await EmailLog.findOne({
        tenantId,
        $and: [
          {
            $or: [
              { subject: cleanedSubject },
              { subject: new RegExp(`^(re:|fwd:|fw:)\\s*${this.escapeRegex(cleanedSubject)}`, 'i') }
            ]
          },
          {
            $or: [
              { 'from.email': parsedEmail.from.email },
              { 'to.email': parsedEmail.from.email }
            ]
          }
        ],
        receivedAt: { $gte: thirtyDaysAgo },
        _id: { $ne: parsedEmail._id } // Exclude self
      }).sort({ receivedAt: -1 });

      if (parent) {
        return parent;
      }
    }

    // Strategy 4: Find by conversation participants and time proximity
    // If same sender/recipient communicated recently
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const recentConversation = await EmailLog.findOne({
      tenantId,
      $or: [
        { 
          'from.email': parsedEmail.from.email,
          'to.email': { $in: parsedEmail.to?.map(t => t.email) || [] }
        },
        {
          'to.email': parsedEmail.from.email,
          'from.email': { $in: parsedEmail.to?.map(t => t.email) || [] }
        }
      ],
      receivedAt: { $gte: oneDayAgo },
      _id: { $ne: parsedEmail._id }
    }).sort({ receivedAt: -1 });

    if (recentConversation) {
      return recentConversation;
    }

    // Strategy 5: Find by tracking ID embedded in email body (FALLBACK)
    // This is the most reliable method when headers are missing/malformed
    console.log('   🔍 Trying tracking ID strategy...');
    const parentByTrackingId = await EmailTrackingService.findParentByTrackingId(parsedEmail, tenantId);
    
    if (parentByTrackingId) {
      console.log(`   ✅ Found parent by tracking ID: ${parentByTrackingId._id}`);
      return parentByTrackingId;
    }

    return null;
  }

  /**
   * Link reply to parent email
   */
  static async linkReplyToParent(replyEmail, parentEmail) {
    try {
      // Update reply with parent reference
      replyEmail.threadMetadata = {
        isReply: true,
        isForward: false,
        parentEmailId: parentEmail._id,
        threadId: parentEmail.threadMetadata?.threadId || parentEmail._id,
        messageId: replyEmail.messageId,
        inReplyTo: this.parseEmailHeaders(replyEmail).inReplyTo,
        references: this.parseEmailHeaders(replyEmail).references
      };

      // Add to parent's replies array
      if (!parentEmail.replies) {
        parentEmail.replies = [];
      }

      parentEmail.replies.push({
        emailId: replyEmail._id,
        from: replyEmail.from,
        subject: replyEmail.subject,
        receivedAt: replyEmail.receivedAt,
        snippet: replyEmail.bodyText?.substring(0, 150) || 'No content'
      });

      // Update conversation participant list (use Set to avoid duplicates, then convert to Array)
      if (!parentEmail.conversationParticipants) {
        parentEmail.conversationParticipants = [];
      }
      
      const participantsSet = new Set(parentEmail.conversationParticipants);
      participantsSet.add(replyEmail.from.email);
      replyEmail.to?.forEach(t => participantsSet.add(t.email));
      parentEmail.conversationParticipants = Array.from(participantsSet);

      // Save both emails
      await Promise.all([
        replyEmail.save(),
        parentEmail.save()
      ]);

      console.log(`✅ Linked reply ${replyEmail._id} to parent ${parentEmail._id}`);
      
      return {
        success: true,
        parentEmail,
        replyEmail,
        threadId: replyEmail.threadMetadata.threadId
      };
    } catch (error) {
      console.error('Failed to link reply to parent:', error);
      throw error;
    }
  }

  /**
   * Process incoming email and detect threading
   */
  static async processEmailThreading(parsedEmail, tenantId) {
    try {
      const metadata = this.parseEmailHeaders(parsedEmail);
      const isReply = this.isReply(parsedEmail, metadata);
      const isForward = this.isForward(parsedEmail, metadata);

      console.log(`\n📧 Processing email: ${parsedEmail.subject}`);
      console.log(`   Is Reply: ${isReply}`);
      console.log(`   Is Forward: ${isForward}`);
      console.log(`   Message-ID: ${metadata.messageId}`);
      console.log(`   In-Reply-To: ${metadata.inReplyTo || 'None'}`);
      console.log(`   References: ${metadata.references.length} found`);

      // If it's a reply, find parent and link
      if (isReply) {
        const parent = await this.findParentEmail(parsedEmail, tenantId);
        
        if (parent) {
          console.log(`   ✅ Found parent email: ${parent._id}`);
          return await this.linkReplyToParent(parsedEmail, parent);
        } else {
          console.log(`   ⚠️  No parent found, treating as new thread`);
        }
      }

      // If no parent found or not a reply, initialize as new thread
      parsedEmail.threadMetadata = {
        isReply: false,
        isForward: isForward,
        threadId: parsedEmail._id, // This email starts a new thread
        messageId: metadata.messageId,
        references: metadata.references
      };

      parsedEmail.replies = [];
      parsedEmail.conversationParticipants = [
        parsedEmail.from.email,
        ...(parsedEmail.to?.map(t => t.email) || [])
      ];

      await parsedEmail.save();

      return {
        success: true,
        isNewThread: true,
        email: parsedEmail,
        threadId: parsedEmail._id
      };

    } catch (error) {
      console.error('Error processing email threading:', error);
      throw error;
    }
  }

  /**
   * Get full conversation thread
   */
  static async getConversationThread(emailId) {
    try {
      const email = await EmailLog.findById(emailId);
      if (!email) {
        throw new Error('Email not found');
      }

      const threadId = email.threadMetadata?.threadId || email._id;

      // Get all emails in this thread
      const threadEmails = await EmailLog.find({
        $or: [
          { _id: threadId },
          { 'threadMetadata.threadId': threadId }
        ]
      }).sort({ receivedAt: 1 }); // Chronological order

      return {
        threadId,
        totalEmails: threadEmails.length,
        emails: threadEmails,
        participants: [...new Set(threadEmails.flatMap(e => [
          e.from.email,
          ...(e.to?.map(t => t.email) || [])
        ]))],
        startedAt: threadEmails[0]?.receivedAt,
        lastActivityAt: threadEmails[threadEmails.length - 1]?.receivedAt
      };
    } catch (error) {
      console.error('Error getting conversation thread:', error);
      throw error;
    }
  }

  /**
   * Helper: Escape regex special characters
   */
  static escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Rebuild all email threads (for existing data)
   */
  static async rebuildAllThreads(tenantId) {
    try {
      console.log(`\n🔄 Rebuilding email threads for tenant: ${tenantId}`);
      
      const emails = await EmailLog.find({ tenantId }).sort({ receivedAt: 1 });
      let processed = 0;
      let linked = 0;

      for (const email of emails) {
        const result = await this.processEmailThreading(email, tenantId);
        processed++;
        
        if (result.parentEmail) {
          linked++;
        }

        if (processed % 10 === 0) {
          console.log(`   Processed: ${processed}/${emails.length}, Linked: ${linked}`);
        }
      }

      console.log(`\n✅ Thread rebuild complete:`);
      console.log(`   Total emails processed: ${processed}`);
      console.log(`   Replies linked: ${linked}`);
      console.log(`   New threads created: ${processed - linked}`);

      return {
        success: true,
        totalProcessed: processed,
        repliesLinked: linked,
        newThreads: processed - linked
      };

    } catch (error) {
      console.error('Error rebuilding threads:', error);
      throw error;
    }
  }
}

module.exports = EmailThreadingService;
