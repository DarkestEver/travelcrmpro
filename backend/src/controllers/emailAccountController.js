const EmailAccount = require('../models/EmailAccount');
const Imap = require('imap');
const nodemailer = require('nodemailer');

/**
 * @desc    Get all email accounts for tenant
 * @route   GET /api/v1/email-accounts
 * @access  Private (Admin, Super Admin, Operator)
 */
exports.getEmailAccounts = async (req, res) => {
  try {
    const emailAccounts = await EmailAccount.find({
      tenantId: req.user.tenantId
    })
      .select('-imap.password -smtp.password -oauth.clientSecret -oauth.refreshToken -oauth.accessToken')
      .sort({ isPrimary: -1, createdAt: -1 });
    
    res.json({
      success: true,
      count: emailAccounts.length,
      data: emailAccounts
    });
  } catch (error) {
    console.error('Error fetching email accounts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching email accounts',
      error: error.message
    });
  }
};

/**
 * @desc    Get single email account
 * @route   GET /api/v1/email-accounts/:id
 * @access  Private
 */
exports.getEmailAccountById = async (req, res) => {
  try {
    const emailAccount = await EmailAccount.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId
    }).select('-imap.password -smtp.password -oauth.clientSecret -oauth.refreshToken -oauth.accessToken');
    
    if (!emailAccount) {
      return res.status(404).json({
        success: false,
        message: 'Email account not found'
      });
    }
    
    res.json({
      success: true,
      data: emailAccount
    });
  } catch (error) {
    console.error('Error fetching email account:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching email account',
      error: error.message
    });
  }
};

/**
 * @desc    Create new email account
 * @route   POST /api/v1/email-accounts
 * @access  Private
 */
exports.createEmailAccount = async (req, res) => {
  try {
    const {
      accountName,
      email,
      provider,
      imap,
      smtp,
      purpose,
      isPrimary
    } = req.body;
    
    // Validation
    if (!accountName || !email || !provider) {
      return res.status(400).json({
        success: false,
        message: 'Please provide accountName, email, and provider'
      });
    }
    
    // Check if email already exists for tenant
    const existingAccount = await EmailAccount.findOne({
      tenantId: req.user.tenantId,
      email: email.toLowerCase()
    });
    
    if (existingAccount) {
      return res.status(400).json({
        success: false,
        message: 'This email account already exists'
      });
    }
    
    // If this is set as primary, unset others
    if (isPrimary) {
      await EmailAccount.updateMany(
        { tenantId: req.user.tenantId },
        { isPrimary: false }
      );
    }
    
    // Create email account
    const emailAccount = await EmailAccount.create({
      tenantId: req.user.tenantId,
      accountName,
      email: email.toLowerCase(),
      provider,
      imap: imap || {},
      smtp: smtp || {},
      purpose: purpose || 'general',
      isPrimary: isPrimary || false,
      createdBy: req.user._id
    });
    
    // Return without sensitive data
    const safeAccount = await EmailAccount.findById(emailAccount._id)
      .select('-imap.password -smtp.password -oauth.clientSecret -oauth.refreshToken -oauth.accessToken');
    
    res.status(201).json({
      success: true,
      message: 'Email account created successfully',
      data: safeAccount
    });
  } catch (error) {
    console.error('Error creating email account:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating email account',
      error: error.message
    });
  }
};

/**
 * @desc    Update email account
 * @route   PUT /api/v1/email-accounts/:id
 * @access  Private
 */
