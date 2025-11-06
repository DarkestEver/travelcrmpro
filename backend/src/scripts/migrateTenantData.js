const mongoose = require('mongoose');
require('dotenv').config();

const { 
  Tenant, 
  User, 
  Agent, 
  Customer, 
  Supplier, 
  Itinerary, 
  Quote, 
  Booking, 
  AuditLog 
} = require('../models');

const migrateTenantData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find default tenant or use the one specified
    const defaultTenantId = process.env.DEFAULT_TENANT_ID;
    
    if (!defaultTenantId) {
      console.error('❌ DEFAULT_TENANT_ID not set in .env');
      console.log('\nPlease set DEFAULT_TENANT_ID in your .env file');
      console.log('You can get the tenant ID by running: node src/scripts/seedTenants.js');
      process.exit(1);
    }

    const defaultTenant = await Tenant.findById(defaultTenantId);
    
    if (!defaultTenant) {
      console.error('❌ Default tenant not found');
      console.log(`\nTenant with ID ${defaultTenantId} not found`);
      console.log('Please run: node src/scripts/seedTenants.js');
      process.exit(1);
    }

    console.log(`\n✅ Found default tenant: ${defaultTenant.name} (${defaultTenant.subdomain})`);
    console.log('\n🔄 Starting data migration...\n');

    // Migrate Users
    const usersWithoutTenant = await User.countDocuments({ tenantId: { $exists: false } });
    if (usersWithoutTenant > 0) {
      const userResult = await User.updateMany(
        { tenantId: { $exists: false } },
        { $set: { tenantId: defaultTenant._id } }
      );
      console.log(`✅ Migrated ${userResult.modifiedCount} users`);
      
      // Update tenant usage
      const totalUsers = await User.countDocuments({ tenantId: defaultTenant._id });
      defaultTenant.usage.users = totalUsers;
    } else {
      console.log('✅ All users already have tenantId');
    }

    // Migrate Agents
    const agentsWithoutTenant = await Agent.countDocuments({ tenantId: { $exists: false } });
    if (agentsWithoutTenant > 0) {
      const agentResult = await Agent.updateMany(
        { tenantId: { $exists: false } },
        { $set: { tenantId: defaultTenant._id } }
      );
      console.log(`✅ Migrated ${agentResult.modifiedCount} agents`);
      
      // Update tenant usage
      const totalAgents = await Agent.countDocuments({ tenantId: defaultTenant._id });
      defaultTenant.usage.agents = totalAgents;
    } else {
      console.log('✅ All agents already have tenantId');
    }

    // Migrate Customers
    const customersWithoutTenant = await Customer.countDocuments({ tenantId: { $exists: false } });
    if (customersWithoutTenant > 0) {
      const customerResult = await Customer.updateMany(
        { tenantId: { $exists: false } },
        { $set: { tenantId: defaultTenant._id } }
      );
      console.log(`✅ Migrated ${customerResult.modifiedCount} customers`);
      
      // Update tenant usage
      const totalCustomers = await Customer.countDocuments({ tenantId: defaultTenant._id });
      defaultTenant.usage.customers = totalCustomers;
    } else {
      console.log('✅ All customers already have tenantId');
    }

    // Migrate Suppliers
    const suppliersWithoutTenant = await Supplier.countDocuments({ tenantId: { $exists: false } });
    if (suppliersWithoutTenant > 0) {
      const supplierResult = await Supplier.updateMany(
        { tenantId: { $exists: false } },
        { $set: { tenantId: defaultTenant._id } }
      );
      console.log(`✅ Migrated ${supplierResult.modifiedCount} suppliers`);
    } else {
      console.log('✅ All suppliers already have tenantId');
    }

    // Migrate Itineraries
    const itinerariesWithoutTenant = await Itinerary.countDocuments({ tenantId: { $exists: false } });
    if (itinerariesWithoutTenant > 0) {
      const itineraryResult = await Itinerary.updateMany(
        { tenantId: { $exists: false } },
        { $set: { tenantId: defaultTenant._id } }
      );
      console.log(`✅ Migrated ${itineraryResult.modifiedCount} itineraries`);
    } else {
      console.log('✅ All itineraries already have tenantId');
    }

    // Migrate Quotes
    const quotesWithoutTenant = await Quote.countDocuments({ tenantId: { $exists: false } });
    if (quotesWithoutTenant > 0) {
      const quoteResult = await Quote.updateMany(
        { tenantId: { $exists: false } },
        { $set: { tenantId: defaultTenant._id } }
      );
      console.log(`✅ Migrated ${quoteResult.modifiedCount} quotes`);
    } else {
      console.log('✅ All quotes already have tenantId');
    }

    // Migrate Bookings
    const bookingsWithoutTenant = await Booking.countDocuments({ tenantId: { $exists: false } });
    if (bookingsWithoutTenant > 0) {
      const bookingResult = await Booking.updateMany(
        { tenantId: { $exists: false } },
        { $set: { tenantId: defaultTenant._id } }
      );
      console.log(`✅ Migrated ${bookingResult.modifiedCount} bookings`);
      
      // Update tenant usage
      const totalBookings = await Booking.countDocuments({ tenantId: defaultTenant._id });
      defaultTenant.usage.bookings = totalBookings;
    } else {
      console.log('✅ All bookings already have tenantId');
    }

    // Migrate Audit Logs
    const auditLogsWithoutTenant = await AuditLog.countDocuments({ tenantId: { $exists: false } });
    if (auditLogsWithoutTenant > 0) {
      const auditLogResult = await AuditLog.updateMany(
        { tenantId: { $exists: false } },
        { $set: { tenantId: defaultTenant._id } }
      );
      console.log(`✅ Migrated ${auditLogResult.modifiedCount} audit logs`);
    } else {
      console.log('✅ All audit logs already have tenantId');
    }

    // Save updated tenant usage
    await defaultTenant.save();
    
    console.log('\n📊 Migration Summary:');
    console.log('─'.repeat(50));
    console.log(`Tenant: ${defaultTenant.name}`);
    console.log(`Subdomain: ${defaultTenant.subdomain}`);
    console.log(`\nUsage:`);
    console.log(`  Users: ${defaultTenant.usage.users}`);
    console.log(`  Agents: ${defaultTenant.usage.agents}`);
    console.log(`  Customers: ${defaultTenant.usage.customers}`);
    console.log(`  Bookings: ${defaultTenant.usage.bookings}`);
    console.log('─'.repeat(50));
    
    console.log('\n✅ Data migration completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('1. Update your frontend to use tenant context');
    console.log('2. Test with subdomain: http://' + defaultTenant.subdomain + '.localhost:3000');
    console.log('3. For production, configure DNS for wildcard subdomains\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error migrating data:', error);
    process.exit(1);
  }
};

migrateTenantData();
