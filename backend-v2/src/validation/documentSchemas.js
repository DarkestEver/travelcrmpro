const Joi = require('joi');

/**
 * Document validation schemas
 */

const uploadDocumentSchema = Joi.object({
  documentType: Joi.string()
    .valid(
      'passport',
      'visa',
      'pan_card',
      'aadhar_card',
      'driving_license',
      'photo',
      'vaccination_certificate',
      'insurance',
      'flight_ticket',
      'hotel_voucher',
      'other'
    )
    .required(),
  documentNumber: Joi.string().max(100).optional(),
  issueDate: Joi.date().max('now').optional(),
  expiryDate: Joi.date().greater(Joi.ref('issueDate')).optional(),
  issuedBy: Joi.string().max(200).optional(),
  issuedCountry: Joi.string().max(100).optional(),
  bookingId: Joi.string().optional(),
  notes: Joi.string().max(1000).optional(),
  // File info (normally from multer, but accepting in body for testing)
  fileUrl: Joi.string().uri().required(),
  fileName: Joi.string().required(),
  fileSize: Joi.number().max(10485760).optional(), // 10MB max
  mimeType: Joi.string().valid(
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png'
  ).optional(),
});

const updateDocumentSchema = Joi.object({
  documentNumber: Joi.string().max(100).optional(),
  issueDate: Joi.date().max('now').optional(),
  expiryDate: Joi.date().optional(),
  issuedBy: Joi.string().max(200).optional(),
  issuedCountry: Joi.string().max(100).optional(),
  notes: Joi.string().max(1000).optional(),
});

const verifyDocumentSchema = Joi.object({
  notes: Joi.string().max(1000).optional(),
});

const rejectDocumentSchema = Joi.object({
  reason: Joi.string().max(500).required(),
});

const shareDocumentSchema = Joi.object({
  userId: Joi.string().required(),
  permissions: Joi.string().valid('view', 'edit', 'admin').default('view'),
  expiresAt: Joi.date().greater('now').optional(),
});

const getDocumentsByTypeSchema = Joi.object({
  documentType: Joi.string()
    .valid(
      'passport',
      'visa',
      'pan_card',
      'aadhar_card',
      'driving_license',
      'photo',
      'vaccination_certificate',
      'insurance',
      'flight_ticket',
      'hotel_voucher',
      'other'
    )
    .required(),
});

const getAllDocumentsSchema = Joi.object({
  documentType: Joi.string()
    .valid(
      'passport',
      'visa',
      'pan_card',
      'aadhar_card',
      'driving_license',
      'photo',
      'vaccination_certificate',
      'insurance',
      'flight_ticket',
      'hotel_voucher',
      'other'
    )
    .optional(),
  verificationStatus: Joi.string().valid('pending', 'in_review', 'verified', 'rejected', 'expired').optional(),
  customer: Joi.string().optional(),
  bookingId: Joi.string().optional(),
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(20),
});

const getPendingVerificationSchema = Joi.object({
  documentType: Joi.string()
    .valid(
      'passport',
      'visa',
      'pan_card',
      'aadhar_card',
      'driving_license',
      'photo',
      'vaccination_certificate',
      'insurance',
      'flight_ticket',
      'hotel_voucher',
      'other'
    )
    .optional(),
  customer: Joi.string().optional(),
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(20),
});

const getExpiringDocumentsSchema = Joi.object({
  days: Joi.number().min(1).max(365).default(90),
});

module.exports = {
  uploadDocumentSchema,
  updateDocumentSchema,
  verifyDocumentSchema,
  rejectDocumentSchema,
  shareDocumentSchema,
  getDocumentsByTypeSchema,
  getAllDocumentsSchema,
  getPendingVerificationSchema,
  getExpiringDocumentsSchema,
};
