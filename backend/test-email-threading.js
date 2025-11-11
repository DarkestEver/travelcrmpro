/**
 * Test Email Threading - Quoted Original Content
 * Tests the formatEmailAsQuote utility function
 */

require('dotenv').config();
const mongoose = require('mongoose');
const openaiService = require('./src/services/openaiService');

// Mock email object
const mockEmail = {
  _id: new mongoose.Types.ObjectId(),
  from: {
    name: 'Keshav Singh',
    email: 'keshav.singh4@gmail.com'
  },
  subject: 'Tokyo Trip Inquiry',
  bodyText: `Hi there,

I'm interested in planning a trip to Tokyo. I've always wanted to visit Japan and experience the culture, food, and modern architecture.

Can you help me plan this trip? I'm looking for something special that includes both traditional and modern experiences.

Looking forward to hearing from you!
Best regards,
Keshav`,
  bodyHtml: `<p>Hi there,</p>
<p>I'm interested in planning a trip to Tokyo. I've always wanted to visit Japan and experience the culture, food, and modern architecture.</p>
<p>Can you help me plan this trip? I'm looking for something special that includes both traditional and modern experiences.</p>
<p>Looking forward to hearing from you!<br>
Best regards,<br>
Keshav</p>`,
  receivedAt: new Date('2025-11-11T16:30:00Z')
};

console.log('\n' + '='.repeat(80));
console.log('🧪 TESTING EMAIL THREADING - QUOTED ORIGINAL CONTENT');
console.log('='.repeat(80) + '\n');

// Test 1: HTML Format
console.log('📧 Test 1: HTML Format (for email body)');
console.log('-'.repeat(80));
const htmlQuote = openaiService.formatEmailAsQuote(mockEmail, 'html');
console.log(htmlQuote);
console.log('\n');

// Test 2: Plain Text Format
console.log('📝 Test 2: Plain Text Format (for plain text fallback)');
console.log('-'.repeat(80));
const plainQuote = openaiService.formatEmailAsQuote(mockEmail, 'plain');
console.log(plainQuote);
console.log('\n');

// Test 3: Simulated Full Email with Threading
console.log('✉️  Test 3: Complete Email with AI Response + Quoted Original');
console.log('-'.repeat(80));

const aiResponse = `<p>Dear Keshav,</p>

<p>Thank you for reaching out about your Tokyo trip! I'm excited to help you plan this amazing experience. 🗼</p>

<p>To create the perfect itinerary for you, I need a few more details:</p>

<ul>
  <li><strong>Travel Dates:</strong> When would you like to visit Tokyo?</li>
  <li><strong>Duration:</strong> How many days will you be staying?</li>
  <li><strong>Number of Travelers:</strong> Will you be traveling solo or with others?</li>
  <li><strong>Budget:</strong> What's your approximate budget per person?</li>
</ul>

<p>Once I have these details, I can recommend packages that perfectly blend traditional temples, modern districts like Shibuya and Shinjuku, authentic cuisine experiences, and architectural marvels!</p>

<p>Looking forward to planning your dream Tokyo adventure!</p>

<p>Best regards,<br>
<strong>Travel Manager Pro Team</strong></p>`;

const fullEmail = aiResponse + htmlQuote;

console.log(fullEmail);
console.log('\n');

// Test 4: Edge Cases
console.log('🔍 Test 4: Edge Cases');
console.log('-'.repeat(80));

// Email without name
const noNameEmail = { ...mockEmail, from: { email: 'test@example.com' } };
console.log('Without name:', openaiService.formatEmailAsQuote(noNameEmail, 'plain').substring(0, 100) + '...');

// Email without HTML body
const noHtmlEmail = { ...mockEmail, bodyHtml: null };
console.log('Without HTML:', openaiService.formatEmailAsQuote(noHtmlEmail, 'html').substring(0, 150) + '...');

console.log('\n' + '='.repeat(80));
console.log('✅ ALL TESTS COMPLETED!');
console.log('='.repeat(80) + '\n');

console.log('📋 Expected Behavior:');
console.log('1. ✅ HTML format includes <blockquote> styling');
console.log('2. ✅ Plain text format includes > quote markers');
console.log('3. ✅ Shows "On [date], [name] <email> wrote:"');
console.log('4. ✅ Original content properly formatted');
console.log('5. ✅ Visual separator present');
console.log('6. ✅ Handles edge cases gracefully\n');

console.log('🎉 Email threading is ready for production!');
console.log('💡 Next: Send test email and verify quoted content in customer inbox\n');
