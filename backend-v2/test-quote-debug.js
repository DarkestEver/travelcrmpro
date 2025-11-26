const request = require('supertest');
const mongoose = require('mongoose');
const app = require('./src/app');
const Tenant = require('./src/models/Tenant');
const User = require('./src/models/User');
const Lead = require('./src/models/Lead');
const Itinerary = require('./src/models/Itinerary');
const tokenService = require('./src/services/tokenService');

async function testQuoteCreation() {
  try {
    await mongoose.connect('mongodb://localhost:27017/travel-crm-test');
    
    // Clear database
    await Tenant.deleteMany({});
    await User.deleteMany({});
    await Lead.deleteMany({});
    await Itinerary.deleteMany({});
    
    // Create tenant
    const tenant = await Tenant.create({
      name: 'Test Travel Agency',
      code: 'TEST',
      slug: 'test-travel-agency',
      email: 'test@travelagency.com',
      phone: '+1234567890',
      address: { city: 'Test City', country: 'Test Country' },
      subscription: { plan: 'professional', status: 'active', startDate: new Date() },
    });
    
    // Create user
    const user = await User.create({
      tenant: tenant._id,
      email: 'test@example.com',
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User',
      role: 'tenant_admin',
      isActive: true,
    });
    
    const authToken = tokenService.generateAccessToken({
      userId: user._id,
      tenantId: tenant._id,
      role: 'tenant_admin',
    });
    
    // Create lead
    const lead = await Lead.create({
      tenant: tenant._id,
      customer: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
      },
      source: 'website',
      status: 'new',
      createdBy: user._id,
    });
    
    // Create itinerary
    const itinerary = await Itinerary.create({
      tenant: tenant._id,
      lead: lead._id,
      title: 'Bali Dream Vacation',
      destination: 'Bali, Indonesia',
      startDate: new Date('2024-07-01'),
      endDate: new Date('2024-07-10'),
      duration: 10,
      numberOfDays: 10,
      numberOfTravelers: 2,
      accommodation: [
        {
          name: 'Luxury Villa Seminyak',
          checkIn: new Date('2024-07-01'),
          checkOut: new Date('2024-07-10'),
          nights: 9,
          roomType: 'Private Pool Villa',
          address: 'Seminyak, Bali, Indonesia',
          ratePerNight: 200,
          totalCost: 1800,
        },
      ],
      activities: [
        {
          day: 2,
          name: 'Ubud Rice Terrace Tour',
          description: 'Guided tour of Tegalalang Rice Terrace',
          duration: 4,
          cost: 50,
        },
        {
          day: 4,
          name: 'Tanah Lot Sunset Tour',
          description: 'Visit iconic sea temple at sunset',
          duration: 3,
          cost: 40,
        },
      ],
      transport: [
        {
          type: 'Airport Transfer',
          from: 'Ngurah Rai Airport',
          to: 'Hotel',
          date: new Date('2024-07-01'),
          cost: 30,
        },
      ],
      meals: [
        {
          day: 1,
          type: 'Welcome Dinner',
          description: 'Beachfront restaurant',
          cost: 60,
        },
      ],
      estimatedCost: 2000,
      status: 'draft',
      createdBy: user._id,
    });
    
    console.log('Setup complete. Creating quote...');
    
    const res = await request(app)
      .post('/quotes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        itineraryId: itinerary._id.toString(),
        leadId: lead._id.toString(),
        title: 'Bali Adventure Quote',
        validityDays: 7,
        paymentSchedule: [
          {
            milestone: 'Deposit',
            dueDate: new Date('2024-06-01'),
            amount: 200,
          },
        ],
      });
    
    console.log('Status:', res.status);
    console.log('Body:', JSON.stringify(res.body, null, 2));
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

testQuoteCreation();
