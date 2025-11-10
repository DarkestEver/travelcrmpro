const mongoose = require('mongoose');
const Imap = require('imap');
const { simpleParser } = require('mailparser');
require('dotenv').config();

const EmailAccount = require('./src/models/EmailAccount');
const EmailLog = require('./src/models/EmailLog');
const processingQueue = require('./src/services/emailProcessingQueue');

async function testDirectPolling() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const tenantId = '690ce6d206c104addbfedb65';
    
    // Get email account with IMAP settings  
    const account = await EmailAccount.findOne({ 
      email: 'app@travelmanagerpro.com',
      tenantId 
    }); // Don't use .lean() so getters work

    if (!account || !account.imap || !account.imap.enabled) {
      console.log('❌ Email account not configured for IMAP');
      process.exit(1);
    }

    console.log('📧 Email Account Configuration:');
    console.log(`  Email: ${account.email}`);
    console.log(`  IMAP Host: ${account.imap.host}`);
    console.log(`  IMAP Port: ${account.imap.port}`);
    console.log(`  IMAP User: ${account.imap.username}`);
    console.log(`  IMAP Secure: ${account.imap.secure}`);
    console.log(`  AI Auto Process: ${account.aiAutoProcess}`);
    console.log();

    // Get the password - it should be decrypted automatically by the getter
    const imapPassword = account.imap.password;

    // Count existing emails
    const beforeCount = await EmailLog.countDocuments({ tenantId });
    console.log(`📊 Current emails in database: ${beforeCount}\n`);

    console.log('🔄 Connecting to IMAP server...');
    
    // Create IMAP connection
    const imap = new Imap({
      user: account.imap.username,
      password: imapPassword,
      host: account.imap.host,
      port: account.imap.port,
      tls: account.imap.secure,
      tlsOptions: { rejectUnauthorized: false }
    });

    let emailsFetched = 0;
    let emailsProcessed = 0;

    imap.once('ready', () => {
      console.log('✅ Connected to IMAP server');
      
      imap.openBox('INBOX', false, (err, box) => {
        if (err) {
          console.error('❌ Failed to open INBOX:', err.message);
          imap.end();
          return;
        }

        console.log(`📫 INBOX opened: ${box.messages.total} total messages, ${box.messages.new} new\n`);

        // Search for unread emails
        imap.search(['UNSEEN'], async (err, results) => {
          if (err) {
            console.error('❌ Search failed:', err.message);
            imap.end();
            return;
          }

          if (!results || results.length === 0) {
            console.log('ℹ️  No unread emails found');
            console.log();
            console.log('💡 To test email polling:');
            console.log('   1. Send an email to: app@travelmanagerpro.com');
            console.log('   2. Run this script again');
            console.log('   3. The email will be fetched and processed with AI');
            imap.end();
            return;
          }

          console.log(`📬 Found ${results.length} unread email(s)!`);
          console.log(`🤖 Processing with AI...\n`);

          const fetch = imap.fetch(results, { bodies: '', markSeen: true });

          fetch.on('message', (msg, seqno) => {
            msg.on('body', (stream, info) => {
              simpleParser(stream, async (err, parsed) => {
                if (err) {
                  console.error(`❌ Failed to parse email ${seqno}:`, err.message);
                  return;
                }

                try {
                  emailsFetched++;
                  
                  console.log(`\n📧 Email ${emailsFetched}/${results.length}:`);
                  console.log(`   From: ${parsed.from?.text || 'Unknown'}`);
                  console.log(`   Subject: ${parsed.subject || 'No subject'}`);
                  console.log(`   Date: ${parsed.date}`);

                  // Check if already exists
                  const existing = await EmailLog.findOne({
                    tenantId,
                    messageId: parsed.messageId
                  });

                  if (existing) {
                    console.log('   ⚠️  Already in database, skipping...');
                    return;
                  }

                  // Create email log
                  const emailLog = new EmailLog({
                    tenantId,
                    emailAccountId: account._id, // Fixed: use emailAccountId instead of accountId
                    messageId: parsed.messageId,
                    subject: parsed.subject,
                    from: {
                      email: parsed.from?.value?.[0]?.address || parsed.from?.text,
                      name: parsed.from?.value?.[0]?.name || ''
                    },
                    to: (parsed.to?.value || []).map(t => ({
                      email: t.address,
                      name: t.name || ''
                    })),
                    bodyText: parsed.text || parsed.html || 'No content', // Fixed: use bodyText
                    bodyHtml: parsed.html || '',
                    receivedAt: parsed.date,
                    processingStatus: 'pending',
                    source: 'imap'
                  });

                  await emailLog.save();
                  console.log('   ✅ Saved to database');

                  // Process with AI if enabled
                  if (account.aiAutoProcess) {
                    console.log('   🤖 Adding to AI processing queue...');
                    
                    try {
                      await processingQueue.addToQueue(
                        emailLog._id.toString(),
                        tenantId,
                        'high'
                      );

                      // Wait a moment for processing
                      await new Promise(resolve => setTimeout(resolve, 15000));
                      
                      // Fetch updated email with AI results
                      const updatedEmail = await EmailLog.findById(emailLog._id);
                      
                      if (updatedEmail.processingStatus === 'completed') {
                        emailsProcessed++;
                        
                        console.log(`   ✅ AI Processing Complete!`);
                        console.log(`      Category: ${updatedEmail.category} (${updatedEmail.categoryConfidence}% confidence)`);
                        console.log(`      Sentiment: ${updatedEmail.sentiment}`);
                        console.log(`      Priority: ${updatedEmail.priority}`);
                        
                        if (updatedEmail.extractedData?.destination) {
                          console.log(`      Destination: ${updatedEmail.extractedData.destination}`);
                        }
                        if (updatedEmail.extractedData?.dates) {
                          console.log(`      Dates: ${updatedEmail.extractedData.dates.checkIn} to ${updatedEmail.extractedData.dates.checkOut}`);
                        }
                      } else {
                        console.log(`   ⏳ Processing status: ${updatedEmail.processingStatus}`);
                      }
                      
                    } catch (aiError) {
                      console.log(`   ⚠️  AI processing failed: ${aiError.message}`);
                    }
                  }

                } catch (error) {
                  console.error(`   ❌ Error processing email:`, error.message);
                }
              });
            });
          });

          fetch.once('end', () => {
            console.log(`\n${'='.repeat(60)}`);
            console.log('📊 POLLING COMPLETE!');
            console.log(`${'='.repeat(60)}`);
            console.log(`✅ Emails fetched: ${emailsFetched}`);
            console.log(`🤖 Emails AI processed: ${emailsProcessed}`);
            console.log();
            
            setTimeout(async () => {
              const afterCount = await EmailLog.countDocuments({ tenantId });
              console.log(`📈 Database: ${beforeCount} → ${afterCount} emails (+${afterCount - beforeCount})`);
              console.log();
              console.log('🎉 Email polling test successful!');
              console.log();
              console.log('💡 Next steps:');
              console.log('   - Check frontend at: http://localhost:5174/emails/history');
              console.log('   - Backend automatically polls every 5 minutes');
              console.log('   - Send more test emails to see AI processing');
              
              imap.end();
              process.exit(0);
            }, 2000);
          });

          fetch.once('error', (err) => {
            console.error('❌ Fetch error:', err.message);
            imap.end();
          });
        });
      });
    });

    imap.once('error', (err) => {
      console.error('❌ IMAP connection error:', err.message);
      process.exit(1);
    });

    imap.once('end', () => {
      console.log('Connection ended');
    });

    imap.connect();

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testDirectPolling();
