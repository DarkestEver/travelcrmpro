const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { resolveTenant, resolveOptionalTenant } = require('../middleware/tenant');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  logoutSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require('../validation/authSchemas');

/**
 * Routes
 */

// Public routes (no authentication required, but need tenant context)
router.post('/register', resolveTenant, validate(registerSchema), authController.register);
router.post('/login', resolveOptionalTenant, validate(loginSchema), authController.login); // Optional for super_admin
router.post('/verify-email', validate(verifyEmailSchema), authController.verifyEmail);
router.post('/forgot-password', resolveTenant, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

// Protected routes (authentication required)
router.post('/logout', authenticate, validate(logoutSchema), authController.logout);
router.post('/refresh-token', validate(refreshTokenSchema), authController.refreshToken);

module.exports = router;
