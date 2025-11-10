require('dotenv').config();
const { connectDB } = require('../config/database');
const { User, Agent, Supplier } = require('../models');

const seedDatabase = async () => {
  try {
    await connectDB();

    console.log('🌱 Starting database seed...');

    // Clear existing data (optional - comment out in production)
    // await User.deleteMany({});
    // await Agent.deleteMany({});

    // Create super admin
    const superAdmin = await User.create({
      name: 'Super Admin',
      email: 'admin@travelcrm.com',
      password: 'Admin@123',
      role: 'super_admin',
      phone: '+1234567890',
      emailVerified: true,
      isActive: true,
    });

    console.log('✅ Super admin created:', superAdmin.email);

    // Create operator
    const operator = await User.create({
      name: 'Operator User',
      email: 'operator@travelcrm.com',
      password: 'Operator@123',
      role: 'operator',
      phone: '+1234567891',
      emailVerified: true,
      isActive: true,
    });

    console.log('✅ Operator created:', operator.email);

    // Create sample agent user
    const agentUser = await User.create({
      name: 'Demo Agent',
      email: 'agent@travelcrm.com',
      password: 'Agent@123',
      role: 'agent',
      phone: '+1234567892',
      emailVerified: true,
      isActive: true,
    });

    // Create agent profile
    const agent = await Agent.create({
      userId: agentUser._id,
      agencyName: 'Demo Travel Agency',
      contactPerson: 'Demo Agent',
      email: 'agent@travelcrm.com',
      phone: '+1234567892',
      address: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        zipCode: '10001',
      },
      creditLimit: 10000,
      availableCredit: 10000,
      tier: 'gold',
      status: 'active',
    });

    console.log('✅ Agent created:', agent.agencyName);

    // Create sample supplier profile first
    const supplier = await Supplier.create({
      name: 'Demo Hotel',
      type: 'hotel',
      contactPerson: 'Hotel Manager',
      email: 'supplier@travelcrm.com',
      phone: '+1234567893',
      address: {
        street: '456 Beach Blvd',
        city: 'Miami',
        state: 'FL',
        country: 'USA',
        zipCode: '33139',
      },
      services: ['hotel', 'accommodation'],
      rating: 4.5,
      status: 'active',
    });

    console.log('✅ Supplier profile created:', supplier.name);

    // Create sample supplier user linked to supplier profile
    const supplierUser = await User.create({
      name: 'Demo Supplier',
      email: 'supplier@travelcrm.com',
      password: 'Supplier@123',
      role: 'supplier',
      phone: '+1234567893',
      emailVerified: true,
      isActive: true,
      supplierId: supplier._id, // Link user to supplier profile
    });

    console.log('✅ Supplier user created:', supplierUser.email);

    // Update supplier with userId reference
    supplier.userId = supplierUser._id;
    await supplier.save();

    console.log('✅ Supplier linked to user');

    console.log('\n🎉 Database seeding completed!');
    console.log('\n📋 Default credentials:');
    console.log('   Admin: admin@travelcrm.com / Admin@123');
    console.log('   Operator: operator@travelcrm.com / Operator@123');
    console.log('   Agent: agent@travelcrm.com / Agent@123');
    console.log('   Supplier: supplier@travelcrm.com / Supplier@123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
