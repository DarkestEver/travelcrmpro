/**
 * Check if nodemailer is properly accessible
 */

try {
  const nodemailer = require('nodemailer');
  
  console.log('✅ nodemailer module loaded successfully');
  console.log('   Type:', typeof nodemailer);
  console.log('   Exports:', Object.keys(nodemailer));
  console.log('   Has createTransport?', typeof nodemailer.createTransport);
  
  if (typeof nodemailer.createTransport === 'function') {
    console.log('\n✅ nodemailer.createTransport is a function');
    console.log('   Module is working correctly!');
    
    // Try creating a test transporter
    const testTransporter = nodemailer.createTransport({
      host: 'test.example.com',
      port: 587,
      secure: false,
      auth: {
        user: 'test@example.com',
        pass: 'password'
      }
    });
    
    console.log('✅ Test transporter created successfully');
    console.log('   Transporter type:', typeof testTransporter);
    console.log('   Has sendMail?', typeof testTransporter.sendMail);
  } else {
    console.log('\n❌ nodemailer.createTransport is NOT a function');
    console.log('   Type:', typeof nodemailer.createTransport);
    console.log('   This indicates a module loading issue');
  }
  
} catch (error) {
  console.error('❌ Error loading nodemailer:', error.message);
  console.error('   Stack:', error.stack);
}
