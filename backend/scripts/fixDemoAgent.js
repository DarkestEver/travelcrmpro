/**
 * Script to update demo agent user with required agent fields
 * Run this with: node scripts/fixDemoAgent.js
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

const User = require('../src/models/User');

async function fixDemoAgent() {
  try {
    // Find the demo agent user
    const demoAgent = await User.findOne({ 
      $or: [
        { email: 'demo.agent@travelcrm.com' },
        { email: { $regex: /demo.*agent/i } },
        { role: 'agent' }
      ]
    });

    if (!demoAgent) {
      console.log('❌ No agent user found');
      console.log('📝 Please provide the email of your agent user:');
      process.exit(1);
    }

    console.log(`\n🔍 Found agent user: ${demoAgent.email}`);
    console.log(`   Current role: ${demoAgent.role}`);
    console.log(`   Agent code: ${demoAgent.agentCode || 'NOT SET'}`);

    // Update with agent fields if not already set
    const updates = {};
    let needsUpdate = false;

    if (!demoAgent.agentCode) {
      updates.agentCode = `AGT${Date.now().toString().slice(-6)}`;
      needsUpdate = true;
    }

    if (!demoAgent.agentLevel) {
      updates.agentLevel = 'silver';
      needsUpdate = true;
    }

    if (demoAgent.creditLimit === undefined || demoAgent.creditLimit === null) {
      updates.creditLimit = 10000;
      needsUpdate = true;
    }

    if (demoAgent.commissionRate === undefined || demoAgent.commissionRate === null) {
      updates.commissionRate = 10;
      needsUpdate = true;
    }

    if (demoAgent.isActive === undefined || demoAgent.isActive === null) {
      updates.isActive = true;
      needsUpdate = true;
    }

    if (!needsUpdate) {
      console.log('\n✅ Agent user already has all required fields!');
      console.log('\nAgent Details:');
      console.log(`   Agent Code: ${demoAgent.agentCode}`);
      console.log(`   Agent Level: ${demoAgent.agentLevel}`);
      console.log(`   Credit Limit: $${demoAgent.creditLimit}`);
      console.log(`   Commission Rate: ${demoAgent.commissionRate}%`);
      console.log(`   Is Active: ${demoAgent.isActive}`);
    } else {
      // Apply updates
      const updatedAgent = await User.findByIdAndUpdate(
        demoAgent._id,
        { $set: updates },
        { new: true, runValidators: true }
      );

      console.log('\n✅ Successfully updated agent user!');
      console.log('\nUpdated Agent Details:');
      console.log(`   Email: ${updatedAgent.email}`);
      console.log(`   Agent Code: ${updatedAgent.agentCode}`);
      console.log(`   Agent Level: ${updatedAgent.agentLevel}`);
      console.log(`   Credit Limit: $${updatedAgent.creditLimit}`);
      console.log(`   Commission Rate: ${updatedAgent.commissionRate}%`);
      console.log(`   Is Active: ${updatedAgent.isActive}`);
    }

    console.log('\n🎉 Done! You can now login with this agent account.');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error updating agent:', error);
    process.exit(1);
  }
}

// Run the script
fixDemoAgent();
