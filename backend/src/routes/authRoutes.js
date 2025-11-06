const express = require('express');
const router = express.Router();
const {
  register,
  login,
  logout,
  refreshToken,
  verifyEmail,
  forgotPassword,
  resetPassword,
  changePassword,
  getMe,
  updateMe,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const { auditLogger } = require('../middleware/auditLogger');
const {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
  updateProfileValidation,
} = require('../validations/authValidation');

// Public routes
router.post('/register', registerValidation, validate, auditLogger('create', 'user'), register);
router.post('/login', loginValidation, validate, auditLogger('login', 'user'), login);
router.post('/refresh', refreshToken);
router.post('/refresh-token', refreshToken); // Alias for compatibility
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password', forgotPasswordValidation, validate, forgotPassword);
router.post('/reset-password/:token', resetPasswordValidation, validate, auditLogger('update', 'user'), resetPassword);

// Protected routes
router.use(protect);
router.post('/logout', auditLogger('logout', 'user'), logout);
router.post('/change-password', changePasswordValidation, validate, auditLogger('update', 'user'), changePassword);
router.put('/change-password', changePasswordValidation, validate, auditLogger('update', 'user'), changePassword);
router.get('/me', getMe);
router.put('/me', updateProfileValidation, validate, auditLogger('update', 'user'), updateMe);

module.exports = router;
