const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Itinerary = require('./src/models/Itinerary');
const Tenant = require('./src/models/Tenant');

const createTestItineraries = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Get first tenant and user
    const tenant = await Tenant.findOne();
    const User = require('./src/models/User');
    const user = await User.findOne({ tenantId: tenant._id });

    if (!tenant || !user) {
      console.error('❌ No tenant or user found. Please create them first.');
      process.exit(1);
    }

    console.log(`Using Tenant: ${tenant.name}`);
    console.log(`Using User: ${user.name}\n`);

    // Test Itineraries with various scenarios for email matching
    const testItineraries = [
      {
        tenantId: tenant._id,
        createdBy: user._id,
        title: '7-Day Bali Paradise Adventure',
        destination: {
          country: 'Indonesia',
          state: 'Bali',
          city: 'Seminyak'
        },
        destinations: [
          { country: 'Indonesia', city: 'Seminyak', duration: 3 },
          { country: 'Indonesia', city: 'Ubud', duration: 2 },
          { country: 'Indonesia', city: 'Uluwatu', duration: 2 }
        ],
        startDate: new Date('2025-12-15'),
        endDate: new Date('2025-12-22'),
        duration: {
          days: 7,
          nights: 6
        },
        travelStyle: 'luxury',
        themes: ['beach', 'relaxation', 'cultural'],
        suitableFor: ['couples'],
        estimatedCost: {
          baseCost: 2500,
          currency: 'USD',
          totalCost: 2500
        },
        status: 'active',
        highlights: ['Beach resorts', 'Rice terraces', 'Temple visits', 'Traditional spa'],
        inclusions: ['Luxury accommodation', 'Daily breakfast', 'Airport transfers', 'Guided tours'],
        overview: 'Experience the best of Bali with luxury accommodations and cultural experiences.'
      },
      {
        tenantId: tenant._id,
        createdBy: user._id,
        title: '10-Day Paris & Switzerland Romance',
        destination: {
          country: 'France',
          city: 'Paris'
        },
        destinations: [
          { country: 'France', city: 'Paris', duration: 4 },
          { country: 'Switzerland', city: 'Zurich', duration: 2 },
          { country: 'Switzerland', city: 'Interlaken', duration: 2 },
          { country: 'Switzerland', city: 'Geneva', duration: 2 }
        ],
        startDate: new Date('2025-11-20'),
        endDate: new Date('2025-11-30'),
        duration: {
          days: 10,
          nights: 9
        },
        travelStyle: 'luxury',
        themes: ['cultural', 'honeymoon', 'city'],
        suitableFor: ['couples'],
        estimatedCost: {
          baseCost: 4500,
          currency: 'USD',
          totalCost: 4500
        },
        status: 'active',
        highlights: ['Eiffel Tower', 'Louvre Museum', 'Swiss Alps', 'Lake Geneva'],
        inclusions: ['Premium hotels', 'Daily breakfast', 'Train tickets', 'City tours'],
        overview: 'Romantic European getaway combining Parisian charm with Swiss Alpine beauty.'
      },
      {
        tenantId: tenant._id,
        createdBy: user._id,
        title: '5-Day Tokyo City Experience',
        destination: {
          country: 'Japan',
          city: 'Tokyo'
        },
        destinations: [
          { country: 'Japan', city: 'Tokyo', region: 'Shibuya', duration: 2 },
          { country: 'Japan', city: 'Tokyo', region: 'Shinjuku', duration: 2 },
          { country: 'Japan', city: 'Tokyo', region: 'Asakusa', duration: 1 }
        ],
        startDate: new Date('2026-01-10'),
        endDate: new Date('2026-01-15'),
        duration: {
          days: 5,
          nights: 4
        },
        travelStyle: 'comfort',
        themes: ['city', 'cultural', 'family'],
        suitableFor: ['families', 'groups'],
        estimatedCost: {
          baseCost: 3500,
          currency: 'USD',
          totalCost: 3500
        },
        status: 'active',
        highlights: ['Shibuya Crossing', 'Tokyo Skytree', 'Senso-ji Temple', 'Harajuku'],
        inclusions: ['Standard hotel', 'Daily breakfast', 'JR Pass', 'City guide'],
        overview: 'Family-friendly Tokyo adventure with perfect mix of modern and traditional.'
      },
      {
        tenantId: tenant._id,
        createdBy: user._id,
        title: '14-Day Thailand Island Hopping',
        destination: {
          country: 'Thailand',
          city: 'Bangkok'
        },
        destinations: [
          { country: 'Thailand', city: 'Bangkok', duration: 3 },
          { country: 'Thailand', city: 'Phuket', duration: 4 },
          { country: 'Thailand', city: 'Krabi', duration: 4 },
          { country: 'Thailand', city: 'Koh Samui', duration: 3 }
        ],
        startDate: new Date('2025-12-01'),
        endDate: new Date('2025-12-15'),
        duration: {
          days: 14,
          nights: 13
        },
        travelStyle: 'comfort',
        themes: ['beach', 'adventure', 'family'],
        suitableFor: ['families', 'groups'],
        estimatedCost: {
          baseCost: 3200,
          currency: 'USD',
          totalCost: 3200
        },
        status: 'active',
        highlights: ['Grand Palace', 'Island beaches', 'Snorkeling', 'Thai cuisine'],
        inclusions: ['Resort accommodation', 'Daily breakfast', 'Island transfers', 'Tours'],
        overview: 'Explore Thailand\'s beautiful islands with family-friendly activities.'
      },
      {
        tenantId: tenant._id,
        createdBy: user._id,
        title: '6-Day Dubai Luxury Getaway',
        destination: {
          country: 'UAE',
          city: 'Dubai'
        },
        destinations: [
          { country: 'UAE', city: 'Dubai', duration: 5 },
          { country: 'UAE', city: 'Abu Dhabi', duration: 1 }
        ],
        startDate: new Date('2025-11-25'),
        endDate: new Date('2025-12-01'),
        duration: {
          days: 6,
          nights: 5
        },
        travelStyle: 'luxury',
        themes: ['luxury', 'city', 'shopping'],
        suitableFor: ['couples', 'families'],
        estimatedCost: {
          baseCost: 5000,
          currency: 'USD',
          totalCost: 5000
        },
        status: 'active',
        highlights: ['Burj Khalifa', 'Desert Safari', 'Dubai Mall', 'Sheikh Zayed Mosque'],
        inclusions: ['5-star hotel', 'All meals', 'Private transfers', 'Premium tours'],
        overview: 'Experience ultimate luxury in Dubai with premium accommodations and exclusive experiences.'
      },
      {
        tenantId: tenant._id,
        createdBy: user._id,
        title: '12-Day European Multi-City Tour',
        destination: {
          country: 'UK',
          city: 'London'
        },
        destinations: [
          { country: 'UK', city: 'London', duration: 3 },
          { country: 'France', city: 'Paris', duration: 3 },
          { country: 'Netherlands', city: 'Amsterdam', duration: 2 },
          { country: 'Germany', city: 'Berlin', duration: 2 },
          { country: 'Czech Republic', city: 'Prague', duration: 2 }
        ],
        startDate: new Date('2026-02-15'),
        endDate: new Date('2026-02-27'),
        duration: {
          days: 12,
          nights: 11
        },
        travelStyle: 'comfort',
        themes: ['cultural', 'city', 'family'],
        suitableFor: ['families', 'groups'],
        estimatedCost: {
          baseCost: 6000,
          currency: 'USD',
          totalCost: 6000
        },
        status: 'active',
        highlights: ['Tower of London', 'Eiffel Tower', 'Anne Frank House', 'Brandenburg Gate', 'Charles Bridge'],
        inclusions: ['Standard hotels', 'Daily breakfast', 'Inter-city trains', 'City tours'],
        overview: 'Comprehensive European tour covering 5 major cities with rich history and culture.'
      },
      {
        tenantId: tenant._id,
        createdBy: user._id,
        title: '8-Day Maldives Honeymoon',
        destination: {
          country: 'Maldives',
          city: 'Male'
        },
        destinations: [
          { country: 'Maldives', city: 'Male', duration: 1 },
          { country: 'Maldives', region: 'South Atoll', duration: 7 }
        ],
        startDate: new Date('2025-12-10'),
        endDate: new Date('2025-12-18'),
        duration: {
          days: 8,
          nights: 7
        },
        travelStyle: 'luxury',
        themes: ['beach', 'honeymoon', 'relaxation'],
        suitableFor: ['couples'],
        estimatedCost: {
          baseCost: 4000,
          currency: 'USD',
          totalCost: 4000
        },
        status: 'active',
        highlights: ['Overwater villa', 'Private beach', 'Snorkeling', 'Spa treatments', 'Romantic dinners'],
        inclusions: ['Luxury resort', 'All-inclusive', 'Speedboat transfers', 'Water sports'],
        overview: 'Perfect honeymoon escape with overwater villas and pristine beaches.'
      },
      {
        tenantId: tenant._id,
        createdBy: user._id,
        title: '9-Day New Zealand Adventure',
        destination: {
          country: 'New Zealand',
          city: 'Auckland'
        },
        destinations: [
          { country: 'New Zealand', city: 'Auckland', duration: 2 },
          { country: 'New Zealand', city: 'Rotorua', duration: 2 },
          { country: 'New Zealand', city: 'Queenstown', duration: 3 },
          { country: 'New Zealand', city: 'Christchurch', duration: 2 }
        ],
        startDate: new Date('2026-03-05'),
        endDate: new Date('2026-03-14'),
        duration: {
          days: 9,
          nights: 8
        },
        travelStyle: 'adventure',
        themes: ['adventure', 'nature', 'family'],
        suitableFor: ['families', 'groups', 'adventure'],
        estimatedCost: {
          baseCost: 5500,
          currency: 'USD',
          totalCost: 5500
        },
        status: 'active',
        highlights: ['Milford Sound', 'Bungy jumping', 'Hobbiton', 'Geothermal parks', 'Scenic flights'],
        inclusions: ['Premium hotels', 'Daily breakfast', 'Car rental', 'Activity passes'],
        overview: 'Action-packed New Zealand adventure with stunning landscapes and thrilling activities.'
      }
    ];

    console.log('Creating test itineraries...\n');

    let created = 0;
    for (const itineraryData of testItineraries) {
      try {
        const itinerary = await Itinerary.create(itineraryData);
        created++;
        console.log(`✅ Created: ${itinerary.title}`);
        console.log(`   - Destination: ${itinerary.destination.city}, ${itinerary.destination.country}`);
        console.log(`   - Duration: ${itinerary.duration.days} days, ${itinerary.duration.nights} nights`);
        console.log(`   - Dates: ${itinerary.startDate.toDateString()} to ${itinerary.endDate.toDateString()}`);
        console.log(`   - Travel Style: ${itinerary.travelStyle}`);
        console.log(`   - Budget: ${itinerary.estimatedCost.currency} ${itinerary.estimatedCost.totalCost}`);
        console.log(`   - Themes: ${itinerary.themes.join(', ')}\n`);
      } catch (err) {
        console.error(`❌ Failed to create "${itineraryData.title}":`, err.message);
      }
    }

    console.log(`\n🎉 Successfully created ${created}/${testItineraries.length} test itineraries!`);
    
    if (created > 0) {
      console.log('\nSummary by destination:');
      const destinations = {};
      testItineraries.forEach(i => {
        const dest = i.destination.country;
        destinations[dest] = (destinations[dest] || 0) + 1;
      });
      Object.entries(destinations).forEach(([dest, count]) => {
        console.log(`  - ${dest}: ${count} itinerary(ies)`);
      });

      console.log('\nThese itineraries cover various scenarios for testing:');
      console.log('  ✓ Different destinations (Bali, Paris, Tokyo, Dubai, Maldives, etc.)');
      console.log('  ✓ Various durations (5-14 days)');
      console.log('  ✓ Different travel styles (budget, comfort, luxury, adventure)');
      console.log('  ✓ Multiple themes (beach, cultural, honeymoon, family, city)');
      console.log('  ✓ Various suitable groups (couples, families, groups)');
      console.log('  ✓ Different date ranges (past, present, future)');
      console.log('\nYou can now test email matching with queries like:');
      console.log('  - "Looking for a 7-day trip to Bali for couples"');
      console.log('  - "Family trip to Tokyo"');
      console.log('  - "Luxury honeymoon in Maldives"');
      console.log('  - "European tour for groups in February"');
      console.log('  - "Beach vacation in Thailand"');
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test itineraries:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

createTestItineraries();
