const mongoose = require('mongoose');
const Quote = require('./src/models/Quote');
const Tenant = require('./src/models/Tenant');
const User = require('./src/models/User');
const Lead = require('./src/models/Lead');
const Itinerary = require('./src/models/Itinerary');

async function testDirectQuoteCreation() {
  try {
    await mongoose.connect('mongodb://localhost:27017/travel-crm-test', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Clearing collections...');
    await Tenant.deleteMany({});
    await User.deleteMany({});
    await Lead.deleteMany({});
    await Itinerary.deleteMany({});
    await Quote.deleteMany({});

    // Create tenant
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

    // Create user
    const user = await User.create({
      tenant: tenant._id,
      firstName: 'Test',
      lastName: 'User',
      email: 'testuser@travelagency.com',
      password: 'password123',
      role: 'tenant_admin',
      status: 'active',
    });

    // Create lead
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

    // Create itinerary
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
      days: [{
        dayNumber: 1,
        title: 'Arrival',
        date: new Date('2024-07-01'),
      }],
      status: 'draft',
      createdBy: user._id,
    });

    console.log('\\n=== TEST: Create Quote with explicit quoteNumber ===');
    const quote = await Quote.create({
      tenant: tenant._id,
      lead: lead._id,
      itinerary: itinerary._id,
      customer: lead.customer,
      quoteNumber: 'QT-TEST-0001',
      title: 'Quote 1',
      destination: 'Bali',
      status: 'draft',
      pricing: {
        subtotal: 1000,
        grandTotal: 1000,
        currency: 'USD',
      },
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdBy: user._id,
    });

    console.log('✅ Quote created successfully!');
    console.log('Quote ID:', quote._id);
    console.log('Quote Number:', quote.quoteNumber);

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error(error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

testDirectQuoteCreation();
