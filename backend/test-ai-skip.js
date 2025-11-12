/**
 * AI Skip Testing Script
 * Tests that AI is only called for NEW emails, not replies or forwards
 */

const EmailLog = require('./src/models/EmailLog');
const EmailThreadingService = require('./src/services/emailThreadingService');
const emailProcessingQueue = require('./src/services/emailProcessingQueue');
const mongoose = require('mongoose');
require('dotenv').config();

// Test data
const TENANT_ID = '507f1f77bcf86cd799439011'; // Replace with your tenant ID
const EMAIL_ACCOUNT_ID = '507f191e810c19729de860ea'; // Replace with your email account ID

/**
 * Test 1: New Email (Should Process with AI)
 */
async function testNewEmail() {
  console.log('\n📧 TEST 1: NEW EMAIL (Should Process with AI)');
  console.log('='.repeat(60));
  
  const newEmail = await EmailLog.create({
    messageId: `<new-${Date.now()}@test.com>`,
    emailAccountId: EMAIL_ACCOUNT_ID,
    tenantId: TENANT_ID,
    from: {
      email: 'customer@example.com',
      name: 'Test Customer'
    },
    to: [{
      email: 'support@travel.com',
      name: 'Support Team'
    }],
    subject: 'Tour Inquiry for Paris',
    bodyText: 'I would like to book a tour to Paris next month. Please send me options.',
    bodyHtml: '<p>I would like to book a tour to Paris next month. Please send me options.</p>',
    snippet: 'I would like to book a tour to Paris...',
    receivedAt: new Date(),
    processingStatus: 'pending',
    source: 'imap'
  });
  
  console.log(`✅ Created new email: ${newEmail._id}`);
  console.log(`   From: ${newEmail.from.email}`);
  console.log(`   Subject: ${newEmail.subject}`);
  
  // Process threading (should NOT detect as reply/forward)
  await EmailThreadingService.processEmailThreading(newEmail, TENANT_ID);
  const newEmailRefreshed = await EmailLog.findById(newEmail._id);
  
  console.log(`\n🔍 Threading Detection:`);
  console.log(`   isReply: ${newEmailRefreshed.threadMetadata?.isReply || 'undefined'}`);
  console.log(`   isForward: ${newEmailRefreshed.threadMetadata?.isForward || 'undefined'}`);
  
  // Add to queue
  console.log(`\n📤 Adding to processing queue...`);
  await emailProcessingQueue.addToQueue(newEmail._id.toString(), TENANT_ID);
  
  // Wait a bit for processing
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Check result
  const processedEmail = await EmailLog.findById(newEmail._id);
  console.log(`\n✅ Processing Result:`);
  console.log(`   Status: ${processedEmail.processingStatus}`);
  console.log(`   Category: ${processedEmail.category}`);
  console.log(`   AI Skipped: ${processedEmail.skipAIProcessing || false}`);
  console.log(`   Skip Reason: ${processedEmail.skipReason || 'N/A'}`);
  
  if (processedEmail.skipAIProcessing) {
    console.log(`\n❌ FAIL: AI should NOT be skipped for new emails!`);
    return false;
  } else {
    console.log(`\n✅ PASS: AI processed the new email correctly!`);
    return true;
  }
}

/**
 * Test 2: Reply Email (Should Skip AI)
 */
