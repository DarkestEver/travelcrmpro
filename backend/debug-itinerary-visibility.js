const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Itinerary = require('./src/models/Itinerary');
const Tenant = require('./src/models/Tenant');

const debugItineraries = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Get all tenants
    const tenants = await Tenant.find().select('name _id');
    console.log('Available Tenants:');
    tenants.forEach(t => console.log(`  - ${t.name} (ID: ${t._id})`));
    console.log('');

    // Check our new itineraries
    const newItineraries = await Itinerary.find({
      title: { 
        $in: [
          '7-Day Bali Paradise Adventure',
          '10-Day Paris & Switzerland Romance',
          '5-Day Tokyo City Experience',
          '14-Day Thailand Island Hopping',
          '6-Day Dubai Luxury Getaway',
          '12-Day European Multi-City Tour',
          '8-Day Maldives Honeymoon',
          '9-Day New Zealand Adventure'
        ] 
      }
    }).select('title tenantId status createdBy destination duration');

    console.log(`Found ${newItineraries.length} new test itineraries:`);
    for (const itin of newItineraries) {
      console.log(`\n${itin.title}`);
      console.log(`  Tenant ID: ${itin.tenantId}`);
      console.log(`  Created By: ${itin.createdBy}`);
      console.log(`  Status: ${itin.status}`);
      console.log(`  Destination: ${itin.destination?.city}, ${itin.destination?.country}`);
      console.log(`  Duration: ${itin.duration?.days} days / ${itin.duration?.nights} nights`);
    }

    // Check old "Romantic Paris" itineraries that ARE showing
    console.log('\n\n=== Comparing with visible "Romantic Paris" itineraries ===');
    const oldItineraries = await Itinerary.find({
      title: { $regex: /Romantic Paris Getaway/i }
    })
    .select('title tenantId status createdBy destination duration')
    .limit(3);

    console.log(`\nFound ${oldItineraries.length} old itineraries:`);
    for (const itin of oldItineraries) {
      console.log(`\n${itin.title}`);
      console.log(`  Tenant ID: ${itin.tenantId}`);
      console.log(`  Created By: ${itin.createdBy}`);
      console.log(`  Status: ${itin.status}`);
      console.log(`  Destination: ${itin.destination?.city}, ${itin.destination?.country}`);
      console.log(`  Duration: ${itin.duration?.days} days / ${itin.duration?.nights} nights`);
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

debugItineraries();
