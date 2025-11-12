const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Itinerary = require('./src/models/Itinerary');

const listItineraries = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const itineraries = await Itinerary.find()
      .select('title destination destinations duration startDate endDate status travelStyle estimatedCost createdAt')
      .sort({ createdAt: -1 })
      .limit(20);

    console.log(`Found ${itineraries.length} itineraries:\n`);

    itineraries.forEach((itin, index) => {
      console.log(`${index + 1}. ${itin.title}`);
      console.log(`   ID: ${itin._id}`);
      console.log(`   Destination: ${itin.destination?.city || 'N/A'}, ${itin.destination?.country || 'N/A'}`);
      console.log(`   Duration: ${itin.duration?.days || 'N/A'} days, ${itin.duration?.nights || 'N/A'} nights`);
      console.log(`   Dates: ${itin.startDate?.toDateString() || 'N/A'} to ${itin.endDate?.toDateString() || 'N/A'}`);
      console.log(`   Status: ${itin.status}`);
      console.log(`   Travel Style: ${itin.travelStyle || 'N/A'}`);
      console.log(`   Budget: ${itin.estimatedCost?.currency || 'N/A'} ${itin.estimatedCost?.totalCost || 'N/A'}`);
      console.log(`   Created: ${itin.createdAt.toLocaleString()}\n`);
    });

    const total = await Itinerary.countDocuments();
    console.log(`\nTotal itineraries in database: ${total}`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

listItineraries();
