/**
 * Cleanup Script - Removes test data
 * Run before tests to ensure clean state
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function cleanup() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travelcrm');
    console.log('✅ Connected to MongoDB');
    
    // Get collections
    const Tenant = mongoose.model('Tenant', new mongoose.Schema({}, { strict: false }));
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const Customer = mongoose.model('Customer', new mongoose.Schema({}, { strict: false }));
    
    // Find demo-agency tenant
    const demoTenant = await Tenant.findOne({ subdomain: 'demo-agency' });
    
    if (demoTenant) {
      console.log(`\n🗑️  Found demo-agency tenant (ID: ${demoTenant._id})`);
      
      // Delete related users
      const deletedUsers = await User.deleteMany({ tenantId: demoTenant._id });
      console.log(`   Deleted ${deletedUsers.deletedCount} users`);
      
      // Delete related customers
      const deletedCustomers = await Customer.deleteMany({ tenantId: demoTenant._id });
      console.log(`   Deleted ${deletedCustomers.deletedCount} customers`);
      
      // Delete tenant
      await Tenant.deleteOne({ _id: demoTenant._id });
      console.log(`   Deleted tenant`);
      
      console.log('\n✅ Cleanup complete - demo-agency removed');
    } else {
      console.log('\n✅ No demo-agency tenant found - database is clean');
    }
    
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('❌ Cleanup error:', error.message);
    process.exit(1);
  }
}

cleanup();
