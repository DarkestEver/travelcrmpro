const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import models
const User = require('../src/models/User');
const Tenant = require('../src/models/Tenant');

const createFinanceUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    // Find the first tenant or a specific tenant
    const tenant = await Tenant.findOne({}).sort({ createdAt: 1 });
    
    if (!tenant) {
      console.error('❌ No tenant found. Please create a tenant first.');
      process.exit(1);
    }

    console.log(`✅ Found tenant: ${tenant.name} (${tenant.subdomain})`);

    // Check if finance user already exists
    const existingFinance = await User.findOne({
      tenantId: tenant._id,
      role: 'finance',
    });

    if (existingFinance) {
      console.log('✅ Finance user already exists:');
      console.log(`   Email: ${existingFinance.email}`);
      console.log(`   Name: ${existingFinance.name}`);
      console.log(`   Role: ${existingFinance.role}`);
      console.log('\n💡 Use password: Finance@123');
      process.exit(0);
    }

    // Create finance user
    const financeUser = await User.create({
      tenantId: tenant._id,
      name: 'Finance Manager',
      email: 'finance@travelcrm.com',
      password: 'Finance@123', // Will be hashed by pre-save hook
      role: 'finance',
      phone: '+1234567890',
      isActive: true,
    });

    console.log('✅ Finance user created successfully!');
    console.log('\n📋 Finance User Details:');
    console.log('   ─────────────────────────────────────');
    console.log(`   Name:     ${financeUser.name}`);
    console.log(`   Email:    ${financeUser.email}`);
    console.log(`   Password: Finance@123`);
    console.log(`   Role:     ${financeUser.role}`);
    console.log(`   Tenant:   ${tenant.name}`);
    console.log('   ─────────────────────────────────────');
    console.log('\n🌐 Login URL: http://localhost:5174/login');
    console.log('📊 Dashboard: http://localhost:5174/finance/dashboard');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createFinanceUser();
