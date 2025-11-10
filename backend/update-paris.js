const mongoose = require('mongoose');
require('dotenv').config();
const EmailLog = require('./src/models/EmailLog');

async function updateEmail() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected\n');
  
  const email = await EmailLog.findById('69126a222d6a7a37eadf12a6');
  console.log('Before update:');
  console.log('  extractedData:', !!email.extractedData);
  console.log('  aiResponse:', !!email.aiResponse);
  console.log();
  
  // Set the data
  email.extractedData = {
    destination: 'Paris',
    dates: { checkIn: '2025-12-20', checkOut: '2025-12-27', nights: 7 },
    travelers: { adults: 2, children: 2 },
    budget: { total: 8000, currency: 'USD' },
    customerInfo: { name: 'John Doe', email: 'john@example.com', phone: '+1-555-1234' }
  };
  email.aiResponse = 'Thank you for your inquiry!';
  email.responseGenerated = true;
  
  try {
    await email.save();
    console.log('✅ Save successful\n');
  } catch (error) {
    console.error('❌ Save failed:', error.message);
  }
  
  // Check if it saved
  const check = await EmailLog.findById('69126a222d6a7a37eadf12a6');
  console.log('After update:');
  console.log('  extractedData:', !!check.extractedData);
  console.log('  aiResponse:', !!check.aiResponse);
  
  if (check.extractedData) {
    console.log('\n📋 Extracted Data:');
    console.log(JSON.stringify(check.extractedData, null, 2));
  }
  
  process.exit(0);
}

updateEmail().catch(console.error);
