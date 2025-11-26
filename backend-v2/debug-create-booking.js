const mongoose = require('mongoose');
const Booking = require('./src/models/Booking');
const Tenant = require('./src/models/Tenant');
const User = require('./src/models/User');
const Itinerary = require('./src/models/Itinerary');
const Lead = require('./src/models/Lead');

async function test() {
  try {
    await mongoose.connect('mongodb://localhost:27017/travel-crm-test');
    
    // Clear data
    await Booking.deleteMany({});
    await Tenant.deleteMany({});
    await User.deleteMany({});
    await Itinerary.deleteMany({});
    await Lead.deleteMany({});
    
    // Create tenant
    const tenant = await Tenant.create({
      name: 'Debug Tenant',
      slug: 'debug-tenant',
      domain: 'debug.example.com',
      settings: { timezone: 'UTC', currency: 'USD' },
    });
    
    console.log('Tenant created:', tenant._id);
    
    // Create user
    const user = await User.create({
      tenant: tenant._id,
      email: 'agent@example.com',
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'Agent',
      role: 'agent',
      isActive: true,
      isEmailVerified: true,
    });
    
    console.log('User created:', user._id);
    
    // Create itinerary
    const itinerary = await Itinerary.create({
      tenant: tenant._id,
      title: 'Test Itinerary',
      destination: 'Paris',
      startDate: '2026-06-01',
      endDate: '2026-06-07',
      duration: 7,
      numberOfTravelers: { adults: 2, children: 0 },
      days: [],
      pricing: {
        basePrice: 2000,
        totalPrice: 2000,
      },
      createdBy: user._id,
    });
    
    console.log('Itinerary created:', itinerary._id);
    
    // Generate booking number
    const bookingNumber = await Booking.generateBookingNumber(tenant._id);
    console.log('Generated booking number:', bookingNumber);
    
    // Create booking
    const booking = await Booking.create({
      tenant: tenant._id,
      bookingNumber,
      itinerary: itinerary._id,
      customer: {
        name: 'Bob Johnson',
        email: 'bob@example.com',
        phone: '+1234567890',
      },
      travelers: [
        {
          type: 'adult',
          firstName: 'Bob',
          lastName: 'Johnson',
        },
      ],
      travelStartDate: '2026-08-01',
      travelEndDate: '2026-08-07',
      pricing: {
        basePrice: 2500,
        totalPrice: 2500,
      },
      createdBy: user._id,
      lastModifiedBy: user._id,
      totalPaid: 0,
      balanceDue: 2500,
    });
    
    console.log('✓ Booking created successfully!', booking._id);
    
  } catch (error) {
    console.error('✗ Error creating booking:');
    console.error('  Message:', error.message);
    console.error('  Name:', error.name);
    if (error.errors) {
      console.error('  Validation errors:');
      Object.keys(error.errors).forEach(key => {
        console.error(`    - ${key}: ${error.errors[key].message}`);
      });
    }
    console.error('  Stack:', error.stack);
  } finally {
    await mongoose.connection.close();
  }
}

test();