exports.updateEmailAccount = async (req, res) => {
  try {
    let emailAccount = await EmailAccount.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId
    });
    
    if (!emailAccount) {
      return res.status(404).json({
        success: false,
        message: 'Email account not found'
      });
    }
    
    // If setting as primary, unset others
    if (req.body.isPrimary === true) {
      await EmailAccount.updateMany(
        { tenantId: req.user.tenantId, _id: { $ne: req.params.id } },
        { isPrimary: false }
      );
    }
    
    // Update fields
    const allowedUpdates = [
      'accountName', 'imap', 'smtp', 'purpose', 
      'isPrimary', 'isActive', 'autoProcess'
    ];
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        // Special handling for imap and smtp to preserve passwords if not provided
        if (field === 'imap' && req.body.imap) {
          // If password is empty, remove it from the update to keep existing password
          if (!req.body.imap.password) {
            const { password, ...imapWithoutPassword } = req.body.imap;
            emailAccount.imap = {
              ...emailAccount.imap.toObject(),
              ...imapWithoutPassword
            };
          } else {
            emailAccount.imap = req.body.imap;
          }
        } else if (field === 'smtp' && req.body.smtp) {
          // If password is empty, remove it from the update to keep existing password
          if (!req.body.smtp.password) {
            const { password, ...smtpWithoutPassword } = req.body.smtp;
            emailAccount.smtp = {
              ...emailAccount.smtp.toObject(),
              ...smtpWithoutPassword
            };
          } else {
            emailAccount.smtp = req.body.smtp;
          }
        } else {
          emailAccount[field] = req.body[field];
        }
      }
    });
    
    await emailAccount.save();
    
    // Return without sensitive data
    const safeAccount = await EmailAccount.findById(emailAccount._id)
      .select('-imap.password -smtp.password -oauth.clientSecret -oauth.refreshToken -oauth.accessToken');
    
    res.json({
      success: true,
      message: 'Email account updated successfully',
      data: safeAccount
    });
  } catch (error) {
    console.error('Error updating email account:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating email account',
      error: error.message
    });
  }
};

/**
 * @desc    Delete email account
 * @route   DELETE /api/v1/email-accounts/:id
 * @access  Private
 */
exports.deleteEmailAccount = async (req, res) => {
  try {
    const emailAccount = await EmailAccount.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId
    });
    
    if (!emailAccount) {
      return res.status(404).json({
        success: false,
        message: 'Email account not found'
      });
    }
    
    // Check if it's the primary account
    if (emailAccount.isPrimary) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete primary email account. Set another account as primary first.'
      });
    }
    
    await emailAccount.deleteOne();
    
    res.json({
      success: true,
      message: 'Email account deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting email account:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting email account',
      error: error.message
    });
  }
};

/**
 * @desc    Test IMAP connection
 * @route   POST /api/v1/email-accounts/:id/test-imap
 * @access  Private
 */
exports.testIMAPConnection = async (req, res) => {
  try {
    const emailAccount = await EmailAccount.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId
    });
    
    if (!emailAccount) {
      return res.status(404).json({
        success: false,
        message: 'Email account not found'
      });
    }
    
    if (!emailAccount.imap.enabled) {
      return res.status(400).json({
        success: false,
        message: 'IMAP is not enabled for this account'
      });
    }
    
    // Test IMAP connection
    const testResult = await testIMAPConfig({
      host: emailAccount.imap.host,
      port: emailAccount.imap.port,
      secure: emailAccount.imap.secure,
      user: emailAccount.imap.username,
      password: emailAccount.imap.password
    });
    
    // Update test status
    emailAccount.imap.lastTestedAt = new Date();
    emailAccount.imap.lastTestStatus = testResult.success ? 'success' : 'failed';
    emailAccount.imap.lastTestError = testResult.error || '';
    await emailAccount.save();
    
    res.json({
      success: testResult.success,
      message: testResult.message,
      details: testResult.details
    });
  } catch (error) {
    console.error('Error testing IMAP:', error);
    res.status(500).json({
      success: false,
      message: 'Error testing IMAP connection',
      error: error.message
    });
  }
};

/**
 * @desc    Test SMTP connection
 * @route   POST /api/v1/email-accounts/:id/test-smtp
 * @access  Private
 */
exports.testSMTPConnection = async (req, res) => {
  try {
    const emailAccount = await EmailAccount.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId
    });
    
    if (!emailAccount) {
      return res.status(404).json({
        success: false,
        message: 'Email account not found'
      });
    }
    
    if (!emailAccount.smtp.enabled) {
      return res.status(400).json({
        success: false,
        message: 'SMTP is not enabled for this account'
      });
    }
    
    // Test SMTP connection
    const testResult = await testSMTPConfig({
      host: emailAccount.smtp.host,
      port: emailAccount.smtp.port,
      secure: emailAccount.smtp.secure,
      auth: {
        user: emailAccount.smtp.username,
        pass: emailAccount.smtp.password
      }
    });
    
    // Update test status
    emailAccount.smtp.lastTestedAt = new Date();
    emailAccount.smtp.lastTestStatus = testResult.success ? 'success' : 'failed';
    emailAccount.smtp.lastTestError = testResult.error || '';
    await emailAccount.save();
    
    res.json({
      success: testResult.success,
      message: testResult.message,
      details: testResult.details
    });
  } catch (error) {
    console.error('Error testing SMTP:', error);
    res.status(500).json({
      success: false,
      message: 'Error testing SMTP connection',
      error: error.message
    });
  }
};

