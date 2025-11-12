/**
 * Simple AI Skip Demo
 * Shows that AI is skipped for replies and forwards
 */

const EmailLog = require('./src/models/EmailLog');
const emailProcessingQueue = require('./src/services/emailProcessingQueue');
const mongoose = require('mongoose');
require('dotenv').config();

async function demo() {
  console.log('\n🎯 AI SKIP DEMONSTRATION');
  console.log('='.repeat(70));
  
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-crm');
    console.log('✅ Connected to database\n');
    
    // Get a tenant ID from existing data
    const Tenant = require('./src/models/Tenant');
    const tenant = await Tenant.findOne();
    
    if (!tenant) {
      console.log('❌ No tenant found. Please create a tenant first.');
      process.exit(1);
    }
    
    const EmailAccount = require('./src/models/EmailAccount');
    const emailAccount = await EmailAccount.findOne({ tenantId: tenant._id });
    
    if (!emailAccount) {
      console.log('❌ No email account found. Please create an email account first.');
      process.exit(1);
    }
    
    console.log(`Using Tenant: ${tenant.name} (${tenant._id})`);
    console.log(`Using Email Account: ${emailAccount.email}\n`);
    
    // DEMO 1: Create a NEW email (should process with AI)
    console.log('📧 DEMO 1: Creating a NEW customer email...');
    console.log('-'.repeat(70));
    
    const newEmail = await EmailLog.create({
      messageId: `<demo-new-${Date.now()}@test.com>`,
      emailAccountId: emailAccount._id,
      tenantId: tenant._id,
      from: { email: 'customer@example.com', name: 'Demo Customer' },
      to: [{ email: emailAccount.email, name: 'Support' }],
      subject: 'I want to book a tour to Paris',
      bodyText: 'Hello, I would like to book a 5-day tour to Paris next month...',
      bodyHtml: '<p>Hello, I would like to book a 5-day tour to Paris next month...</p>',
      snippet: 'Hello, I would like to book a 5-day tour...',
      receivedAt: new Date(),
      processingStatus: 'pending',
      source: 'webhook'
    });
    
    console.log(`✅ Created: ${newEmail._id}`);
    console.log(`   From: ${newEmail.from.email}`);
    console.log(`   Subject: ${newEmail.subject}`);
    console.log(`   threadMetadata: ${newEmail.threadMetadata ? 'YES' : 'NO (new email)'}`);
    
    // Add to queue
    console.log(`\n📤 Adding to processing queue...`);
    await emailProcessingQueue.addToQueue(newEmail._id.toString(), tenant._id.toString());
    
    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const processedNew = await EmailLog.findById(newEmail._id);
    console.log(`\n✅ Result after processing:`);
    console.log(`   Status: ${processedNew.processingStatus}`);
    console.log(`   Category: ${processedNew.category || 'Not set yet'}`);
    console.log(`   AI Skipped: ${processedNew.skipAIProcessing ? 'YES ⏭️' : 'NO - AI PROCESSED ✅'}`);
    console.log(`   Skip Reason: ${processedNew.skipReason || 'N/A'}`);
    
    if (!processedNew.skipAIProcessing) {
      console.log(`\n🎉 SUCCESS: AI processed the new email (as expected)!`);
    }
    
    // DEMO 2: Create a REPLY email (should skip AI)
    console.log('\n\n📧 DEMO 2: Creating a REPLY email...');
    console.log('-'.repeat(70));
    
    const replyEmail = await EmailLog.create({
      messageId: `<demo-reply-${Date.now()}@test.com>`,
      emailAccountId: emailAccount._id,
      tenantId: tenant._id,
      from: { email: 'customer@example.com', name: 'Demo Customer' },
      to: [{ email: emailAccount.email, name: 'Support' }],
      subject: 'Re: Your tour options',
      bodyText: 'Thanks for the options! I prefer option 2...',
      bodyHtml: '<p>Thanks for the options! I prefer option 2...</p>',
      snippet: 'Thanks for the options! I prefer option 2...',
      receivedAt: new Date(),
      processingStatus: 'pending',
      source: 'webhook',
      // Threading metadata showing it's a reply
      threadMetadata: {
        isReply: true,
        isForward: false,
        parentEmailId: newEmail._id,
        threadId: newEmail._id,
        messageId: `<demo-reply-${Date.now()}@test.com>`,
        strategy: 'manual-test'
      }
    });
    
    console.log(`✅ Created: ${replyEmail._id}`);
    console.log(`   From: ${replyEmail.from.email}`);
    console.log(`   Subject: ${replyEmail.subject}`);
    console.log(`   threadMetadata.isReply: ${replyEmail.threadMetadata.isReply}`);
    console.log(`   threadMetadata.parentEmailId: ${replyEmail.threadMetadata.parentEmailId}`);
    
    // Add to queue
    console.log(`\n📤 Adding to processing queue...`);
    await emailProcessingQueue.addToQueue(replyEmail._id.toString(), tenant._id.toString());
    
    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const processedReply = await EmailLog.findById(replyEmail._id);
    console.log(`\n✅ Result after processing:`);
    console.log(`   Status: ${processedReply.processingStatus}`);
    console.log(`   Category: ${processedReply.category || 'Not set'}`);
    console.log(`   AI Skipped: ${processedReply.skipAIProcessing ? 'YES ⏭️' : 'NO - AI PROCESSED ❌'}`);
    console.log(`   Skip Reason: ${processedReply.skipReason || 'N/A'}`);
    
    if (processedReply.skipAIProcessing && processedReply.category === 'REPLY') {
      console.log(`\n🎉 SUCCESS: AI skipped the reply (as expected)!`);
    }
    
    // DEMO 3: Create a FORWARD email (should skip AI)
    console.log('\n\n📧 DEMO 3: Creating a FORWARD email...');
    console.log('-'.repeat(70));
    
    const forwardEmail = await EmailLog.create({
      messageId: `<demo-forward-${Date.now()}@test.com>`,
      emailAccountId: emailAccount._id,
      tenantId: tenant._id,
      from: { email: 'agent@travel.com', name: 'Agent' },
      to: [{ email: 'team@travel.com', name: 'Team' }],
      subject: 'Fwd: Customer inquiry',
      bodyText: '---------- Forwarded message ----------\nFrom: customer...',
      bodyHtml: '<p>---------- Forwarded message ----------</p>',
      snippet: '---------- Forwarded message ----------',
      receivedAt: new Date(),
      processingStatus: 'pending',
      source: 'webhook',
      // Threading metadata showing it's a forward
      threadMetadata: {
        isReply: false,
        isForward: true,
        parentEmailId: newEmail._id,
        threadId: newEmail._id,
        messageId: `<demo-forward-${Date.now()}@test.com>`,
        strategy: 'manual-test'
      }
    });
    
    console.log(`✅ Created: ${forwardEmail._id}`);
    console.log(`   From: ${forwardEmail.from.email}`);
    console.log(`   Subject: ${forwardEmail.subject}`);
    console.log(`   threadMetadata.isForward: ${forwardEmail.threadMetadata.isForward}`);
    
    // Add to queue
    console.log(`\n📤 Adding to processing queue...`);
    await emailProcessingQueue.addToQueue(forwardEmail._id.toString(), tenant._id.toString());
    
    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const processedForward = await EmailLog.findById(forwardEmail._id);
    console.log(`\n✅ Result after processing:`);
    console.log(`   Status: ${processedForward.processingStatus}`);
    console.log(`   Category: ${processedForward.category || 'Not set'}`);
    console.log(`   AI Skipped: ${processedForward.skipAIProcessing ? 'YES ⏭️' : 'NO - AI PROCESSED ❌'}`);
    console.log(`   Skip Reason: ${processedForward.skipReason || 'N/A'}`);
    
    if (processedForward.skipAIProcessing && processedForward.category === 'FORWARD') {
      console.log(`\n🎉 SUCCESS: AI skipped the forward (as expected)!`);
    }
    
    // Summary
    console.log('\n\n📊 SUMMARY');
    console.log('='.repeat(70));
    console.log(`NEW Email:     AI Skipped = ${processedNew.skipAIProcessing ? 'YES ❌' : 'NO ✅'} (Expected: NO)`);
    console.log(`REPLY Email:   AI Skipped = ${processedReply.skipAIProcessing ? 'YES ✅' : 'NO ❌'} (Expected: YES)`);
    console.log(`FORWARD Email: AI Skipped = ${processedForward.skipAIProcessing ? 'YES ✅' : 'NO ❌'} (Expected: YES)`);
    
    const allCorrect = !processedNew.skipAIProcessing && 
                       processedReply.skipAIProcessing && 
                       processedForward.skipAIProcessing;
    
    if (allCorrect) {
      console.log(`\n✅ ALL TESTS PASSED! AI skip logic is working correctly!`);
    } else {
      console.log(`\n⚠️  Some results don't match expectations. Check logs above.`);
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Disconnected from database');
    process.exit(0);
  }
}

demo();
