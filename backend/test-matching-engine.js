require('dotenv').config();
const mongoose = require('mongoose');
const matchingEngine = require('./src/services/matchingEngine'); // Already an instance

async function testMatching() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const tenantId = '690ce6d206c104addbfedb65';
    
    const extractedData = {
      destination: 'Paris',
      dates: {
        preferredStart: '2025-06-01',
        duration: 10
      },
      travelers: {
        adults: 2
      },
      budget: {
        amount: 4500,
        currency: 'USD'
      },
      packageType: 'honeymoon'
    };

    console.log('🔍 Testing matching engine with:', extractedData);
    console.log('\n---\n');

    const matches = await matchingEngine.matchPackages(extractedData, tenantId);

    console.log(`\n✅ Found ${matches.length} matches\n`);

    if (matches.length > 0) {
      console.log('📦 First match structure:');
      console.log(JSON.stringify(matches[0], null, 2));
      console.log('\n---\n');

      matches.forEach((match, idx) => {
        console.log(`${idx + 1}. Package ID: ${match.package?._id}`);
        console.log(`   Title: ${match.package?.title || 'MISSING TITLE'}`);
        console.log(`   Destination: ${JSON.stringify(match.package?.destination)}`);
        console.log(`   Duration: ${JSON.stringify(match.package?.duration)}`);
        console.log(`   EstimatedCost: ${JSON.stringify(match.package?.estimatedCost)}`);
        console.log(`   Score: ${match.score}/100`);
        console.log('');
      });
    } else {
      console.log('❌ No matches found!');
    }

    mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testMatching();
