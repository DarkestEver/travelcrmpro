# Multi-Email Account Management System - PHASE 1
**Travel CRM - Email Provisioning & Connection Testing**

---

## 🎯 OBJECTIVE

Build a system where **each tenant can add and manage multiple email accounts** from different providers:
- ✅ Gmail (via IMAP/SMTP or API)
- ✅ Outlook/Hotmail (via IMAP/SMTP or API)
- ✅ Zoho Mail
- ✅ Generic SMTP/IMAP (any provider)

**Key Features:**
1. Add unlimited email accounts per tenant
2. Test IMAP connection (receive emails)
3. Test SMTP connection (send emails)
4. View connection status for each account
5. Edit/Delete email accounts
6. Secure credential storage (encrypted)

---

## 📋 DATABASE SCHEMA

### EmailAccount Model

```javascript
// backend/src/models/EmailAccount.js

const mongoose = require('mongoose');
const crypto = require('crypto');

const emailAccountSchema = new mongoose.Schema({
  // Tenant & User
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  
  // Account Identification
  accountName: {
    type: String,
    required: true,
    trim: true
  }, // e.g., "Support Gmail", "Sales Outlook"
  
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  
  // Provider Type
  provider: {
    type: String,
    enum: ['gmail', 'outlook', 'zoho', 'smtp', 'other'],
    required: true
  },
  
  // IMAP Configuration (Receiving)
  imap: {
    enabled: {
      type: Boolean,
      default: true
    },
    host: {
      type: String,
      required: true
    }, // e.g., imap.gmail.com
    port: {
      type: Number,
      required: true,
      default: 993
    },
    secure: {
      type: Boolean,
      default: true
    }, // Use TLS
    username: {
      type: String,
      required: true
    },
    password: {
      type: String,
      required: true,
      get: decryptPassword,
      set: encryptPassword
    }, // Encrypted
    
    // Connection Status
    lastTestedAt: Date,
    lastTestStatus: {
      type: String,
      enum: ['success', 'failed', 'pending', 'not_tested'],
      default: 'not_tested'
    },
    lastTestError: String
  },
  
  // SMTP Configuration (Sending)
  smtp: {
    enabled: {
      type: Boolean,
      default: true
    },
    host: {
      type: String,
      required: true
    }, // e.g., smtp.gmail.com
    port: {
      type: Number,
      required: true,
      default: 587
    },
    secure: {
      type: Boolean,
      default: false
    }, // Use STARTTLS
    username: {
      type: String,
      required: true
    },
    password: {
      type: String,
      required: true,
      get: decryptPassword,
      set: encryptPassword
    }, // Encrypted
    
    // Sender Details
    fromName: String, // Display name for sent emails
    replyTo: String,
    
    // Connection Status
    lastTestedAt: Date,
    lastTestStatus: {
      type: String,
      enum: ['success', 'failed', 'pending', 'not_tested'],
      default: 'not_tested'
    },
    lastTestError: String
  },
  
  // OAuth (for Gmail/Outlook API - Future)
  oauth: {
    enabled: {
      type: Boolean,
      default: false
    },
    provider: String, // 'google', 'microsoft'
    clientId: String,
    clientSecret: {
      type: String,
      get: decryptPassword,
      set: encryptPassword
    },
    refreshToken: {
      type: String,
      get: decryptPassword,
      set: encryptPassword
    },
    accessToken: {
      type: String,
      get: decryptPassword,
      set: encryptPassword
    },
    tokenExpiry: Date
  },
  
  // Usage Settings
  isActive: {
    type: Boolean,
    default: true
  },
  
  isPrimary: {
    type: Boolean,
    default: false
  }, // Primary email for sending
  
  // Purpose
  purpose: {
    type: String,
    enum: ['support', 'sales', 'finance', 'general', 'custom'],
    default: 'general'
  },
  
  // Auto-Processing (for AI - Phase 2)
  autoProcess: {
    enabled: {
      type: Boolean,
      default: false
    },
    categories: [String], // Which categories to auto-process
    lastSyncAt: Date,
    syncFrequency: {
      type: Number,
      default: 5
    } // minutes
  },
  
  // Stats
  stats: {
    emailsReceived: {
      type: Number,
      default: 0
    },
    emailsSent: {
      type: Number,
      default: 0
    },
    lastReceivedAt: Date,
    lastSentAt: Date
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

// Encryption/Decryption Functions
const ENCRYPTION_KEY = process.env.EMAIL_ENCRYPTION_KEY || 'default-key-change-in-production-32'; // Must be 32 chars
const ALGORITHM = 'aes-256-cbc';

function encryptPassword(password) {
  if (!password) return password;
  
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(password, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

function decryptPassword(encryptedPassword) {
  if (!encryptedPassword || !encryptedPassword.includes(':')) return encryptedPassword;
  
  const parts = encryptedPassword.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Indexes
emailAccountSchema.index({ tenantId: 1, email: 1 });
emailAccountSchema.index({ tenantId: 1, isPrimary: 1 });
emailAccountSchema.index({ tenantId: 1, isActive: 1 });

// Methods
emailAccountSchema.methods.testIMAP = async function() {
  // Implemented in controller
};

emailAccountSchema.methods.testSMTP = async function() {
  // Implemented in controller
};

module.exports = mongoose.model('EmailAccount', emailAccountSchema);
```

