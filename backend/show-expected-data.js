// Show what should appear in the frontend
require('dotenv').config();
const mongoose = require('mongoose');

async function showExpectedData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-crm');
    console.log('✅ Connected to MongoDB\n');

    const EmailLog = require('./src/models/EmailLog');
    
    const tenantId = '690ce6d206c104addbfedb65';
    
    const emails = await EmailLog.find({ tenantId })
      .sort({ receivedAt: -1 })
      .limit(10)
      .select('-bodyHtml -bodyText -headers')
      .lean();
    
    console.log('📊 WHAT SHOULD APPEAR IN THE FRONTEND:\n');
    console.log(`Total Emails: ${emails.length}\n`);
    console.log('═══════════════════════════════════════════════════════════\n');
    
    emails.forEach((email, index) => {
      console.log(`${index + 1}. Email:`);
      console.log(`   Date/Time: ${new Date(email.receivedAt).toLocaleString()}`);
      console.log(`   From: ${email.from.email}`);
      console.log(`   Subject: ${email.subject}`);
      console.log(`   Source: ${email.source}`);
      console.log(`   Category: ${email.category || 'N/A'}`);
      console.log(`   Status: ${email.processingStatus}`);
      console.log(`   Time: ${new Date(email.receivedAt).toLocaleTimeString()}`);
      
      if (email.category === 'CUSTOMER' && email.extractedData) {
        console.log(`   ✅ AI Processed - View Details Available`);
        console.log(`      - Destination: ${email.extractedData.destination}`);
        console.log(`      - Confidence: ${email.categoryConfidence}%`);
        console.log(`      - Budget: $${email.extractedData.budget?.amount} ${email.extractedData.budget?.currency}`);
      }
      
      console.log('');
    });
    
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('🔧 TO FIX THE FRONTEND:\n');
    console.log('1. Backend server needs to restart to pick up new JWT settings');
    console.log('2. Stop the backend (Ctrl+C in Chrome terminal)');
    console.log('3. Start it again: npm run dev');
    console.log('4. Refresh the frontend browser\n');

    await mongoose.connection.close();
    console.log('✅ Connection closed');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

console.log('══════════════════════════════════════════════════════════════');
console.log('  EXPECTED FRONTEND DATA');
console.log('══════════════════════════════════════════════════════════════\n');

showExpectedData();
