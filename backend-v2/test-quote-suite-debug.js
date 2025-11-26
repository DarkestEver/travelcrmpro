const request = require('supertest');
const mongoose = require('mongoose');
const app = require('./src/app');
const Tenant = require('./src/models/Tenant');
const User = require('./src/models/User');
const Lead = require('./src/models/Lead');
const Itinerary = require('./src/models/Itinerary');
const Quote = require('./src/models/Quote');
const tokenService = require('./src/services/tokenService');

async function runTest() {
  try {
    // Connect
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-crm-test', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Clear collections
    console.log('Clearing collections...');
    await Tenant.deleteMany({});
    await User.deleteMany({});
    await Lead.deleteMany({});
    await Itinerary.deleteMany({});
    await Quote.deleteMany({});

    // Create tenant
    console.log('Creating tenant...');
    const tenant = await Tenant.create({
      name: 'Test Travel Agency',
      code: 'TEST',
      slug: 'test-travel-agency',
      email: 'test@travelagency.com',
      phone: '+1234567890',
      address: {
        street: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        country: 'Test Country',
        postalCode: '12345',
      },
      settings: {
        currency: 'USD',
        timezone: 'UTC',
        dateFormat: 'MM/DD/YYYY',
        language: 'en',
      },
      branding: {
        primaryColor: '#007bff',
        secondaryColor: '#6c757d',
      },
      status: 'active',
    });
    console.log('Tenant created:', tenant._id);

    // Create user
    console.log('Creating user...');
    const user = await User.create({
      tenant: tenant._id,
      firstName: 'Test',
      lastName: 'User',
      email: 'testuser@travelagency.com',
      password: 'password123',
      role: 'tenant_admin',
      status: 'active',
    });
    console.log('User created:', user._id);

    // Generate token
    const authToken = tokenService.generateAccessToken({
      userId: user._id,
      tenantId: tenant._id,
      role: user.role,
    });
    console.log('Token generated');

    // Create lead
    console.log('Creating lead...');
    const lead = await Lead.create({
      tenant: tenant._id,
      customer: {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1987654321',
      },
      destination: 'Bali, Indonesia',
      travelDates: {
        startDate: new Date('2024-07-01'),
        endDate: new Date('2024-07-10'),
        isFlexible: false,
      },
      travelers: {
        adults: 2,
        children: 1,
        infants: 0,
      },
      budget: {
        min: 3000,
        max: 5000,
        currency: 'USD',
      },
      interests: ['beach', 'culture', 'adventure'],
      source: 'website',
      status: 'qualified',
      priority: 'high',
      assignedTo: user._id,
    });
    console.log('Lead created:', lead._id);

    // Create itinerary
    console.log('Creating itinerary...');
    const itinerary = await Itinerary.create({
      tenant: tenant._id,
      lead: lead._id,
      title: 'Amazing Bali Adventure',
      destination: 'Bali, Indonesia',
      startDate: new Date('2024-07-01'),
      endDate: new Date('2024-07-10'),
      duration: 9,
      travelers: {
        adults: 2,
        children: 1,
        infants: 0,
      },
      currency: 'USD',
      days: [
        {
          dayNumber: 1,
          title: 'Arrival in Bali',
          date: new Date('2024-07-01'),
          accommodation: {
            name: 'Beach Resort Bali',
            type: 'hotel',
            roomType: 'Deluxe Ocean View',
            numberOfRooms: 1,
            checkIn: new Date('2024-07-01T14:00:00Z'),
            checkOut: new Date('2024-07-02T12:00:00Z'),
            cost: {
              amount: 150,
              currency: 'USD',
            },
            address: 'Seminyak, Bali, Indonesia',
          },
          activities: [
            {
              title: 'Airport Transfer',
              time: '10:00',
              duration: 60,
              cost: {
                amount: 30,
                currency: 'USD',
                includedInPackage: false,
              },
              description: 'Private transfer from airport to hotel',
            },
          ],
          transport: [
            {
              type: 'car',
              from: 'Ngurah Rai International Airport',
              to: 'Beach Resort Bali',
              departureTime: new Date('2024-07-01T10:00:00Z'),
              arrivalTime: new Date('2024-07-01T11:00:00Z'),
              cost: {
                amount: 30,
                currency: 'USD',
              },
            },
          ],
          meals: [
            {
              type: 'dinner',
              restaurant: 'Hotel Restaurant',
              cost: {
                amount: 50,
                currency: 'USD',
                includedInPackage: false,
              },
            },
          ],
        },
      ],
      status: 'draft',
      createdBy: user._id,
    });
    console.log('Itinerary created:', itinerary._id);

    // Wait a bit to ensure everything is committed
    await new Promise(resolve => setTimeout(resolve, 100));

    // Now try to create quote - TEST 1
    console.log('\n=== TEST 1: Create Quote ===');
    const res1 = await request(app)
      .post('/quotes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        itineraryId: itinerary._id.toString(),
        leadId: lead._id.toString(),
        title: 'Bali Adventure Quote',
        validityDays: 7,
        discounts: [
          {
            name: 'Early Bird Discount',
            type: 'percentage',
            value: 10,
          },
        ],
        taxes: [
          {
            name: 'Service Tax',
            type: 'percentage',
            value: 8,
          },
        ],
        paymentSchedule: [
          {
            milestone: 'Deposit',
            dueDate: new Date('2024-06-01'),
            amount: 200,
          },
        ],
        inclusions: [
          '9 nights accommodation',
          'Airport transfers',
          'All activities as mentioned',
        ],
        exclusions: [
          'International flights',
          'Travel insurance',
          'Personal expenses',
        ],
        termsAndConditions: 'Standard terms apply',
        cancellationPolicy: 'Free cancellation up to 30 days before travel',
      });

    console.log('Response Status:', res1.status);
    if (res1.status === 201) {
      console.log('✅ TEST 1 SUCCESS');
      console.log('Quote created:', res1.body.data.quoteNumber);
    } else {
      console.log('❌ TEST 1 FAILED');
      console.log('Response:', JSON.stringify(res1.body, null, 2));
    }

    // Clear quotes for next test
    await Quote.deleteMany({});
    await new Promise(resolve => setTimeout(resolve, 100));

    // TEST 2: Create another quote
    console.log('\n=== TEST 2: Create Another Quote ===');
    const res2 = await request(app)
      .post('/quotes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        itineraryId: itinerary._id.toString(),
        title: 'Quote 2',
        validityDays: 7,
      });

    console.log('Response Status:', res2.status);
    if (res2.status === 201) {
      console.log('✅ TEST 2 SUCCESS');
      console.log('Quote created:', res2.body.data.quoteNumber);
    } else {
      console.log('❌ TEST 2 FAILED');
      console.log('Response:', JSON.stringify(res2.body, null, 2));
    }

    await mongoose.connection.close();
    console.log('\n✅ All tests completed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

runTest();
