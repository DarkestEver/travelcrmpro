const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Itinerary = require('./src/models/Itinerary');

const updateItineraryStatus = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Update all itineraries with status 'active' to 'published'
    const result = await Itinerary.updateMany(
      { 
        status: 'active',
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
      },
      { $set: { status: 'published' } }
    );

    console.log(`✅ Updated ${result.modifiedCount} itineraries from 'active' to 'published' status`);
    
    // List the updated itineraries
    const updatedItineraries = await Itinerary.find({
      status: 'published',
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
    }).select('title status destination');

    console.log('\nUpdated test itineraries:');
    updatedItineraries.forEach((itin, index) => {
      console.log(`${index + 1}. ${itin.title} - Status: ${itin.status}`);
    });

    console.log('\n🎉 All test itineraries are now published and should be visible in the UI!');
    console.log('Please refresh your browser to see the changes.');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

updateItineraryStatus();
