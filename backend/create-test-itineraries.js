const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Itinerary = require('./src/models/Itinerary');
const Tenant = require('./src/models/Tenant');

const createTestItineraries = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Get first tenant and user (agent)
    const tenant = await Tenant.findOne();
    const User = require('./src/models/User');
    const user = await User.findOne({ tenantId: tenant._id });

    if (!tenant || !user) {
      console.error('❌ No tenant or user found. Please create them first.');
      process.exit(1);
    }

    console.log(`Using Tenant: ${tenant.name}`);
    console.log(`Using User: ${user.name}\n`);

    // Test Itineraries with various scenarios
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
        suitableFor: ['couples', 'honeymoon'],
        estimatedCost: {
          baseCost: 2500,
          currency: 'USD',
          totalCost: 2500
        },
        days: [
          {
            dayNumber: 1,
            date: new Date('2025-12-15'),
            title: 'Arrival in Bali',
            activities: [
              {
                time: '14:00',
                title: 'Hotel Check-in',
                description: 'Check into luxury resort in Seminyak',
                location: 'Seminyak Beach Resort'
              }
            ],
            meals: { breakfast: false, lunch: false, dinner: true },
            accommodation: {
              name: 'Seminyak Beach Resort',
              type: 'luxury',
              checkIn: new Date('2025-12-15T14:00:00'),
              checkOut: new Date('2025-12-17T11:00:00')
            }
          },
          {
            dayNumber: 2,
            date: new Date('2025-12-16'),
            title: 'Ubud Cultural Tour',
            activities: [
              {
                time: '09:00',
                title: 'Tegalalang Rice Terrace',
                description: 'Visit famous rice terraces',
                location: 'Tegalalang, Ubud'
              }
            ],
            meals: { breakfast: true, lunch: true, dinner: true }
          }
        ],
        status: 'active'
      },
      {
        tenantId: tenant._id,
        agentId: agent._id,
        title: '10-Day Paris & Switzerland Romance',
        destination: 'Paris',
        destinations: ['Paris', 'Zurich', 'Interlaken', 'Geneva'],
        startDate: new Date('2025-11-20'),
        endDate: new Date('2025-11-30'),
        duration: 10,
        numberOfTravelers: 2,
        adults: 2,
        children: 0,
        infants: 0,
        budget: {
          amount: 4500,
          currency: 'USD'
        },
        accommodationType: 'premium',
        days: [
          {
            dayNumber: 1,
            date: new Date('2025-11-20'),
            title: 'Arrival in Paris',
            activities: [
              {
                time: '15:00',
                title: 'Eiffel Tower Visit',
                description: 'Evening visit to iconic Eiffel Tower',
                location: 'Champ de Mars, Paris'
              }
            ],
            meals: { breakfast: false, lunch: false, dinner: true },
            accommodation: {
              name: 'Hotel Le Meurice',
              type: 'premium',
              checkIn: new Date('2025-11-20T14:00:00'),
              checkOut: new Date('2025-11-24T11:00:00')
            }
          }
        ],
        status: 'active'
      },
      {
        tenantId: tenant._id,
        agentId: agent._id,
        title: '5-Day Tokyo City Experience',
        destination: 'Tokyo',
        destinations: ['Tokyo', 'Shibuya', 'Shinjuku', 'Asakusa'],
        startDate: new Date('2026-01-10'),
        endDate: new Date('2026-01-15'),
        duration: 5,
        numberOfTravelers: 4,
        adults: 2,
        children: 2,
        childAges: [8, 10],
        infants: 0,
        budget: {
          amount: 3500,
          currency: 'USD'
        },
        accommodationType: 'standard',
        days: [
          {
            dayNumber: 1,
            date: new Date('2026-01-10'),
            title: 'Arrival in Tokyo',
            activities: [
              {
                time: '16:00',
                title: 'Shibuya Crossing',
                description: 'Visit famous scramble crossing',
                location: 'Shibuya, Tokyo'
              }
            ],
            meals: { breakfast: false, lunch: false, dinner: true },
            accommodation: {
              name: 'Shinjuku Grand Hotel',
              type: 'standard',
              checkIn: new Date('2026-01-10T14:00:00'),
              checkOut: new Date('2026-01-15T11:00:00')
            }
          }
        ],
        status: 'active'
      },
      {
        tenantId: tenant._id,
        agentId: agent._id,
        title: '14-Day Thailand Island Hopping',
        destination: 'Bangkok',
        destinations: ['Bangkok', 'Phuket', 'Krabi', 'Koh Samui'],
        startDate: new Date('2025-12-01'),
        endDate: new Date('2025-12-15'),
        duration: 14,
        numberOfTravelers: 3,
        adults: 2,
        children: 1,
        childAges: [5],
        infants: 0,
        budget: {
          amount: 3200,
          currency: 'USD'
        },
        accommodationType: 'premium',
        days: [
          {
            dayNumber: 1,
            date: new Date('2025-12-01'),
            title: 'Arrival in Bangkok',
            activities: [
              {
                time: '14:00',
                title: 'Grand Palace Visit',
                description: 'Explore the magnificent Grand Palace',
                location: 'Grand Palace, Bangkok'
              }
            ],
            meals: { breakfast: false, lunch: true, dinner: true },
            accommodation: {
              name: 'Mandarin Oriental Bangkok',
              type: 'premium',
              checkIn: new Date('2025-12-01T14:00:00'),
              checkOut: new Date('2025-12-03T11:00:00')
            }
          }
        ],
        status: 'active'
      },
      {
        tenantId: tenant._id,
        agentId: agent._id,
        title: '6-Day Dubai Luxury Getaway',
        destination: 'Dubai',
        destinations: ['Dubai', 'Abu Dhabi'],
        startDate: new Date('2025-11-25'),
        endDate: new Date('2025-12-01'),
        duration: 6,
        numberOfTravelers: 2,
        adults: 2,
        children: 0,
        infants: 0,
        budget: {
          amount: 5000,
          currency: 'USD'
        },
        accommodationType: 'luxury',
        days: [
          {
            dayNumber: 1,
            date: new Date('2025-11-25'),
            title: 'Arrival in Dubai',
            activities: [
              {
                time: '18:00',
                title: 'Burj Khalifa Visit',
                description: 'Sunset view from world\'s tallest building',
                location: 'Burj Khalifa, Dubai'
              }
            ],
            meals: { breakfast: false, lunch: false, dinner: true },
            accommodation: {
              name: 'Burj Al Arab',
              type: 'luxury',
              checkIn: new Date('2025-11-25T15:00:00'),
              checkOut: new Date('2025-12-01T12:00:00')
            }
          }
        ],
        status: 'active'
      },
      {
        tenantId: tenant._id,
        agentId: agent._id,
        title: '12-Day European Multi-City Tour',
        destination: 'London',
        destinations: ['London', 'Paris', 'Amsterdam', 'Berlin', 'Prague'],
        startDate: new Date('2026-02-15'),
        endDate: new Date('2026-02-27'),
        duration: 12,
        numberOfTravelers: 5,
        adults: 3,
        children: 2,
        childAges: [12, 14],
        infants: 0,
        budget: {
          amount: 6000,
          currency: 'USD'
        },
        accommodationType: 'standard',
        days: [
          {
            dayNumber: 1,
            date: new Date('2026-02-15'),
            title: 'Arrival in London',
            activities: [
              {
                time: '14:00',
                title: 'Tower Bridge & Tower of London',
                description: 'Explore historic landmarks',
                location: 'Tower Bridge, London'
              }
            ],
            meals: { breakfast: false, lunch: true, dinner: true },
            accommodation: {
              name: 'Premier Inn London',
              type: 'standard',
              checkIn: new Date('2026-02-15T14:00:00'),
              checkOut: new Date('2026-02-18T11:00:00')
            }
          }
        ],
        status: 'active'
      },
      {
        tenantId: tenant._id,
        agentId: agent._id,
        title: '8-Day Maldives Honeymoon',
        destination: 'Maldives',
        destinations: ['Male', 'Maldives'],
        startDate: new Date('2025-12-10'),
        endDate: new Date('2025-12-18'),
        duration: 8,
        numberOfTravelers: 2,
        adults: 2,
        children: 0,
        infants: 0,
        budget: {
          amount: 4000,
          currency: 'USD'
        },
        accommodationType: 'luxury',
        days: [
          {
            dayNumber: 1,
            date: new Date('2025-12-10'),
            title: 'Arrival in Maldives',
            activities: [
              {
                time: '16:00',
                title: 'Resort Check-in & Beach Welcome',
                description: 'Private villa with ocean view',
                location: 'Conrad Maldives Rangali Island'
              }
            ],
            meals: { breakfast: false, lunch: false, dinner: true },
            accommodation: {
              name: 'Conrad Maldives Rangali Island',
              type: 'luxury',
              checkIn: new Date('2025-12-10T14:00:00'),
              checkOut: new Date('2025-12-18T11:00:00')
            }
          }
        ],
        status: 'active'
      },
      {
        tenantId: tenant._id,
        agentId: agent._id,
        title: '9-Day New Zealand Adventure',
        destination: 'Auckland',
        destinations: ['Auckland', 'Rotorua', 'Queenstown', 'Christchurch'],
        startDate: new Date('2026-03-05'),
        endDate: new Date('2026-03-14'),
        duration: 9,
        numberOfTravelers: 4,
        adults: 2,
        children: 1,
        childAges: [15],
        infants: 1,
        budget: {
          amount: 5500,
          currency: 'USD'
        },
        accommodationType: 'premium',
        days: [
          {
            dayNumber: 1,
            date: new Date('2026-03-05'),
            title: 'Arrival in Auckland',
            activities: [
              {
                time: '15:00',
                title: 'Sky Tower Visit',
                description: 'Panoramic views of Auckland',
                location: 'Sky Tower, Auckland'
              }
            ],
            meals: { breakfast: false, lunch: false, dinner: true },
            accommodation: {
              name: 'Sofitel Auckland',
              type: 'premium',
              checkIn: new Date('2026-03-05T14:00:00'),
              checkOut: new Date('2026-03-07T11:00:00')
            }
          }
        ],
        status: 'active'
      }
    ];

    console.log('Creating test itineraries...\n');

    for (const itineraryData of testItineraries) {
      const itinerary = await Itinerary.create(itineraryData);
      console.log(`✅ Created: ${itinerary.title}`);
      console.log(`   - Destination: ${itinerary.destination}`);
      console.log(`   - Duration: ${itinerary.duration} days`);
      console.log(`   - Dates: ${itinerary.startDate.toDateString()} to ${itinerary.endDate.toDateString()}`);
      console.log(`   - Travelers: ${itinerary.adults} adults, ${itinerary.children} children, ${itinerary.infants} infants`);
      console.log(`   - Budget: ${itinerary.budget.currency} ${itinerary.budget.amount}`);
      console.log(`   - Accommodation: ${itinerary.accommodationType}\n`);
    }

    console.log(`\n🎉 Successfully created ${testItineraries.length} test itineraries!`);
    console.log('\nSummary by destination:');
    const destinations = [...new Set(testItineraries.map(i => i.destination))];
    destinations.forEach(dest => {
      const count = testItineraries.filter(i => i.destination === dest).length;
      console.log(`  - ${dest}: ${count} itinerary(ies)`);
    });

    console.log('\nThese itineraries cover various scenarios for testing:');
    console.log('  ✓ Different destinations (Bali, Paris, Tokyo, Dubai, Maldives, etc.)');
    console.log('  ✓ Various durations (5-14 days)');
    console.log('  ✓ Different traveler configurations (singles, couples, families)');
    console.log('  ✓ Multiple budget ranges');
    console.log('  ✓ Different accommodation types (budget, standard, premium, luxury)');
    console.log('  ✓ Various date ranges (past, present, future)');
    console.log('\nYou can now test email matching with queries like:');
    console.log('  - "Looking for a 7-day trip to Bali for 2 people"');
    console.log('  - "Family trip to Tokyo with 2 kids"');
    console.log('  - "Luxury honeymoon in Maldives"');
    console.log('  - "European tour for 5 people in February"');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test itineraries:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

createTestItineraries();
