const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Itinerary = require('./src/models/Itinerary');

const checkPublishedItineraries = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Get all published itineraries sorted by creation date (newest first)
    const published = await Itinerary.find({ status: 'published' })
      .select('title destination duration status createdAt')
      .sort({ createdAt: -1 })
      .limit(15);

    console.log(`Found ${published.length} published itineraries:\n`);

    published.forEach((itin, index) => {
      console.log(`${index + 1}. ${itin.title}`);
      console.log(`   Location: ${itin.destination?.city || 'N/A'}, ${itin.destination?.country || 'N/A'}`);
      console.log(`   Duration: ${itin.duration?.days || 'N/A'} days / ${itin.duration?.nights || 'N/A'} nights`);
      console.log(`   Status: ${itin.status}`);
      console.log(`   Created: ${itin.createdAt.toLocaleString()}\n`);
    });

    // Count by status
    const statusCounts = await Itinerary.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    console.log('Itineraries by status:');
    statusCounts.forEach(item => {
      console.log(`  ${item._id}: ${item.count}`);
    });

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

checkPublishedItineraries();
