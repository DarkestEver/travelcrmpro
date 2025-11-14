const express = require('express');
const router = express.Router();
const {
  createInventory,
  getMyInventory,
  getInventoryById,
  updateInventory,
  deleteInventory,
  checkAvailability,
  addBlackoutDates,
  removeBlackoutDates,
  updateCapacity,
  addSeasonalPricing,
  updateSeasonalPricing,
  removeSeasonalPricing,
  getInventoryStats,
  bulkUpdateAvailability,
  searchInventory
} = require('../controllers/supplierInventoryController');
const { protect, loadSupplier } = require('../middleware/auth');

// Supplier-only routes (require supplier authentication)
router.use(protect);
router.use(loadSupplier);

// Inventory CRUD
router.post('/', createInventory);
router.get('/', getMyInventory);
router.get('/stats', getInventoryStats);
router.get('/:id', getInventoryById);
router.put('/:id', updateInventory);
router.delete('/:id', deleteInventory);

// Availability management
router.get('/:id/availability', checkAvailability);
router.post('/:id/blackout-dates', addBlackoutDates);
router.delete('/:id/blackout-dates', removeBlackoutDates);

// Capacity management
router.patch('/:id/capacity', updateCapacity);

// Pricing management
router.post('/:id/seasonal-pricing', addSeasonalPricing);
router.put('/:id/seasonal-pricing/:seasonIndex', updateSeasonalPricing);
router.delete('/:id/seasonal-pricing/:seasonIndex', removeSeasonalPricing);

// Bulk operations
router.patch('/bulk-update', bulkUpdateAvailability);

module.exports = router;