async function testReplyEmail() {
  console.log('\n📧 TEST 2: REPLY EMAIL (Should Skip AI)');
  console.log('='.repeat(60));
  
  // Create a parent email first
  const parentEmail = await EmailLog.create({
    messageId: `<parent-${Date.now()}@travel.com>`,
    emailAccountId: EMAIL_ACCOUNT_ID,
    tenantId: TENANT_ID,
    from: {
      email: 'support@travel.com',
      name: 'Support Team'
    },
    to: [{
      email: 'customer@example.com',
      name: 'Test Customer'
    }],
    subject: 'Re: Tour Inquiry for Paris',
    bodyText: 'Here are some tour options for Paris...',
    bodyHtml: '<p>Here are some tour options for Paris...</p>',
    snippet: 'Here are some tour options...',
    receivedAt: new Date(),
    processingStatus: 'completed',
    source: 'manual' // Changed from 'outbound' to valid enum value
  });
  
  console.log(`✅ Created parent email: ${parentEmail._id}`);
  
  // Create a reply
  const replyEmail = await EmailLog.create({
    messageId: `<reply-${Date.now()}@test.com>`,
    emailAccountId: EMAIL_ACCOUNT_ID,
    tenantId: TENANT_ID,
    from: {
      email: 'customer@example.com',
      name: 'Test Customer'
    },
    to: [{
      email: 'support@travel.com',
      name: 'Support Team'
    }],
    subject: 'Re: Tour Inquiry for Paris',
    bodyText: 'Thanks! Option 2 looks great. Can you send more details?',
    bodyHtml: '<p>Thanks! Option 2 looks great. Can you send more details?</p>',
    snippet: 'Thanks! Option 2 looks great...',
    receivedAt: new Date(),
    processingStatus: 'pending',
    source: 'imap',
    inReplyTo: parentEmail.messageId,
    references: [parentEmail.messageId]
  });
  
  console.log(`✅ Created reply email: ${replyEmail._id}`);
  console.log(`   From: ${replyEmail.from.email}`);
  console.log(`   Subject: ${replyEmail.subject}`);
  console.log(`   In-Reply-To: ${replyEmail.inReplyTo}`);
  
  // Process threading (should detect as reply)
  await EmailThreadingService.processEmailThreading(replyEmail, TENANT_ID);
  const replyEmailRefreshed = await EmailLog.findById(replyEmail._id);
  
  console.log(`\n🔍 Threading Detection:`);
  console.log(`   isReply: ${replyEmailRefreshed.threadMetadata?.isReply || 'undefined'}`);
  console.log(`   isForward: ${replyEmailRefreshed.threadMetadata?.isForward || 'undefined'}`);
  console.log(`   parentEmailId: ${replyEmailRefreshed.threadMetadata?.parentEmailId || 'undefined'}`);
  
  // Add to queue
  console.log(`\n📤 Adding to processing queue...`);
  await emailProcessingQueue.addToQueue(replyEmail._id.toString(), TENANT_ID);
  
  // Wait a bit for processing
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Check result
  const processedReply = await EmailLog.findById(replyEmail._id);
  console.log(`\n✅ Processing Result:`);
  console.log(`   Status: ${processedReply.processingStatus}`);
  console.log(`   Category: ${processedReply.category}`);
  console.log(`   AI Skipped: ${processedReply.skipAIProcessing || false}`);
  console.log(`   Skip Reason: ${processedReply.skipReason || 'N/A'}`);
  
  if (processedReply.skipAIProcessing && processedReply.category === 'REPLY') {
    console.log(`\n✅ PASS: AI was correctly skipped for reply email!`);
    return true;
  } else {
    console.log(`\n❌ FAIL: AI should be skipped for reply emails!`);
    return false;
  }
}

/**
 * Test 3: Forward Email (Should Skip AI)
 */
