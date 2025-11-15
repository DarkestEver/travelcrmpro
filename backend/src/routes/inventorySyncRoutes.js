/**
 * Inventory Sync Routes
 * Phase 7.2: Routes for inventory synchronization
 */

const express = require('express');
const router = express.Router();
const inventorySyncController = require('../controllers/inventorySyncController');
const { protect, restrictTo } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Super admin, admin and operator access for sync operations
router.use(restrictTo('super_admin', 'admin', 'operator'));

// Sync operations
router.post('/sync-all', inventorySyncController.syncAllInventory);
router.post('/sync/:inventoryId', inventorySyncController.syncInventoryItem);

// Capacity management
router.post('/update-capacity', inventorySyncController.updateCapacity);

// Conflict detection and resolution
router.get('/check-conflicts', inventorySyncController.checkConflicts);
router.post(
  '/resolve-conflict/:inventoryId',
  restrictTo('super_admin', 'admin'), // Super admin and admin only for conflict resolution
  inventorySyncController.resolveConflict
);

// Status and monitoring
router.get('/status', inventorySyncController.getSyncStatus);
router.get('/capacity-history/:inventoryId', inventorySyncController.getCapacityHistory);

// Real-time events (Server-Sent Events)
router.get('/events', inventorySyncController.getSyncEvents);

module.exports = router;
