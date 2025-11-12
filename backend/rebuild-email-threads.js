/**
 * Rebuild Email Threading
 * 
 * This script rebuilds threading metadata for all existing emails.
 * Run this after deploying the email threading feature to link
 * existing emails into conversation threads.
 * 
 * Usage:
 *   node rebuild-email-threads.js <tenantId>
 */

require('dotenv').config();
const mongoose = require('mongoose');
const EmailThreadingService = require('./src/services/emailThreadingService');

async function rebuildThreads() {
  try {
    console.log('🔗 Starting email thread rebuild...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get tenant ID from command line or env
    const tenantId = process.argv[2] || process.env.TENANT_ID;
    
    if (!tenantId) {
      console.error('❌ Error: Please provide a tenant ID');
      console.log('Usage: node rebuild-email-threads.js <tenantId>');
      process.exit(1);
    }

    console.log(`📧 Rebuilding threads for tenant: ${tenantId}\n`);

    // Run rebuild
    const result = await EmailThreadingService.rebuildAllThreads(tenantId);

    console.log('\n✅ Thread rebuild complete!');
    console.log(`\nResults:`);
    console.log(`- Total emails processed: ${result.totalProcessed}`);
    console.log(`- Threads created: ${result.threadsCreated}`);
    console.log(`- Replies linked: ${result.repliesLinked}`);
    console.log(`- Forwards detected: ${result.forwardsDetected}`);
    console.log(`- Errors: ${result.errors}`);

    if (result.errorDetails && result.errorDetails.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      result.errorDetails.forEach(error => {
        console.log(`  - ${error}`);
      });
    }

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
rebuildThreads();
