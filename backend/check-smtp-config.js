/**
 * Check Tenant SMTP Configuration
 * Verifies that tenant has SMTP settings configured for sending replies
 */

require('dotenv').config();
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const EmailAccount = require('./src/models/EmailAccount');

async function checkSMTPConfig() {
  try {
    console.log('🔍 Checking tenant SMTP configuration...\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all active email accounts
    const accounts = await EmailAccount.find({ 
      isActive: true 
    }).select('+smtp.password +imap.password');

    console.log(`📧 Found ${accounts.length} active email account(s)\n`);

    for (const account of accounts) {
      console.log('═══════════════════════════════════════════════════');
      console.log(`📬 Email Account: ${account.email}`);
      console.log(`🏢 Tenant ID: ${account.tenantId}`);
      console.log('═══════════════════════════════════════════════════\n');

      // IMAP Configuration
      console.log('📥 IMAP Configuration (for receiving):');
      console.log('   Enabled:', account.imap?.enabled ? '✅' : '❌');
      if (account.imap?.enabled) {
        console.log('   Host:', account.imap.host);
        console.log('   Port:', account.imap.port);
        console.log('   Secure:', account.imap.secure);
        console.log('   Username:', account.imap.username);
        
        // Decrypt password
        const accountObj = account.toObject({ getters: true });
        console.log('   Password:', accountObj.imap.password ? '✅ (decrypted)' : '❌ Missing');
      }
      console.log();

      // SMTP Configuration
      console.log('📤 SMTP Configuration (for sending):');
      console.log('   Enabled:', account.smtp?.enabled ? '✅' : '❌');
      if (account.smtp?.enabled) {
        console.log('   Host:', account.smtp.host);
        console.log('   Port:', account.smtp.port);
        console.log('   Secure:', account.smtp.secure);
        console.log('   Username:', account.smtp.username);
        
        // Decrypt password
        const accountObj = account.toObject({ getters: true });
        console.log('   Password:', accountObj.smtp.password ? '✅ (decrypted)' : '❌ Missing');
        console.log('   From Name:', account.smtp.fromName || '(not set)');
        console.log('   Reply-To:', account.smtp.replyTo || '(not set)');
      } else {
        console.log('   ⚠️  SMTP is DISABLED - Manual replies will fail!');
      }
      console.log();

      // Check if SMTP and IMAP use same credentials
      if (account.smtp?.enabled && account.imap?.enabled) {
        const sameHost = account.smtp.host === account.imap.host;
        const sameUser = account.smtp.username === account.imap.username;
        
        console.log('🔗 Configuration Consistency:');
        console.log('   Same host for IMAP/SMTP:', sameHost ? '✅' : '❌');
        console.log('   Same username for IMAP/SMTP:', sameUser ? '✅' : '❌');
        
        if (!sameHost || !sameUser) {
          console.log('   ⚠️  Warning: Different IMAP/SMTP settings. Verify this is intentional.');
        }
        console.log();
      }

      // Test SMTP connection
      if (account.smtp?.enabled) {
        console.log('🧪 Testing SMTP connection...');
        const accountObj = account.toObject({ getters: true });

        const transporter = nodemailer.createTransporter({
          host: accountObj.smtp.host,
          port: accountObj.smtp.port,
          secure: accountObj.smtp.secure,
          auth: {
            user: accountObj.smtp.username,
            pass: accountObj.smtp.password
          },
          tls: {
            rejectUnauthorized: false
          }
        });

        try {
          await transporter.verify();
          console.log('   ✅ SMTP connection successful!');
          console.log('   📧 Ready to send manual replies from UI');
        } catch (error) {
          console.log('   ❌ SMTP connection failed:', error.message);
          console.log('   🔧 Manual replies will fail until SMTP is configured correctly');
        }
      }

      console.log('\n');
    }

    if (accounts.length === 0) {
      console.log('⚠️  No active email accounts found!');
      console.log('💡 Create an email account with SMTP enabled to send manual replies.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkSMTPConfig();
