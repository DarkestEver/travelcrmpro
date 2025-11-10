/**
 * Seed Script for Super Admin and Default Tenant
 * Creates a default tenant and super admin user
 * Run: node backend/scripts/seedSuperAdmin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-crm';

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Define schemas (inline for simplicity)
const tenantSchema = new mongoose.Schema({
  name: String,
  subdomain: String,
  status: String,
  subscription: Object,
  settings: Object,
  ownerId: mongoose.Schema.Types.ObjectId,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  tenantId: mongoose.Schema.Types.ObjectId,
  name: String,
  email: String,
  password: String,
  role: String,
  phone: String,
  isActive: { type: Boolean, default: true },
  emailVerified: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Tenant = mongoose.model('Tenant', tenantSchema);
const User = mongoose.model('User', userSchema);

async function seedSuperAdmin() {
  try {
    console.log('\n🌱 Starting seed process...\n');

    // Step 1: Check if default tenant exists
    let tenant = await Tenant.findOne({ subdomain: 'default' });
    
    if (!tenant) {
      console.log('📦 Creating default tenant...');
      tenant = await Tenant.create({
        name: 'Default Tenant',
        subdomain: 'default',
        status: 'active',
        subscription: {
          plan: 'enterprise',
          status: 'active'
        },
        settings: {
          currency: 'INR',
          timezone: 'Asia/Kolkata',
          language: 'en'
        }
      });
      console.log('✅ Default tenant created:', tenant.subdomain);
    } else {
      console.log('✅ Default tenant already exists:', tenant.subdomain);
    }

    // Step 2: Check if super admin exists
    const existingSuperAdmin = await User.findOne({ 
      email: 'admin@travelcrm.com' 
    });

    if (existingSuperAdmin) {
      console.log('⚠️  Super admin already exists:', existingSuperAdmin.email);
      console.log('   Current role:', existingSuperAdmin.role);
      
      // Update role to super_admin if it's not
      if (existingSuperAdmin.role !== 'super_admin') {
        existingSuperAdmin.role = 'super_admin';
        existingSuperAdmin.tenantId = tenant._id;
        await existingSuperAdmin.save();
        console.log('✅ Updated role to super_admin');
      }
      
      // Update tenant ownerId if not set
      if (!tenant.ownerId) {
        tenant.ownerId = existingSuperAdmin._id;
        await tenant.save();
        console.log('✅ Linked tenant to super admin');
      }
    } else {
      console.log('👤 Creating super admin user...');
      
      // Hash password
      const hashedPassword = await bcrypt.hash('Admin@123', 10);
      
      // Create super admin
      const superAdmin = await User.create({
        tenantId: tenant._id,
        name: 'Super Administrator',
        email: 'admin@travelcrm.com',
        password: hashedPassword,
        role: 'super_admin',
        phone: '+1234567890',
        isActive: true,
        emailVerified: true
      });
      
      console.log('✅ Super admin created:', superAdmin.email);
      
      // Update tenant with owner
      tenant.ownerId = superAdmin._id;
      await tenant.save();
      console.log('✅ Linked tenant to super admin');
    }

    // Step 3: Create operator if doesn't exist
    const existingOperator = await User.findOne({ email: 'operator@travelcrm.com' });
    if (!existingOperator) {
      const hashedPassword = await bcrypt.hash('Operator@123', 10);
      await User.create({
        tenantId: tenant._id,
        name: 'Operator User',
        email: 'operator@travelcrm.com',
        password: hashedPassword,
        role: 'operator',
        phone: '+1234567891',
        isActive: true,
        emailVerified: true
      });
      console.log('✅ Operator user created');
    } else {
      console.log('✅ Operator user already exists');
    }

    console.log('\n🎉 Seed process completed successfully!\n');
    console.log('📋 Login Credentials:\n');
    console.log('   🔐 Super Admin:');
    console.log('      Email:    admin@travelcrm.com');
    console.log('      Password: Admin@123');
    console.log('      Role:     super_admin');
    console.log('\n   🔐 Operator:');
    console.log('      Email:    operator@travelcrm.com');
    console.log('      Password: Operator@123');
    console.log('      Role:     operator');
    console.log('\n   🏢 Tenant:');
    console.log('      Name:     Default Tenant');
    console.log('      Subdomain: default');
    console.log('      ID:       ' + tenant._id);
    console.log('\n💡 Next Steps:');
    console.log('   1. Start your servers (backend & frontend)');
    console.log('   2. Go to http://localhost:5173/login');
    console.log('   3. Login with: admin@travelcrm.com / Admin@123');
    console.log('   4. Look for "Tenant Management" in the sidebar\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during seed process:', error);
    process.exit(1);
  }
}

// Run the seed
seedSuperAdmin();
