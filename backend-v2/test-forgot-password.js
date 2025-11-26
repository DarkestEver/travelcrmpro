require('dotenv').config();
const mongoose = require('mongoose');
const authService = require('./src/services/authService');
const User = require('./src/models/User');
const Tenant = require('./src/models/Tenant');

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find existing tenant
    const tenant = await Tenant.findOne();
    if (!tenant) {
      console.error('No tenant found');
      process.exit(1);
    }
    console.log('Found tenant:', tenant.name);

    // Find or create test user
    let user = await User.findOne({ tenant: tenant._id, email: 'test@example.com' });
    if (!user) {
      console.log('Creating test user...');
      user = await User.create({
        tenant: tenant._id,
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
        role: 'agent',
      });
    }
    console.log('Found user:', user.email);

    // Test password reset request
    console.log('\nTesting requestPasswordReset...');
    const result = await authService.requestPasswordReset(user.email, tenant._id);
    console.log('SUCCESS:', result);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('ERROR:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

test();
