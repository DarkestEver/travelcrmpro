/**
 * Manually process a specific email through the AI pipeline
 */

const mongoose = require('mongoose');
require('dotenv').config();

const EmailLog = require('./src/models/EmailLog');
const emailProcessingQueue = require('./src/services/emailProcessingQueue');

async function processEmail() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-crm');
    console.log('✅ Connected to MongoDB\n');

    // Get the Bali email
    const email = await EmailLog.findOne({ subject: /honeymoon to Bali v1/i });
    
    if (!email) {
      console.log('❌ Email not found');
      mongoose.connection.close();
      return;
    }

    console.log('📧 Found email:');
    console.log('- ID:', email._id.toString());
    console.log('- Subject:', email.subject);
    console.log('- From:', email.from?.email);
    console.log('- TenantID:', email.tenantId.toString());
    console.log('');

    console.log('🚀 Adding to AI processing queue...\n');

    try {
      await emailProcessingQueue.addToQueue(
        email._id.toString(),
        email.tenantId.toString(),
        'high' // High priority for manual processing
      );

      console.log('✅ Email added to processing queue successfully!');
      console.log('');
      console.log('The AI will now:');
      console.log('1. Categorize the email');
      console.log('2. Extract travel details (destination, dates, travelers, budget)');
      console.log('3. Match with available packages');
      console.log('4. Generate response');
      console.log('');
      console.log('Check the UI in a few seconds to see the results!');
      
      // Wait a bit to see console output
      await new Promise(resolve => setTimeout(resolve, 15000));
      
    } catch (error) {
      console.error('❌ Error adding to queue:', error);
    }

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

processEmail();