---

## 🔧 BACKEND API ENDPOINTS

### Email Account Management Routes

```javascript
// backend/src/routes/emailAccounts.js

const express = require('express');
const router = express.Router();
const {
  getEmailAccounts,
  getEmailAccountById,
  createEmailAccount,
  updateEmailAccount,
  deleteEmailAccount,
  testIMAPConnection,
  testSMTPConnection,
  setAsPrimary,
  syncEmailAccount
} = require('../controllers/emailAccountController');
const { protect, authorize } = require('../middlewares/auth');

// Protect all routes - require authentication
router.use(protect);
router.use(authorize('admin', 'super_admin', 'operator'));

// Email Account CRUD
router.get('/', getEmailAccounts); // List all for tenant
router.post('/', createEmailAccount); // Add new account
router.get('/:id', getEmailAccountById); // Get single account
router.put('/:id', updateEmailAccount); // Update account
router.delete('/:id', deleteEmailAccount); // Delete account

// Connection Testing
router.post('/:id/test-imap', testIMAPConnection); // Test IMAP
router.post('/:id/test-smtp', testSMTPConnection); // Test SMTP

// Actions
router.post('/:id/set-primary', setAsPrimary); // Set as primary
router.post('/:id/sync', syncEmailAccount); // Manual sync (Phase 2)

module.exports = router;
```

### Controller Implementation

```javascript
// backend/src/controllers/emailAccountController.js

const EmailAccount = require('../models/EmailAccount');
const Imap = require('imap');
const nodemailer = require('nodemailer');
const { promisify } = require('util');

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
        emailAccount[field] = req.body[field];
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
    const transporter = nodemailer.createTransport(config);
    
    transporter.verify((error, success) => {
      if (error) {
        resolve({
          success: false,
          message: 'SMTP connection failed',
          error: error.message,
          details: {
            host: config.host,
            port: config.port,
            errorType: error.code || 'UNKNOWN'
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
```

---

## 🎨 FRONTEND UI IMPLEMENTATION

### Email Accounts Page

