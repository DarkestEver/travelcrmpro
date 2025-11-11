/**
 * Process Specific Email by ID
 */

const mongoose = require('mongoose');
const EmailLog = require('./src/models/EmailLog');
const openaiService = require('./src/services/openaiService');

async function processSpecificEmail(emailId) {
  try {
    await mongoose.connect('mongodb://localhost:27017/travel-crm');
    console.log('✅ Connected to MongoDB\n');

    const email = await EmailLog.findById(emailId);
    
    if (!email) {
      console.log('❌ Email not found');
      return;
    }

    console.log('📧 Email Found:');
    console.log(`   Subject: ${email.subject}`);
    console.log(`   From: ${email.from.email}`);
    console.log(`   Current Status: ${email.processingStatus}\n`);

    // Step 1: Categorize
    console.log('🤖 Step 1: Categorizing email...');
    const categorization = await openaiService.categorizeEmail(
      email,
      email.tenantId.toString()
    );
    
    email.category = categorization.category;
    email.confidence = categorization.confidence;
    email.aiProcessing = {
      ...email.aiProcessing,
      categorization: categorization
    };
    
    console.log(`   ✅ Category: ${categorization.category} (${categorization.confidence}%)`);

    // Step 2: Extract Data (if CUSTOMER email)
    if (categorization.category === 'CUSTOMER') {
      console.log('\n🤖 Step 2: Extracting data...');
      const extraction = await openaiService.extractCustomerData(
        email,
        email.tenantId.toString()
      );
      
      email.extractedData = extraction;
      email.processingStatus = 'completed';
      
      console.log('   ✅ Extraction complete!\n');
      console.log('📊 EXTRACTED DATA:');
      console.log(JSON.stringify(extraction, null, 2));
    } else {
      email.processingStatus = 'completed';
      console.log('\n   ℹ️  Not a customer email, skipping extraction');
    }

    await email.save();
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ EMAIL PROCESSED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('\n💡 Now refresh your UI (Ctrl+Shift+R) to see this email!');
    console.log(`   Subject: ${email.subject}`);
    console.log(`   Category: ${email.category}`);
    if (email.extractedData) {
      console.log(`   Destination: ${email.extractedData.destination}`);
      console.log(`   Dates: ${email.extractedData.dates?.startDate} to ${email.extractedData.dates?.endDate}`);
    }
    console.log('='.repeat(60));
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Get email ID from command line argument
const emailId = process.argv[2] || '6912e3371f3db5194031d421';

console.log('🔄 Processing Email ID:', emailId);
console.log('');

processSpecificEmail(emailId);
