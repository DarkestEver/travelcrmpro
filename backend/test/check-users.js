const mongoose = require('mongoose');
require('dotenv').config();

async function checkUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');
    
    const User = require('../src/models/User');
    
    // Find the most recent user
    const users = await User.find().sort({ createdAt: -1 }).limit(5);
    
    console.log(`Found ${users.length} recent users:\n`);
    users.forEach((user, i) => {
      console.log(`${i + 1}. Email: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   TenantID: ${user.tenantId}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log('');
    });
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkUser();
