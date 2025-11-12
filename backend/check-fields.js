const mongoose = require('mongoose');
const Itinerary = require('./src/models/Itinerary');

async function checkFields() {
  await mongoose.connect('mongodb://localhost:27017/travel-crm');
  
  const it = await Itinerary.findOne({ title: /10-Day Paris/ }).lean();
  
  if (!it) {
    console.log('Paris itinerary not found');
    process.exit(1);
  }
  
  console.log('='.repeat(80));
  console.log('Itinerary:', it.title);
  console.log('='.repeat(80));
  console.log('\nAvailable top-level fields:');
  Object.keys(it).sort().forEach(key => {
    const value = it[key];
    if (value !== null && value !== undefined) {
      const type = typeof value;
      if (type === 'object') {
        if (Array.isArray(value)) {
          console.log(`  ${key}: Array[${value.length}]`);
        } else {
          console.log(`  ${key}: Object ${JSON.stringify(value).substring(0, 80)}...`);
        }
      } else {
        console.log(`  ${key}: ${value}`);
      }
    }
  });
  
  process.exit(0);
}

checkFields();
