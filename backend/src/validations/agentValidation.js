const { body, param } = require('express-validator');

const createAgentValidation = [
  body('userId').isMongoId().withMessage('Valid user ID is required'),
  body('agencyName').trim().notEmpty().withMessage('Agency name is required').isLength({ max: 200 }),
  body('contactPerson').trim().notEmpty().withMessage('Contact person is required'),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('address.street').optional().trim(),
  body('address.city').optional().trim(),
  body('address.state').optional().trim(),
  body('address.country').optional().trim(),
  body('address.zipCode').optional().trim(),
  body('creditLimit').optional().isNumeric().withMessage('Credit limit must be a number'),
  body('tier').optional().isIn(['standard', 'silver', 'gold', 'platinum']),
];

const updateAgentValidation = [
  param('id').isMongoId().withMessage('Valid agent ID is required'),
  body('contactPerson').optional().trim(),
  body('phone').optional().trim(),
  body('address').optional(),
  body('creditLimit').optional().isNumeric(),
  body('tier').optional().isIn(['standard', 'silver', 'gold', 'platinum']),
];

const approveAgentValidation = [
  param('id').isMongoId().withMessage('Valid agent ID is required'),
  body('creditLimit').isNumeric().withMessage('Credit limit is required'),
  body('tier').optional().isIn(['standard', 'silver', 'gold', 'platinum']),
];

module.exports = {
  createAgentValidation,
  updateAgentValidation,
  approveAgentValidation,
};
