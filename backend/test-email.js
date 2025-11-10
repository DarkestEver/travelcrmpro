/**
 * Quick Email Test Script
 * Run this to test email sending without authentication
 */

// Use dynamic import for proper nodemailer loading
(async () => {
  const nodemailer = require('nodemailer');

  console.log('🔄 Initializing email service...\n');

  // Email configuration
  const transporter = nodemailer.createTransport({
  host: 'travelmanagerpro.com',
  port: 587,
  secure: false,
  auth: {
    user: 'app@travelmanagerpro.com',
    pass: 'Ip@warming#123'
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Test email
const mailOptions = {
  from: '"Travel Manager Pro" <app@travelmanagerpro.com>',
  to: 'keshav@eurasiaglobal.online',
  subject: 'Test Email from Travel CRM',
  html: `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">
              🎉 Email Test Successful!
            </h1>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px;">
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Hello Keshav,
            </p>
            
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              This is a test email from the <strong>Travel Manager Pro</strong> CRM system. 
              If you're receiving this, it means our email service is working perfectly! 🚀
            </p>
            
            <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 30px 0; border-radius: 4px;">
              <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0;">
                <strong>Test Details:</strong><br>
                Date: ${new Date().toLocaleString()}<br>
                From: Travel Manager Pro<br>
                Status: ✅ Success
              </p>
            </div>
            
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Our email service is now ready to send:
            </p>
            
            <ul style="color: #333333; font-size: 16px; line-height: 1.8; margin-bottom: 30px;">
              <li>Invoice notifications</li>
              <li>Payment receipts</li>
              <li>Booking confirmations</li>
              <li>Commission alerts</li>
              <li>Credit limit warnings</li>
            </ul>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #666666; font-size: 14px; line-height: 1.6;">
                Thank you for using Travel Manager Pro!
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
            <p style="color: #999999; font-size: 12px; line-height: 1.6; margin: 0;">
              This is an automated test email from Travel Manager Pro CRM System<br>
              © ${new Date().getFullYear()} Travel Manager Pro. All rights reserved.
            </p>
          </div>
          
        </div>
      </body>
    </html>
  `
};

// Send email
console.log('🔄 Sending test email to keshav@eurasiaglobal.online...\n');

transporter.sendMail(mailOptions)
  .then(info => {
    console.log('✅ Email sent successfully!');
    console.log('📧 Message ID:', info.messageId);
    console.log('📬 Response:', info.response);
    console.log('\n✨ Email service is working perfectly!\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error sending email:');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
      console.error('\nFull error:', error);
      process.exit(1);
    });
})();
