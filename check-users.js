const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-crm')
  .then(async () => {
    const User = require(path.join(__dirname, 'backend', 'src', 'models', 'User'));
    const users = await User.find({}).select('name email role tenantId');
    
    console.log('📋 Users in database:\n');
    users.forEach(u => {
      console.log(`  Email: ${u.email}`);
      console.log(`  Name: ${u.name}`);
      console.log(`  Role: ${u.role}`);
      console.log(`  Tenant: ${u.tenantId}`);
      console.log('  ---');
    });
    
    console.log(`\nTotal: ${users.length} users`);
    process.exit();
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