```javascript
// frontend/src/pages/settings/EmailAccounts.jsx

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Mail, Plus, Trash2, Edit, Check, X, TestTube,
  CheckCircle, XCircle, Clock, AlertCircle, Star
} from 'lucide-react';
import emailAccountsAPI from '../../services/emailAccountsAPI';

// Provider Presets
const PROVIDER_PRESETS = {
  gmail: {
    name: 'Gmail',
    imap: { host: 'imap.gmail.com', port: 993, secure: true },
    smtp: { host: 'smtp.gmail.com', port: 587, secure: false }
  },
  outlook: {
    name: 'Outlook/Hotmail',
    imap: { host: 'outlook.office365.com', port: 993, secure: true },
    smtp: { host: 'smtp.office365.com', port: 587, secure: false }
  },
  zoho: {
    name: 'Zoho Mail',
    imap: { host: 'imap.zoho.com', port: 993, secure: true },
    smtp: { host: 'smtp.zoho.com', port: 587, secure: false }
  },
  smtp: {
    name: 'Custom SMTP/IMAP',
    imap: { host: '', port: 993, secure: true },
    smtp: { host: '', port: 587, secure: false }
  }
};

export default function EmailAccounts() {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [testingIMAP, setTestingIMAP] = useState(null);
  const [testingSMTP, setTestingSMTP] = useState(null);
  
  // Fetch email accounts
  const { data: accounts, isLoading } = useQuery({
    queryKey: ['emailAccounts'],
    queryFn: emailAccountsAPI.getAll
  });
  
  // Add account mutation
  const addMutation = useMutation({
    mutationFn: emailAccountsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['emailAccounts']);
      setShowAddForm(false);
    }
  });
  
  // Update account mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => emailAccountsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['emailAccounts']);
      setEditingId(null);
    }
  });
  
  // Delete account mutation
  const deleteMutation = useMutation({
    mutationFn: emailAccountsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['emailAccounts']);
    }
  });
  
  // Test IMAP mutation
  const testIMAPMutation = useMutation({
    mutationFn: emailAccountsAPI.testIMAP,
    onSuccess: (data, accountId) => {
      setTestingIMAP(null);
      queryClient.invalidateQueries(['emailAccounts']);
      alert(data.success ? 'IMAP Connection Successful!' : `IMAP Failed: ${data.error}`);
    },
    onError: (error, accountId) => {
      setTestingIMAP(null);
      alert(`IMAP Test Error: ${error.message}`);
    }
  });
  
  // Test SMTP mutation
  const testSMTPMutation = useMutation({
    mutationFn: emailAccountsAPI.testSMTP,
    onSuccess: (data, accountId) => {
      setTestingSMTP(null);
      queryClient.invalidateQueries(['emailAccounts']);
      alert(data.success ? 'SMTP Connection Successful!' : `SMTP Failed: ${data.error}`);
    },
    onError: (error, accountId) => {
      setTestingSMTP(null);
      alert(`SMTP Test Error: ${error.message}`);
    }
  });
  
  const handleTestIMAP = (accountId) => {
    setTestingIMAP(accountId);
    testIMAPMutation.mutate(accountId);
  };
  
  const handleTestSMTP = (accountId) => {
    setTestingSMTP(accountId);
    testSMTPMutation.mutate(accountId);
  };
  
  const handleSetPrimary = async (accountId) => {
    try {
      await emailAccountsAPI.setPrimary(accountId);
      queryClient.invalidateQueries(['emailAccounts']);
    } catch (error) {
      alert('Error setting primary: ' + error.message);
    }
  };
  
  if (isLoading) {
    return <div className="p-8">Loading email accounts...</div>;
  }
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Accounts</h1>
          <p className="text-gray-600 mt-1">
            Manage multiple email accounts for sending and receiving emails
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          Add Email Account
        </button>
      </div>
      
      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <AddEmailAccountForm
          onClose={() => setShowAddForm(false)}
          onSubmit={(data) => addMutation.mutate(data)}
          isSubmitting={addMutation.isPending}
        />
      )}
      
      {/* Email Accounts List */}
      <div className="space-y-4">
        {accounts?.data?.map((account) => (
          <EmailAccountCard
            key={account._id}
            account={account}
            onTestIMAP={() => handleTestIMAP(account._id)}
            onTestSMTP={() => handleTestSMTP(account._id)}
            onSetPrimary={() => handleSetPrimary(account._id)}
            onDelete={() => {
              if (window.confirm('Delete this email account?')) {
                deleteMutation.mutate(account._id);
              }
            }}
            testingIMAP={testingIMAP === account._id}
            testingSMTP={testingSMTP === account._id}
          />
        ))}
        
        {accounts?.data?.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Mail size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Email Accounts
            </h3>
            <p className="text-gray-600 mb-4">
              Add your first email account to start sending and receiving emails
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Email Account
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Email Account Card Component
function EmailAccountCard({ 
  account, 
  onTestIMAP, 
  onTestSMTP, 
  onSetPrimary, 
  onDelete,
  testingIMAP,
  testingSMTP
}) {
  const getStatusBadge = (status) => {
    const styles = {
      success: { icon: CheckCircle, color: 'text-green-600 bg-green-100', text: 'Connected' },
      failed: { icon: XCircle, color: 'text-red-600 bg-red-100', text: 'Failed' },
      pending: { icon: Clock, color: 'text-yellow-600 bg-yellow-100', text: 'Testing' },
      not_tested: { icon: AlertCircle, color: 'text-gray-600 bg-gray-100', text: 'Not Tested' }
    };
    
    const style = styles[status] || styles.not_tested;
    const Icon = style.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${style.color}`}>
        <Icon size={14} />
        {style.text}
      </span>
    );
  };
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
            <Mail className="text-blue-600" size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {account.accountName}
              </h3>
              {account.isPrimary && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                  <Star size={12} fill="currentColor" />
                  Primary
                </span>
              )}
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                {PROVIDER_PRESETS[account.provider]?.name || account.provider.toUpperCase()}
              </span>
            </div>
            <p className="text-gray-600 mt-1">{account.email}</p>
            <p className="text-sm text-gray-500 mt-1">
              Purpose: {account.purpose} • 
              Received: {account.stats.emailsReceived} • 
              Sent: {account.stats.emailsSent}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!account.isPrimary && (
            <button
              onClick={onSetPrimary}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              title="Set as Primary"
            >
              <Star size={18} />
            </button>
          )}
          <button
            onClick={onDelete}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
            title="Delete"
            disabled={account.isPrimary}
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
      
      {/* Connection Status */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* IMAP Status */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900">IMAP (Receive)</h4>
            {getStatusBadge(account.imap.lastTestStatus)}
          </div>
          <p className="text-sm text-gray-600 mb-2">
            {account.imap.host}:{account.imap.port}
          </p>
          {account.imap.lastTestError && (
            <p className="text-xs text-red-600 mb-2">{account.imap.lastTestError}</p>
          )}
          <button
            onClick={onTestIMAP}
            disabled={testingIMAP || !account.imap.enabled}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 disabled:opacity-50"
          >
            <TestTube size={16} />
            {testingIMAP ? 'Testing...' : 'Test IMAP'}
          </button>
        </div>
        
        {/* SMTP Status */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900">SMTP (Send)</h4>
            {getStatusBadge(account.smtp.lastTestStatus)}
          </div>
          <p className="text-sm text-gray-600 mb-2">
            {account.smtp.host}:{account.smtp.port}
          </p>
          {account.smtp.lastTestError && (
            <p className="text-xs text-red-600 mb-2">{account.smtp.lastTestError}</p>
          )}
          <button
            onClick={onTestSMTP}
            disabled={testingSMTP || !account.smtp.enabled}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 disabled:opacity-50"
          >
            <TestTube size={16} />
            {testingSMTP ? 'Testing...' : 'Test SMTP'}
          </button>
        </div>
      </div>
      
      {/* Last Tested Info */}
      {(account.imap.lastTestedAt || account.smtp.lastTestedAt) && (
        <div className="text-xs text-gray-500">
          Last tested: {new Date(account.imap.lastTestedAt || account.smtp.lastTestedAt).toLocaleString()}
        </div>
      )}
    </div>
  );
}

