/**
 * Email Polling Service
 * 
 * Automatically fetches emails from IMAP servers for all active email accounts.
 * Runs periodically to check for new unread emails and processes them through
 * the email-to-quote workflow.
 * 
 * This service works ALONGSIDE the webhook receiver, providing dual-mode operation:
 * - IMAP Polling: For automatic email account monitoring
 * - Webhook: For direct website/chat integration
 */

const Imap = require('imap');
const { simpleParser } = require('mailparser');
const EmailAccount = require('../models/EmailAccount');
const EmailLog = require('../models/EmailLog');
const emailProcessingQueue = require('./emailProcessingQueue');
const EmailThreadingService = require('./emailThreadingService');
const logger = require('../utils/logger');

class EmailPollingService {
  constructor() {
    this.activePollers = new Map(); // Store active polling intervals
    this.isPolling = false;
  }

  /**
   * Start polling all active email accounts
   */
  async startPolling() {
    if (this.isPolling) {
      logger.info('Email polling is already running');
      return;
    }

    this.isPolling = true;
    logger.info('🔄 Starting email polling service...');

    try {
      const accounts = await EmailAccount.find({
        isActive: true,
        autoFetch: true,
        'imap.host': { $exists: true, $ne: '' }
      });

      if (accounts.length === 0) {
        logger.info('ℹ️  No email accounts configured for automatic fetching');
        return;
      }

      logger.info(`📧 Found ${accounts.length} email account(s) to poll`);

      // Perform initial fetch for all accounts
      for (const account of accounts) {
        await this.pollAccount(account);
      }

      logger.info('✅ Email polling service started successfully');
    } catch (error) {
      logger.error('❌ Error starting email polling service:', error);
      this.isPolling = false;
    }
  }

  /**
   * Poll a single email account for new emails
   */
  async pollAccount(account) {
    const accountId = account._id.toString();
    
    try {
      logger.info(`📬 Polling emails for: ${account.email}`);
      
      const emails = await this.fetchNewEmails(account);
      
      if (emails.length > 0) {
        logger.info(`✅ Fetched ${emails.length} new email(s) from ${account.email}`);
        
        // Update last fetch timestamp
        await EmailAccount.findByIdAndUpdate(account._id, {
          lastFetchAt: new Date(),
          lastFetchStatus: 'success',
          lastFetchError: null
        });
      } else {
        logger.info(`ℹ️  No new emails for ${account.email}`);
        
        await EmailAccount.findByIdAndUpdate(account._id, {
          lastFetchAt: new Date(),
          lastFetchStatus: 'success'
        });
      }

      return emails;
    } catch (error) {
      logger.error(`❌ Error polling ${account.email}:`, error.message);
      
      // Update account with error status
      await EmailAccount.findByIdAndUpdate(account._id, {
        lastFetchAt: new Date(),
        lastFetchStatus: 'error',
        lastFetchError: error.message
      });

      return [];
    }
  }

