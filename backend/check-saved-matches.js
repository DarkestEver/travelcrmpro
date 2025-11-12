require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');

// Use EmailLog model (emails are stored here)
const EmailLog = require(path.join(__dirname, 'src/models/EmailLog'));

async function checkSavedMatches() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const emailId = '69137569bc51b82e755770a3'; // Your email ID
    const email = await EmailLog.findById(emailId).lean();

    if (!email) {
      console.log('❌ Email not found');
      return;
    }

    console.log('📧 Email Subject:', email.subject);
    console.log('📍 Destination:', email.extractedData?.destination);
    console.log('💰 Budget:', email.extractedData?.budget?.amount);
    console.log('\n📦 Saved Matches in Database:\n');

    if (!email.matchingResults || email.matchingResults.length === 0) {
      console.log('❌ No matches saved in database!');
      console.log('\nThis means the match API worked but did not save to the email document.');
    } else {
      console.log(`✅ Found ${email.matchingResults.length} saved matches:\n`);
      email.matchingResults.forEach((match, idx) => {
        console.log(`${idx + 1}. ${match.itineraryTitle || 'Untitled'}`);
        console.log(`   Score: ${match.score}/100`);
        console.log(`   Destination: ${match.destination || 'N/A'}`);
        console.log(`   Price: ${match.currency} ${match.price || 'N/A'}`);
        console.log(`   Duration: ${match.duration || 'N/A'} days`);
        console.log(`   Package ID: ${match.packageId}`);
        console.log(`   Match Reasons: ${match.matchReasons?.join(', ') || 'None'}`);
        console.log('');
      });
    }

    mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkSavedMatches();
