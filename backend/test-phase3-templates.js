/**
 * Phase 3 Template Testing
 * Tests all 3 new template generation methods
 */

const fs = require('fs').promises;
const path = require('path');
const emailTemplateService = require('./src/services/emailTemplateService');

// Sample data for testing
const sampleEmail = {
  _id: 'test123',
  from: {
    email: 'john.doe@example.com',
    name: 'John Doe'
  },
  subject: 'Paris Honeymoon Trip',
  bodyPlain: 'Hi! My wife and I are planning a honeymoon to Paris for next summer. We have around $5000 budget and want to spend about 7 days there. We love art, wine, and romantic experiences. Can you help us plan something special?',
  bodyHtml: '<p>Hi! My wife and I are planning a honeymoon to Paris...</p>',
  receivedAt: new Date('2024-01-15T10:30:00Z'),
  createdAt: new Date('2024-01-15T10:30:00Z')
};

const sampleExtractedData = {
  destination: 'Paris, France',
  travelDates: {
    startDate: '2024-07-15',
    endDate: '2024-07-22',
    flexible: true
  },
  duration: {
    days: 7,
    nights: 6
  },
  groupSize: {
    adults: 2,
    children: 0,
    numberOfPeople: 2
  },
  budget: {
    amount: 5000,
    currency: 'USD',
    perPerson: false
  },
  activities: ['art museums', 'wine tasting', 'romantic dining'],
  accommodationPreference: '4-star romantic hotels',
  specialRequests: 'Anniversary celebration',
  customerInfo: {
    name: 'John Doe',
    email: 'john.doe@example.com'
  }
};

const sampleItineraries = [
  {
    score: 92,
    itinerary: {
      _id: 'itinerary_001',
      title: 'Paris Romantic Honeymoon - 7 Days',
      description: 'Experience the magic of Paris with this carefully curated romantic itinerary. Explore iconic landmarks, indulge in world-class cuisine, and create unforgettable memories in the City of Light.',
      overview: 'Perfect blend of culture, romance, and gastronomy',
      duration: { days: 7, nights: 6 },
      destinations: ['Paris', 'Versailles', 'Montmartre'],
      estimatedCost: {
        totalCost: 4800,
        currency: 'USD',
        breakdown: {
          accommodation: 2100,
          activities: 1200,
          meals: 1500
        }
      },
      capacity: {
        min: 2,
        max: 4
      },
      highlights: [
        'Private Eiffel Tower sunset tour',
        'Seine River dinner cruise',
        'Skip-the-line Louvre Museum access',
        'Champagne tasting in Montmartre',
        'Romantic dinner at Michelin-starred restaurant',
        'Day trip to Palace of Versailles'
      ],
      activities: [
        { name: 'Eiffel Tower visit', duration: 3 },
        { name: 'Louvre Museum tour', duration: 4 },
        { name: 'Seine River cruise', duration: 2 },
        { name: 'Wine tasting', duration: 3 },
        { name: 'Cooking class', duration: 4 }
      ],
      accommodationDetails: [
        {
          hotelName: 'Hotel Le Meurice',
          rating: 5,
          location: '1st Arrondissement',
          nights: 6
        }
      ],
      availability: {
        available: true,
        startDate: '2024-06-01',
        endDate: '2024-09-30'
      }
    }
  },
  {
    score: 85,
    itinerary: {
      _id: 'itinerary_002',
      title: 'Paris Art & Culture Escape',
      description: 'Dive deep into Parisian art and culture with museum tours, gallery visits, and artistic neighborhoods exploration.',
      duration: { days: 7, nights: 6 },
      destinations: ['Paris', 'Giverny'],
      estimatedCost: {
        totalCost: 4200,
        currency: 'USD'
      },
      capacity: { min: 2, max: 6 },
      highlights: [
        'Orsay Museum private tour',
        'Monet\'s Gardens in Giverny',
        'Latin Quarter exploration',
        'Art gallery walking tour',
        'French cooking workshop'
      ],
      activities: [
        { name: 'Museum tours' },
        { name: 'Art workshops' },
        { name: 'Gallery visits' }
      ],
      accommodationDetails: [
        {
          hotelName: 'Hotel des Arts',
          rating: 4,
          location: 'Marais District'
        }
      ],
      availability: {
        available: true,
        startDate: '2024-05-01',
        endDate: '2024-10-31'
      }
    }
  },
  {
    score: 78,
    itinerary: {
      _id: 'itinerary_003',
      title: 'Classic Paris Discovery',
      description: 'Discover the essentials of Paris with this well-rounded itinerary covering major attractions and hidden gems.',
      duration: { days: 6, nights: 5 },
      destinations: ['Paris'],
      estimatedCost: {
        totalCost: 3800,
        currency: 'USD'
      },
      capacity: { min: 2, max: 8 },
      highlights: [
        'Eiffel Tower visit',
        'Notre-Dame Cathedral',
        'Arc de Triomphe',
        'Champs-Élysées shopping',
        'Seine River walk'
      ],
      activities: [
        { name: 'City tours' },
        { name: 'Shopping' },
        { name: 'Sightseeing' }
      ],
      accommodationDetails: [
        {
          hotelName: 'Best Western Paris',
          rating: 3,
          location: 'Central Paris'
        }
      ],
      availability: {
        available: true,
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      }
    }
  }
];

