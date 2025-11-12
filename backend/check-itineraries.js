const mongoose = require('mongoose');
const Itinerary = require('./src/models/Itinerary');

async function checkItineraries() {
  try {
    await mongoose.connect('mongodb://localhost:27017/travel-crm');
    
    const itineraries = await Itinerary.find({
      status: 'published'
    }).limit(5);

    console.log(`Found ${itineraries.length} published itineraries:\n`);

    itineraries.forEach((it, idx) => {
      console.log(`${idx + 1}. ${it.title}`);
      console.log(`   Destination: ${it.destination?.name || 'N/A'}`);
      console.log(`   Cities: ${it.destination?.cities?.join(', ') || 'N/A'}`);
      console.log(`   Duration: ${it.duration} days`);
      console.log(`   Price: $${it.pricing?.basePrice || 'N/A'}`);
      console.log(`   Package Type: ${it.packageType || 'N/A'}`);
      console.log(`   Theme: ${it.theme || 'N/A'}`);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkItineraries();
