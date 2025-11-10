const mongoose = require('mongoose');
require('dotenv').config();

async function dropOldIndex() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-crm');
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('bookings');

    // Drop the old bookingNumber_1 index
    try {
      await collection.dropIndex('bookingNumber_1');
      console.log('✓ Dropped old bookingNumber_1 index');
    } catch (err) {
      if (err.code === 27) {
        console.log('✓ Index bookingNumber_1 does not exist (already dropped)');
      } else {
        throw err;
      }
    }

    console.log('✓ Done!');
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

dropOldIndex();
