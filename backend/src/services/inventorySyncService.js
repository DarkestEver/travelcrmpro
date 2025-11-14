/**
 * Inventory Sync Service
 * Phase 7.2: Real-time inventory updates and booking integration
 * 
 * Features:
 * - Real-time capacity updates
 * - Booking lifecycle hooks
 * - Automatic capacity adjustments
 * - Conflict detection and resolution
 * - Sync status tracking
 * - Overbooking prevention
 */

const mongoose = require('mongoose');
const Inventory = require('../models/Inventory');
const Booking = require('../models/Booking');
const logger = require('../utils/logger');
const EventEmitter = require('events');

// Event emitter for real-time updates
const syncEmitter = new EventEmitter();

// Sync status tracking
const syncStatus = {
  lastSync: null,
  syncInProgress: false,
  pendingUpdates: [],
  conflicts: [],
  stats: {
    totalSyncs: 0,
    successfulSyncs: 0,
    failedSyncs: 0,
    conflictsResolved: 0
  }
};

/**
 * Update inventory capacity based on booking
 * @param {Object} params - Update parameters
 * @returns {Object} Update result
 */
exports.updateCapacityFromBooking = async ({
  inventoryId,
  bookingId,
  travelers,
  action, // 'reserve', 'confirm', 'cancel', 'complete'
  tenantId
}) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Lock inventory for update
    const inventory = await Inventory.findOne({
      _id: inventoryId,
      tenant: tenantId
    }).session(session);

    if (!inventory) {
      throw new Error('Inventory not found');
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      tenantId
    }).session(session);

    if (!booking) {
      throw new Error('Booking not found');
    }

    const travelerCount = travelers || booking.travelers.length;
    let capacityChange = 0;
    let newAvailable = inventory.capacity.available;

    // Calculate capacity change based on action
    switch (action) {
      case 'reserve':
      case 'confirm':
        // Decrease available capacity
        capacityChange = -travelerCount;
        newAvailable = inventory.capacity.available - travelerCount;
        
        // Check for overbooking
        if (newAvailable < 0) {
          throw new Error(`Insufficient capacity. Available: ${inventory.capacity.available}, Required: ${travelerCount}`);
        }
        break;

      case 'cancel':
      case 'complete':
        // Increase available capacity
        capacityChange = travelerCount;
        newAvailable = Math.min(
          inventory.capacity.available + travelerCount,
          inventory.capacity.total
        );
        break;

      default:
        throw new Error(`Invalid action: ${action}`);
    }

    // Update inventory capacity
    inventory.capacity.available = newAvailable;
    inventory.lastUpdated = new Date();

    // Track sync history
    if (!inventory.syncHistory) {
      inventory.syncHistory = [];
    }

    inventory.syncHistory.push({
      timestamp: new Date(),
      bookingId,
      action,
      capacityChange,
      previousAvailable: inventory.capacity.available - capacityChange,
      newAvailable: newAvailable,
      source: 'booking_sync'
    });

    // Keep only last 100 sync records
    if (inventory.syncHistory.length > 100) {
      inventory.syncHistory = inventory.syncHistory.slice(-100);
    }

    await inventory.save({ session });

    // Commit transaction
    await session.commitTransaction();

    // Emit real-time update event
    syncEmitter.emit('capacity-updated', {
      inventoryId,
      bookingId,
      action,
      capacityChange,
      available: newAvailable,
      total: inventory.capacity.total,
      timestamp: new Date()
    });

    logger.info(`Inventory capacity updated: ${inventoryId}, action: ${action}, change: ${capacityChange}`);

    return {
      success: true,
      inventory: {
        id: inventory._id,
        name: inventory.serviceName,
        capacity: {
          total: inventory.capacity.total,
          available: newAvailable,
          occupied: inventory.capacity.total - newAvailable,
          occupancyRate: ((inventory.capacity.total - newAvailable) / inventory.capacity.total * 100).toFixed(1)
        }
      },
      change: {
        action,
        travelers: travelerCount,
        capacityChange
      }
    };
  } catch (error) {
    await session.abortTransaction();
    logger.error('Error updating inventory capacity:', error);
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Sync all inventory with current bookings
 * @param {Object} params - Sync parameters
 * @returns {Object} Sync result
 */
exports.syncAllInventory = async ({ tenantId, inventoryType }) => {
  try {
    syncStatus.syncInProgress = true;
    const startTime = Date.now();

    // Get all inventory items
    const query = { tenant: tenantId };
    if (inventoryType) {
      query.serviceType = inventoryType;
    }

    const inventoryItems = await Inventory.find(query);
    const results = {
      total: inventoryItems.length,
      synced: 0,
      errors: 0,
      conflicts: 0,
      details: []
    };

    // Sync each inventory item
    for (const inventory of inventoryItems) {
      try {
        const syncResult = await exports.syncInventoryItem({
          inventoryId: inventory._id,
          tenantId
        });

        results.synced++;
        results.details.push({
          inventoryId: inventory._id,
          name: inventory.serviceName,
          ...syncResult
        });
      } catch (error) {
        results.errors++;
        results.details.push({
          inventoryId: inventory._id,
          name: inventory.serviceName,
          error: error.message
        });
        logger.error(`Error syncing inventory ${inventory._id}:`, error);
      }
    }

    const duration = Date.now() - startTime;

    // Update sync status
    syncStatus.lastSync = new Date();
    syncStatus.syncInProgress = false;
    syncStatus.stats.totalSyncs++;
    syncStatus.stats.successfulSyncs += results.synced;
    syncStatus.stats.failedSyncs += results.errors;

    logger.info(`Inventory sync completed: ${results.synced}/${results.total} in ${duration}ms`);

    return {
      success: true,
      results,
      duration,
      timestamp: new Date()
    };
  } catch (error) {
    syncStatus.syncInProgress = false;
    logger.error('Error syncing all inventory:', error);
    throw error;
  }
};

/**
 * Sync single inventory item with bookings
 * @param {Object} params - Sync parameters
 * @returns {Object} Sync result
 */
exports.syncInventoryItem = async ({ inventoryId, tenantId }) => {
  try {
    const inventory = await Inventory.findOne({
      _id: inventoryId,
      tenant: tenantId
    });

    if (!inventory) {
      throw new Error('Inventory not found');
    }

    // Get all active bookings for this inventory
    const activeBookings = await Booking.find({
      tenantId,
      itineraryId: inventoryId,
      bookingStatus: { $in: ['confirmed', 'in_progress'] }
    });

    // Calculate occupied capacity
    const occupiedCapacity = activeBookings.reduce((sum, booking) => {
      return sum + booking.travelers.length;
    }, 0);

    // Calculate expected available capacity
    const expectedAvailable = inventory.capacity.total - occupiedCapacity;

    // Check for discrepancy
    const discrepancy = inventory.capacity.available - expectedAvailable;

    if (discrepancy !== 0) {
      // Conflict detected - adjust capacity
      logger.warn(`Capacity discrepancy detected for inventory ${inventoryId}: ${discrepancy}`);

      inventory.capacity.available = expectedAvailable;
      inventory.lastUpdated = new Date();

      if (!inventory.syncHistory) {
        inventory.syncHistory = [];
      }

      inventory.syncHistory.push({
        timestamp: new Date(),
        action: 'sync_correction',
        discrepancy,
        previousAvailable: inventory.capacity.available + discrepancy,
        newAvailable: expectedAvailable,
        source: 'manual_sync'
      });

      await inventory.save();

      syncStatus.conflicts.push({
        inventoryId,
        timestamp: new Date(),
        discrepancy,
        resolved: true
      });

      syncStatus.stats.conflictsResolved++;
    }

    return {
      success: true,
      capacity: {
        total: inventory.capacity.total,
        available: expectedAvailable,
        occupied: occupiedCapacity,
        occupancyRate: (occupiedCapacity / inventory.capacity.total * 100).toFixed(1)
      },
      bookings: {
        active: activeBookings.length,
        travelers: occupiedCapacity
      },
      discrepancy: discrepancy !== 0 ? {
        detected: true,
        amount: discrepancy,
        corrected: true
      } : null
    };
  } catch (error) {
    logger.error(`Error syncing inventory item ${inventoryId}:`, error);
    throw error;
  }
};

/**
 * Check for inventory conflicts
 * @param {Object} params - Check parameters
 * @returns {Object} Conflicts found
 */
exports.checkInventoryConflicts = async ({ tenantId, inventoryType }) => {
  try {
    const query = { tenant: tenantId };
    if (inventoryType) {
      query.serviceType = inventoryType;
    }

    const inventoryItems = await Inventory.find(query);
    const conflicts = [];

    for (const inventory of inventoryItems) {
      // Get active bookings
      const activeBookings = await Booking.find({
        tenantId,
        itineraryId: inventory._id,
        bookingStatus: { $in: ['confirmed', 'in_progress'] }
      });

      const occupiedCapacity = activeBookings.reduce((sum, booking) => {
        return sum + booking.travelers.length;
      }, 0);

      const expectedAvailable = inventory.capacity.total - occupiedCapacity;
      const discrepancy = inventory.capacity.available - expectedAvailable;

      if (discrepancy !== 0) {
        conflicts.push({
          inventoryId: inventory._id,
          inventoryName: inventory.serviceName,
          serviceType: inventory.serviceType,
          capacity: {
            total: inventory.capacity.total,
            currentAvailable: inventory.capacity.available,
            expectedAvailable,
            discrepancy
          },
          bookings: {
            count: activeBookings.length,
            travelers: occupiedCapacity
          },
          severity: Math.abs(discrepancy) > 5 ? 'high' : 'low'
        });
      }

      // Check for overbooking
      if (inventory.capacity.available < 0) {
        conflicts.push({
          inventoryId: inventory._id,
          inventoryName: inventory.serviceName,
          serviceType: inventory.serviceType,
          type: 'overbooking',
          capacity: {
            total: inventory.capacity.total,
            available: inventory.capacity.available,
            overbooked: Math.abs(inventory.capacity.available)
          },
          severity: 'critical'
        });
      }
    }

    return {
      success: true,
      conflictsFound: conflicts.length,
      conflicts: conflicts.sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, low: 2 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      })
    };
  } catch (error) {
    logger.error('Error checking inventory conflicts:', error);
    throw error;
  }
};

