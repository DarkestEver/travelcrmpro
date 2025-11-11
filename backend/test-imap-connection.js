/**
 * Test IMAP connection with detailed error logging
 */

const Imap = require('imap');
const mongoose = require('mongoose');
require('dotenv').config();

const EmailAccount = require('./src/models/EmailAccount');

async function testImapConnection() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-crm');
    console.log('✅ Connected to MongoDB\n');

    const account = await EmailAccount.findOne({ email: 'app@travelmanagerpro.com' });
    
    if (!account) {
      console.log('❌ Email account not found');
      process.exit(1);
    }

    console.log('📧 Testing IMAP connection for:', account.email);
    console.log('\nIMAP Configuration:');
    console.log('- Host:', account.imap.host);
    console.log('- Port:', account.imap.port);
    console.log('- Secure (TLS):', account.imap.secure);
    console.log('- Username:', account.imap.username);
    console.log('- Password:', account.imap.password ? '(encrypted - ' + account.imap.password.length + ' chars)' : '(missing)');
    
    console.log('\n🔌 Attempting IMAP connection...\n');

    // Convert to plain object to ensure getters (password decryption) are applied
    const accountObj = account.toObject({ getters: true });
    
    console.log('🔑 Decrypted password length:', accountObj.imap.password.length, 'chars');

    const imapConfig = {
      user: accountObj.email,
      password: accountObj.imap.password,
      host: accountObj.imap.host,
      port: accountObj.imap.port || 993,
      tls: accountObj.imap.secure !== false, // Default to true
      tlsOptions: { 
        rejectUnauthorized: false // For self-signed certificates
      },
      connTimeout: 10000,
      authTimeout: 5000,
      debug: console.log // Enable debug output
    };

    console.log('📝 Connection config:');
    console.log('- user:', imapConfig.user);
    console.log('- host:', imapConfig.host);
    console.log('- port:', imapConfig.port);
    console.log('- tls:', imapConfig.tls);
    console.log('\n');

    const imap = new Imap(imapConfig);

    imap.once('ready', () => {
      console.log('\n✅ IMAP connection successful!');
      console.log('✅ Authentication successful!');
      
      imap.openBox('INBOX', false, (err, box) => {
        if (err) {
          console.error('❌ Failed to open INBOX:', err.message);
          imap.end();
          return;
        }
        
        console.log('✅ INBOX opened successfully');
        console.log('📊 Total messages:', box.messages.total);
        console.log('📊 New messages:', box.messages.new);
        console.log('📊 Unseen messages:', box.messages.unseen || 0);
        
        imap.end();
      });
    });

    imap.once('error', (err) => {
      console.error('\n❌ IMAP ERROR:', err.message);
      console.error('\n🔍 Error details:', err);
      
      if (err.message.includes('Invalid credentials')) {
        console.log('\n💡 SOLUTION: Check your email password');
      } else if (err.message.includes('ECONNREFUSED')) {
        console.log('\n💡 SOLUTION: IMAP server is not accessible. Check:');
        console.log('   - Is the host correct?');
        console.log('   - Is the port correct?');
        console.log('   - Is IMAP enabled on the server?');
      } else if (err.message.includes('timeout')) {
        console.log('\n💡 SOLUTION: Connection timeout. Check:');
        console.log('   - Firewall settings');
        console.log('   - Network connectivity');
      }
      
      mongoose.connection.close();
      process.exit(1);
    });

    imap.once('end', () => {
      console.log('\n👋 IMAP connection closed');
      mongoose.connection.close();
    });

    imap.connect();

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testImapConnection();
