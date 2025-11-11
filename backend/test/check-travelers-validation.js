/**
 * Test: Missing Travelers - Check Processed Email
 * Sends email without travelers and checks the database result
 */

const mongoose = require('mongoose');
require('dotenv').config();

const EmailLog = require('../src/models/EmailLog');

console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
console.log('║       CHECK: Recent Emails for Missing Travelers Handling           ║');
console.log('╚══════════════════════════════════════════════════════════════════════╝\n');

async function checkRecentEmails() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Find recent emails processed in last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const recentEmails = await EmailLog.find({
      receivedAt: { $gte: fiveMinutesAgo },
      category: 'CUSTOMER'
    })
      .sort({ receivedAt: -1 })
      .limit(5);

    console.log(`Found ${recentEmails.length} recent customer emails\n`);

    for (const email of recentEmails) {
      console.log('━'.repeat(70));
      console.log(`\n📧 Email ID: ${email._id}`);
      console.log(`   From: ${email.from.email}`);
      console.log(`   Subject: ${email.subject}`);
      console.log(`   Status: ${email.processingStatus}`);
      console.log(`   Category: ${email.category}`);

      if (email.extractedData) {
        const data = email.extractedData;
        console.log(`\n   📊 Extracted Data:`);
        console.log(`      Destination: ${data.destination || 'NOT EXTRACTED'}`);
        console.log(`      Adults: ${data.travelers?.adults ?? 'NOT EXTRACTED'}`);
        console.log(`      Children: ${data.travelers?.children ?? 0}`);
        console.log(`      Budget: $${data.budget?.amount || 'NOT EXTRACTED'}`);

        if (data.missingInfo && data.missingInfo.length > 0) {
          console.log(`\n   ⚠️  Missing Info Detected:`);
          data.missingInfo.forEach(field => {
            console.log(`      • ${field}`);
          });
        }
      }

      if (email.itineraryMatching) {
        const matching = email.itineraryMatching;
        console.log(`\n   🔄 Workflow:`);
        console.log(`      Action: ${matching.workflowAction}`);
        console.log(`      Reason: ${matching.reason || 'N/A'}`);
        console.log(`      Matches: ${matching.matchCount || 0}`);

        if (matching.validation) {
          const validation = matching.validation;
          console.log(`\n   ✓ Validation:`);
          console.log(`      Valid: ${validation.isValid}`);
          console.log(`      Completeness: ${Math.round(validation.completeness * 100)}%`);

          if (validation.missingFields && validation.missingFields.length > 0) {
            console.log(`\n      Missing Fields:`);
            validation.missingFields.forEach(field => {
              const icon = field.field === 'travelers' ? '👥' : '❓';
              console.log(`        ${icon} ${field.label}`);
              console.log(`           Priority: ${field.priority}`);
              console.log(`           Question: "${field.question}"`);

              if (field.field === 'travelers') {
                console.log(`           ✅ TRAVELERS CORRECTLY FLAGGED AS MISSING!`);
              }
            });
          }
        }

        if (matching.workflowAction === 'ASK_CUSTOMER') {
          console.log(`\n      ✅ CORRECT! System will ask customer for more info`);
        }
      }

      console.log('');
    }

    console.log('━'.repeat(70));
    console.log('\n✅ Analysis complete!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkRecentEmails();