async function testForwardEmail() {
  console.log('\n📧 TEST 3: FORWARD EMAIL (Should Skip AI)');
  console.log('='.repeat(60));
  
  const forwardEmail = await EmailLog.create({
    messageId: `<forward-${Date.now()}@test.com>`,
    emailAccountId: EMAIL_ACCOUNT_ID,
    tenantId: TENANT_ID,
    from: {
      email: 'agent@travel.com',
      name: 'Agent Smith'
    },
    to: [{
      email: 'team@travel.com',
      name: 'Support Team'
    }],
    subject: 'Fwd: Customer Request for Paris Tour',
    bodyText: '---------- Forwarded message ----------\nFrom: customer@example.com\nSubject: Paris Tour\n\nI need help with this customer...',
    bodyHtml: '<p>---------- Forwarded message ----------</p><p>From: customer@example.com</p>',
    snippet: '---------- Forwarded message ----------',
    receivedAt: new Date(),
    processingStatus: 'pending',
    source: 'imap'
  });
  
  console.log(`✅ Created forward email: ${forwardEmail._id}`);
  console.log(`   From: ${forwardEmail.from.email}`);
  console.log(`   Subject: ${forwardEmail.subject}`);
  
  // Process threading (should detect as forward)
  await EmailThreadingService.processEmailThreading(forwardEmail, TENANT_ID);
  const forwardEmailRefreshed = await EmailLog.findById(forwardEmail._id);
  
  console.log(`\n🔍 Threading Detection:`);
  console.log(`   isReply: ${forwardEmailRefreshed.threadMetadata?.isReply || 'undefined'}`);
  console.log(`   isForward: ${forwardEmailRefreshed.threadMetadata?.isForward || 'undefined'}`);
  
  // Add to queue
  console.log(`\n📤 Adding to processing queue...`);
  await emailProcessingQueue.addToQueue(forwardEmail._id.toString(), TENANT_ID);
  
  // Wait a bit for processing
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Check result
  const processedForward = await EmailLog.findById(forwardEmail._id);
  console.log(`\n✅ Processing Result:`);
  console.log(`   Status: ${processedForward.processingStatus}`);
  console.log(`   Category: ${processedForward.category}`);
  console.log(`   AI Skipped: ${processedForward.skipAIProcessing || false}`);
  console.log(`   Skip Reason: ${processedForward.skipReason || 'N/A'}`);
  
  if (processedForward.skipAIProcessing && processedForward.category === 'FORWARD') {
    console.log(`\n✅ PASS: AI was correctly skipped for forward email!`);
    return true;
  } else {
    console.log(`\n❌ FAIL: AI should be skipped for forward emails!`);
    return false;
  }
}

/**
 * Test 4: Check Database Statistics
 */
async function checkStatistics() {
  console.log('\n📊 DATABASE STATISTICS');
  console.log('='.repeat(60));
  
  const total = await EmailLog.countDocuments({ tenantId: TENANT_ID });
  const skipped = await EmailLog.countDocuments({ 
    tenantId: TENANT_ID, 
    skipAIProcessing: true 
  });
  const processed = await EmailLog.countDocuments({ 
    tenantId: TENANT_ID, 
    skipAIProcessing: { $ne: true },
    category: 'CUSTOMER'
  });
  
  console.log(`Total Emails: ${total}`);
  console.log(`AI Processed: ${processed}`);
  console.log(`AI Skipped: ${skipped}`);
  
  if (skipped > 0) {
    const skipRate = ((skipped / total) * 100).toFixed(1);
    console.log(`Skip Rate: ${skipRate}%`);
    
    const estimatedSavings = skipped * 0.05;
    console.log(`Estimated Savings: $${estimatedSavings.toFixed(2)}`);
  }
  
  // Category breakdown
  const categories = await EmailLog.aggregate([
    { $match: { tenantId: mongoose.Types.ObjectId(TENANT_ID) } },
    { $group: { 
      _id: '$category', 
      count: { $sum: 1 }
    }},
    { $sort: { count: -1 } }
  ]);
  
  console.log('\nCategory Breakdown:');
  categories.forEach(cat => {
    console.log(`   ${cat._id || 'UNCATEGORIZED'}: ${cat.count}`);
  });
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('\n🚀 AI SKIP TESTING - START');
  console.log('='.repeat(60));
  
  try {
    // Connect to database
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-crm', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to database\n');
    
    const results = {
      test1: false,
      test2: false,
      test3: false
    };
    
    // Run tests
    results.test1 = await testNewEmail();
    results.test2 = await testReplyEmail();
    results.test3 = await testForwardEmail();
    
    // Show statistics
    await checkStatistics();
    
    // Summary
    console.log('\n📋 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Test 1 (New Email - AI Process): ${results.test1 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Test 2 (Reply Email - AI Skip): ${results.test2 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Test 3 (Forward Email - AI Skip): ${results.test3 ? '✅ PASS' : '❌ FAIL'}`);
    
    const allPassed = Object.values(results).every(r => r === true);
    
    if (allPassed) {
      console.log('\n🎉 ALL TESTS PASSED! ✅');
      console.log('AI is correctly skipping replies and forwards.');
    } else {
      console.log('\n⚠️  SOME TESTS FAILED! ❌');
      console.log('Please review the implementation.');
    }
    
  } catch (error) {
    console.error('\n❌ TEST ERROR:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Disconnected from database');
    process.exit(0);
  }
}

// Run if executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests, testNewEmail, testReplyEmail, testForwardEmail };
