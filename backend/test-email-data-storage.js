/**
 * Test to verify email processing saves all data correctly
 */

require('dotenv').config();
const mongoose = require('mongoose');
const EmailLog = require('./src/models/EmailLog');
const Tenant = require('./src/models/Tenant');

async function checkSavedData() {
  console.log('🔍 Checking Email Processing Data Storage\n');
  
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-crm');
    console.log('✅ Connected to MongoDB\n');
    
    // Get a tenant with itineraries
    const tenant = await Tenant.findOne({}).lean();
    if (!tenant) {
      console.log('❌ No tenants found in database');
      return;
    }
    
    console.log(`📌 Using Tenant: ${tenant.businessName || tenant._id}\n`);
    
    // Get recent processed emails
    const recentEmails = await EmailLog.find({
      tenantId: tenant._id,
      processingStatus: 'completed'
    })
    .sort({ processedAt: -1 })
    .limit(5)
    .lean();
    
    console.log(`📧 Found ${recentEmails.length} processed emails\n`);
    
    if (recentEmails.length === 0) {
      console.log('⚠️  No processed emails found. Process some emails first.');
      return;
    }
    
    // Check what data is being saved
    recentEmails.forEach((email, idx) => {
      console.log('='.repeat(80));
      console.log(`📧 Email ${idx + 1}: ${email.subject}`);
      console.log('='.repeat(80));
      
      console.log('\n📋 Basic Info:');
      console.log(`   From: ${email.from?.name || ''} <${email.from?.email}>`);
      console.log(`   Received: ${email.receivedAt}`);
      console.log(`   Status: ${email.processingStatus}`);
      console.log(`   Category: ${email.category} (${email.categoryConfidence}% confidence)`);
      
      console.log('\n🤖 AI Processing:');
      console.log(`   OpenAI Cost: $${email.openaiCost?.toFixed(4) || 0}`);
      console.log(`   Tokens Used: ${email.tokensUsed || 0}`);
      
      if (email.extractedData) {
        console.log('\n📊 Extracted Data:');
        console.log(`   ✅ Customer Info: ${email.extractedData.customerInfo ? 'Yes' : 'No'}`);
        if (email.extractedData.customerInfo) {
          const info = email.extractedData.customerInfo;
          console.log(`      - Name: ${info.name || 'N/A'}`);
          console.log(`      - Email: ${info.email || 'N/A'}`);
          console.log(`      - Phone: ${info.phone || 'N/A'}`);
          console.log(`      - Company: ${info.company || 'N/A'}`);
        }
        console.log(`   ✅ Destination: ${email.extractedData.destination || 'N/A'}`);
        console.log(`   ✅ Dates: ${email.extractedData.dates?.startDate ? 'Yes' : 'No'}`);
        console.log(`   ✅ Travelers: ${email.extractedData.travelers?.adults || 0} adults`);
        console.log(`   ✅ Budget: ${email.extractedData.budget?.amount || 'N/A'} ${email.extractedData.budget?.currency || ''}`);
      }
      
      if (email.signatureImageProcessed) {
        console.log('\n🖼️  Signature Image Processing:');
        console.log(`   ✅ Processed: Yes`);
        console.log(`   Images: ${email.signatureImageData?.processedImages || 0}`);
        console.log(`   Contacts Found: ${email.signatureImageData?.extractedContacts?.length || 0}`);
        console.log(`   Cost: $${email.signatureImageData?.cost?.toFixed(4) || 0}`);
      } else {
        console.log('\n🖼️  Signature Image Processing: ❌ Not processed');
      }
      
      if (email.itineraryMatching) {
        console.log('\n🗺️  Itinerary Matching:');
        console.log(`   ✅ Workflow Action: ${email.itineraryMatching.workflowAction || 'N/A'}`);
        console.log(`   Reason: ${email.itineraryMatching.reason || 'N/A'}`);
        console.log(`   Matches Found: ${email.itineraryMatching.matchCount || 0}`);
        
        if (email.itineraryMatching.validation) {
          console.log(`   Validation:`);
          console.log(`      - Valid: ${email.itineraryMatching.validation.isValid ? 'Yes' : 'No'}`);
          console.log(`      - Completeness: ${(email.itineraryMatching.validation.completeness * 100).toFixed(0)}%`);
          console.log(`      - Missing: ${email.itineraryMatching.validation.missingFields?.join(', ') || 'None'}`);
        }
        
        if (email.itineraryMatching.topMatches?.length > 0) {
          console.log(`   Top Matches:`);
          email.itineraryMatching.topMatches.forEach((match, i) => {
            console.log(`      ${i + 1}. ${match.title} (${match.score}%)`);
          });
        }
      } else {
        console.log('\n🗺️  Itinerary Matching: ❌ Not saved');
      }
      
      if (email.matchingResults?.length > 0) {
        console.log('\n📦 Package Matches:');
        console.log(`   Found: ${email.matchingResults.length} packages`);
        email.matchingResults.forEach((match, i) => {
          console.log(`      ${i + 1}. Package ${match.packageId} (${match.score}%)`);
        });
      }
      
      if (email.generatedResponse) {
        console.log('\n✉️  Generated Response:');
        console.log(`   ✅ Subject: ${email.generatedResponse.subject || 'N/A'}`);
        console.log(`   Template: ${email.generatedResponse.templateType || 'N/A'}`);
        console.log(`   Cost: $${email.generatedResponse.cost?.toFixed(4) || 0}`);
        console.log(`   Tokens: ${email.generatedResponse.tokens?.total || 0}`);
        console.log(`   Body Length: ${email.generatedResponse.body?.length || 0} chars`);
      } else {
        console.log('\n✉️  Generated Response: ❌ Not saved');
      }
      
      console.log('');
    });
    
    // Summary
    console.log('='.repeat(80));
    console.log('📊 DATA STORAGE SUMMARY');
    console.log('='.repeat(80));
    
    const withItineraryMatching = recentEmails.filter(e => e.itineraryMatching).length;
    const withGeneratedResponse = recentEmails.filter(e => e.generatedResponse).length;
    const withSignatureImages = recentEmails.filter(e => e.signatureImageProcessed).length;
    const withExtractedData = recentEmails.filter(e => e.extractedData).length;
    
    console.log(`\n✅ Emails with Extracted Data: ${withExtractedData}/${recentEmails.length}`);
    console.log(`✅ Emails with Signature Processing: ${withSignatureImages}/${recentEmails.length}`);
    console.log(`✅ Emails with Itinerary Matching: ${withItineraryMatching}/${recentEmails.length}`);
    console.log(`✅ Emails with Generated Response: ${withGeneratedResponse}/${recentEmails.length}`);
    
    if (withItineraryMatching === 0) {
      console.log('\n⚠️  WARNING: No emails have itineraryMatching data saved!');
      console.log('   This field was added recently. Process new emails to see this data.');
    }
    
    if (withGeneratedResponse === 0) {
      console.log('\n⚠️  WARNING: No emails have generatedResponse data saved!');
      console.log('   This field was added recently. Process new emails to see this data.');
    }
    
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run check
if (require.main === module) {
  checkSavedData().catch(console.error);
}

module.exports = { checkSavedData };
