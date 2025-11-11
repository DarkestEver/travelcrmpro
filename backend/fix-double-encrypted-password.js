/**
 * Fix double-encrypted IMAP password
 * The password got encrypted twice, so we need to decrypt it once and save it back
 */

const mongoose = require('mongoose');
const readline = require('readline');
require('dotenv').config();

const EmailAccount = require('./src/models/EmailAccount');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function fixPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-crm');
    console.log('✅ Connected to MongoDB\n');

    const account = await EmailAccount.findOne({ email: 'app@travelmanagerpro.com' }).lean();
    
    console.log('Current account:', account.email);
    console.log('Current encrypted password:', account.imap.password, '\n');
    
    console.log('⚠️  WARNING: The password appears to be double-encrypted.');
    console.log('This script will:');
    console.log('1. Decrypt the password once (to get the plain text)');
    console.log('2. Save it back (will be encrypted once by the model)\n');
    
    const proceed = await question('Do you want to proceed? (yes/no): ');
    
    if (proceed.toLowerCase() !== 'yes') {
      console.log('❌ Aborted');
      rl.close();
      mongoose.connection.close();
      return;
    }
    
    console.log('\n🔧 Option 1: Enter the correct IMAP password manually');
    console.log('🔧 Option 2: Let me try to decrypt the double-encrypted password\n');
    
    const option = await question('Choose option (1 or 2): ');
    
    let newPassword;
    
    if (option === '1') {
      newPassword = await question('\nEnter the correct IMAP password: ');
    } else {
      // Try to decrypt twice
      const crypto = require('crypto');
      const ENCRYPTION_KEY = process.env.EMAIL_ENCRYPTION_KEY || 'change-this-to-32-char-string!';
      
      function decrypt(encryptedPassword) {
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
      
      // Decrypt once
      const firstDecrypt = decrypt(account.imap.password);
      console.log('\n1st decryption:', firstDecrypt);
      
      // Decrypt twice
      const secondDecrypt = decrypt(firstDecrypt);
      console.log('2nd decryption:', secondDecrypt);
      console.log('');
      
      newPassword = secondDecrypt;
    }
    
    console.log('\n🔄 Updating password in database...');
    
    // Update using Mongoose (will encrypt once)
    await EmailAccount.findByIdAndUpdate(account._id, {
      'imap.password': newPassword
    });
    
    console.log('✅ Password updated successfully!\n');
    
    // Verify
    const updated = await EmailAccount.findById(account._id);
    console.log('🔍 Verification:');
    console.log('   New encrypted password in DB:', updated.imap.password);
    console.log('   Length:', updated.imap.password.length);
    console.log('\n✅ Done! Please restart the backend to test.');
    
    rl.close();
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    rl.close();
    process.exit(1);
  }
}

fixPassword();
