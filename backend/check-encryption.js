// Check if encryption/decryption is working
require('dotenv').config();
const mongoose = require('mongoose');

async function checkEncryption() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-crm');
    console.log('✅ Connected to MongoDB\n');

    const Tenant = require('./src/models/Tenant');
    
    const tenant = await Tenant.findById('690ce6d206c104addbfedb65');
    
    console.log('📊 Tenant AI Settings:');
    console.log('   Enabled:', tenant.settings.aiSettings.enabled);
    console.log('   Raw encrypted key:', tenant.settings.aiSettings.openaiApiKey.substring(0, 50) + '...');
    console.log('');
    
    console.log('🔐 Attempting to decrypt with current ENCRYPTION_KEY...\n');
    
    try {
      const decrypted = tenant.getDecryptedAISettings();
      console.log('✅ DECRYPTION SUCCESSFUL!');
      console.log('   Decrypted key starts with:', decrypted.openaiApiKey.substring(0, 20) + '...');
      console.log('   Key length:', decrypted.openaiApiKey.length);
      
      // Test if it looks like a valid OpenAI key
      if (decrypted.openaiApiKey.startsWith('sk-')) {
        console.log('   ✅ Key format looks valid (starts with sk-)');
      } else {
        console.log('   ⚠️  Key format may be invalid (should start with sk-)');
      }
    } catch (error) {
      console.error('❌ DECRYPTION FAILED:', error.message);
      console.error('\n💡 This means the ENCRYPTION_KEY in .env doesn\'t match');
      console.error('   the key used to encrypt the OpenAI API key in the database.');
      console.error('\n   Solution: Re-save the OpenAI API key in the frontend');
      console.error('   or update it directly in the database with the new encryption.');
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
console.log('  ENCRYPTION/DECRYPTION TEST');
console.log('══════════════════════════════════════════════════════════════\n');

checkEncryption();
