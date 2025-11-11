/**
 * Test password decryption
 */

const mongoose = require('mongoose');
require('dotenv').config();

const EmailAccount = require('./src/models/EmailAccount');

async function testDecryption() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-crm');
    console.log('✅ Connected to MongoDB\n');

    const account = await EmailAccount.findOne({ email: 'app@travelmanagerpro.com' });
    
    console.log('1️⃣ Direct access:');
    console.log('   account.imap.password:', account.imap.password);
    console.log('   Length:', account.imap.password.length);
    console.log('   Includes colon?', account.imap.password.includes(':'), '\n');
    
    console.log('2️⃣ Using get():');
    console.log('   account.get("imap.password"):', account.get('imap.password'));
    console.log('   Length:', account.get('imap.password').length);
    console.log('   Includes colon?', account.get('imap.password').includes(':'), '\n');
    
    console.log('3️⃣ Using toObject({getters: true}):');
    const obj = account.toObject({ getters: true });
    console.log('   obj.imap.password:', obj.imap.password);
    console.log('   Length:', obj.imap.password.length);
    console.log('   Includes colon?', obj.imap.password.includes(':'), '\n');
    
    console.log('4️⃣ Using toJSON():');
    const json = account.toJSON();
    console.log('   json.imap.password:', json.imap.password);
    console.log('   Length:', json.imap.password.length);
    console.log('   Includes colon?', json.imap.password.includes(':'), '\n');

    // Test manual decryption
    console.log('5️⃣ Manual decryption test:');
    const crypto = require('crypto');
    const ENCRYPTION_KEY = process.env.EMAIL_ENCRYPTION_KEY || 'change-this-to-32-char-string!';
    
    function manualDecrypt(encryptedPassword) {
      if (!encryptedPassword || !encryptedPassword.includes(':')) {
        return encryptedPassword;
      }
      
      try {
        const parts = encryptedPassword.split(':');
        const iv = Buffer.from(parts[0], 'hex');
        const encrypted = parts[1];
        
        const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
      } catch (error) {
        console.error('Decryption error:', error);
        return encryptedPassword;
      }
    }
    
    // Get raw password from database
    const rawAccount = await EmailAccount.findOne({ email: 'app@travelmanagerpro.com' }).lean();
    console.log('   Raw from DB:', rawAccount.imap.password);
    console.log('   After manual decrypt:', manualDecrypt(rawAccount.imap.password));
    console.log('   Decrypted length:', manualDecrypt(rawAccount.imap.password).length);

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testDecryption();
