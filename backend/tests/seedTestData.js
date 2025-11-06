const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../src/models/User');
const Agent = require('../src/models/Agent');
const Customer = require('../src/models/Customer');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-crm';

// Test data
const testUsers = [
  {
    name: 'Test Agent User',
    email: 'testagent@travelcrm.com',
    password: 'TestAgent123!',
    role: 'agent',
    emailVerified: true,
    phone: '+1555123456'
  },
  {
    name: 'Test Operator User',
    email: 'testoperator@travelcrm.com',
    password: 'TestOp123!',
    role: 'operator',
    emailVerified: true,
    phone: '+1555234567'
  }
];

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Clean up existing test data
    console.log('🧹 Cleaning up existing test data...');
    await User.deleteMany({ email: { $in: testUsers.map(u => u.email) } });
    await Agent.deleteMany({ email: { $in: ['testagent@travelcrm.com', 'test.agent@agency.com'] } });
    await Customer.deleteMany({ email: /^testcustomer\d+@example\.com$/ });
    console.log('✅ Cleanup complete\n');

    // Create test users
    console.log('👤 Creating test users...');
    const createdUsers = {};
    
    for (const userData of testUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = await User.create({
        ...userData,
        password: hashedPassword
      });
      createdUsers[userData.role] = user;
      console.log(`  ✅ Created ${userData.role} user: ${userData.email}`);
    }
    console.log('');

    // Create agent profile for agent user
    console.log('🏢 Creating agent profile...');
    const agentProfile = await Agent.create({
      userId: createdUsers.agent._id,
      agencyName: 'Test Travel Agency',
      contactPerson: 'Test Agent User',
      email: 'test.agent@agency.com',
      phone: '+1555123456',
      address: {
        street: '123 Test Street',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        zipCode: '10001'
      },
      businessRegistration: {
        number: 'TEST123456',
        document: ''
      },
      creditLimit: 10000,
      availableCredit: 10000,
      tier: 'gold',
      status: 'active'
    });
    console.log(`  ✅ Created agent profile: ${agentProfile.agencyName}`);
    console.log(`  📋 Agent ID: ${agentProfile._id}\n`);

    // Create test customers
    console.log('👥 Creating test customers...');
    const customerData = [
      {
        name: 'Alice Johnson',
        email: 'testcustomer1@example.com',
        phone: '+1555345678',
        agentId: agentProfile._id,
        dateOfBirth: new Date('1985-05-15'),
        address: {
          city: 'Los Angeles',
          state: 'CA',
          country: 'USA',
          zipCode: '90001'
        },
        preferences: {
          interests: ['beach', 'adventure', 'luxury'],
          budget: 'high'
        }
      },
      {
        name: 'Bob Williams',
        email: 'testcustomer2@example.com',
        phone: '+1555456789',
        agentId: agentProfile._id,
        dateOfBirth: new Date('1990-08-20'),
        address: {
          city: 'Chicago',
          state: 'IL',
          country: 'USA',
          zipCode: '60601'
        },
        preferences: {
          interests: ['culture', 'food', 'history'],
          budget: 'medium'
        }
      }
    ];

    const customers = [];
    for (const custData of customerData) {
      const customer = await Customer.create(custData);
      customers.push(customer);
      console.log(`  ✅ Created customer: ${customer.name} (${customer.email})`);
    }
    console.log('');

    // Print summary
    console.log('═══════════════════════════════════════');
    console.log('🎉 DATABASE SEEDING COMPLETED!');
    console.log('═══════════════════════════════════════\n');
    
    console.log('📊 SEEDED DATA SUMMARY:\n');
    console.log('Users:');
    console.log(`  • Agent: testagent@travelcrm.com (password: TestAgent123!)`);
    console.log(`    User ID: ${createdUsers.agent._id}`);
    console.log(`  • Operator: testoperator@travelcrm.com (password: TestOp123!)`);
    console.log(`    User ID: ${createdUsers.operator._id}\n`);
    
    console.log('Agent Profile:');
    console.log(`  • Agency: ${agentProfile.agencyName}`);
    console.log(`  • Agent ID: ${agentProfile._id}`);
    console.log(`  • Status: ${agentProfile.status}\n`);
    
    console.log('Customers:');
    customers.forEach(c => {
      console.log(`  • ${c.name} (${c.email})`);
      console.log(`    Customer ID: ${c._id}`);
    });
    console.log('');
    
    console.log('═══════════════════════════════════════');
    console.log('💡 USE THIS DATA IN YOUR TESTS:');
    console.log('═══════════════════════════════════════\n');
    console.log('// Login as agent');
    console.log('POST /auth/login');
    console.log('{ "email": "testagent@travelcrm.com", "password": "TestAgent123!" }\n');
    console.log('// Use these IDs in your tests:');
    console.log(`const agentId = "${agentProfile._id}";`);
    console.log(`const customerId = "${customers[0]._id}";`);
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed\n');
    process.exit(0);
  }
};

// Run seeding
seedDatabase();
