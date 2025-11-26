const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { isSuperAdmin } = require('../middleware/rbac');
const { validate } = require('../middleware/validation');
const {
  getUsersQuerySchema,
  updateUserSchema,
  assignRoleSchema,
} = require('../validation/userSchemas');

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /users
 * @desc    Get all users with pagination and filtering
 * @access  Super Admin (all users) / Tenant Admin (own tenant users)
 */
router.get(
  '/',
  validate(getUsersQuerySchema, 'query'),
  userController.getAllUsers
);

/**
 * @route   GET /users/:id
 * @desc    Get user by ID
 * @access  Super Admin / Tenant Admin (own tenant) / Self
 */
router.get('/:id', userController.getUser);

/**
 * @route   PUT /users/:id
 * @desc    Update user
 * @access  Super Admin / Tenant Admin (limited) / Self (limited)
 */
router.put(
  '/:id',
  validate(updateUserSchema),
  userController.updateUser
);

/**
 * @route   DELETE /users/:id
 * @desc    Delete user
 * @access  Super Admin / Tenant Admin (own tenant, not self)
 */
router.delete('/:id', userController.deleteUser);

/**
 * @route   PUT /users/:id/role
 * @desc    Assign role to user
 * @access  Super Admin only
 */
router.put(
  '/:id/role',
  isSuperAdmin,
  validate(assignRoleSchema),
  userController.assignRole
);

module.exports = router;
