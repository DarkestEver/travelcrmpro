/**
 * Check Raw MongoDB Data
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function checkRawData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-crm');
    
    const collection = mongoose.connection.collection('emaillogs');
    const emails = await collection.find({}).sort({ createdAt: -1 }).limit(2).toArray();
    
    console.log('📧 RAW EMAIL DATA:\n');
    console.log(JSON.stringify(emails, null, 2));
    
    await mongoose.disconnect();
  } catch (error) {
    console.error(error);
  }
}

checkRawData();
