const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { protect, restrictTo } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

/**
 * @route   GET /api/v1/expenses/summary
 * @desc    Get expense summary/statistics
 * @access  Private
 */
router.get('/summary', expenseController.getExpenseSummary);

/**
 * @route   GET /api/v1/expenses/:entityType/:entityId
 * @desc    Get expenses for specific entity
 * @access  Private
 */
router.get('/:entityType/:entityId', expenseController.getExpensesForEntity);

/**
 * @route   GET /api/v1/expenses
 * @desc    Get all expenses (with filters)
 * @access  Private
 */
router.get('/', expenseController.getAllExpenses);

/**
 * @route   POST /api/v1/expenses
 * @desc    Create new expense
 * @access  Private (super_admin, operator, agent)
 */
router.post('/', restrictTo('super_admin', 'operator', 'agent'), expenseController.createExpense);

/**
 * @route   GET /api/v1/expenses/:id
 * @desc    Get single expense
 * @access  Private
 */
router.get('/:id', expenseController.getExpense);

/**
 * @route   PATCH /api/v1/expenses/:id
 * @desc    Update expense
 * @access  Private (super_admin, operator, agent)
 */
router.patch('/:id', restrictTo('super_admin', 'operator', 'agent'), expenseController.updateExpense);

/**
 * @route   POST /api/v1/expenses/:id/mark-paid
 * @desc    Mark expense as paid
 * @access  Private (super_admin, operator, agent)
 */
router.post('/:id/mark-paid', restrictTo('super_admin', 'operator', 'agent'), expenseController.markAsPaid);

/**
 * @route   POST /api/v1/expenses/:id/approve
 * @desc    Approve expense
 * @access  Private (super_admin, operator)
 */
router.post('/:id/approve', restrictTo('super_admin', 'operator'), expenseController.approveExpense);

/**
 * @route   POST /api/v1/expenses/:id/reject
 * @desc    Reject expense
 * @access  Private (super_admin, operator)
 */
router.post('/:id/reject', restrictTo('super_admin', 'operator'), expenseController.rejectExpense);

/**
 * @route   DELETE /api/v1/expenses/:id
 * @desc    Delete expense
 * @access  Private (super_admin, operator)
 */
router.delete('/:id', restrictTo('super_admin', 'operator'), expenseController.deleteExpense);

module.exports = router;
