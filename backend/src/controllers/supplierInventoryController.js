const { asyncHandler } = require('../middleware/errorHandler');
const inventoryService = require('../services/inventoryService');

/**
 * @desc    Create new inventory item
 * @route   POST /api/v1/supplier-portal/inventory
 * @access  Private (Supplier only)
 */
exports.createInventory = asyncHandler(async (req, res) => {
  const supplierId = req.supplier._id;
  
  const inventory = await inventoryService.createInventory(req.body, supplierId);
  
  res.status(201).json({
    success: true,
    message: 'Inventory item created successfully',
    data: inventory
  });
});

/**
 * @desc    Get all inventory items for supplier
 * @route   GET /api/v1/supplier-portal/inventory
 * @access  Private (Supplier only)
 */
exports.getMyInventory = asyncHandler(async (req, res) => {
  const supplierId = req.supplier._id;
  const { status, serviceType, search, limit } = req.query;
  
  const inventory = await inventoryService.getSupplierInventory(supplierId, {
    status,
    serviceType,
    search,
    limit: limit ? parseInt(limit) : undefined
  });
  
  res.json({
    success: true,
    count: inventory.length,
    data: inventory
  });
});

/**
 * @desc    Get single inventory item
 * @route   GET /api/v1/supplier-portal/inventory/:id
 * @access  Private (Supplier only)
 */
exports.getInventoryById = asyncHandler(async (req, res) => {
  const supplierId = req.supplier._id;
  const { id } = req.params;
  
  const inventory = await inventoryService.getInventoryById(id, supplierId);
  
  res.json({
    success: true,
    data: inventory
  });
});

/**
 * @desc    Update inventory item
 * @route   PUT /api/v1/supplier-portal/inventory/:id
 * @access  Private (Supplier only)
 */
exports.updateInventory = asyncHandler(async (req, res) => {
  const supplierId = req.supplier._id;
  const { id } = req.params;
  
  const inventory = await inventoryService.updateInventory(id, supplierId, req.body);
  
  res.json({
    success: true,
    message: 'Inventory item updated successfully',
    data: inventory
  });
});

/**
 * @desc    Delete inventory item
 * @route   DELETE /api/v1/supplier-portal/inventory/:id
 * @access  Private (Supplier only)
 */
exports.deleteInventory = asyncHandler(async (req, res) => {
  const supplierId = req.supplier._id;
  const { id } = req.params;
  
  await inventoryService.deleteInventory(id, supplierId);
  
  res.json({
    success: true,
    message: 'Inventory item deleted successfully'
  });
});

/**
 * @desc    Check availability for date range
 * @route   GET /api/v1/supplier-portal/inventory/:id/availability
 * @access  Private (Supplier only)
 */
exports.checkAvailability = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { startDate, endDate } = req.query;
  
  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      message: 'Start date and end date are required'
    });
  }
  
  const availability = await inventoryService.checkAvailability(id, startDate, endDate);
  
  res.json({
    success: true,
    data: availability
  });
});

/**
 * @desc    Add blackout dates
 * @route   POST /api/v1/supplier-portal/inventory/:id/blackout-dates
 * @access  Private (Supplier only)
 */
exports.addBlackoutDates = asyncHandler(async (req, res) => {
  const supplierId = req.supplier._id;
  const { id } = req.params;
  const { dates } = req.body;
  
  if (!dates || !Array.isArray(dates)) {
    return res.status(400).json({
      success: false,
      message: 'Dates array is required'
    });
  }
  
  const inventory = await inventoryService.addBlackoutDates(id, supplierId, dates);
  
  res.json({
    success: true,
    message: 'Blackout dates added successfully',
    data: inventory
  });
});

/**
 * @desc    Remove blackout dates
 * @route   DELETE /api/v1/supplier-portal/inventory/:id/blackout-dates
 * @access  Private (Supplier only)
 */
exports.removeBlackoutDates = asyncHandler(async (req, res) => {
  const supplierId = req.supplier._id;
  const { id } = req.params;
  const { dates } = req.body;
  
  if (!dates || !Array.isArray(dates)) {
    return res.status(400).json({
      success: false,
      message: 'Dates array is required'
    });
  }
  
  const inventory = await inventoryService.removeBlackoutDates(id, supplierId, dates);
  
  res.json({
    success: true,
    message: 'Blackout dates removed successfully',
    data: inventory
  });
});

