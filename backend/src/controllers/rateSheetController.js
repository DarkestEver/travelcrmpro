/**
 * Rate Sheet Controller
 * Phase 5.2: API endpoints for rate sheet management
 */

const rateSheetService = require('../services/rateSheetService');
const Supplier = require('../models/Supplier');
const asyncHandler = require('../middleware/errorHandler').asyncHandler;

/**
 * @desc    Upload and create rate sheet from CSV
 * @route   POST /api/rate-sheets/upload
 * @access  Private/Supplier
 */
exports.uploadRateSheet = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded',
    });
  }
  
  const supplier = req.supplier; // From loadSupplier middleware
  const filePath = req.file.path;
  
  // Metadata from form data
  const metadata = {
    name: req.body.name,
    description: req.body.description,
    requireApproval: req.body.requireApproval === 'true',
    notes: req.body.notes,
  };
  
  const result = await rateSheetService.createRateSheetFromUpload(
    filePath,
    supplier,
    req.user._id,
    metadata
  );
  
  res.status(201).json({
    success: true,
    message: 'Rate sheet uploaded successfully',
    data: result.rateSheet,
    errors: result.errors,
    warnings: result.warnings,
    statistics: result.statistics,
  });
});

/**
 * @desc    Create rate sheet manually
 * @route   POST /api/rate-sheets
 * @access  Private/Supplier
 */
exports.createRateSheet = asyncHandler(async (req, res) => {
  const rateSheet = await rateSheetService.createRateSheet(
    req.body,
    req.supplier._id,
    req.user._id
  );
  
  res.status(201).json({
    success: true,
    message: 'Rate sheet created successfully',
    data: rateSheet,
  });
});

/**
 * @desc    Get my rate sheets
 * @route   GET /api/rate-sheets
 * @access  Private/Supplier
 */
exports.getMyRateSheets = asyncHandler(async (req, res) => {
  const filters = {
    status: req.query.status,
    search: req.query.search,
    validOn: req.query.validOn,
    limit: req.query.limit,
    skip: req.query.skip,
  };
  
  const result = await rateSheetService.getSupplierRateSheets(
    req.supplier._id,
    filters
  );
  
  res.json({
    success: true,
    count: result.rateSheets.length,
    total: result.total,
    page: result.page,
    pages: result.pages,
    data: result.rateSheets,
  });
});

/**
 * @desc    Get rate sheet by ID
 * @route   GET /api/rate-sheets/:id
 * @access  Private/Supplier
 */
exports.getRateSheetById = asyncHandler(async (req, res) => {
  const rateSheet = await rateSheetService.getRateSheetById(
    req.params.id,
    req.supplier._id
  );
  
  res.json({
    success: true,
    data: rateSheet,
  });
});

/**
 * @desc    Update rate sheet
 * @route   PUT /api/rate-sheets/:id
 * @access  Private/Supplier
 */
exports.updateRateSheet = asyncHandler(async (req, res) => {
  const rateSheet = await rateSheetService.updateRateSheet(
    req.params.id,
    req.supplier._id,
    req.body
  );
  
  res.json({
    success: true,
    message: 'Rate sheet updated successfully',
    data: rateSheet,
  });
});

/**
 * @desc    Delete rate sheet
 * @route   DELETE /api/rate-sheets/:id
 * @access  Private/Supplier
 */
exports.deleteRateSheet = asyncHandler(async (req, res) => {
  const result = await rateSheetService.deleteRateSheet(
    req.params.id,
    req.supplier._id
  );
  
  res.json({
    success: true,
    message: result.message,
  });
});

/**
 * @desc    Activate rate sheet
 * @route   PATCH /api/rate-sheets/:id/activate
 * @access  Private/Supplier
 */
exports.activateRateSheet = asyncHandler(async (req, res) => {
  const rateSheet = await rateSheetService.activateRateSheet(
    req.params.id,
    req.supplier._id
  );
  
  res.json({
    success: true,
    message: 'Rate sheet activated successfully',
    data: rateSheet,
  });
});

/**
 * @desc    Archive rate sheet
 * @route   PATCH /api/rate-sheets/:id/archive
 * @access  Private/Supplier
 */
exports.archiveRateSheet = asyncHandler(async (req, res) => {
  const rateSheet = await rateSheetService.archiveRateSheet(
    req.params.id,
    req.supplier._id
  );
  
  res.json({
    success: true,
    message: 'Rate sheet archived successfully',
    data: rateSheet,
  });
});

/**
 * @desc    Approve rate sheet (admin only)
 * @route   POST /api/rate-sheets/:id/approve
 * @access  Private/Admin
 */
exports.approveRateSheet = asyncHandler(async (req, res) => {
  const rateSheet = await rateSheetService.approveRateSheet(
    req.params.id,
    req.user._id
  );
  
  res.json({
    success: true,
    message: 'Rate sheet approved successfully',
    data: rateSheet,
  });
});

