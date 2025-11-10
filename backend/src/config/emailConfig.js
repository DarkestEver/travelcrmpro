/**
 * Email Configuration
 * Manages email service setup and configuration
 */

const nodemailer = require('nodemailer');

// Email configuration from environment variables
const emailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true' || false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  // Add these for better compatibility
  tls: {
    rejectUnauthorized: false // Allow self-signed certificates (use with caution)
  }
};

// Only add service if using a known service (gmail, outlook, etc.)
if (process.env.EMAIL_SERVICE && process.env.EMAIL_SERVICE !== 'smtp') {
  emailConfig.service = process.env.EMAIL_SERVICE;
  // Remove host/port when using a service
  delete emailConfig.host;
  delete emailConfig.port;
}

// Create reusable transporter
const createTransporter = () => {
  try {
    const transporter = nodemailer.createTransport(emailConfig);
    return transporter;
  } catch (error) {
    console.error('Error creating email transporter:', error);
    throw error;
  }
};

// Verify transporter connection
const verifyConnection = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email service is ready to send messages');
    return true;
  } catch (error) {
    console.error('❌ Email service connection failed:', error.message);
    return false;
  }
};

// Default sender information
const defaultSender = {
  name: process.env.EMAIL_FROM_NAME || 'Travel CRM',
  email: process.env.EMAIL_FROM || process.env.EMAIL_USER
};

module.exports = {
  emailConfig,
  createTransporter,
  verifyConnection,
  defaultSender
};
