/**
 * Phase 3 Direct Integration Test
 * Tests template usage directly in email processing queue
 */

const mongoose = require('mongoose');
require('dotenv').config();

const EmailLog = require('../src/models/EmailLog');
const emailProcessingQueue = require('../src/services/emailProcessingQueue');

async function runTest() {
  console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║          PHASE 3 DIRECT INTEGRATION TEST                             ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝\n');

  try {
    // Connect to database
    console.log('📡 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected!\n');

    // Find a recent email or create test email
    console.log('🔍 Finding recent unprocessed emails...');
    const emails = await EmailLog.find({
      processingStatus: { $in: ['pending', 'processing'] },
      category: { $exists: false }
    })
      .sort({ receivedAt: -1 })
      .limit(3);

    console.log(`Found ${emails.length} emails to process\n`);

    if (emails.length === 0) {
      console.log('⚠️  No pending emails found. Creating a test email...\n');
      
      // Create test email
      const testEmail = await EmailLog.create({
        messageId: `test-phase3-${Date.now()}@test.com`,
        from: { email: 'test@example.com', name: 'Test Customer' },
        to: [{ email: 'travel@example.com', name: null }],
        subject: 'Paris Honeymoon Trip',
        bodyText: 'Planning honeymoon to Paris for July. Budget $5000 for 2 people. Love art museums, wine, romantic dining.',
        bodyHtml: '<p>Planning honeymoon to Paris for July. Budget $5000 for 2 people.</p>',
        snippet: 'Planning honeymoon to Paris for July...',
        receivedAt: new Date(),
        processingStatus: 'pending',
        tenantId: '690ce93c464bf35e0adede29',
        emailAccountId: new mongoose.Types.ObjectId()
      });

      emails.push(testEmail);
      console.log(`✅ Created test email: ${testEmail._id}\n`);
    }

    // Process each email and check for template usage
    for (let i = 0; i < Math.min(emails.length, 3); i++) {
      const email = emails[i];
      
      console.log('━'.repeat(70));
      console.log(`\n📧 Processing Email ${i + 1}:`);
      console.log(`   ID: ${email._id}`);
      console.log(`   From: ${email.from.email}`);
      console.log(`   Subject: ${email.subject}`);
      console.log(`   Status: ${email.processingStatus}\n`);

      const startTime = Date.now();

      try {
        // Process the email
        await emailProcessingQueue.processEmail({
          data: {
            emailId: email._id,
            tenantId: email.tenantId
          },
          progress: (percent) => {} // Mock progress function
        });
        
        // Reload email to see results
        const processedEmail = await EmailLog.findById(email._id);
        const duration = Date.now() - startTime;

        console.log(`✅ Processing complete in ${duration}ms\n`);
        console.log('📊 Results:');
        console.log(`   Category: ${processedEmail.category || 'N/A'}`);
        console.log(`   Workflow Action: ${processedEmail.workflowAction || 'N/A'}`);
        console.log(`   Status: ${processedEmail.processingStatus}`);

        if (processedEmail.aiProcessingLog && processedEmail.aiProcessingLog.length > 0) {
          const logs = processedEmail.aiProcessingLog;
          
          // Check for response generation
          const responseLog = logs.find(log => 
            log.step === 'response_generation' || log.action === 'generate_response'
          );

          if (responseLog) {
            console.log('\n   📝 Response Generation:');
            console.log(`      Method: ${responseLog.method || 'N/A'}`);
            console.log(`      Cost: $${(responseLog.cost || 0).toFixed(4)}`);
            console.log(`      Duration: ${responseLog.duration || 'N/A'}ms`);
            
            if (responseLog.method === 'template') {
              console.log(`      ✅ USING PHASE 3 TEMPLATES! (${responseLog.template || 'unknown'})`);
            } else if (responseLog.method === 'ai') {
              console.log(`      ⚠️  Still using AI (cost: $${responseLog.cost})`);
            }

            if (responseLog.response && responseLog.response.body) {
              const bodyLength = responseLog.response.body.length;
              console.log(`      Response Length: ${bodyLength} chars`);
              console.log(`      Has HTML: ${responseLog.response.body.includes('<html>') ? 'Yes' : 'No'}`);
            }
          }

          // Show total costs
          const totalCost = logs.reduce((sum, log) => sum + (log.cost || 0), 0);
          console.log(`\n   💰 Total AI Cost: $${totalCost.toFixed(4)}`);
        }

        console.log('\n');

      } catch (error) {
        console.log(`❌ Error processing: ${error.message}\n`);
      }
    }

    console.log('━'.repeat(70));
    console.log('\n✅ Test complete!\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

runTest();
