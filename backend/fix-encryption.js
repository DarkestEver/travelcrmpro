// Fix encrypted OpenAI key - clear and re-encrypt
require('dotenv').config();
const mongoose = require('mongoose');

async function fixEncryption() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-crm');
    console.log('✅ Connected to MongoDB\n');

    const Tenant = require('./src/models/Tenant');
    
    const tenant = await Tenant.findById('690ce6d206c104addbfedb65');
    
    console.log('🔧 Current state:');
    console.log('   AI Enabled:', tenant.settings.aiSettings.enabled);
    console.log('   Old encrypted key:', tenant.settings.aiSettings.openaiApiKey.substring(0, 50) + '...\n');
    
    console.log('🔄 Clearing old encrypted key and setting new one...\n');
    
    // Set the plain text API key - Mongoose pre-save hook will encrypt it
    const newApiKey = process.env.OPENAI_API_KEY;
    
    if (!newApiKey) {
      console.error('❌ OPENAI_API_KEY not found in environment variables!');
      console.log('   Please set OPENAI_API_KEY in your .env file');
      process.exit(1);
    }
    
    tenant.settings.aiSettings.openaiApiKey = newApiKey;
    tenant.markModified('settings.aiSettings.openaiApiKey');
    
    await tenant.save();
    
    console.log('✅ OpenAI API key re-encrypted with current ENCRYPTION_KEY\n');
    console.log('   New encrypted key:', tenant.settings.aiSettings.openaiApiKey.substring(0, 50) + '...\n');
    
    // Test decryption
    console.log('🔐 Testing decryption...\n');
    
    const reloaded = await Tenant.findById('690ce6d206c104addbfedb65');
    
    try {
      const decrypted = reloaded.getDecryptedAISettings();
      console.log('✅ DECRYPTION SUCCESSFUL!');
      console.log('   Decrypted key starts with:', decrypted.openaiApiKey.substring(0, 20) + '...');
      console.log('   Key length:', decrypted.openaiApiKey.length);
      
      if (decrypted.openaiApiKey.startsWith('sk-')) {
        console.log('   ✅ Key format is valid (starts with sk-)');
      }
      
      console.log('\n✅ OpenAI API key is now properly encrypted and ready to use!');
      
    } catch (error) {
      console.error('❌ Decryption still failed:', error.message);
    }

    await mongoose.connection.close();
    console.log('\n✅ Connection closed');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

console.log('══════════════════════════════════════════════════════════════');
console.log('  FIX OPENAI KEY ENCRYPTION');
console.log('══════════════════════════════════════════════════════════════\n');

fixEncryption();
