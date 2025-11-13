const QueryExpense = require('../models/QueryExpense');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

/**
 * Create a new expense
 * @route POST /api/v1/expenses
 * @access Private (super_admin, operator, agent)
 */
exports.createExpense = asyncHandler(async (req, res) => {
  const {
    entityType,
    entityId,
    category,
    description,
    amount,
    currency,
    supplierId,
    supplierName,
    dueDate,
    invoiceNumber,
    invoiceUrl,
    exchangeRate,
    markup,
    commission
  } = req.body;

  // Validation
  if (!entityType || !entityId || !category || !amount) {
    throw new AppError('entityType, entityId, category, and amount are required', 400);
  }

  const expense = await QueryExpense.create({
    tenantId: req.user.tenantId,
    entityType,
    entityId,
    category,
    description,
    amount,
    currency: currency || 'INR',
    supplierId,
    supplierName,
    dueDate,
    invoiceNumber,
    invoiceUrl,
    exchangeRate,
    markup,
    commission,
    recordedBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    message: 'Expense created successfully',
    data: { expense },
  });
});

/**
 * Get expenses for specific entity
 * @route GET /api/v1/expenses/:entityType/:entityId
 * @access Private
 */
exports.getExpensesForEntity = asyncHandler(async (req, res) => {
  const { entityType, entityId } = req.params;

  const expenses = await QueryExpense.getExpensesForEntity(
    entityType,
    entityId,
    req.user.tenantId
  );

  const totals = await QueryExpense.getTotalExpenses(
    entityType,
    entityId,
    req.user.tenantId
  );

  const categoryBreakdown = await QueryExpense.getExpensesByCategory(
    entityType,
    entityId,
    req.user.tenantId
  );

  res.status(200).json({
    success: true,
    message: 'Expenses fetched successfully',
    data: {
      expenses,
      totals,
      categoryBreakdown,
      count: expenses.length,
    },
  });
});

/**
 * Get all expenses (with filters)
 * @route GET /api/v1/expenses
 * @access Private
 */
exports.getAllExpenses = asyncHandler(async (req, res) => {
  const { entityType, category, paymentStatus, approvalStatus, startDate, endDate } = req.query;

  const filters = { tenantId: req.user.tenantId };

  if (entityType) filters.entityType = entityType;
  if (category) filters.category = category;
  if (paymentStatus) filters.paymentStatus = paymentStatus;
  if (approvalStatus) filters.approvalStatus = approvalStatus;

  if (startDate || endDate) {
    filters.createdAt = {};
    if (startDate) filters.createdAt.$gte = new Date(startDate);
    if (endDate) filters.createdAt.$lte = new Date(endDate);
  }

  const expenses = await QueryExpense.find(filters)
    .populate('supplierId', 'name email')
    .populate('recordedBy approvedBy', 'name email')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    message: 'Expenses fetched successfully',
    data: {
      expenses,
      count: expenses.length,
    },
  });
});

/**
 * Get single expense by ID
 * @route GET /api/v1/expenses/:id
 * @access Private
 */
exports.getExpense = asyncHandler(async (req, res) => {
  const expense = await QueryExpense.findById(req.params.id)
    .populate('supplierId', 'name email phone')
    .populate('recordedBy approvedBy paidBy', 'name email');

  if (!expense || expense.tenantId.toString() !== req.user.tenantId.toString()) {
    throw new AppError('Expense not found', 404);
  }

  res.status(200).json({
    success: true,
    message: 'Expense fetched successfully',
    data: { expense },
  });
});

/**
 * Update expense
 * @route PATCH /api/v1/expenses/:id
 * @access Private (super_admin, operator, agent)
 */
exports.updateExpense = asyncHandler(async (req, res) => {
  const expense = await QueryExpense.findById(req.params.id);

  if (!expense || expense.tenantId.toString() !== req.user.tenantId.toString()) {
    throw new AppError('Expense not found', 404);
  }

  // Only allow updates if not yet approved or paid
  if (expense.approvalStatus === 'approved' && expense.paymentStatus === 'paid') {
    throw new AppError('Cannot update an approved and paid expense', 400);
  }

  // Update allowed fields
  const allowedUpdates = [
    'description',
    'amount',
    'currency',
    'category',
    'supplierId',
    'supplierName',
    'supplierEmail',
    'supplierPhone',
    'dueDate',
    'invoiceNumber',
    'invoiceUrl',
    'receiptUrl',
    'exchangeRate',
    'markup',
    'commission',
    'notes',
  ];

  allowedUpdates.forEach((field) => {
    if (req.body[field] !== undefined) {
      expense[field] = req.body[field];
    }
  });

  await expense.save();

  res.status(200).json({
    success: true,
    message: 'Expense updated successfully',
    data: { expense },
  });
});

