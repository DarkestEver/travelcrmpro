const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Load .env from current directory
const envPath = path.join(__dirname, '.env');
console.log('Looking for .env at:', envPath);
console.log('.env exists:', fs.existsSync(envPath));

require('dotenv').config({ path: envPath });

const migrateShareTokens = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in .env file');
      console.log('Available env vars:', Object.keys(process.env).filter(k => k.includes('MONGO')));
      process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const ShareToken = mongoose.connection.collection('sharetokens');

    // Update all tokens with lowercase entityType to capital case
    const updateBooking = await ShareToken.updateMany(
      { entityType: 'booking' },
      { $set: { entityType: 'Booking' } }
    );
    console.log(`Updated ${updateBooking.modifiedCount} booking tokens`);

    const updateQuote = await ShareToken.updateMany(
      { entityType: 'quote' },
      { $set: { entityType: 'Quote' } }
    );
    console.log(`Updated ${updateQuote.modifiedCount} quote tokens`);

    const updateItinerary = await ShareToken.updateMany(
      { entityType: 'itinerary' },
      { $set: { entityType: 'Itinerary' } }
    );
    console.log(`Updated ${updateItinerary.modifiedCount} itinerary tokens`);

    console.log('\n✅ Migration completed successfully!');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

migrateShareTokens();