/**
 * Resolve inventory conflict
 * @param {Object} params - Resolution parameters
 * @returns {Object} Resolution result
 */
exports.resolveConflict = async ({
  inventoryId,
  tenantId,
  resolution, // 'recalculate', 'manual', 'cancel_bookings'
  manualAvailable
}) => {
  try {
    const inventory = await Inventory.findOne({
      _id: inventoryId,
      tenant: tenantId
    });

    if (!inventory) {
      throw new Error('Inventory not found');
    }

    let newAvailable;
    let resolutionDetails = {};

    switch (resolution) {
      case 'recalculate':
        // Recalculate from bookings
        const syncResult = await exports.syncInventoryItem({
          inventoryId,
          tenantId
        });
        newAvailable = syncResult.capacity.available;
        resolutionDetails = {
          method: 'recalculate',
          previousAvailable: inventory.capacity.available,
          newAvailable,
          discrepancy: syncResult.discrepancy
        };
        break;

      case 'manual':
        // Manual override
        if (manualAvailable === undefined || manualAvailable < 0) {
          throw new Error('Invalid manual available capacity');
        }
        if (manualAvailable > inventory.capacity.total) {
          throw new Error('Manual capacity exceeds total capacity');
        }

        const previousAvailable = inventory.capacity.available;
        inventory.capacity.available = manualAvailable;
        inventory.lastUpdated = new Date();

        if (!inventory.syncHistory) {
          inventory.syncHistory = [];
        }

        inventory.syncHistory.push({
          timestamp: new Date(),
          action: 'manual_override',
          previousAvailable,
          newAvailable: manualAvailable,
          source: 'admin'
        });

        await inventory.save();

        newAvailable = manualAvailable;
        resolutionDetails = {
          method: 'manual',
          previousAvailable,
          newAvailable,
          override: true
        };
        break;

      case 'cancel_bookings':
        // Cancel excess bookings (use with caution)
        throw new Error('Booking cancellation must be handled separately for safety');

      default:
        throw new Error(`Invalid resolution method: ${resolution}`);
    }

    // Remove from conflicts list
    syncStatus.conflicts = syncStatus.conflicts.filter(
      c => c.inventoryId.toString() !== inventoryId.toString()
    );

    logger.info(`Conflict resolved for inventory ${inventoryId}: ${resolution}`);

    return {
      success: true,
      inventoryId,
      resolution: resolutionDetails,
      capacity: {
        total: inventory.capacity.total,
        available: newAvailable,
        occupied: inventory.capacity.total - newAvailable
      }
    };
  } catch (error) {
    logger.error(`Error resolving conflict for inventory ${inventoryId}:`, error);
    throw error;
  }
};