/**
 * @desc    Reject rate sheet (admin only)
 * @route   POST /api/rate-sheets/:id/reject
 * @access  Private/Admin
 */
exports.rejectRateSheet = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  
  if (!reason) {
    return res.status(400).json({
      success: false,
      message: 'Rejection reason is required',
    });
  }
  
  const rateSheet = await rateSheetService.rejectRateSheet(
    req.params.id,
    req.user._id,
    reason
  );
  
  res.json({
    success: true,
    message: 'Rate sheet rejected',
    data: rateSheet,
  });
});

/**
 * @desc    Create new version of rate sheet
 * @route   POST /api/rate-sheets/:id/new-version
 * @access  Private/Supplier
 */
exports.createNewVersion = asyncHandler(async (req, res) => {
  const newVersion = await rateSheetService.createNewVersion(
    req.params.id,
    req.supplier._id,
    req.body
  );
  
  res.status(201).json({
    success: true,
    message: 'New version created successfully',
    data: newVersion,
  });
});

/**
 * @desc    Get rate sheet history
 * @route   GET /api/rate-sheets/history/:name
 * @access  Private/Supplier
 */
exports.getRateSheetHistory = asyncHandler(async (req, res) => {
  const history = await rateSheetService.getRateSheetHistory(
    req.supplier._id,
    req.params.name
  );
  
  res.json({
    success: true,
    count: history.length,
    data: history,
  });
});

/**
 * @desc    Compare two rate sheet versions
 * @route   GET /api/rate-sheets/compare/:id1/:id2
 * @access  Private/Supplier
 */
exports.compareVersions = asyncHandler(async (req, res) => {
  const differences = await rateSheetService.compareVersions(
    req.params.id1,
    req.params.id2
  );
  
  res.json({
    success: true,
    data: differences,
  });
});

/**
 * @desc    Get supplier rate sheet statistics
 * @route   GET /api/rate-sheets/stats
 * @access  Private/Supplier
 */
exports.getRateSheetStats = asyncHandler(async (req, res) => {
  const stats = await rateSheetService.getSupplierStats(req.supplier._id);
  
  res.json({
    success: true,
    data: stats,
  });
});

/**
 * @desc    Search rate sheets (for operators/agents)
 * @route   GET /api/rate-sheets/search
 * @access  Private
 */
exports.searchRateSheets = asyncHandler(async (req, res) => {
  const filters = {
    tenant: req.tenant?._id,
    supplier: req.query.supplier,
    status: req.query.status || 'active',
    serviceType: req.query.serviceType,
    date: req.query.date,
  };
  
  const rateSheets = await rateSheetService.searchRateSheets(filters);
  
  res.json({
    success: true,
    count: rateSheets.length,
    data: rateSheets,
  });
});

/**
 * @desc    Get rate by service code
 * @route   GET /api/rate-sheets/:id/rates/:serviceCode
 * @access  Private
 */
exports.getRateByServiceCode = asyncHandler(async (req, res) => {
  const rate = await rateSheetService.getRateByServiceCode(
    req.params.id,
    req.params.serviceCode
  );
  
  if (!rate) {
    return res.status(404).json({
      success: false,
      message: 'Rate not found',
    });
  }
  
  res.json({
    success: true,
    data: rate,
  });
});

/**
 * @desc    Get applicable rate for date
 * @route   GET /api/rate-sheets/:id/rates/:serviceCode/applicable
 * @access  Private
 */
exports.getApplicableRate = asyncHandler(async (req, res) => {
  const { date } = req.query;
  
  if (!date) {
    return res.status(400).json({
      success: false,
      message: 'Date parameter is required',
    });
  }
  
  const rate = await rateSheetService.getApplicableRate(
    req.params.id,
    req.params.serviceCode,
    date
  );
  
  if (!rate) {
    return res.status(404).json({
      success: false,
      message: 'No applicable rate found for the specified date',
    });
  }
  
  res.json({
    success: true,
    data: rate,
  });
});

/**
 * @desc    Download CSV template
 * @route   GET /api/rate-sheets/template
 * @access  Private/Supplier
 */
exports.getTemplate = asyncHandler(async (req, res) => {
  const template = rateSheetService.generateTemplate();
  
  // Set headers for CSV download
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="rate-sheet-template.csv"');
  
  res.send(template.csv);
});

/**
 * @desc    Get expiring rate sheets
 * @route   GET /api/rate-sheets/expiring
 * @access  Private
 */
exports.getExpiringRateSheets = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const rateSheets = await rateSheetService.getExpiringRateSheets(
    req.tenant._id,
    days
  );
  
  res.json({
    success: true,
    count: rateSheets.length,
    data: rateSheets,
  });
});
