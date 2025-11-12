const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Itinerary = require('./src/models/Itinerary');

const updateItinerariesToMainTenant = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const mainTenantId = '690ce6d206c104addbfedb65'; // Main Travel Agency
    const mainUserId = '690c2fbe3388216b98feb91d'; // User from visible itineraries

    // Update all our test itineraries to the correct tenant
    const result = await Itinerary.updateMany(
      { 
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
      { 
        $set: { 
          tenantId: mainTenantId,
          createdBy: mainUserId
        } 
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} itineraries to Main Travel Agency tenant`);
    console.log(`   Tenant ID: ${mainTenantId}`);
    console.log(`   Created By: ${mainUserId}`);
    
    console.log('\n🎉 The test itineraries should now be visible in your UI!');
    console.log('Please refresh your browser (Ctrl+Shift+R) to see them.');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

updateItinerariesToMainTenant();
