/**
 * Inventory Sync Controller
 * Phase 7.2: API endpoints for inventory synchronization
 */

const { asyncHandler } = require('../middleware/errorHandler');
const inventorySyncService = require('../services/inventorySyncService');
const { successResponse } = require('../utils/response');

/**
 * @desc    Sync all inventory with bookings
 * @route   POST /api/v1/inventory-sync/sync-all
 * @access  Private (admin, operator)
 */
exports.syncAllInventory = asyncHandler(async (req, res) => {
  const { inventoryType } = req.body;
  const tenantId = req.tenant._id;

  const result = await inventorySyncService.syncAllInventory({
    tenantId,
    inventoryType
  });

  successResponse(res, 200, 'Inventory sync completed', result);
});

/**
 * @desc    Sync single inventory item
 * @route   POST /api/v1/inventory-sync/sync/:inventoryId
 * @access  Private (admin, operator)
 */
exports.syncInventoryItem = asyncHandler(async (req, res) => {
  const { inventoryId } = req.params;
  const tenantId = req.tenant._id;

  const result = await inventorySyncService.syncInventoryItem({
    inventoryId,
    tenantId
  });

  successResponse(res, 200, 'Inventory synced successfully', result);
});

/**
 * @desc    Update capacity from booking
 * @route   POST /api/v1/inventory-sync/update-capacity
 * @access  Private (admin, operator)
 */
exports.updateCapacity = asyncHandler(async (req, res) => {
  const { inventoryId, bookingId, travelers, action } = req.body;
  const tenantId = req.tenant._id;

  if (!inventoryId || !bookingId || !action) {
    return res.status(400).json({
      success: false,
      message: 'inventoryId, bookingId, and action are required'
    });
  }

  if (!['reserve', 'confirm', 'cancel', 'complete'].includes(action)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid action. Must be: reserve, confirm, cancel, or complete'
    });
  }

  const result = await inventorySyncService.updateCapacityFromBooking({
    inventoryId,
    bookingId,
    travelers,
    action,
    tenantId
  });

  successResponse(res, 200, 'Capacity updated successfully', result);
});

/**
 * @desc    Check for inventory conflicts
 * @route   GET /api/v1/inventory-sync/check-conflicts
 * @access  Private (admin, operator)
 */
exports.checkConflicts = asyncHandler(async (req, res) => {
  const { inventoryType } = req.query;
  const tenantId = req.tenant._id;

  const result = await inventorySyncService.checkInventoryConflicts({
    tenantId,
    inventoryType
  });

  successResponse(res, 200, 'Conflicts checked successfully', result);
});

/**
 * @desc    Resolve inventory conflict
 * @route   POST /api/v1/inventory-sync/resolve-conflict/:inventoryId
 * @access  Private (admin only)
 */
exports.resolveConflict = asyncHandler(async (req, res) => {
  const { inventoryId } = req.params;
  const { resolution, manualAvailable } = req.body;
  const tenantId = req.tenant._id;

  if (!resolution) {
    return res.status(400).json({
      success: false,
      message: 'resolution is required (recalculate, manual, cancel_bookings)'
    });
  }

  if (resolution === 'manual' && manualAvailable === undefined) {
    return res.status(400).json({
      success: false,
      message: 'manualAvailable is required for manual resolution'
    });
  }

  const result = await inventorySyncService.resolveConflict({
    inventoryId,
    tenantId,
    resolution,
    manualAvailable
  });

  successResponse(res, 200, 'Conflict resolved successfully', result);
});

/**
 * @desc    Get sync status and statistics
 * @route   GET /api/v1/inventory-sync/status
 * @access  Private (admin, operator)
 */
exports.getSyncStatus = asyncHandler(async (req, res) => {
  const status = inventorySyncService.getSyncStatus();

  successResponse(res, 200, 'Sync status retrieved', status);
});

/**
 * @desc    Get capacity history for inventory
 * @route   GET /api/v1/inventory-sync/capacity-history/:inventoryId
 * @access  Private (admin, operator)
 */
exports.getCapacityHistory = asyncHandler(async (req, res) => {
  const { inventoryId } = req.params;
  const { startDate, endDate, limit } = req.query;
  const tenantId = req.tenant._id;

  const result = await inventorySyncService.getCapacityHistory({
    inventoryId,
    tenantId,
    startDate,
    endDate,
    limit: limit ? parseInt(limit) : 100
  });

  successResponse(res, 200, 'Capacity history retrieved', result);
});

/**
 * @desc    Get real-time sync events (Server-Sent Events)
 * @route   GET /api/v1/inventory-sync/events
 * @access  Private (admin, operator)
 */
exports.getSyncEvents = asyncHandler(async (req, res) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Get event emitter
  const emitter = inventorySyncService.getEventEmitter();

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date() })}\n\n`);

  // Listen for capacity updates
  const onCapacityUpdate = (data) => {
    res.write(`data: ${JSON.stringify({ type: 'capacity-updated', ...data })}\n\n`);
  };

  emitter.on('capacity-updated', onCapacityUpdate);

  // Clean up on client disconnect
  req.on('close', () => {
    emitter.off('capacity-updated', onCapacityUpdate);
    res.end();
  });
});

module.exports = exports;
