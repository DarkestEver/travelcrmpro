require('dotenv').config();
const mongoose = require('mongoose');
const Quote = require('./src/models/Quote');
const Itinerary = require('./src/models/Itinerary');
const Lead = require('./src/models/Lead');
const User = require('./src/models/User');
const Tenant = require('./src/models/Tenant');

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const tenant = await Tenant.findOne();
    let user = await User.findOne({ tenant: tenant._id });
    if (!user) {
      user = await User.create({
        tenant: tenant._id,
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
        role: 'agent',
      });
    }

    let lead = await Lead.findOne({ tenant: tenant._id });
    if (!lead) {
      lead = await Lead.create({
        tenant: tenant._id,
        firstName: 'Test',
        lastName: 'Lead',
        email: 'lead@example.com',
        phone: '1234567890',
        source: 'website',
        assignedTo: user._id,
        customer: {
          name: 'Test Lead',
          email: 'lead@example.com',
          phone: '1234567890',
        },
      });
    }

    const itinerary = await Itinerary.create({
      tenant: tenant._id,
      lead: lead._id,
      title: 'Test Itinerary',
      destination: 'Test',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
      duration: 1,
      currency: 'USD',
      createdBy: user._id,
    });

    console.log('Created itinerary:', itinerary._id);

    // Try to create quote
    const quoteData = {
      tenant: tenant._id,
      lead: lead._id,
      itinerary: itinerary._id,
      quoteNumber: 'TEST-001',
      title: 'Test Quote',
      validUntil: new Date(Date.now() + 7 * 86400000),
      pricing: {
        subtotal: 1000,
        tax: 100,
        total: 1100,
        currency: 'USD',
      },
      terms: ['Test term 1', 'Test term 2'],
      createdBy: user._id,
    };

    console.log('\nCreating quote with data:', JSON.stringify(quoteData, null, 2));
    
    const quote = await Quote.create(quoteData);
    console.log('\nSUCCESS! Created quote:', quote._id);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\nERROR:', error.message);
    if (error.errors) {
      console.error('\nValidation Errors:');
      Object.keys(error.errors).forEach(key => {
        console.error(`  ${key}: ${error.errors[key].message}`);
      });
    }
    process.exit(1);
  }
}

test();
