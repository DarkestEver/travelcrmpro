const QueryAssignment = require('../models/QueryAssignment');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

/**
 * Create a new assignment
 * @route POST /api/v1/assignments
 * @access Private (super_admin, operator, agent)
 */
exports.createAssignment = asyncHandler(async (req, res) => {
  const { entityType, entityId, assignedTo, assignedRole, priority, dueDate, notes } = req.body;

  // Validation
  if (!entityType || !entityId || !assignedTo) {
    throw new AppError('entityType, entityId, and assignedTo are required', 400);
  }

  const assignment = await QueryAssignment.create({
    tenantId: req.user.tenantId,
    entityType,
    entityId,
    assignedTo,
    assignedBy: req.user._id,
    assignedRole: assignedRole || 'agent',
    priority: priority || 'medium',
    dueDate,
    notes,
  });

  await assignment.populate('assignedTo assignedBy', 'name email');

  res.status(201).json({
    success: true,
    message: 'Assignment created successfully',
    data: { assignment },
  });
});

/**
 * Get all assignments for current user
 * @route GET /api/v1/assignments/my-assignments
 * @access Private
 */
exports.getMyAssignments = asyncHandler(async (req, res) => {
  const { status, priority, entityType } = req.query;

  const filters = {};
  if (status) filters.status = status;
  if (priority) filters.priority = priority;
  if (entityType) filters.entityType = entityType;

  const assignments = await QueryAssignment.getAssignmentsForUser(
    req.user._id,
    req.user.tenantId,
    filters
  );

  res.status(200).json({
    success: true,
    message: 'Assignments fetched successfully',
    data: { 
      assignments,
      count: assignments.length
    },
  });
});

/**
 * Get assignments for specific entity
 * @route GET /api/v1/assignments/entity/:entityType/:entityId
 * @access Private
 */
exports.getAssignmentsForEntity = asyncHandler(async (req, res) => {
  const { entityType, entityId } = req.params;

  const assignments = await QueryAssignment.getAssignmentsForEntity(
    entityType,
    entityId,
    req.user.tenantId
  );

  res.status(200).json({
    success: true,
    message: 'Assignments fetched successfully',
    data: { 
      assignments,
      count: assignments.length
    },
  });
});

/**
 * Get single assignment by ID
 * @route GET /api/v1/assignments/:id
 * @access Private
 */
exports.getAssignment = asyncHandler(async (req, res) => {
  const assignment = await QueryAssignment.findById(req.params.id)
    .populate('assignedTo assignedBy', 'name email')
    .populate('reassignmentHistory.fromUser reassignmentHistory.toUser reassignmentHistory.reassignedBy', 'name email');

  if (!assignment || assignment.tenantId.toString() !== req.user.tenantId.toString()) {
    throw new AppError('Assignment not found', 404);
  }

  res.status(200).json({
    success: true,
    message: 'Assignment fetched successfully',
    data: { assignment },
  });
});

/**
 * Update assignment status
 * @route PATCH /api/v1/assignments/:id/status
 * @access Private
 */
exports.updateAssignmentStatus = asyncHandler(async (req, res) => {
  const { status, notes } = req.body;
  
  const assignment = await QueryAssignment.findById(req.params.id);

  if (!assignment || assignment.tenantId.toString() !== req.user.tenantId.toString()) {
    throw new AppError('Assignment not found', 404);
  }

  // Check if user is assigned to this task or is admin
  const isAssigned = assignment.assignedTo.toString() === req.user._id.toString();
  const isAdmin = ['super_admin', 'operator'].includes(req.user.role);

  if (!isAssigned && !isAdmin) {
    throw new AppError('You are not authorized to update this assignment', 403);
  }

  if (status === 'completed') {
    await assignment.complete(req.user._id, notes);
  } else {
    assignment.status = status;
    if (notes) assignment.notes = notes;
    await assignment.save();
  }

  await assignment.populate('assignedTo assignedBy', 'name email');

  res.status(200).json({
    success: true,
    message: 'Assignment status updated successfully',
    data: { assignment },
  });
});

/**
 * Reassign assignment to another user
 * @route PATCH /api/v1/assignments/:id/reassign
 * @access Private (super_admin, operator, agent)
 */
exports.reassignAssignment = asyncHandler(async (req, res) => {
  const { toUserId, reason } = req.body;

  if (!toUserId) {
    throw new AppError('toUserId is required', 400);
  }

  const assignment = await QueryAssignment.findById(req.params.id);

  if (!assignment || assignment.tenantId.toString() !== req.user.tenantId.toString()) {
    throw new AppError('Assignment not found', 404);
  }

  const fromUserId = assignment.assignedTo;

  await assignment.reassign(fromUserId, toUserId, reason, req.user._id);
  await assignment.populate('assignedTo assignedBy', 'name email');

  res.status(200).json({
    success: true,
    message: 'Assignment reassigned successfully',
    data: { assignment },
  });
});

/**
 * Update assignment
 * @route PATCH /api/v1/assignments/:id
 * @access Private
 */
exports.updateAssignment = asyncHandler(async (req, res) => {
  const { priority, dueDate, notes } = req.body;

  const assignment = await QueryAssignment.findById(req.params.id);

  if (!assignment || assignment.tenantId.toString() !== req.user.tenantId.toString()) {
    throw new AppError('Assignment not found', 404);
  }

  // Update allowed fields
  if (priority) assignment.priority = priority;
  if (dueDate) assignment.dueDate = dueDate;
  if (notes) assignment.notes = notes;

  await assignment.save();
  await assignment.populate('assignedTo assignedBy', 'name email');

  res.status(200).json({
    success: true,
    message: 'Assignment updated successfully',
    data: { assignment },
  });
});

/**
 * Delete assignment
 * @route DELETE /api/v1/assignments/:id
 * @access Private (super_admin, operator)
 */
exports.deleteAssignment = asyncHandler(async (req, res) => {
  const assignment = await QueryAssignment.findById(req.params.id);

  if (!assignment || assignment.tenantId.toString() !== req.user.tenantId.toString()) {
    throw new AppError('Assignment not found', 404);
  }

  await assignment.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Assignment deleted successfully',
  });
});