/**
 * Mark expense as paid
 * @route POST /api/v1/expenses/:id/mark-paid
 * @access Private (super_admin, operator, agent)
 */
exports.markAsPaid = asyncHandler(async (req, res) => {
  const { amount, paymentMethod, transactionId, notes } = req.body;

  const expense = await QueryExpense.findById(req.params.id);

  if (!expense || expense.tenantId.toString() !== req.user.tenantId.toString()) {
    throw new AppError('Expense not found', 404);
  }

  await expense.markAsPaid(amount, paymentMethod, req.user._id, transactionId, notes);

  res.status(200).json({
    success: true,
    message: 'Expense marked as paid successfully',
    data: { expense },
  });
});

/**
 * Approve expense
 * @route POST /api/v1/expenses/:id/approve
 * @access Private (super_admin, operator)
 */
exports.approveExpense = asyncHandler(async (req, res) => {
  const { notes } = req.body;

  const expense = await QueryExpense.findById(req.params.id);

  if (!expense || expense.tenantId.toString() !== req.user.tenantId.toString()) {
    throw new AppError('Expense not found', 404);
  }

  await expense.approve(req.user._id, notes);

  res.status(200).json({
    success: true,
    message: 'Expense approved successfully',
    data: { expense },
  });
});

/**
 * Reject expense
 * @route POST /api/v1/expenses/:id/reject
 * @access Private (super_admin, operator)
 */
exports.rejectExpense = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  if (!reason) {
    throw new AppError('Rejection reason is required', 400);
  }

  const expense = await QueryExpense.findById(req.params.id);

  if (!expense || expense.tenantId.toString() !== req.user.tenantId.toString()) {
    throw new AppError('Expense not found', 404);
  }

  await expense.reject(req.user._id, reason);

  res.status(200).json({
    success: true,
    message: 'Expense rejected successfully',
    data: { expense },
  });
});

/**
 * Delete expense
 * @route DELETE /api/v1/expenses/:id
 * @access Private (super_admin, operator)
 */
exports.deleteExpense = asyncHandler(async (req, res) => {
  const expense = await QueryExpense.findById(req.params.id);

  if (!expense || expense.tenantId.toString() !== req.user.tenantId.toString()) {
    throw new AppError('Expense not found', 404);
  }

  // Don't allow deletion of paid expenses
  if (expense.paymentStatus === 'paid') {
    throw new AppError('Cannot delete a paid expense', 400);
  }

  await expense.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Expense deleted successfully',
  });
});

/**
 * Get expense summary/statistics
 * @route GET /api/v1/expenses/summary
 * @access Private
 */
exports.getExpenseSummary = asyncHandler(async (req, res) => {
  const { entityType, entityId } = req.query;

  const matchFilters = { tenantId: req.user.tenantId };
  if (entityType) matchFilters.entityType = entityType;
  if (entityId) matchFilters.entityId = entityId;

  const summary = await QueryExpense.aggregate([
    { $match: matchFilters },
    {
      $group: {
        _id: null,
        totalExpenses: { $sum: '$amount' },
        totalPaid: {
          $sum: {
            $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$amountPaid', 0],
          },
        },
        totalPending: {
          $sum: {
            $cond: [{ $eq: ['$paymentStatus', 'pending'] }, '$amount', 0],
          },
        },
        totalOverdue: {
          $sum: {
            $cond: [{ $eq: ['$paymentStatus', 'overdue'] }, '$amount', 0],
          },
        },
        count: { $sum: 1 },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    message: 'Expense summary fetched successfully',
    data: {
      summary: summary[0] || {
        totalExpenses: 0,
        totalPaid: 0,
        totalPending: 0,
        totalOverdue: 0,
        count: 0,
      },
    },
  });
});