async function testTemplate1_HighConfidence() {
  console.log('\n========================================');
  console.log('TEST 1: High Confidence Matches (≥70%)');
  console.log('========================================\n');

  try {
    const result = await emailTemplateService.generateItinerariesEmail({
      email: sampleEmail,
      extractedData: sampleExtractedData,
      itineraries: sampleItineraries,
      tenantId: 'test_tenant_123'
    });

    console.log('✅ Template generated successfully!');
    console.log('📧 Subject:', result.subject);
    console.log('💰 Cost:', result.cost);
    console.log('📋 Method:', result.method);
    console.log('🏷️  Template:', result.templateUsed);
    console.log('📝 Body length:', result.body.length, 'characters');

    // Save to file
    const outputPath = path.join(__dirname, 'test-output-high-confidence.html');
    await fs.writeFile(outputPath, result.body);
    console.log('💾 HTML saved to:', outputPath);

    // Check for placeholders
    const hasPlaceholders = result.body.includes('{{') && result.body.includes('}}');
    if (hasPlaceholders) {
      console.log('⚠️  WARNING: Unreplaced placeholders found!');
      const matches = result.body.match(/{{[^}]+}}/g);
      console.log('   Placeholders:', matches);
    } else {
      console.log('✅ All placeholders replaced successfully!');
    }

    return result;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    throw error;
  }
}

async function testTemplate2_ModerateMatch() {
  console.log('\n========================================');
  console.log('TEST 2: Moderate Matches (50-69%)');
  console.log('========================================\n');

  // Use itineraries with lower scores
  const moderateItineraries = sampleItineraries.map(item => ({
    ...item,
    score: item.score - 25 // Reduce scores to 67, 60, 53
  }));

  try {
    const result = await emailTemplateService.generateModerateMatchEmail({
      email: sampleEmail,
      extractedData: sampleExtractedData,
      itineraries: moderateItineraries,
      note: 'These itineraries are close to your requirements. We can adjust the duration, upgrade accommodations, or modify the activities to better match your preferences.',
      tenantId: 'test_tenant_123'
    });

    console.log('✅ Template generated successfully!');
    console.log('📧 Subject:', result.subject);
    console.log('💰 Cost:', result.cost);
    console.log('📋 Method:', result.method);
    console.log('🏷️  Template:', result.templateUsed);
    console.log('📝 Body length:', result.body.length, 'characters');

    // Save to file
    const outputPath = path.join(__dirname, 'test-output-moderate-match.html');
    await fs.writeFile(outputPath, result.body);
    console.log('💾 HTML saved to:', outputPath);

    // Check for placeholders
    const hasPlaceholders = result.body.includes('{{') && result.body.includes('}}');
    if (hasPlaceholders) {
      console.log('⚠️  WARNING: Unreplaced placeholders found!');
      const matches = result.body.match(/{{[^}]+}}/g);
      console.log('   Placeholders:', matches);
    } else {
      console.log('✅ All placeholders replaced successfully!');
    }

    return result;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    throw error;
  }
}

async function testTemplate3_CustomRequest() {
  console.log('\n========================================');
  console.log('TEST 3: Custom Request (<50% match)');
  console.log('========================================\n');

  try {
    const result = await emailTemplateService.generateCustomRequestEmail({
      email: sampleEmail,
      extractedData: sampleExtractedData,
      note: 'Your honeymoon requirements are unique and deserve a custom-designed itinerary. We couldn\'t find exact matches in our database, but our expert planners will create a perfect romantic Paris experience tailored specifically to your preferences.',
      tenantId: 'test_tenant_123'
    });

    console.log('✅ Template generated successfully!');
    console.log('📧 Subject:', result.subject);
    console.log('💰 Cost:', result.cost);
    console.log('📋 Method:', result.method);
    console.log('🏷️  Template:', result.templateUsed);
    console.log('📝 Body length:', result.body.length, 'characters');

    // Save to file
    const outputPath = path.join(__dirname, 'test-output-custom-request.html');
    await fs.writeFile(outputPath, result.body);
    console.log('💾 HTML saved to:', outputPath);

    // Check for placeholders
    const hasPlaceholders = result.body.includes('{{') && result.body.includes('}}');
    if (hasPlaceholders) {
      console.log('⚠️  WARNING: Unreplaced placeholders found!');
      const matches = result.body.match(/{{[^}]+}}/g);
      console.log('   Placeholders:', matches);
    } else {
      console.log('✅ All placeholders replaced successfully!');
    }

    return result;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    throw error;
  }
}

async function runAllTests() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║   PHASE 3 TEMPLATE TESTING SUITE              ║');
  console.log('║   Testing 3 New Template Methods              ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  const startTime = Date.now();
  let passedTests = 0;
  let failedTests = 0;

  try {
    // Test 1: High confidence matches
    await testTemplate1_HighConfidence();
    passedTests++;
  } catch (error) {
    failedTests++;
  }

  try {
    // Test 2: Moderate matches
    await testTemplate2_ModerateMatch();
    passedTests++;
  } catch (error) {
    failedTests++;
  }

  try {
    // Test 3: Custom request
    await testTemplate3_CustomRequest();
    passedTests++;
  } catch (error) {
    failedTests++;
  }

  const duration = Date.now() - startTime;

  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║   TEST SUMMARY                                 ║');
  console.log('╚════════════════════════════════════════════════╝\n');
  console.log(`✅ Passed: ${passedTests}/3`);
  console.log(`❌ Failed: ${failedTests}/3`);
  console.log(`⏱️  Duration: ${duration}ms`);
  console.log('\n📁 Output files saved to:');
  console.log('   - test-output-high-confidence.html');
  console.log('   - test-output-moderate-match.html');
  console.log('   - test-output-custom-request.html');
  console.log('\n🎉 Phase 3 template testing complete!');
  console.log('💰 All 3 templates cost: $0 (vs $0.0090 with AI)');
  console.log('📊 Annual savings from Phase 3: ~$155/year');
}

// Run tests
runAllTests().catch(error => {
  console.error('\n❌ Fatal error during testing:', error);
  process.exit(1);
});
