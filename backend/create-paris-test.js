/**
 * Create Test Case #1: Paris Family Vacation with Sarah Johnson
 */

const mongoose = require('mongoose');
const EmailLog = require('./src/models/EmailLog');

async function createParisTestEmail() {
  try {
    await mongoose.connect('mongodb://localhost:27017/travel-crm');
    console.log('✅ Connected to MongoDB\n');

    const tenantId = '690ce6d206c104addbfedb65';
    const emailAccountId = '6910eef8ad00888b4c012e75';

    // Test Case #1: Complete Email with Specific Dates
    const testEmail = {
      messageId: `test-paris-complete-${Date.now()}@test.com`,
      emailAccountId,
      from: {
        email: 'sarah.johnson@techinnovations.com',
        name: 'Sarah Johnson'
      },
      to: [
        {
          email: 'app@travelmanagerpro.com',
          name: 'Travel Agent'
        }
      ],
      subject: 'Paris Family Vacation Inquiry',
      bodyText: `Hi,

I'm interested in planning a family trip to Paris from December 20-27. We are 2 adults and 2 children aged 8 and 12 years old.

Our budget is around $8,000 total for the entire trip.

We'd prefer 4-star hotels near the Eiffel Tower, and we're interested in sightseeing tours and museum visits.

Looking forward to your suggestions!

Best regards,
Sarah Johnson
Senior Marketing Manager
Tech Innovations Inc.
Phone: +1-555-123-4567
Email: sarah.johnson@techinnovations.com
123 Business Avenue, Suite 500
New York, NY 10001`,
      bodyHtml: `<p>Hi,</p>
<p>I'm interested in planning a family trip to Paris from December 20-27. We are 2 adults and 2 children aged 8 and 12 years old.</p>
<p>Our budget is around $8,000 total for the entire trip.</p>
<p>We'd prefer 4-star hotels near the Eiffel Tower, and we're interested in sightseeing tours and museum visits.</p>
<p>Looking forward to your suggestions!</p>
<p>Best regards,<br>
Sarah Johnson<br>
Senior Marketing Manager<br>
Tech Innovations Inc.<br>
Phone: +1-555-123-4567<br>
Email: sarah.johnson@techinnovations.com<br>
123 Business Avenue, Suite 500<br>
New York, NY 10001</p>`,
      receivedAt: new Date(),
      direction: 'incoming',
      source: 'webhook',
      tenantId,
      processingStatus: 'pending'
    };

    console.log('📧 Creating Paris Family Vacation Inquiry...');
    const email = await EmailLog.create(testEmail);
    console.log(`✅ Email created with ID: ${email._id}`);
    console.log(`   Subject: ${email.subject}`);
    console.log(`   From: ${email.from.name} <${email.from.email}>`);
    
    console.log('\n💡 Now run: node process-emails-simple.js');
    
    await mongoose.disconnect();
    console.log('\n✅ Done!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

createParisTestEmail();
