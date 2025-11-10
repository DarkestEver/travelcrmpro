// Fix tenants with missing companyName
// Run with: node fix-tenants.js

require('dotenv').config();
const mongoose = require('mongoose');
const Tenant = require('./src/models/Tenant');

async function fixTenants() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-crm');
    console.log('✅ Connected to MongoDB\n');

    // Find all tenants
    const tenants = await Tenant.find();
    console.log(`Found ${tenants.length} tenants\n`);

    let fixed = 0;
    let skipped = 0;

    for (const tenant of tenants) {
      console.log(`Processing tenant: ${tenant.subdomain} (ID: ${tenant._id})`);
      
      // Check if companyName is missing or undefined
      if (!tenant.companyName || tenant.companyName === 'undefined') {
        // Set companyName from subdomain
        const defaultName = tenant.subdomain
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        
        tenant.companyName = `${defaultName} Travel Agency`;
        
        // Ensure settings structure exists
        if (!tenant.settings) {
          tenant.settings = {
            general: {},
            aiSettings: {},
            emailSettings: {}
          };
        }
        
        await tenant.save();
        console.log(`✅ Fixed: Set companyName to "${tenant.companyName}"\n`);
        fixed++;
      } else {
        console.log(`✓ Skipped: Already has companyName "${tenant.companyName}"\n`);
        skipped++;
      }
    }

    console.log('─'.repeat(80));
    console.log(`\n✅ Migration complete!`);
    console.log(`   Fixed: ${fixed} tenants`);
    console.log(`   Skipped: ${skipped} tenants`);
    console.log(`   Total: ${tenants.length} tenants\n`);

    await mongoose.connection.close();
    console.log('✅ Connection closed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

fixTenants();
