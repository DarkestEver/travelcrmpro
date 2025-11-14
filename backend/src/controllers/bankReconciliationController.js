const bankReconciliationService = require('../services/bankReconciliationService');
const BankTransaction = require('../models/BankTransaction');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    Upload and import bank statement
 * @route   POST /api/v1/bank-reconciliation/import
 * @access  Private (Admin/Accountant)
 */
exports.importBankStatement = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Please upload a bank statement file (CSV or OFX)'
    });
  }
  
  const result = await bankReconciliationService.importBankStatement(
    req.file,
    req.user.tenant,
    req.user._id
  );
  
  res.status(201).json({
    success: true,
    message: `Imported ${result.imported} transactions`,
    data: result
  });
});

/**
 * @desc    Auto-match imported transactions with bookings
 * @route   POST /api/v1/bank-reconciliation/auto-match
 * @access  Private (Admin/Accountant)
 */
exports.autoMatchTransactions = asyncHandler(async (req, res) => {
  const { importBatch, minScore } = req.body;
  
  const result = await bankReconciliationService.autoMatchTransactions(
    req.user.tenant,
    { importBatch, minScore }
  );
  
  res.json({
    success: true,
    message: `Matched ${result.matched} transactions, ${result.unmatched} remain unmatched`,
    data: result
  });
});

/**
 * @desc    Manually match transaction with booking
 * @route   POST /api/v1/bank-reconciliation/manual-match
 * @access  Private (Admin/Accountant)
 */
exports.manualMatch = asyncHandler(async (req, res) => {
  const { transactionId, bookingId } = req.body;
  
  if (!transactionId || !bookingId) {
    return res.status(400).json({
      success: false,
      message: 'Transaction ID and Booking ID are required'
    });
  }
  
  const transaction = await bankReconciliationService.manualMatch(
    transactionId,
    bookingId,
    req.user._id
  );
  
  res.json({
    success: true,
    message: 'Transaction matched successfully',
    data: transaction
  });
});

/**
 * @desc    Unmatch a transaction
 * @route   POST /api/v1/bank-reconciliation/unmatch/:id
 * @access  Private (Admin/Accountant)
 */
exports.unmatch = asyncHandler(async (req, res) => {
  const transaction = await bankReconciliationService.unmatch(req.params.id);
  
  res.json({
    success: true,
    message: 'Transaction unmatched',
    data: transaction
  });
});

/**
 * @desc    Get all transactions
 * @route   GET /api/v1/bank-reconciliation/transactions
 * @access  Private (Admin/Accountant)
 */
exports.getTransactions = asyncHandler(async (req, res) => {
  const { status, importBatch, startDate, endDate } = req.query;
  
  const query = { tenant: req.user.tenant };
  
  if (status) query.status = status;
  if (importBatch) query.importBatch = importBatch;
  
  if (startDate || endDate) {
    query.transactionDate = {};
    if (startDate) query.transactionDate.$gte = new Date(startDate);
    if (endDate) query.transactionDate.$lte = new Date(endDate);
  }
  
  const transactions = await BankTransaction.find(query)
    .sort({ transactionDate: -1 })
    .limit(1000); // Limit to prevent large responses
  
  res.json({
    success: true,
    count: transactions.length,
    data: transactions
  });
});

/**
 * @desc    Get unmatched transactions
 * @route   GET /api/v1/bank-reconciliation/unmatched
 * @access  Private (Admin/Accountant)
 */
exports.getUnmatched = asyncHandler(async (req, res) => {
  const transactions = await BankTransaction.getUnmatched(req.user.tenant);
  
  res.json({
    success: true,
    count: transactions.length,
    data: transactions
  });
});

/**
 * @desc    Get reconciliation report
 * @route   GET /api/v1/bank-reconciliation/report
 * @access  Private (Admin/Accountant)
 */
exports.getReconciliationReport = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const report = await bankReconciliationService.getReconciliationReport(
    req.user.tenant,
    startDate,
    endDate
  );
  
  res.json({
    success: true,
    data: report
  });
});

/**
 * @desc    Get import batches
 * @route   GET /api/v1/bank-reconciliation/batches
 * @access  Private (Admin/Accountant)
 */
exports.getImportBatches = asyncHandler(async (req, res) => {
  const batches = await BankTransaction.aggregate([
    { $match: { tenant: req.user.tenant } },
    {
      $group: {
        _id: '$importBatch',
        count: { $sum: 1 },
        matched: {
          $sum: {
            $cond: [
              { $in: ['$status', ['matched', 'manually_matched']] },
              1,
              0
            ]
          }
        },
        unmatched: {
          $sum: {
            $cond: [{ $eq: ['$status', 'unmatched'] }, 1, 0]
          }
        },
        totalAmount: { $sum: '$amount' },
        importedAt: { $first: '$importedAt' }
      }
    },
    { $sort: { importedAt: -1 } }
  ]);
  
  res.json({
    success: true,
    count: batches.length,
    data: batches
  });
});

/**
 * @desc    Delete transaction
 * @route   DELETE /api/v1/bank-reconciliation/transactions/:id
 * @access  Private (Admin/Accountant)
 */
exports.deleteTransaction = asyncHandler(async (req, res) => {
  const transaction = await BankTransaction.findOne({
    _id: req.params.id,
    tenant: req.user.tenant
  });
  
  if (!transaction) {
    return res.status(404).json({
      success: false,
      message: 'Transaction not found'
    });
  }
  
  await transaction.remove();
  
  res.json({
    success: true,
    message: 'Transaction deleted'
  });
});

/**
 * @desc    Delete import batch
 * @route   DELETE /api/v1/bank-reconciliation/batches/:batchId
 * @access  Private (Admin/Accountant)
 */
exports.deleteImportBatch = asyncHandler(async (req, res) => {
  const result = await BankTransaction.deleteMany({
    tenant: req.user.tenant,
    importBatch: req.params.batchId
  });
  
  res.json({
    success: true,
    message: `Deleted ${result.deletedCount} transactions from batch`
  });
});

/**
 * @desc    Find matching suggestions for a transaction
 * @route   GET /api/v1/bank-reconciliation/suggestions/:id
 * @access  Private (Admin/Accountant)
 */
exports.getMatchingSuggestions = asyncHandler(async (req, res) => {
  const transaction = await BankTransaction.findOne({
    _id: req.params.id,
    tenant: req.user.tenant
  });
  
  if (!transaction) {
    return res.status(404).json({
      success: false,
      message: 'Transaction not found'
    });
  }
  
  const match = await bankReconciliationService.findBestMatch(
    transaction,
    req.user.tenant
  );
  
  res.json({
    success: true,
    data: match
  });
});
