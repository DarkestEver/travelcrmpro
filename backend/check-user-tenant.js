// Quick script to check user's tenant assignment
// Run with: node check-user-tenant.js

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Tenant = require('./src/models/Tenant');

async function checkUserTenant() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-crm');
    console.log('✅ Connected to MongoDB');

    // Find all users
    const users = await User.find().select('email role tenantId');
    console.log('\n📋 All Users:');
    console.log('─'.repeat(80));
    
    for (const user of users) {
      console.log(`\nEmail: ${user.email}`);
      console.log(`Role: ${user.role}`);
      console.log(`Tenant ID: ${user.tenantId || '❌ NO TENANT ASSIGNED'}`);
      
      if (user.tenantId) {
        const tenant = await Tenant.findById(user.tenantId);
        if (tenant) {
          console.log(`Tenant Name: ${tenant.companyName}`);
          console.log(`Subdomain: ${tenant.subdomain}`);
        } else {
          console.log(`⚠️  Warning: Tenant ${user.tenantId} not found in database!`);
        }
      }
      console.log('─'.repeat(80));
    }

    // Find tenants without users
    console.log('\n\n🏢 All Tenants:');
    console.log('─'.repeat(80));
    const tenants = await Tenant.find().select('companyName subdomain');
    for (const tenant of tenants) {
      console.log(`\nTenant: ${tenant.companyName}`);
      console.log(`Subdomain: ${tenant.subdomain}`);
      console.log(`ID: ${tenant._id}`);
      
      const userCount = await User.countDocuments({ tenantId: tenant._id });
      console.log(`Users: ${userCount}`);
      console.log('─'.repeat(80));
    }

    await mongoose.connection.close();
    console.log('\n✅ Connection closed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

checkUserTenant();
