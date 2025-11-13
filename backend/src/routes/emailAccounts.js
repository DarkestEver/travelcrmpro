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
  syncEmailAccount,
  addWatcher,
  removeWatcher,
  toggleWatcher
} = require('../controllers/emailAccountController');
const { protect, authorize } = require('../middleware/auth');

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

// Watcher Management
router.post('/:id/watchers', addWatcher); // Add watcher
router.delete('/:id/watchers/:email', removeWatcher); // Remove watcher
router.patch('/:id/watchers/:email/toggle', toggleWatcher); // Toggle watcher active status

module.exports = router;
