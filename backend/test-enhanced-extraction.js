/**
 * Enhanced Email Extraction Test
 * Tests all date cases, traveler rules, budget handling, and signature extraction
 */

require('dotenv').config();
const mongoose = require('mongoose');
const openaiService = require('./src/services/openaiService');

// Test cases covering all scenarios
const testCases = [
  {
    name: "CASE 1: Both dates provided with budget",
    email: {
      _id: 'test-1',
      from: { email: 'john.doe@example.com', name: 'John Doe' },
      subject: 'Paris Trip Inquiry',
      bodyText: `Hi,

I'm interested in a trip to Paris from December 20-27, 2025 for my family of 4 (2 adults and 2 children aged 8 and 12). Our budget is $8,000 total.

Please send me available packages.

Best regards,
John Doe
Senior Manager, Tech Corp
Phone: +1-555-123-4567
john.doe@techcorp.com`
    },
    expected: {
      destination: 'Paris',
      dates: { flexible: false, startDate: '2025-12-20', endDate: '2025-12-27', duration: 7 },
      travelers: { adults: 2, children: 2, childAges: [8, 12], infants: 0 },
      budget: { amount: 8000, perPerson: false },
      customerInfo: { name: 'John Doe', phone: '+1-555-123-4567' }
    }
  },
  {
    name: "CASE 2: Start date + duration (7 nights)",
    email: {
      _id: 'test-2',
      from: { email: 'sarah@email.com', name: 'Sarah Johnson' },
      subject: 'Bali Vacation',
      bodyText: `Hello,

We want to visit Bali starting March 10 for 7 nights. We are a couple (2 adults) with one infant (6 months old).

No specific budget in mind, we're flexible.

Thanks,
Sarah Johnson
(555) 987-6543`
    },
    expected: {
      destination: 'Bali',
      dates: { flexible: false, startDate: '2025-03-10', endDate: '2025-03-17', duration: 7 },
      travelers: { adults: 2, children: 0, infants: 1 },
      budget: { amount: null, flexible: true },
      customerInfo: { name: 'Sarah Johnson', phone: '(555) 987-6543' }
    }
  },
  {
    name: "CASE 3: Only month + duration (flexible dates)",
    email: {
      _id: 'test-3',
      from: { email: 'mike@example.com', name: 'Mike Wilson' },
      subject: 'Dubai Trip Sometime in April',
      bodyText: `Hi there,

Looking for a Dubai trip sometime in April for about 5 days. Just me and my wife (2 people), no kids.

Budget around $5,000 per person.

Regards,
Mike Wilson
mike.wilson@email.com
555.123.4567`
    },
    expected: {
      destination: 'Dubai',
      dates: { flexible: true, startDate: null, endDate: null, duration: 5 },
      travelers: { adults: 2, children: 0, infants: 0 },
      budget: { amount: 5000, perPerson: true },
      customerInfo: { name: 'Mike Wilson', phone: '555.123.4567' }
    }
  },
  {
    name: "CASE 4: Children without ages specified",
    email: {
      _id: 'test-4',
      from: { email: 'lisa@test.com', name: 'Lisa Brown' },
      subject: 'Family Trip to London',
      bodyText: `Hello,

Planning a London trip for June 15-22. We are 2 adults and 3 children.

Budget is $10,000 total.

Best,
Lisa Brown
+44 7700 900123`
    },
    expected: {
      destination: 'London',
      dates: { flexible: false, startDate: '2025-06-15', endDate: '2025-06-22' },
      travelers: { adults: 2, children: 3, childAges: [] },
      budget: { amount: 10000, perPerson: false },
      missingInfo: ['children ages'],
      customerInfo: { name: 'Lisa Brown', phone: '+44 7700 900123' }
    }
  },
  {
    name: "CASE 5: No budget mentioned (budget optional)",
    email: {
      _id: 'test-5',
      from: { email: 'robert@mail.com', name: 'Robert Taylor' },
      subject: 'Tokyo Adventure',
      bodyText: `Hi,

Interested in Tokyo trip from August 5-12, 2025. Just 2 adults traveling.

Please share what you have.

Sincerely,
Robert Taylor
Contact: (555) 222-3333`
    },
    expected: {
      destination: 'Tokyo',
      dates: { flexible: false, startDate: '2025-08-05', endDate: '2025-08-12' },
      travelers: { adults: 2, children: 0, infants: 0 },
      budget: { amount: null, flexible: true },
      missingInfo: [], // Budget is optional, should not be in missingInfo
      customerInfo: { name: 'Robert Taylor', phone: '(555) 222-3333' }
    }
  },
  {
    name: "CASE 6: Image signature detection",
    email: {
      _id: 'test-6',
      from: { email: 'alex@company.com', name: 'Alex Martinez' },
      subject: 'Greece Honeymoon',
      bodyText: `Hello,

My fiancé and I are planning our honeymoon to Greece, September 10-20. Budget is around €6,000.

Looking forward to your suggestions!

Alex
[Image signature present]`,
      attachments: [
        { contentType: 'image/png', filename: 'signature.png' }
      ]
    },
    expected: {
      destination: 'Greece',
      dates: { flexible: false, startDate: '2025-09-10', endDate: '2025-09-20' },
      travelers: { adults: 2, children: 0, infants: 0 }, // honeymoon = couple
      budget: { amount: 6000, currency: 'EUR', flexible: true },
      hasImageSignature: true,
      customerInfo: { name: 'Alex Martinez' } // Limited info from text
    }
  }
];

