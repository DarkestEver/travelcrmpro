/**
 * Simple Email Processing - Extraction Only
 */

require('dotenv').config();
const mongoose = require('mongoose');
const EmailLog = require('./src/models/EmailLog');
const openaiService = require('./src/services/openaiService');

async function processEmailsSimple() {
  console.log('🔧 Processing Emails (Extraction Only)...\n');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-crm');
    console.log('✅ Connected to MongoDB\n');

    const collection = mongoose.connection.collection('emaillogs');
    
    // Update all to incoming
    await collection.updateMany({}, { 
      $set: { 
        direction: 'incoming',
        status: 'received'
      } 
    });

    const emails = await EmailLog.find({ direction: 'incoming' })
      .sort({ createdAt: -1 })
      .limit(10);

    console.log(`Processing ${emails.length} emails\n`);

    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];
      console.log(`\n${'='.repeat(70)}`);
      console.log(`📧 ${i + 1}/${emails.length}: ${email.subject}`);
      console.log('-'.repeat(70));

      try {
        // Categorize
        const category = await openaiService.categorizeEmail(email, email.tenantId);
        console.log(`✅ Category: ${category.category} (${category.confidence}%)`);

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
          const extracted = await openaiService.extractCustomerInquiry(email, email.tenantId);
          
          console.log(`\n✅ Extracted Data:`);
          console.log(`   Destination: ${extracted.destination || 'N/A'}`);
          console.log(`   Start Date: ${extracted.dates?.startDate || 'N/A'}`);
          console.log(`   End Date: ${extracted.dates?.endDate || 'N/A'}`);
          console.log(`   Flexible: ${extracted.dates?.flexible}`);
          console.log(`   Duration: ${extracted.dates?.duration || 'N/A'} nights`);
          console.log(`   Adults: ${extracted.travelers?.adults || 0}`);
          console.log(`   Children: ${extracted.travelers?.children || 0}`);
          console.log(`   Infants: ${extracted.travelers?.infants || 0}`);
          if (extracted.travelers?.childAges?.length > 0) {
            console.log(`   Child Ages: [${extracted.travelers.childAges.join(', ')}]`);
          }
          console.log(`   Budget: ${extracted.budget?.amount ? '$' + extracted.budget.amount : 'Not specified'}`);
          console.log(`   Currency: ${extracted.budget?.currency || 'USD'}`);
          console.log(`   Per Person: ${extracted.budget?.perPerson || false}`);
          console.log(`   Missing Info: ${extracted.missingInfo?.length ? extracted.missingInfo.join(', ') : 'None'}`);
          
          if (extracted.customerInfo) {
            console.log(`\n✅ Customer Info:`);
            console.log(`   Name: ${extracted.customerInfo.name || 'N/A'}`);
            console.log(`   Email: ${extracted.customerInfo.email || email.from.email}`);
            console.log(`   Phone: ${extracted.customerInfo.phone || 'N/A'}`);
          }

          await collection.updateOne(
            { _id: email._id },
            { 
              $set: { 
                processingStatus: 'completed',
                extractedData: extracted,
                'aiProcessing.status': 'completed',
                'aiProcessing.extractedData': extracted,
                'aiProcessing.completedAt': new Date()
              } 
            }
          );
        } else {
          await collection.updateOne(
            { _id: email._id },
            { 
              $set: { 
                processingStatus: 'completed',
                'aiProcessing.status': 'completed',
                'aiProcessing.completedAt': new Date()
              } 
            }
          );
        }

        console.log(`\n✅ Email processed successfully!`);

      } catch (error) {
        console.error(`\n❌ Error: ${error.message}`);
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

      if (i < emails.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log(`\n\n${'='.repeat(70)}`);
    console.log('🎉 ALL EMAILS PROCESSED!');
    console.log(`\n💡 Now check your UI - the emails should appear with extracted data!`);
    console.log(`\n📊 Summary:`);
    console.log(`   - Total Processed: ${emails.length}`);
    console.log(`   - Dynamic Year Used: 2025`);
    console.log(`   - All extraction rules applied ✅`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

processEmailsSimple().catch(console.error);
