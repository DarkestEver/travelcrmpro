// Cleanup Script: Remove Duplicate Sent Email Records
// Run this ONCE after deploying the fix to clean up existing duplicates

const mongoose = require('mongoose');
const EmailLog = require('./src/models/EmailLog');
const EmailAccount = require('./src/models/EmailAccount');

async function cleanupDuplicateSentEmails() {
  try {
    console.log('🧹 Starting cleanup of duplicate sent email records...\n');
    
    const accounts = await EmailAccount.find({});
    console.log(`📧 Found ${accounts.length} email account(s) to check\n`);
    
    let totalDeleted = 0;
    
    for (const account of accounts) {
      console.log(`\n🔍 Checking account: ${account.imap.username}`);
      
      // Find emails sent from this account that exist in both 'manual' and 'imap' sources
      const sentEmails = await EmailLog.find({
        'from.email': account.imap.username,
        $or: [
          { source: 'manual' },
          { source: 'imap' }
        ]
      }).sort({ receivedAt: 1 });
      
      console.log(`   Found ${sentEmails.length} sent email records`);
      
      // Group by subject and approximate time (within 2 minutes)
      const groups = {};
      
      for (const email of sentEmails) {
        const key = `${email.subject}_${email.to[0]?.email}_${Math.floor(email.receivedAt.getTime() / (2 * 60 * 1000))}`;
        
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(email);
      }
      
      // Process each group
      for (const [key, emails] of Object.entries(groups)) {
        if (emails.length > 1) {
          // Find 'manual' entry (keep this one)
          const manualEntry = emails.find(e => e.source === 'manual');
          
          if (manualEntry) {
            // Delete all 'imap' duplicates
            const duplicates = emails.filter(e => e.source === 'imap' && e._id.toString() !== manualEntry._id.toString());
            
            if (duplicates.length > 0) {
              const idsToDelete = duplicates.map(e => e._id);
              
              console.log(`   🗑️  Deleting ${duplicates.length} duplicate(s) for: "${emails[0].subject}"`);
              console.log(`      Keeping: ${manualEntry._id} (source: manual, ${manualEntry.receivedAt})`);
              
              for (const dup of duplicates) {
                console.log(`      Deleting: ${dup._id} (source: ${dup.source}, ${dup.receivedAt})`);
              }
              
              await EmailLog.deleteMany({ _id: { $in: idsToDelete } });
              totalDeleted += duplicates.length;
            }
          } else {
            // No manual entry, keep oldest
            console.log(`   ⚠️  Found ${emails.length} duplicates but no 'manual' source. Keeping oldest.`);
            const sorted = emails.sort((a, b) => a.receivedAt - b.receivedAt);
            const toKeep = sorted[0];
            const toDelete = sorted.slice(1);
            
            if (toDelete.length > 0) {
              const idsToDelete = toDelete.map(e => e._id);
              console.log(`      Keeping: ${toKeep._id} (source: ${toKeep.source})`);
              console.log(`      Deleting: ${toDelete.map(e => e._id).join(', ')}`);
              
              await EmailLog.deleteMany({ _id: { $in: idsToDelete } });
              totalDeleted += toDelete.length;
            }
          }
        }
      }
    }
    
    console.log(`\n✅ Cleanup complete!`);
    console.log(`📊 Total duplicate records deleted: ${totalDeleted}`);
    
    // Show summary
    const remainingEmails = await EmailLog.aggregate([
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log(`\n📈 Email records by source:`);
    for (const stat of remainingEmails) {
      console.log(`   ${stat._id}: ${stat.count}`);
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-crm';

mongoose.connect(mongoUri)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    return cleanupDuplicateSentEmails();
  })
  .catch(error => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });
