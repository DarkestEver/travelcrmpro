// Fix supplier user - add supplierId if missing
require('dotenv').config();
const mongoose = require('mongoose');
const { User, Supplier, Tenant } = require('../src/models');

const fixSupplierUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Get the default tenant
    const tenant = await Tenant.findOne({ subdomain: 'demo' });
    if (!tenant) {
      console.log('❌ Demo tenant not found. Please run: node src/scripts/seedTenants.js');
      process.exit(1);
    }
    console.log('✅ Found tenant:', tenant.name);
    console.log('   Tenant ID:', tenant._id.toString(), '\n');

    // Find supplier user
    const supplierUser = await User.findOne({ 
      email: 'supplier@travelcrm.com',
      tenantId: tenant._id 
    });

    if (!supplierUser) {
      console.log('❌ Supplier user not found with email: supplier@travelcrm.com');
      console.log('   Creating new supplier user...\n');

      // Create supplier profile first
      const supplier = await Supplier.create({
        tenantId: tenant._id,
        userId: new mongoose.Types.ObjectId(), // Temporary
        companyName: 'Demo Hotel',
        country: 'USA',
        city: 'Miami',
        state: 'FL',
        email: 'supplier@travelcrm.com',
        phone: '+1234567893',
        address: {
          street: '456 Beach Blvd',
          city: 'Miami',
          state: 'FL',
          country: 'USA',
          zipCode: '33139',
        },
        serviceTypes: ['hotel'],
        currencies: ['USD'],
        defaultMarkup: { percentage: 15 },
        status: 'active',
      });

      console.log('✅ Supplier profile created:', supplier.companyName);
      console.log('   Supplier ID:', supplier._id.toString(), '\n');

      // Create user with supplierId
      const newUser = await User.create({
        tenantId: tenant._id,
        name: 'Demo Supplier',
        email: 'supplier@travelcrm.com',
        password: 'Supplier@123',
        role: 'supplier',
        phone: '+1234567893',
        supplierId: supplier._id,
        isActive: true,
        emailVerified: true,
      });

      console.log('✅ Supplier user created:', newUser.email);
      console.log('   User ID:', newUser._id.toString());
      console.log('   Supplier ID:', newUser.supplierId.toString(), '\n');

      // Update supplier with userId
      supplier.userId = newUser._id;
      await supplier.save();

      console.log('✅ Supplier linked to user\n');
      console.log('🎉 Setup complete!');
      console.log('\nYou can now login with:');
      console.log('   Email: supplier@travelcrm.com');
      console.log('   Password: Supplier@123');
      
    } else {
      console.log('✅ Supplier user found:', supplierUser.email);
      console.log('   User ID:', supplierUser._id.toString());
      console.log('   Current supplierId:', supplierUser.supplierId || 'null (NOT SET)', '\n');

      // Check if user already has supplierId
      if (supplierUser.supplierId) {
        // Check if supplier profile exists
        const supplier = await Supplier.findById(supplierUser.supplierId);
        if (supplier) {
          console.log('✅ Supplier profile exists:', supplier.companyName);
          console.log('   Supplier ID:', supplier._id.toString());
          console.log('   User ID in Supplier:', supplier.userId?.toString() || 'null');
          console.log('\n✅ Everything is properly linked! No fix needed.');
        } else {
          console.log('❌ Supplier profile NOT FOUND! Creating new one...\n');
          
          // Create new supplier profile
          const newSupplier = await Supplier.create({
            tenantId: tenant._id,
            userId: supplierUser._id,
            companyName: 'Demo Hotel',
            country: 'USA',
            city: 'Miami',
            state: 'FL',
            email: supplierUser.email,
            phone: supplierUser.phone || '+1234567893',
            address: {
              street: '456 Beach Blvd',
              city: 'Miami',
              state: 'FL',
              country: 'USA',
              zipCode: '33139',
            },
            serviceTypes: ['hotel'],
            currencies: ['USD'],
            defaultMarkup: { percentage: 15 },
            status: 'active',
          });

          console.log('✅ Supplier profile created:', newSupplier.companyName);
          console.log('   Supplier ID:', newSupplier._id.toString(), '\n');

          // Update user with new supplierId
          supplierUser.supplierId = newSupplier._id;
          await supplierUser.save();

          console.log('✅ User updated with supplierId');
          console.log('🎉 Fix complete!');
        }
      } else {
        console.log('⚠️  Supplier user has NO supplierId! Fixing...\n');

        // Check if supplier profile exists for this email
        let supplier = await Supplier.findOne({ 
          email: supplierUser.email,
          tenantId: tenant._id 
        });

        if (!supplier) {
          console.log('Creating new supplier profile...');
          
          supplier = await Supplier.create({
            tenantId: tenant._id,
            userId: supplierUser._id,
            companyName: 'Demo Hotel',
            country: 'USA',
            city: 'Miami',
            state: 'FL',
            email: supplierUser.email,
            phone: supplierUser.phone || '+1234567893',
            address: {
              street: '456 Beach Blvd',
              city: 'Miami',
              state: 'FL',
              country: 'USA',
              zipCode: '33139',
            },
            serviceTypes: ['hotel'],
            currencies: ['USD'],
            defaultMarkup: { percentage: 15 },
            status: 'active',
          });

          console.log('✅ Supplier profile created:', supplier.companyName);
          console.log('   Supplier ID:', supplier._id.toString(), '\n');
        } else {
          console.log('✅ Found existing supplier profile:', supplier.companyName);
          console.log('   Supplier ID:', supplier._id.toString(), '\n');

          // Update supplier userId if not set
          if (!supplier.userId || supplier.userId.toString() !== supplierUser._id.toString()) {
            supplier.userId = supplierUser._id;
            await supplier.save();
            console.log('✅ Supplier userId updated');
          }
        }

        // Update user with supplierId
        supplierUser.supplierId = supplier._id;
        await supplierUser.save();

        console.log('✅ User updated with supplierId');
        console.log('   User supplierId:', supplierUser.supplierId.toString());
        console.log('\n🎉 Fix complete! Supplier user is now properly linked.');
        console.log('\nYou can now login with:');
        console.log('   Email: supplier@travelcrm.com');
        console.log('   Password: Supplier@123');
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
};

fixSupplierUser();
