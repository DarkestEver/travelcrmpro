const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const { protect, restrictTo } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

/**
 * @route   GET /api/v1/assignments/my-assignments
 * @desc    Get all assignments for current user
 * @access  Private
 */
router.get('/my-assignments', assignmentController.getMyAssignments);

/**
 * @route   GET /api/v1/assignments/entity/:entityType/:entityId
 * @desc    Get assignments for specific entity
 * @access  Private
 */
router.get('/entity/:entityType/:entityId', assignmentController.getAssignmentsForEntity);

/**
 * @route   POST /api/v1/assignments
 * @desc    Create new assignment
 * @access  Private (super_admin, operator, agent)
 */
router.post('/', restrictTo('super_admin', 'operator', 'agent'), assignmentController.createAssignment);

/**
 * @route   GET /api/v1/assignments/:id
 * @desc    Get single assignment
 * @access  Private
 */
router.get('/:id', assignmentController.getAssignment);

/**
 * @route   PATCH /api/v1/assignments/:id
 * @desc    Update assignment
 * @access  Private
 */
router.patch('/:id', assignmentController.updateAssignment);

/**
 * @route   PATCH /api/v1/assignments/:id/status
 * @desc    Update assignment status
 * @access  Private
 */
router.patch('/:id/status', assignmentController.updateAssignmentStatus);

/**
 * @route   PATCH /api/v1/assignments/:id/reassign
 * @desc    Reassign assignment to another user
 * @access  Private (super_admin, operator, agent)
 */
router.patch('/:id/reassign', restrictTo('super_admin', 'operator', 'agent'), assignmentController.reassignAssignment);

/**
 * @route   DELETE /api/v1/assignments/:id
 * @desc    Delete assignment
 * @access  Private (super_admin, operator)
 */
router.delete('/:id', restrictTo('super_admin', 'operator'), assignmentController.deleteAssignment);

module.exports = router;
