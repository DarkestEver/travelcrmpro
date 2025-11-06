const mongoose = require('mongoose');
require('dotenv').config();

const { Tenant, User } = require('../models');

const seedTenants = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing tenants (optional - comment out for production)
    // await Tenant.deleteMany({});
    // await User.deleteMany({});
    // console.log('Cleared existing data');

    // Create a temporary placeholder ObjectId for ownerId
    const tempOwnerId = new mongoose.Types.ObjectId();

    // Create default/demo tenant
    const demoTenant = await Tenant.create({
      name: 'Demo Travel Agency',
      subdomain: 'demo',
      settings: {
        branding: {
          companyName: 'Demo Travel Agency',
          primaryColor: '#4F46E5',
          secondaryColor: '#06B6D4',
        },
        features: {
          maxUsers: 10,
          maxAgents: 25,
          maxCustomers: 500,
          maxBookings: 200,
          enableAnalytics: true,
          enableAuditLogs: true,
          enableNotifications: true,
          enableWhiteLabel: false,
        },
        contact: {
          email: 'demo@travelcrm.com',
          phone: '+1234567890',
          address: '123 Demo Street',
          city: 'Demo City',
          country: 'USA',
        },
      },
      subscription: {
        plan: 'professional',
        status: 'active',
      },
      metadata: {
        industry: 'travel',
        size: 'medium',
        country: 'USA',
        timezone: 'America/New_York',
        currency: 'USD',
      },
      ownerId: tempOwnerId, // Temporary ID
    });

    // Create owner user for demo tenant
    const demoOwner = await User.create({
      tenantId: demoTenant._id,
      name: 'Demo Admin',
      email: 'admin@demo.travelcrm.com',
      password: 'Demo@123', // Plain password - will be hashed by pre-save hook
      phone: '+1234567890',
      role: 'super_admin',
      isActive: true,
      emailVerified: true,
    });

    // Update tenant with actual owner ID
    demoTenant.ownerId = demoOwner._id;
    demoTenant.usage.users = 1;
    await demoTenant.save();

    console.log('Demo tenant created:');
    console.log('  Subdomain: demo.travelcrm.com');
    console.log('  Email: admin@demo.travelcrm.com');
    console.log('  Password: Demo@123');
    console.log('  Tenant ID:', demoTenant._id.toString());

    // Create test tenant for development
    if (process.env.NODE_ENV === 'development') {
      const tempTestOwnerId = new mongoose.Types.ObjectId();
      
      const testTenant = await Tenant.create({
        name: 'Test Travel Co',
        subdomain: 'test',
        settings: {
          branding: {
            companyName: 'Test Travel Co',
            primaryColor: '#10B981',
            secondaryColor: '#F59E0B',
          },
          features: {
            maxUsers: 5,
            maxAgents: 10,
            maxCustomers: 100,
            maxBookings: 50,
            enableAnalytics: true,
            enableAuditLogs: true,
            enableNotifications: true,
            enableWhiteLabel: false,
          },
        },
        subscription: {
          plan: 'free',
          status: 'trial',
        },
        metadata: {
          industry: 'travel',
          size: 'small',
          country: 'UK',
          timezone: 'Europe/London',
          currency: 'GBP',
        },
        ownerId: tempTestOwnerId,
      });

      const testOwner = await User.create({
        tenantId: testTenant._id,
        name: 'Test User',
        email: 'test@test.travelcrm.com',
        password: 'Demo@123', // Plain password - will be hashed by pre-save hook
        phone: '+4412345678',
        role: 'super_admin',
        isActive: true,
        emailVerified: true,
      });

      testTenant.ownerId = testOwner._id;
      testTenant.usage.users = 1;
      await testTenant.save();

      console.log('\nTest tenant created:');
      console.log('  Subdomain: test.travelcrm.com');
      console.log('  Email: test@test.travelcrm.com');
      console.log('  Password: Demo@123');
      console.log('  Tenant ID:', testTenant._id.toString());
    }

    console.log('\n✅ Tenant seeding completed!');
    console.log('\nSet DEFAULT_TENANT_ID in .env file for local development:');
    console.log(`DEFAULT_TENANT_ID=${demoTenant._id.toString()}`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding tenants:', error);
    process.exit(1);
  }
};

seedTenants();
