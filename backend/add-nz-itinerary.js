const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Itinerary = require('./src/models/Itinerary');
const Tenant = require('./src/models/Tenant');

const addOneMoreItinerary = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const tenant = await Tenant.findOne();
    const User = require('./src/models/User');
    const user = await User.findOne({ tenantId: tenant._id });

    const itinerary = await Itinerary.create({
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
      suitableFor: ['families', 'groups'],
      estimatedCost: {
        baseCost: 5500,
        currency: 'USD',
        totalCost: 5500
      },
      status: 'active',
      highlights: ['Milford Sound', 'Bungy jumping', 'Hobbiton', 'Geothermal parks', 'Scenic flights'],
      inclusions: ['Premium hotels', 'Daily breakfast', 'Car rental', 'Activity passes'],
      overview: 'Action-packed New Zealand adventure with stunning landscapes and thrilling activities.'
    });

    console.log(`✅ Created: ${itinerary.title}`);
    console.log(`   - Destination: ${itinerary.destination.city}, ${itinerary.destination.country}`);
    console.log(`   - Duration: ${itinerary.duration.days} days, ${itinerary.duration.nights} nights`);
    console.log(`   - Travel Style: ${itinerary.travelStyle}`);
    console.log(`   - Budget: ${itinerary.estimatedCost.currency} ${itinerary.estimatedCost.totalCost}\n`);

    console.log('🎉 All done! You now have 8 diverse test itineraries for email matching!');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

addOneMoreItinerary();
