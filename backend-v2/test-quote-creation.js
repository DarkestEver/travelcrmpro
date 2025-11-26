const request = require('supertest');
const mongoose = require('mongoose');
const app = require('./src/app');
const Tenant = require('./src/models/Tenant');
const User = require('./src/models/User');
const Lead = require('./src/models/Lead');
const Itinerary = require('./src/models/Itinerary');
const Quote = require('./src/models/Quote');
const tokenService = require('./src/services/tokenService');

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-crm-test');
    
    // Clean
    await Tenant.deleteMany({});
    await User.deleteMany({});
    await Lead.deleteMany({});
    await Itinerary.deleteMany({});
    await Quote.deleteMany({});

    // Create tenant
    const tenant = await Tenant.create({
      name: 'Test Agency',
      code: 'TEST',
      slug: 'test-agency',
      email: 'test@agency.com',
      phone: '+1234567890',
      address: { street: '123 St', city: 'City', state: 'State', country: 'Country', postalCode: '12345' },
      settings: { currency: 'USD', timezone: 'UTC', dateFormat: 'MM/DD/YYYY', language: 'en' },
      branding: { primaryColor: '#007bff', secondaryColor: '#6c757d' },
      status: 'active',
    });

    // Create user
    const user = await User.create({
      tenant: tenant._id,
      firstName: 'Test',
      lastName: 'User',
      email: 'testuser@agency.com',
      password: 'password123',
      role: 'tenant_admin',
      status: 'active',
    });

    const authToken = tokenService.generateAccessToken({
      userId: user._id,
      tenantId: tenant._id,
      role: user.role,
    });

    // Create lead
    const lead = await Lead.create({
      tenant: tenant._id,
      customer: { name: 'John Doe', email: 'john@example.com', phone: '+1987654321' },
      destination: 'Bali, Indonesia',
      travelDates: { startDate: new Date('2024-07-01'), endDate: new Date('2024-07-10'), isFlexible: false },
      travelers: { adults: 2, children: 1, infants: 0 },
      budget: { min: 3000, max: 5000, currency: 'USD' },
      interests: ['beach'],
      source: 'website',
      status: 'qualified',
      priority: 'high',
      assignedTo: user._id,
    });

    // Create itinerary
    const itinerary = await Itinerary.create({
      tenant: tenant._id,
      lead: lead._id,
      title: 'Bali Adventure',
      destination: 'Bali',
      startDate: new Date('2024-07-01'),
      endDate: new Date('2024-07-10'),
      duration: 9,
      travelers: { adults: 2, children: 1, infants: 0 },
      currency: 'USD',
      days: [{
        dayNumber: 1,
        title: 'Arrival',
        date: new Date('2024-07-01'),
        accommodation: {
          name: 'Beach Resort',
          type: 'hotel',
          roomType: 'Deluxe',
          numberOfRooms: 1,
          checkIn: new Date('2024-07-01T14:00:00Z'),
          checkOut: new Date('2024-07-02T12:00:00Z'),
          cost: { amount: 150, currency: 'USD' },
          address: 'Seminyak, Bali',
        },
        transport: [{
          type: 'car',
          from: 'Airport',
          to: 'Hotel',
          departureTime: new Date('2024-07-01T10:00:00Z'),
          arrivalTime: new Date('2024-07-01T11:00:00Z'),
          cost: { amount: 30, currency: 'USD' },
        }],
      }],
      status: 'draft',
      createdBy: user._id,
    });

    // Test quote creation
    const res = await request(app)
      .post('/quotes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        itineraryId: itinerary._id.toString(),
        leadId: lead._id.toString(),
        title: 'Bali Quote',
        validityDays: 7,
        paymentSchedule: [{
          milestone: 'Deposit',
          dueDate: new Date('2024-06-01'),
          amount: 200,
        }],
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

test();