// Add Email Account Form Component
function AddEmailAccountForm({ onClose, onSubmit, isSubmitting }) {
  const [formData, setFormData] = useState({
    accountName: '',
    email: '',
    provider: 'gmail',
    purpose: 'general',
    isPrimary: false,
    imap: {
      enabled: true,
      host: '',
      port: 993,
      secure: true,
      username: '',
      password: ''
    },
    smtp: {
      enabled: true,
      host: '',
      port: 587,
      secure: false,
      username: '',
      password: '',
      fromName: ''
    }
  });
  
  const handleProviderChange = (provider) => {
    const preset = PROVIDER_PRESETS[provider];
    setFormData({
      ...formData,
      provider,
      imap: {
        ...formData.imap,
        host: preset.imap.host,
        port: preset.imap.port,
        secure: preset.imap.secure
      },
      smtp: {
        ...formData.smtp,
        host: preset.smtp.host,
        port: preset.smtp.port,
        secure: preset.smtp.secure
      }
    });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Set username from email if not set
    const submitData = {
      ...formData,
      imap: {
        ...formData.imap,
        username: formData.imap.username || formData.email
      },
      smtp: {
        ...formData.smtp,
        username: formData.smtp.username || formData.email
      }
    };
    
    onSubmit(submitData);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold">Add Email Account</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Name *
            </label>
            <input
              type="text"
              required
              value={formData.accountName}
              onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
              placeholder="e.g., Support Gmail"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="support@company.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Provider *
            </label>
            <select
              value={formData.provider}
              onChange={(e) => handleProviderChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              {Object.entries(PROVIDER_PRESETS).map(([key, preset]) => (
                <option key={key} value={key}>{preset.name}</option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Purpose
              </label>
              <select
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="general">General</option>
                <option value="support">Support</option>
                <option value="sales">Sales</option>
                <option value="finance">Finance</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isPrimary}
                  onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-gray-700">Set as Primary</span>
              </label>
            </div>
          </div>
          
          {/* IMAP Settings */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-4">IMAP Settings (Receive)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Host</label>
                <input
                  type="text"
                  required
                  value={formData.imap.host}
                  onChange={(e) => setFormData({
                    ...formData,
                    imap: { ...formData.imap, host: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Port</label>
                <input
                  type="number"
                  required
                  value={formData.imap.port}
                  onChange={(e) => setFormData({
                    ...formData,
                    imap: { ...formData.imap, port: parseInt(e.target.value) }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                <input
                  type="password"
                  required
                  value={formData.imap.password}
                  onChange={(e) => setFormData({
                    ...formData,
                    imap: { ...formData.imap, password: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Email password or app-specific password"
                />
              </div>
            </div>
          </div>
          
          {/* SMTP Settings */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-4">SMTP Settings (Send)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Host</label>
                <input
                  type="text"
                  required
                  value={formData.smtp.host}
                  onChange={(e) => setFormData({
                    ...formData,
                    smtp: { ...formData.smtp, host: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Port</label>
                <input
                  type="number"
                  required
                  value={formData.smtp.port}
                  onChange={(e) => setFormData({
                    ...formData,
                    smtp: { ...formData.smtp, port: parseInt(e.target.value) }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                <input
                  type="password"
                  required
                  value={formData.smtp.password}
                  onChange={(e) => setFormData({
                    ...formData,
                    smtp: { ...formData.smtp, password: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Email password or app-specific password"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">From Name</label>
                <input
                  type="text"
                  value={formData.smtp.fromName}
                  onChange={(e) => setFormData({
                    ...formData,
                    smtp: { ...formData.smtp, fromName: e.target.value }
                  })}
                  placeholder="Company Support"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>
          
          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Adding...' : 'Add Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

### API Service

```javascript
// frontend/src/services/emailAccountsAPI.js

import api from './api';

const emailAccountsAPI = {
  // Get all email accounts
  getAll: async () => {
    const response = await api.get('/email-accounts');
    return response.data;
  },
  
  // Get single account
  getById: async (id) => {
    const response = await api.get(`/email-accounts/${id}`);
    return response.data;
  },
  
  // Create new account
  create: async (data) => {
    const response = await api.post('/email-accounts', data);
    return response.data;
  },
  
  // Update account
  update: async (id, data) => {
    const response = await api.put(`/email-accounts/${id}`, data);
    return response.data;
  },
  
  // Delete account
  delete: async (id) => {
    const response = await api.delete(`/email-accounts/${id}`);
    return response.data;
  },
  
  // Test IMAP connection
  testIMAP: async (id) => {
    const response = await api.post(`/email-accounts/${id}/test-imap`);
    return response.data;
  },
  
  // Test SMTP connection
  testSMTP: async (id) => {
    const response = await api.post(`/email-accounts/${id}/test-smtp`);
    return response.data;
  },
  
  // Set as primary
  setPrimary: async (id) => {
    const response = await api.post(`/email-accounts/${id}/set-primary`);
    return response.data;
  },
  
  // Sync account (Phase 2)
  sync: async (id) => {
    const response = await api.post(`/email-accounts/${id}/sync`);
    return response.data;
  }
};

export default emailAccountsAPI;
```

---

## 🔒 SECURITY CONSIDERATIONS

### Password Encryption
- ✅ **AES-256-CBC encryption** for stored passwords
- ✅ **Environment variable** for encryption key
- ✅ **Never expose** passwords in API responses
- ✅ **Secure key management** in production

### Best Practices
1. Use **App-Specific Passwords** (Gmail, Outlook)
2. Never log passwords or credentials
3. Implement rate limiting on connection tests
4. Add IP whitelisting for sensitive actions
5. Audit trail for all email account changes

---

## 📦 REQUIRED NPM PACKAGES

```bash
# Backend
npm install imap nodemailer

# Already have: mongoose, express, crypto (built-in)
```

---

## ✅ TESTING CHECKLIST

### Gmail Setup
- [ ] Enable IMAP in Gmail settings
- [ ] Create App-Specific Password
- [ ] Test IMAP connection (imap.gmail.com:993)
- [ ] Test SMTP connection (smtp.gmail.com:587)
- [ ] Verify emails can be received
- [ ] Verify emails can be sent

### Outlook Setup
- [ ] Enable IMAP in Outlook settings
- [ ] Test IMAP connection (outlook.office365.com:993)
- [ ] Test SMTP connection (smtp.office365.com:587)
- [ ] Verify authentication works
- [ ] Test with both @outlook.com and @hotmail.com

### Zoho Setup
- [ ] Enable IMAP in Zoho settings
- [ ] Test IMAP connection (imap.zoho.com:993)
- [ ] Test SMTP connection (smtp.zoho.com:587)
- [ ] Verify Zoho app password works

### Generic SMTP
- [ ] Test with custom SMTP server
- [ ] Test with different ports (25, 465, 587, 2525)
- [ ] Test TLS vs STARTTLS
- [ ] Verify error handling

---

## 🚀 IMPLEMENTATION STEPS

### Week 1 - Backend Foundation
1. ✅ Create EmailAccount model with encryption
2. ✅ Create email account controller
3. ✅ Create routes
4. ✅ Implement IMAP test function
5. ✅ Implement SMTP test function
6. ✅ Add to main routes (index.js)

### Week 2 - Frontend UI
1. ✅ Create EmailAccounts page
2. ✅ Build add/edit form with provider presets
3. ✅ Implement test buttons
4. ✅ Add connection status indicators
5. ✅ Add to navigation/settings menu
6. ✅ Create API service

### Week 3 - Testing & Polish
1. ✅ Test with real Gmail account
2. ✅ Test with Outlook account
3. ✅ Test with Zoho account
4. ✅ Test error scenarios
5. ✅ Add proper error messages
6. ✅ Polish UI/UX

---

## 📊 SUCCESS CRITERIA

**Phase 1 Complete When:**
- ✅ Tenant can add unlimited email accounts
- ✅ Support for Gmail, Outlook, Zoho, Custom SMTP
- ✅ IMAP test button works and shows success/failure
- ✅ SMTP test button works and shows success/failure
- ✅ Passwords encrypted in database
- ✅ Primary email selection works
- ✅ Connection status displayed clearly
- ✅ Edit and delete functionality works
- ✅ No sensitive data exposed in API responses

---

## 🔄 NEXT PHASE (AI Automation)

Once email provisioning is complete, we'll implement:
1. Email polling/webhook system
2. AI categorization
3. JSON extraction
4. Database matching
5. Auto-responses
6. Manual review queue

---

**Document Version:** 1.0  
**Status:** Ready for Implementation  
**Estimated Time:** 2-3 weeks  
**Dependencies:** Node.js, MongoDB, Express, React
