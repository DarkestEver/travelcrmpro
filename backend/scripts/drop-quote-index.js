const mongoose = require('mongoose');
require('dotenv').config();

async function dropOldIndex() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-crm');
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('quotes');

    // List current indexes
    const indexes = await collection.indexes();
    console.log('\nCurrent indexes:');
    indexes.forEach(idx => console.log(`- ${idx.name}:`, JSON.stringify(idx.key)));

    // Drop the old quoteNumber_1 index
    try {
      await collection.dropIndex('quoteNumber_1');
      console.log('\n✓ Dropped old quoteNumber_1 index');
    } catch (err) {
      if (err.code === 27) {
        console.log('\n✓ Index quoteNumber_1 does not exist (already dropped)');
      } else {
        throw err;
      }
    }

    // List indexes after drop
    const newIndexes = await collection.indexes();
    console.log('\nIndexes after drop:');
    newIndexes.forEach(idx => console.log(`- ${idx.name}:`, JSON.stringify(idx.key)));

    console.log('\n✓ Done! The new compound index (tenantId + quoteNumber) will be created automatically.');

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

dropOldIndex();
