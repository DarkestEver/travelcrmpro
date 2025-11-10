// Create missing tenant for orphaned users
// Run with: node create-missing-tenant.js

require('dotenv').config();
const mongoose = require('mongoose');
const Tenant = require('./src/models/Tenant');
const User = require('./src/models/User');

async function createMissingTenant() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-crm');
    console.log('✅ Connected to MongoDB\n');

    const missingTenantId = '690ce6d206c104addbfedb65';
    
    // Check if tenant already exists (shouldn't, but just in case)
    let tenant = await Tenant.findById(missingTenantId);
    
    if (tenant) {
      console.log('✅ Tenant already exists!');
      console.log(`   Company Name: ${tenant.companyName}`);
      console.log(`   Subdomain: ${tenant.subdomain}`);
    } else {
      // Get admin user to set as owner
      const adminUser = await User.findOne({ email: 'admin@travelcrm.com' });
      if (!adminUser) {
        console.error('❌ Admin user not found!');
        process.exit(1);
      }
      
      console.log('✅ Admin user found:', adminUser._id);
      
      // Create the missing tenant
      console.log('Creating missing tenant...\n');
      
      tenant = new Tenant({
        _id: missingTenantId,
        name: 'Main Travel Agency', // Required field
        ownerId: adminUser._id, // Required field
        subdomain: 'main',
        contactEmail: 'admin@travelcrm.com',
        contactPhone: '+1234567890',
        address: {
          street: '123 Main Street',
          city: 'New York',
          state: 'NY',
          country: 'USA',
          zipCode: '10001'
        },
        settings: {
          general: {
            currency: 'USD',
            timezone: 'America/New_York',
            dateFormat: 'MM/DD/YYYY',
            language: 'en'
          },
          aiSettings: {
            enabled: false,
            provider: 'openai',
            model: 'gpt-4-turbo-preview',
            apiKey: '',
            maxTokens: 2000,
            temperature: 0.7
          },
          emailSettings: {
            fromName: 'Main Travel Agency',
            fromEmail: 'noreply@main.travelcrm.com',
            replyToEmail: 'support@main.travelcrm.com'
          }
        },
        subscription: {
          plan: 'enterprise',
          status: 'active',
          startDate: new Date(),
          features: ['multi-user', 'ai-email', 'advanced-reporting']
        },
        status: 'active' // Changed from isActive to status
      });

      await tenant.save();
      console.log('✅ TENANT CREATED SUCCESSFULLY!');
      console.log(`   ID: ${tenant._id}`);
      console.log(`   Company Name: ${tenant.companyName}`);
      console.log(`   Subdomain: ${tenant.subdomain}`);
      console.log(`   Status: Active`);
    }

    // Count users with this tenant
    const userCount = await User.countDocuments({ tenantId: missingTenantId });
    console.log(`\n✅ This tenant now has ${userCount} users assigned`);

    // Show some key users
    const keyUsers = await User.find({ 
      tenantId: missingTenantId,
      role: { $in: ['super_admin', 'operator', 'admin'] }
    }).select('email role').limit(5);

    if (keyUsers.length > 0) {
      console.log('\n👥 Key users in this tenant:');
      keyUsers.forEach(user => {
        console.log(`   - ${user.email} (${user.role})`);
      });
    }

    console.log('\n' + '─'.repeat(80));
    console.log('\n✅ Problem solved! You can now login and access tenant settings.');
    console.log('   Try refreshing your browser and the API should work.');

    await mongoose.connection.close();
    console.log('\n✅ Connection closed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

createMissingTenant();
