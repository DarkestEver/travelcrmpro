const mongoose = require('mongoose');
const EmailLog = require('./src/models/EmailLog');

async function fixEmailMatches() {
  try {
    await mongoose.connect('mongodb://localhost:27017/travel-crm');
    console.log('✅ Connected to MongoDB\n');

    const email = await EmailLog.findById('69137569bc51b82e755770a3');
    
    if (!email) {
      console.log('❌ Email not found');
      process.exit(1);
    }

    console.log(`📧 Found email: ${email.subject}`);
    console.log(`Current matches: ${email.matchingResults?.length || 0}`);
    
    // Check if data is already correct
    if (email.matchingResults?.[0]?.itineraryTitle) {
      console.log('\n✅ Matches already have full details!');
      console.log('First match:', email.matchingResults[0].itineraryTitle);
    } else {
      console.log('\n⚠️  Matches missing details. Please click "Match Packages" button in the UI.');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixEmailMatches();