/**
 * @desc    Set email account as primary
 * @route   POST /api/v1/email-accounts/:id/set-primary
 * @access  Private
 */
exports.setAsPrimary = async (req, res) => {
  try {
    const emailAccount = await EmailAccount.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId
    });
    
    if (!emailAccount) {
      return res.status(404).json({
        success: false,
        message: 'Email account not found'
      });
    }
    
    // Unset all other primary accounts
    await EmailAccount.updateMany(
      { tenantId: req.user.tenantId },
      { isPrimary: false }
    );
    
    // Set this as primary
    emailAccount.isPrimary = true;
    await emailAccount.save();
    
    res.json({
      success: true,
      message: 'Email account set as primary successfully'
    });
  } catch (error) {
    console.error('Error setting primary:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting email account as primary',
      error: error.message
    });
  }
};

/**
 * @desc    Sync email account (Phase 2 - AI processing)
 * @route   POST /api/v1/email-accounts/:id/sync
 * @access  Private
 */
exports.syncEmailAccount = async (req, res) => {
  try {
    res.json({
      success: false,
      message: 'Email sync will be implemented in Phase 2 (AI automation)'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ============================================
// HELPER FUNCTIONS - IMAP/SMTP Testing
// ============================================

/**
 * Test IMAP Configuration
 */
async function testIMAPConfig(config) {
  return new Promise((resolve) => {
    const imap = new Imap({
      user: config.user,
      password: config.password,
      host: config.host,
      port: config.port,
      tls: config.secure,
      tlsOptions: { rejectUnauthorized: false }
    });
    
    let connectionSuccessful = false;
    
    imap.once('ready', () => {
      connectionSuccessful = true;
      imap.end();
    });
    
    imap.once('end', () => {
      if (connectionSuccessful) {
        resolve({
          success: true,
          message: 'IMAP connection successful',
          details: {
            host: config.host,
            port: config.port,
            secure: config.secure
          }
        });
      }
    });
    
    imap.once('error', (err) => {
      resolve({
        success: false,
        message: 'IMAP connection failed',
        error: err.message,
        details: {
          host: config.host,
          port: config.port,
          errorType: err.code || 'UNKNOWN'
        }
      });
    });
    
    // Set timeout
    setTimeout(() => {
      if (!connectionSuccessful) {
        imap.end();
        resolve({
          success: false,
          message: 'IMAP connection timeout',
          error: 'Connection timed out after 10 seconds',
          details: {
            host: config.host,
            port: config.port
          }
        });
      }
    }, 10000);
    
    try {
      imap.connect();
    } catch (err) {
      resolve({
        success: false,
        message: 'IMAP connection failed',
        error: err.message
      });
    }
  });
}

/**
 * Test SMTP Configuration
 */
async function testSMTPConfig(config) {
  return new Promise((resolve) => {
    // Set timeout for SMTP test
    const timeout = setTimeout(() => {
      resolve({
        success: false,
        message: 'SMTP connection timeout',
        error: 'Connection timed out after 10 seconds',
        details: {
          host: config.host,
          port: config.port,
          secure: config.secure
        }
      });
    }, 10000);

    // Add connection timeout to config
    const smtpConfig = {
      ...config,
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
      // For port 25, sometimes authentication is optional
      requireTLS: config.secure,
      tls: {
        rejectUnauthorized: false // Allow self-signed certificates
      }
    };

    const transporter = nodemailer.createTransport(smtpConfig);
    
    transporter.verify((error, success) => {
      clearTimeout(timeout);
      
      if (error) {
        resolve({
          success: false,
          message: 'SMTP connection failed',
          error: error.message,
          details: {
            host: config.host,
            port: config.port,
            secure: config.secure,
            errorType: error.code || 'UNKNOWN',
            errorCommand: error.command || 'CONNECT'
          }
        });
      } else {
        resolve({
          success: true,
          message: 'SMTP connection successful',
          details: {
            host: config.host,
            port: config.port,
            secure: config.secure,
            ready: success
          }
        });
      }
    });
    
    // Set timeout
    setTimeout(() => {
      resolve({
        success: false,
        message: 'SMTP connection timeout',
        error: 'Connection timed out after 10 seconds',
        details: {
          host: config.host,
          port: config.port
        }
      });
    }, 10000);
  });
}
