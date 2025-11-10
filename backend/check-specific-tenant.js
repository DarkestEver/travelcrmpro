// Check if specific tenant exists
// Run with: node check-specific-tenant.js

require('dotenv').config();
const mongoose = require('mongoose');
const Tenant = require('./src/models/Tenant');
const User = require('./src/models/User');

async function checkTenant() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-crm');
    console.log('✅ Connected to MongoDB\n');

    const tenantId = '690ce6d206c104addbfedb65';
    console.log(`Looking for tenant: ${tenantId}\n`);

    // Try to find the tenant
    const tenant = await Tenant.findById(tenantId);
    
    if (tenant) {
      console.log('✅ TENANT FOUND!');
      console.log(`   Company Name: ${tenant.companyName}`);
      console.log(`   Subdomain: ${tenant.subdomain}`);
      console.log(`   Created: ${tenant.createdAt}`);
      console.log(`   Status: ${tenant.isActive ? 'Active' : 'Inactive'}`);
    } else {
      console.log('❌ TENANT NOT FOUND IN DATABASE!');
      console.log('\nThis tenant ID does not exist.');
      console.log('The user has an invalid tenantId in their record.');
    }

    console.log('\n' + '─'.repeat(80));
    
    // Find users with this tenant ID
    const users = await User.find({ tenantId }).select('email role');
    console.log(`\nUsers assigned to this tenant: ${users.length}`);
    
    if (users.length > 0) {
      console.log('\n⚠️  PROBLEM: These users have invalid tenantId:');
      users.forEach(user => {
        console.log(`   - ${user.email} (${user.role})`);
      });
      
      console.log('\n💡 SOLUTION:');
      console.log('   You need to either:');
      console.log('   1. Create the missing tenant, OR');
      console.log('   2. Reassign these users to an existing tenant');
    }

    await mongoose.connection.close();
    console.log('\n✅ Connection closed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkTenant();