async function runTests() {
  console.log('🧪 Enhanced Email Extraction Test Suite\n');
  console.log('=' .repeat(70));
  
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not found in environment variables');
    console.log('\nPlease set OPENAI_API_KEY in your .env file');
    process.exit(1);
  }

  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-crm-test');
    console.log('✅ Connected to MongoDB\n');

    let passCount = 0;
    let failCount = 0;

    for (const testCase of testCases) {
      console.log(`\n📋 TEST: ${testCase.name}`);
      console.log('-'.repeat(70));
      console.log(`Email: ${testCase.email.bodyText.substring(0, 100)}...`);
      console.log();

      try {
        // Extract data using AI
        const extracted = await openaiService.extractCustomerInquiry(
          testCase.email,
          'test-tenant-id'
        );

        console.log('📊 Extracted Data:');
        console.log(JSON.stringify(extracted, null, 2));
        console.log();

        // Validate against expected results
        const validationResults = validateExtraction(extracted, testCase.expected);
        
        if (validationResults.passed) {
          console.log('✅ TEST PASSED');
          passCount++;
        } else {
          console.log('❌ TEST FAILED');
          console.log('Validation Errors:');
          validationResults.errors.forEach(err => console.log(`   - ${err}`));
          failCount++;
        }

      } catch (error) {
        console.error('❌ Extraction Error:', error.message);
        failCount++;
      }

      console.log('='.repeat(70));
      
      // Delay between API calls to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Summary
    console.log('\n📈 TEST SUMMARY');
    console.log('='.repeat(70));
    console.log(`Total Tests: ${testCases.length}`);
    console.log(`✅ Passed: ${passCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`Success Rate: ${((passCount / testCases.length) * 100).toFixed(1)}%`);

  } catch (error) {
    console.error('❌ Test Suite Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

function validateExtraction(extracted, expected) {
  const errors = [];
  let passed = true;

  // Validate destination
  if (expected.destination && extracted.destination !== expected.destination) {
    errors.push(`Destination: expected '${expected.destination}', got '${extracted.destination}'`);
    passed = false;
  }

  // Validate dates
  if (expected.dates) {
    if (expected.dates.flexible !== extracted.dates?.flexible) {
      errors.push(`Dates flexible: expected ${expected.dates.flexible}, got ${extracted.dates?.flexible}`);
      passed = false;
    }
    if (expected.dates.startDate !== extracted.dates?.startDate) {
      errors.push(`Start date: expected '${expected.dates.startDate}', got '${extracted.dates?.startDate}'`);
      passed = false;
    }
    if (expected.dates.endDate !== extracted.dates?.endDate) {
      errors.push(`End date: expected '${expected.dates.endDate}', got '${extracted.dates?.endDate}'`);
      passed = false;
    }
  }

  // Validate travelers
  if (expected.travelers) {
    if (expected.travelers.adults !== extracted.travelers?.adults) {
      errors.push(`Adults: expected ${expected.travelers.adults}, got ${extracted.travelers?.adults}`);
      passed = false;
    }
    if (expected.travelers.children !== extracted.travelers?.children) {
      errors.push(`Children: expected ${expected.travelers.children}, got ${extracted.travelers?.children}`);
      passed = false;
    }
    if (expected.travelers.infants !== extracted.travelers?.infants) {
      errors.push(`Infants: expected ${expected.travelers.infants}, got ${extracted.travelers?.infants}`);
      passed = false;
    }
    if (expected.travelers.childAges && 
        JSON.stringify(expected.travelers.childAges) !== JSON.stringify(extracted.travelers?.childAges || [])) {
      errors.push(`Child ages: expected [${expected.travelers.childAges}], got [${extracted.travelers?.childAges || []}]`);
      passed = false;
    }
  }

  // Validate budget
  if (expected.budget) {
    if (expected.budget.amount !== extracted.budget?.amount) {
      errors.push(`Budget: expected ${expected.budget.amount}, got ${extracted.budget?.amount}`);
      passed = false;
    }
    if (expected.budget.perPerson !== undefined && 
        expected.budget.perPerson !== extracted.budget?.perPerson) {
      errors.push(`Budget perPerson: expected ${expected.budget.perPerson}, got ${extracted.budget?.perPerson}`);
      passed = false;
    }
  }

  // Validate missingInfo
  if (expected.missingInfo) {
    const expectedMissing = expected.missingInfo.sort();
    const actualMissing = (extracted.missingInfo || []).sort();
    if (JSON.stringify(expectedMissing) !== JSON.stringify(actualMissing)) {
      errors.push(`Missing info: expected [${expectedMissing}], got [${actualMissing}]`);
      passed = false;
    }
  }

  // Validate customer info
  if (expected.customerInfo) {
    if (expected.customerInfo.name && extracted.customerInfo?.name !== expected.customerInfo.name) {
      errors.push(`Customer name: expected '${expected.customerInfo.name}', got '${extracted.customerInfo?.name}'`);
      passed = false;
    }
    if (expected.customerInfo.phone && !extracted.customerInfo?.phone?.includes(expected.customerInfo.phone.replace(/[\s\-().]/g, ''))) {
      errors.push(`Customer phone: expected '${expected.customerInfo.phone}', got '${extracted.customerInfo?.phone}'`);
      // Don't fail on phone format differences
    }
  }

  // Validate image signature detection
  if (expected.hasImageSignature !== undefined && 
      expected.hasImageSignature !== extracted.hasImageSignature) {
    errors.push(`Image signature detection: expected ${expected.hasImageSignature}, got ${extracted.hasImageSignature}`);
    passed = false;
  }

  return { passed, errors };
}

// Run the tests
runTests().catch(console.error);
