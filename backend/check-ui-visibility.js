/**
 * Check Emails in Database - UI Visibility Test
 */

require('dotenv').config();
const mongoose = require('mongoose');
const EmailLog = require('./src/models/EmailLog');

async function checkEmailsForUI() {
  console.log('🔍 Checking Emails for UI Visibility...\n');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-crm');
    console.log('✅ Connected to MongoDB\n');

    // Check all emails
    const allEmails = await EmailLog.find({})
      .sort({ createdAt: -1 })
      .limit(10);

    console.log(`📊 Total Emails in DB: ${await EmailLog.countDocuments()}\n`);

    console.log('📧 Recent Emails Details:\n');
    console.log('='.repeat(70));
    
    allEmails.forEach((email, i) => {
      console.log(`\n${i + 1}. Subject: ${email.subject}`);
      console.log(`   From: ${email.from.email}`);
      console.log(`   Created: ${email.createdAt}`);
      console.log(`   Received At: ${email.receivedAt || 'NOT SET ❌'}`);
      console.log(`   Direction: ${email.direction}`);
      console.log(`   Category: ${email.category || 'NOT SET'}`);
      console.log(`   Status: ${email.status}`);
      console.log(`   Processing Status: ${email.processingStatus || 'NOT SET'}`);
      console.log(`   Tenant ID: ${email.tenantId}`);
      console.log(`   AI Processing Status: ${email.aiProcessing?.status || 'none'}`);
      console.log(`   Has Extracted Data: ${!!email.aiProcessing?.extractedData}`);
    });

    // Check for issues
    console.log(`\n\n🔍 POTENTIAL ISSUES:`);
    console.log('='.repeat(70));

    const noReceivedAt = await EmailLog.countDocuments({ receivedAt: { $exists: false } });
    if (noReceivedAt > 0) {
      console.log(`❌ ${noReceivedAt} emails missing 'receivedAt' field`);
      console.log('   → This might prevent them from showing in UI');
      console.log('   → Fix: Set receivedAt = createdAt');
    }

    const noDirection = await EmailLog.countDocuments({ direction: { $exists: false } });
    if (noDirection > 0) {
      console.log(`❌ ${noDirection} emails missing 'direction' field`);
    }

    const noCategory = await EmailLog.countDocuments({ category: { $exists: false } });
    if (noCategory > 0) {
      console.log(`⚠️  ${noCategory} emails missing 'category' field`);
    }

    const noProcessingStatus = await EmailLog.countDocuments({ processingStatus: { $exists: false } });
    if (noProcessingStatus > 0) {
      console.log(`⚠️  ${noProcessingStatus} emails missing 'processingStatus' field`);
    }

    // Get tenant IDs
    const tenantIds = await EmailLog.distinct('tenantId');
    console.log(`\n📋 Tenant IDs in emails: ${tenantIds.map(id => id.toString()).join(', ')}`);

    console.log(`\n\n💡 TO FIX AND SHOW IN UI:`);
    console.log('='.repeat(70));
    console.log('1. Set receivedAt field (if missing)');
    console.log('2. Set processingStatus field');
    console.log('3. Ensure tenantId matches your logged-in user');
    console.log('4. Restart backend if not running');
    console.log('5. Hard refresh browser (Ctrl+Shift+R)');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkEmailsForUI().catch(console.error);
