const Joi = require('joi');

/**
 * Schema for updating profile
 */
const updateProfileSchema = Joi.object({
  firstName: Joi.string().trim().min(1).max(100),
  lastName: Joi.string().trim().min(1).max(100),
  phone: Joi.string().trim().pattern(/^\+?[1-9]\d{1,14}$/),
  preferences: Joi.object({
    language: Joi.string().valid('en', 'es', 'fr', 'de', 'it'),
    timezone: Joi.string(),
    dateFormat: Joi.string().valid('DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'),
    currency: Joi.string().length(3).uppercase(),
    notifications: Joi.object({
      email: Joi.boolean(),
      push: Joi.boolean(),
      sms: Joi.boolean(),
    }).unknown(false),
  }).unknown(false),
}).min(1);

/**
 * Schema for changing password
 */
const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).max(128).required()
    .messages({
      'string.min': 'New password must be at least 8 characters long',
      'any.required': 'New password is required',
    }),
});

module.exports = {
  updateProfileSchema,
  changePasswordSchema,
};