  /**
   * Fetch new emails from IMAP server
   */
  async fetchNewEmails(account) {
    return new Promise((resolve, reject) => {
      // Convert to plain object to ensure getters (password decryption) are applied
      const accountObj = account.toObject({ getters: true });
      
      const imapConfig = {
        user: accountObj.email,
        password: accountObj.imap.password,
        host: accountObj.imap.host,
        port: accountObj.imap.port || 993,
        tls: accountObj.imap.secure === true, // Use the 'secure' field, not 'tls'
        tlsOptions: { 
          rejectUnauthorized: false // For self-signed certificates
        },
        connTimeout: 10000,
        authTimeout: 5000
      };

      const imap = new Imap(imapConfig);
      const emails = [];

      imap.once('ready', () => {
        imap.openBox('INBOX', false, (err, box) => {
          if (err) {
            imap.end();
            return reject(new Error(`Failed to open inbox: ${err.message}`));
          }

          // Search for UNSEEN emails
          imap.search(['UNSEEN'], async (err, results) => {
            if (err) {
              imap.end();
              return reject(new Error(`IMAP search failed: ${err.message}`));
            }

            if (!results || results.length === 0) {
              imap.end();
              return resolve([]);
            }

            logger.info(`📨 Found ${results.length} unread email(s) for ${account.email}`);

            const fetch = imap.fetch(results, {
              bodies: '',
              markSeen: true // Mark as read after fetching
            });

            fetch.on('message', (msg, seqno) => {
              let emailBuffer = '';

              msg.on('body', (stream, info) => {
                stream.on('data', (chunk) => {
                  emailBuffer += chunk.toString('utf8');
                });

                stream.once('end', async () => {
                  try {
                    const parsed = await simpleParser(emailBuffer);
                    
                    // Extract email addresses FIRST
                    const fromAddress = parsed.from?.value?.[0];
                    const toAddresses = parsed.to?.value || [];
                    const ccAddresses = parsed.cc?.value || [];
                    const senderEmail = fromAddress?.address?.toLowerCase();
                    const accountEmail = account.imap.username.toLowerCase();
                    
                    // Skip emails sent by us (our own sent emails) - CHECK THIS FIRST
                    if (senderEmail === accountEmail) {
                      logger.info(`⏭️  Skipping our own sent email: ${parsed.messageId} from ${senderEmail}`);
                      return;
                    }
                    
                    // Skip system emails: spam, undelivered, mail delivery failures
                    const subject = parsed.subject?.toLowerCase() || '';
                    const systemEmailPatterns = [
                      'mail delivery',
                      'delivery status notification',
                      'undelivered mail returned to sender',
                      'returned mail',
                      'failure notice',
                      'delivery failure',
                      'mail system error',
                      'postmaster',
                      'mailer-daemon',
                      'auto-reply',
                      'automatic reply',
                      'out of office',
                      'vacation reply'
                    ];
                    
                    const isSystemEmail = 
                      systemEmailPatterns.some(pattern => subject.includes(pattern)) ||
                      senderEmail?.includes('mailer-daemon') ||
                      senderEmail?.includes('postmaster') ||
                      senderEmail === 'noreply@' ||
                      senderEmail?.startsWith('noreply');
                    
                    if (isSystemEmail) {
                      logger.info(`🚫 Skipping system/automated email: "${parsed.subject}" from ${senderEmail}`);
                      return;
                    }
                    
                    // Check if email already exists (by messageId, subject, and date)
                    const existingEmail = await EmailLog.findOne({
                      $or: [
                        { messageId: parsed.messageId },
                        {
                          // Also check by subject + from + date (in case messageId differs)
                          subject: parsed.subject,
                          'from.email': senderEmail,
                          receivedAt: {
                            $gte: new Date(parsed.date.getTime() - 5000), // Within 5 seconds
                            $lte: new Date(parsed.date.getTime() + 5000)
                          }
                        }
                      ]
                    });

                    if (existingEmail) {
                      logger.info(`ℹ️  Email already processed: ${parsed.messageId || parsed.subject}`);
                      return;
                    }

                    // Save to database
                    const emailLog = await EmailLog.create({
                      messageId: parsed.messageId || `${Date.now()}-${Math.random()}`,
                      emailAccountId: account._id,
                      tenantId: account.tenantId,
                      from: {
                        email: fromAddress?.address || 'unknown@unknown.com',
                        name: fromAddress?.name || 'Unknown'
                      },
                      to: toAddresses.map(t => ({
                        email: t.address,
                        name: t.name || t.address
                      })),
                      cc: ccAddresses.map(c => ({
                        email: c.address,
                        name: c.name || c.address
                      })),
                      subject: parsed.subject || '(No Subject)',
                      bodyText: parsed.text || '',
                      bodyHtml: parsed.html || '',
                      receivedAt: parsed.date || new Date(),
                      processingStatus: 'pending',
                      source: 'imap', // Track source as IMAP (vs webhook)
                      emailType: 'customer', // Normal customer email (system emails already filtered above)
                      inReplyTo: parsed.inReplyTo || null,
                      references: parsed.references || []
                    });

                    logger.info(`✅ Saved email: ${emailLog._id} - "${emailLog.subject}"`);

                    // Process email threading (detect replies/forwards)
                    try {
                      await EmailThreadingService.processEmailThreading(emailLog, account.tenantId.toString());
                      logger.info(`🔗 Threading processed for email: ${emailLog._id}`);
                    } catch (threadError) {
                      logger.error(`⚠️  Threading error for ${emailLog._id}:`, threadError.message);
                      // Don't fail the whole process if threading fails
                    }

                    // Add to processing queue
                    await emailProcessingQueue.addToQueue(
                      emailLog._id.toString(),
                      account.tenantId.toString(),
                      'normal'
                    );

                    logger.info(`📤 Queued email for processing: ${emailLog._id}`);

                    emails.push(emailLog);
                  } catch (error) {
                    logger.error(`❌ Error processing email #${seqno}:`, error);
                  }
                });
              });

              msg.once('attributes', (attrs) => {
                // You can access email attributes here if needed
              });

              msg.once('end', () => {
                // Email message processing complete
              });
            });

            fetch.once('error', (err) => {
              logger.error('❌ IMAP fetch error:', err);
              imap.end();
              reject(err);
            });

            fetch.once('end', () => {
              logger.info(`✅ Finished fetching emails for ${account.email}`);
              imap.end();
            });
          });
        });
      });

      imap.once('error', (err) => {
        logger.error(`❌ IMAP connection error for ${account.email}:`, err.message);
        reject(err);
      });

      imap.once('end', () => {
        resolve(emails);
      });

      // Connect to IMAP server
      try {
        imap.connect();
      } catch (error) {
        reject(new Error(`Failed to connect to IMAP: ${error.message}`));
      }
    });
  }

  /**
   * Poll all active accounts (called by cron job)
   */
  async pollAllAccounts() {
    try {
      const accounts = await EmailAccount.find({
        isActive: true,
        autoFetch: true,
        'imap.host': { $exists: true, $ne: '' }
      });

      if (accounts.length === 0) {
        return;
      }

      logger.info(`🔄 Polling ${accounts.length} email account(s)...`);

      // Poll accounts sequentially to avoid overwhelming the system
      for (const account of accounts) {
        await this.pollAccount(account);
      }

      logger.info('✅ Email polling cycle complete');
    } catch (error) {
      logger.error('❌ Error in pollAllAccounts:', error);
    }
  }

  /**
   * Stop all polling
   */
  stopPolling() {
    this.isPolling = false;
    logger.info('🛑 Email polling service stopped');
  }

  /**
   * Get polling status
   */
  getStatus() {
    return {
      isPolling: this.isPolling,
      activeAccounts: this.activePollers.size
    };
  }
}

// Export singleton instance
module.exports = new EmailPollingService();
