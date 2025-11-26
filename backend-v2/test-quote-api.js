require('dotenv').config();
process.env.NODE_ENV = 'test';
const request = require('supertest');
const app = require('./src/app');
const mongoose = require('mongoose');
const Tenant = require('./src/models/Tenant');
const User = require('./src/models/User');
const Lead = require('./src/models/Lead');
const Itinerary = require('./src/models/Itinerary');
const tokenService = require('./src/services/tokenService');

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const tenant = await Tenant.findOne();
    const user = await User.findOne({ tenant: tenant._id });
    const lead = await Lead.findOne({ tenant: tenant._id });
    const itinerary = await Itinerary.findOne({ tenant: tenant._id });

    if (!itinerary) {
      console.error('No itinerary found');
      process.exit(1);
    }

    const authToken = tokenService.generateAccessToken({
      userId: user._id,
      tenantId: tenant._id,
      role: user.role,
    });

    console.log('Making request to POST /quotes...');
    console.log('Data:', {
      itineraryId: itinerary._id.toString(),
      leadId: lead?._id.toString(),
      title: 'Test Quote',
    });

    const res = await request(app)
      .post('/quotes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        itineraryId: itinerary._id.toString(),
        leadId: lead?._id.toString(),
        title: 'Test Quote',
      });

    console.log('\nResponse status:', res.status);
    console.log('Response body:', JSON.stringify(res.body, null, 2));

    await mongoose.connection.close();
    process.exit(res.status === 201 ? 0 : 1);
  } catch (error) {
    console.error('ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

test();