/**
 * Get sync status and statistics
 * @returns {Object} Sync status
 */
exports.getSyncStatus = () => {
  return {
    status: syncStatus.syncInProgress ? 'in_progress' : 'idle',
    lastSync: syncStatus.lastSync,
    pendingUpdates: syncStatus.pendingUpdates.length,
    activeConflicts: syncStatus.conflicts.filter(
      c => Date.now() - c.timestamp < 3600000 // Last hour
    ).length,
    statistics: {
      ...syncStatus.stats,
      successRate: syncStatus.stats.totalSyncs > 0
        ? ((syncStatus.stats.successfulSyncs / syncStatus.stats.totalSyncs) * 100).toFixed(1)
        : 0
    },
    recentConflicts: syncStatus.conflicts.slice(-10)
  };
};

/**
 * Register booking lifecycle hooks
 */
exports.registerBookingHooks = () => {
  // Hook: After booking creation (reserve capacity)
  Booking.schema.post('save', async function(doc) {
    if (doc.isNew && doc.bookingStatus === 'pending') {
      try {
        await exports.updateCapacityFromBooking({
          inventoryId: doc.itineraryId,
          bookingId: doc._id,
          travelers: doc.travelers.length,
          action: 'reserve',
          tenantId: doc.tenantId
        });
      } catch (error) {
        logger.error('Error in booking save hook:', error);
      }
    }
  });

  // Hook: After booking update (adjust capacity)
  Booking.schema.post('findOneAndUpdate', async function(doc) {
    if (doc) {
      const wasStatus = this.getQuery().bookingStatus;
      const newStatus = doc.bookingStatus;

      // Status changed - adjust capacity
      if (wasStatus && wasStatus !== newStatus) {
        try {
          let action;
          if (newStatus === 'confirmed') action = 'confirm';
          else if (newStatus === 'cancelled') action = 'cancel';
          else if (newStatus === 'completed') action = 'complete';

          if (action) {
            await exports.updateCapacityFromBooking({
              inventoryId: doc.itineraryId,
              bookingId: doc._id,
              travelers: doc.travelers.length,
              action,
              tenantId: doc.tenantId
            });
          }
        } catch (error) {
          logger.error('Error in booking update hook:', error);
        }
      }
    }
  });

  logger.info('Booking lifecycle hooks registered');
};

