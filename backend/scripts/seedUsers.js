const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

// User Schema (simplified for seeding)
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['super_admin', 'operator', 'agent'],
    default: 'agent',
  },
  phone: String,
  emailVerified: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

const User = mongoose.model('User', userSchema);

// Demo users
const demoUsers = [
  {
    name: 'Admin User',
    email: 'admin@travelcrm.com',
    password: 'Admin@123',
    role: 'super_admin',
    phone: '+1234567890',
    emailVerified: true,
    isActive: true,
  },
  {
    name: 'Operator User',
    email: 'operator@travelcrm.com',
    password: 'Operator@123',
    role: 'operator',
    phone: '+1234567891',
    emailVerified: true,
    isActive: true,
  },
  {
    name: 'Agent User',
    email: 'agent@travelcrm.com',
    password: 'Agent@123',
    role: 'agent',
    phone: '+1234567892',
    emailVerified: true,
    isActive: true,
  },
];

// Seed function
const seedUsers = async () => {
  try {
    await connectDB();

    // Clear existing users (optional - comment out if you want to keep existing data)
    console.log('🗑️  Clearing existing demo users...');
    await User.deleteMany({ 
      email: { 
        $in: ['admin@travelcrm.com', 'operator@travelcrm.com', 'agent@travelcrm.com'] 
      } 
    });

    // Create demo users
    console.log('🌱 Seeding demo users...');
    for (const userData of demoUsers) {
      const user = new User(userData);
      await user.save();
      console.log(`✅ Created user: ${user.name} (${user.email})`);
    }

    console.log('\n🎉 Seeding completed successfully!');
    console.log('\n📋 Demo Accounts:');
    console.log('─────────────────────────────────────────');
    console.log('Admin:    admin@travelcrm.com    / Admin@123');
    console.log('Operator: operator@travelcrm.com / Operator@123');
    console.log('Agent:    agent@travelcrm.com    / Agent@123');
    console.log('─────────────────────────────────────────\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Error:', error.message);
    process.exit(1);
  }
};

// Run seeder
seedUsers();