/**
 * @desc    Update capacity
 * @route   PATCH /api/v1/supplier-portal/inventory/:id/capacity
 * @access  Private (Supplier only)
 */
exports.updateCapacity = asyncHandler(async (req, res) => {
  const supplierId = req.supplier._id;
  const { id } = req.params;
  const { total, available } = req.body;
  
  const inventory = await inventoryService.updateCapacity(id, supplierId, total, available);
  
  res.json({
    success: true,
    message: 'Capacity updated successfully',
    data: inventory
  });
});

/**
 * @desc    Add seasonal pricing
 * @route   POST /api/v1/supplier-portal/inventory/:id/seasonal-pricing
 * @access  Private (Supplier only)
 */
exports.addSeasonalPricing = asyncHandler(async (req, res) => {
  const supplierId = req.supplier._id;
  const { id } = req.params;
  
  const inventory = await inventoryService.addSeasonalPricing(id, supplierId, req.body);
  
  res.json({
    success: true,
    message: 'Seasonal pricing added successfully',
    data: inventory
  });
});

/**
 * @desc    Update seasonal pricing
 * @route   PUT /api/v1/supplier-portal/inventory/:id/seasonal-pricing/:seasonIndex
 * @access  Private (Supplier only)
 */
exports.updateSeasonalPricing = asyncHandler(async (req, res) => {
  const supplierId = req.supplier._id;
  const { id, seasonIndex } = req.params;
  
  const inventory = await inventoryService.updateSeasonalPricing(
    id,
    supplierId,
    parseInt(seasonIndex),
    req.body
  );
  
  res.json({
    success: true,
    message: 'Seasonal pricing updated successfully',
    data: inventory
  });
});

/**
 * @desc    Remove seasonal pricing
 * @route   DELETE /api/v1/supplier-portal/inventory/:id/seasonal-pricing/:seasonIndex
 * @access  Private (Supplier only)
 */
exports.removeSeasonalPricing = asyncHandler(async (req, res) => {
  const supplierId = req.supplier._id;
  const { id, seasonIndex } = req.params;
  
  const inventory = await inventoryService.removeSeasonalPricing(
    id,
    supplierId,
    parseInt(seasonIndex)
  );
  
  res.json({
    success: true,
    message: 'Seasonal pricing removed successfully',
    data: inventory
  });
});

/**
 * @desc    Get inventory statistics
 * @route   GET /api/v1/supplier-portal/inventory/stats
 * @access  Private (Supplier only)
 */
exports.getInventoryStats = asyncHandler(async (req, res) => {
  const supplierId = req.supplier._id;
  
  const stats = await inventoryService.getSupplierStats(supplierId);
  
  res.json({
    success: true,
    data: stats
  });
});

/**
 * @desc    Bulk update availability
 * @route   PATCH /api/v1/supplier-portal/inventory/bulk-update
 * @access  Private (Supplier only)
 */
exports.bulkUpdateAvailability = asyncHandler(async (req, res) => {
  const supplierId = req.supplier._id;
  const { inventoryIds, updates } = req.body;
  
  if (!inventoryIds || !Array.isArray(inventoryIds)) {
    return res.status(400).json({
      success: false,
      message: 'Inventory IDs array is required'
    });
  }
  
  const result = await inventoryService.bulkUpdateAvailability(
    supplierId,
    inventoryIds,
    updates
  );
  
  res.json({
    success: true,
    message: `Updated ${result.modified} inventory items`,
    data: result
  });
});

/**
 * @desc    Search inventory (public - for operators/agents)
 * @route   GET /api/v1/inventory/search
 * @access  Public/Protected
 */
exports.searchInventory = asyncHandler(async (req, res) => {
  const { 
    tenant,
    supplier,
    serviceType,
    city,
    country,
    minPrice,
    maxPrice,
    featured
  } = req.query;
  
  const inventory = await inventoryService.searchInventory({
    tenant: tenant || req.user?.tenant,
    supplier,
    serviceType,
    city,
    country,
    minPrice: minPrice ? parseFloat(minPrice) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    featured: featured === 'true'
  });
  
  res.json({
    success: true,
    count: inventory.length,
    data: inventory
  });
});
