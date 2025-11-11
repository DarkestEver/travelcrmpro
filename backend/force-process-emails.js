/**
 * Force Update and Process Emails (Direct MongoDB)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const EmailLog = require('./src/models/EmailLog');
const openaiService = require('./src/services/openaiService');
const itineraryMatchingService = require('./src/services/itineraryMatchingService');

async function forceProcessEmails() {
  console.log('🔧 Force Processing Emails...\n');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-crm');
    console.log('✅ Connected to MongoDB\n');

    // Get collection directly
    const collection = mongoose.connection.collection('emaillogs');
    
    // Update using native MongoDB
    const updateResult = await collection.updateMany(
      {},
      { 
        $set: { 
          direction: 'incoming',
          status: 'received'
        } 
      }
    );
    
    console.log(`✅ Updated ${updateResult.modifiedCount} emails\n`);

    // Now fetch and process
    const emails = await EmailLog.find({ direction: 'incoming' })
      .sort({ createdAt: -1 })
      .limit(10);

    console.log(`Found ${emails.length} emails to process\n`);

    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];
      console.log(`\n${'='.repeat(70)}`);
      console.log(`📧 ${i + 1}/${emails.length}: ${email.subject}`);
      console.log(`From: ${email.from.email}`);
      console.log('-'.repeat(70));

      try {
        // Categorize
        console.log('1️⃣  Categorizing...');
        const category = await openaiService.categorizeEmail(email, email.tenantId);
        console.log(`   → ${category.category} (${category.confidence}%)`);

        // Update using collection.updateOne
        await collection.updateOne(
          { _id: email._id },
          { 
            $set: { 
              category: category.category,
              'aiProcessing.status': 'processing',
              'aiProcessing.categorization': category
            } 
          }
        );

        if (category.category === 'CUSTOMER') {
          // Extract
          console.log('2️⃣  Extracting...');
          const extracted = await openaiService.extractCustomerInquiry(email, email.tenantId);
          
          console.log(`   → Destination: ${extracted.destination || 'N/A'}`);
          console.log(`   → Dates: ${extracted.dates?.startDate || 'N/A'} to ${extracted.dates?.endDate || 'N/A'}`);
          console.log(`   → Flexible: ${extracted.dates?.flexible}`);
          console.log(`   → Adults: ${extracted.travelers?.adults}, Children: ${extracted.travelers?.children}, Infants: ${extracted.travelers?.infants}`);
          if (extracted.travelers?.childAges?.length > 0) {
            console.log(`   → Ages: [${extracted.travelers.childAges.join(', ')}]`);
          }
          console.log(`   → Budget: $${extracted.budget?.amount || 'Not specified'}`);
          console.log(`   → Missing: ${extracted.missingInfo?.join(', ') || 'None'}`);

          // Match
          console.log('3️⃣  Matching...');
          const workflow = await itineraryMatchingService.processCustomerInquiry(
            email,
            extracted,
            email.tenantId
          );
          
          console.log(`   → Action: ${workflow.action}`);
          if (workflow.itineraries) {
            console.log(`   → Matches: ${workflow.itineraries.length}`);
          }

          // Update with all data
          await collection.updateOne(
            { _id: email._id },
            { 
              $set: { 
                'aiProcessing.status': 'completed',
                'aiProcessing.extractedData': extracted,
                'aiProcessing.workflow': workflow,
                'aiProcessing.completedAt': new Date()
              } 
            }
          );
        } else {
          await collection.updateOne(
            { _id: email._id },
            { 
              $set: { 
                'aiProcessing.status': 'completed',
                'aiProcessing.completedAt': new Date()
              } 
            }
          );
        }

        console.log('✅ DONE!');

      } catch (error) {
        console.error(`❌ Failed: ${error.message}`);
        await collection.updateOne(
          { _id: email._id },
          { 
            $set: { 
              'aiProcessing.status': 'failed',
              'aiProcessing.error': error.message
            } 
          }
        );
      }

      // Delay
      if (i < emails.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log(`\n\n${'='.repeat(70)}`);
    console.log('🎉 ALL DONE!');
    console.log(`\n💡 Check your UI now!`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected');
  }
}

forceProcessEmails().catch(console.error);
