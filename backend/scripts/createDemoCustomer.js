/**
 * Create Demo Customer Script
 * Creates a demo customer account with sample data for testing
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const Customer = require('../src/models/Customer');
const Booking = require('../src/models/Booking');
const Invoice = require('../src/models/Invoice');
const Quote = require('../src/models/Quote');
const Notification = require('../src/models/Notification');
const Itinerary = require('../src/models/Itinerary');
const Tenant = require('../src/models/Tenant');
const Agent = require('../src/models/Agent');
const User = require('../src/models/User');

const DEMO_CREDENTIALS = {
  email: 'demo@customer.com',
  password: 'demo123',
  firstName: 'Demo',
  lastName: 'Customer',
  phone: '+1-555-0100',
  tenantName: 'Demo Travel Agency',
};

async function createDemoCustomer() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-crm');
    console.log('✓ Connected to MongoDB');

    // Try to find an existing tenant or get the first one
    let demoTenant = await Tenant.findOne();
    
    if (!demoTenant) {
      console.log('❌ No tenants found in database!');
      console.log('Please create a tenant first through the agent portal or run the setup script.');
      process.exit(1);
    }

    console.log(`✓ Using existing tenant: ${demoTenant.name} (ID: ${demoTenant._id})`);

    const tenantId = demoTenant._id;

    // Try to find an existing agent for this tenant
    let demoAgent = await Agent.findOne({ tenantId });
    
    if (!demoAgent) {
      console.log('⚠ No agent found for this tenant. Demo customer will not be assigned to an agent.');
    } else {
      console.log(`✓ Using existing agent: ${demoAgent.name}`);
    }

    const agentId = demoAgent?._id;

    // Try to find an existing user for createdBy
    let demoUser = await User.findOne({ tenantId });
    
    if (!demoUser) {
      console.log('❌ No users found for this tenant!');
      console.log('Please create a user first through the agent portal.');
      process.exit(1);
    }

    console.log(`✓ Using existing user for itinerary creation: ${demoUser.name}`);
    const createdById = demoUser._id;

    // Check if demo customer already exists
    let demoCustomer = await Customer.findOne({ email: DEMO_CREDENTIALS.email, tenantId });
    
    if (demoCustomer) {
      console.log('✓ Demo customer already exists');
    } else {
      // Create demo customer
      demoCustomer = await Customer.create({
        firstName: DEMO_CREDENTIALS.firstName,
        lastName: DEMO_CREDENTIALS.lastName,
        email: DEMO_CREDENTIALS.email,
        password: DEMO_CREDENTIALS.password, // Will be hashed by pre-save hook
        phone: DEMO_CREDENTIALS.phone,
        tenantId,
        agentId,
        portalAccess: true,
        emailVerified: true,
        status: 'active',
        address: {
          street: '123 Demo Street',
          city: 'Demo City',
          state: 'CA',
          country: 'USA',
          zipCode: '12345',
        },
        preferences: {
          newsletter: true,
          communicationPreference: 'email',
        },
      });
      console.log('✓ Created demo customer');
    }

    // Create sample itineraries
    const itinerary1 = await Itinerary.create({
      title: 'Paris Adventure - 7 Days',
      destination: {
        country: 'France',
        city: 'Paris',
      },
      startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      endDate: new Date(Date.now() + 37 * 24 * 60 * 60 * 1000), // 37 days from now
      days: [
        {
          dayNumber: 1,
          title: 'Arrival in Paris',
          description: 'Check-in at hotel, evening Seine River cruise',
          activities: [
            { time: '14:00', title: 'Hotel Check-in', description: 'Le Marais Boutique Hotel' },
            { time: '19:00', title: 'Seine River Cruise', description: 'Bateaux Parisiens dinner cruise' },
          ],
        },
        {
          dayNumber: 2,
          title: 'Eiffel Tower & Louvre',
          description: 'Visit iconic landmarks',
          activities: [
            { time: '09:00', title: 'Eiffel Tower Visit', description: 'Skip-the-line tickets included' },
            { time: '14:00', title: 'Louvre Museum', description: 'Guided tour with art expert' },
          ],
        },
        {
          dayNumber: 3,
          title: 'Versailles Palace',
          description: 'Day trip to magnificent palace',
          activities: [
            { time: '09:00', title: 'Versailles Tour', description: 'Full day guided tour with gardens' },
          ],
        },
      ],
      totalCost: 3500,
      currency: 'USD',
      tenantId,
      createdBy: createdById,
    });

    const itinerary2 = await Itinerary.create({
      title: 'Bali Beach Retreat - 5 Days',
      destination: {
        country: 'Indonesia',
        city: 'Bali',
      },
      startDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
      endDate: new Date(Date.now() + 65 * 24 * 60 * 60 * 1000), // 65 days from now
      days: [
        {
          dayNumber: 1,
          title: 'Arrival in Bali',
          description: 'Transfer to beach resort',
          activities: [
            { time: '15:00', title: 'Resort Check-in', description: 'Beachfront villa at Seminyak' },
          ],
        },
        {
          dayNumber: 2,
          title: 'Beach Day & Spa',
          description: 'Relaxation and wellness',
          activities: [
            { time: '10:00', title: 'Beach Activities', description: 'Surfing lessons available' },
            { time: '16:00', title: 'Balinese Spa Treatment', description: 'Traditional massage' },
          ],
        },
      ],
      totalCost: 2200,
      currency: 'USD',
      tenantId,
      createdBy: createdById,
    });

    console.log('✓ Created sample itineraries');

    console.log('\n========================================');
    console.log('✓ Demo Customer Created Successfully!');
    console.log('========================================');
    console.log('\nDemo Credentials:');
    console.log(`Email:     ${DEMO_CREDENTIALS.email}`);
    console.log(`Password:  ${DEMO_CREDENTIALS.password}`);
    console.log(`Tenant ID: ${tenantId}`);
    console.log('\nNext Steps:');
    console.log('1. Access the customer portal at: http://localhost:5173/customer/login');
    console.log('2. Click "Fill Demo Credentials" button to auto-fill login form');
    console.log('3. Create bookings, invoices, and quotes through the agent portal');
    console.log('4. Those items will appear in the demo customer portal');
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error creating demo customer:', error);
    process.exit(1);
  }
}

// Run the script
createDemoCustomer();
