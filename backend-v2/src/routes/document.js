const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const { validate, validateQuery, validateParams } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');
const { checkRole } = require('../middleware/rbac');
const { USER_ROLES } = require('../config/constants');
const {
  uploadDocumentSchema,
  updateDocumentSchema,
  verifyDocumentSchema,
  rejectDocumentSchema,
  shareDocumentSchema,
  getAllDocumentsSchema,
  getPendingVerificationSchema,
  getExpiringDocumentsSchema,
  getDocumentsByTypeSchema,
} = require('../validation/documentSchemas');

// Apply authentication to all document routes
router.use(authenticate);

/**
 * Customer document routes (upload, update, delete, share)
 */
router.post(
  '/upload',
  checkRole(USER_ROLES.CUSTOMER),
  validate(uploadDocumentSchema),
  documentController.uploadDocument
);

router.patch(
  '/:id',
  checkRole(USER_ROLES.CUSTOMER),
  validate(updateDocumentSchema),
  documentController.updateDocument
);

router.delete(
  '/:id',
  checkRole(USER_ROLES.CUSTOMER),
  documentController.deleteDocument
);

router.get(
  '/type/:documentType',
  checkRole(USER_ROLES.CUSTOMER, USER_ROLES.AGENT, USER_ROLES.OPERATOR, USER_ROLES.TENANT_ADMIN),
  documentController.getDocumentsByType
);

router.post(
  '/:id/share',
  checkRole(USER_ROLES.CUSTOMER),
  validate(shareDocumentSchema),
  documentController.shareDocument
);

router.delete(
  '/:id/share/:userId',
  checkRole(USER_ROLES.CUSTOMER),
  documentController.revokeDocumentShare
);

/**
 * Agent/Admin document routes (verification, management)
 */
router.get(
  '/',
  checkRole(USER_ROLES.AGENT, USER_ROLES.OPERATOR, USER_ROLES.TENANT_ADMIN),
  validateQuery(getAllDocumentsSchema),
  documentController.getAllDocuments
);

router.get(
  '/pending-verification',
  checkRole(USER_ROLES.AGENT, USER_ROLES.OPERATOR, USER_ROLES.TENANT_ADMIN),
  validateQuery(getPendingVerificationSchema),
  documentController.getPendingVerification
);

router.get(
  '/expiring',
  checkRole(USER_ROLES.AGENT, USER_ROLES.OPERATOR, USER_ROLES.TENANT_ADMIN),
  validateQuery(getExpiringDocumentsSchema),
  documentController.getExpiringDocuments
);

router.get(
  '/shared-with-me',
  checkRole(USER_ROLES.AGENT, USER_ROLES.OPERATOR, USER_ROLES.TENANT_ADMIN),
  documentController.getSharedDocuments
);

router.post(
  '/:id/verify',
  checkRole(USER_ROLES.AGENT, USER_ROLES.OPERATOR, USER_ROLES.TENANT_ADMIN),
  validate(verifyDocumentSchema),
  documentController.verifyDocument
);

router.post(
  '/:id/reject',
  checkRole(USER_ROLES.AGENT, USER_ROLES.OPERATOR, USER_ROLES.TENANT_ADMIN),
  validate(rejectDocumentSchema),
  documentController.rejectDocument
);

// This must be last to avoid matching specific routes above
router.get(
  '/:id',
  checkRole(USER_ROLES.CUSTOMER, USER_ROLES.AGENT, USER_ROLES.OPERATOR, USER_ROLES.TENANT_ADMIN),
  documentController.getDocumentById
);

module.exports = router;