/**
 * Get real-time event emitter
 * @returns {EventEmitter} Event emitter instance
 */
exports.getEventEmitter = () => {
  return syncEmitter;
};

/**
 * Get inventory capacity history
 * @param {Object} params - History parameters
 * @returns {Object} Capacity history
 */
exports.getCapacityHistory = async ({
  inventoryId,
  tenantId,
  startDate,
  endDate,
  limit = 100
}) => {
  try {
    const inventory = await Inventory.findOne({
      _id: inventoryId,
      tenant: tenantId
    });

    if (!inventory) {
      throw new Error('Inventory not found');
    }

    let history = inventory.syncHistory || [];

    // Filter by date range if provided
    if (startDate || endDate) {
      history = history.filter(record => {
        const recordDate = new Date(record.timestamp);
        if (startDate && recordDate < new Date(startDate)) return false;
        if (endDate && recordDate > new Date(endDate)) return false;
        return true;
      });
    }

    // Limit results
    history = history.slice(-limit);

    return {
      success: true,
      inventory: {
        id: inventory._id,
        name: inventory.serviceName,
        currentCapacity: {
          total: inventory.capacity.total,
          available: inventory.capacity.available,
          occupied: inventory.capacity.total - inventory.capacity.available
        }
      },
      history: history.map(record => ({
        timestamp: record.timestamp,
        action: record.action,
        bookingId: record.bookingId,
        capacityChange: record.capacityChange,
        previousAvailable: record.previousAvailable,
        newAvailable: record.newAvailable,
        source: record.source
      })),
      totalRecords: history.length
    };
  } catch (error) {
    logger.error('Error getting capacity history:', error);
    throw error;
  }
};

module.exports = exports;
