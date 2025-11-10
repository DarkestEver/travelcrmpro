/**
 * Quick Database Check Script
 * Checks for existing demo-agency tenant
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Define minimal Tenant schema
const tenantSchema = new mongoose.Schema({
  name: String,
  subdomain: String,
  ownerId: mongoose.Schema.Types.ObjectId
});

const Tenant = mongoose.model('Tenant', tenantSchema);

async function checkTenant() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travelcrm');
    console.log('Connected to MongoDB');
    
    const tenant = await Tenant.findOne({ subdomain: 'demo-agency' });
    
    if (tenant) {
      console.log('✅ Found existing demo-agency tenant:');
      console.log(`   ID: ${tenant._id}`);
      console.log(`   Name: ${tenant.name}`);
      console.log(`   Owner ID: ${tenant.ownerId}`);
      console.log('\n⚠️  Deleting existing tenant to allow clean test...');
      await Tenant.deleteOne({ _id: tenant._id });
      console.log('✅ Deleted successfully');
    } else {
      console.log('❌ No existing demo-agency tenant found');
    }
    
    await mongoose.connection.close();
    console.log('\n✅ Database check complete');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkTenant();
