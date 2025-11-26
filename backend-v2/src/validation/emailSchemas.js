const Joi = require('joi');

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

/**
 * Template variable schema
 */
const templateVariableSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow(''),
  required: Joi.boolean().default(false),
  defaultValue: Joi.string().allow(''),
});

/**
 * Create template schema
 */
const createTemplateSchema = Joi.object({
  name: Joi.string().trim().max(200).required(),
  slug: Joi.string().trim().lowercase().pattern(/^[a-z0-9-]+$/),
  category: Joi.string()
    .valid('booking', 'payment', 'itinerary', 'reminder', 'notification', 'marketing', 'other')
    .default('other'),
  subject: Joi.string().required(),
  htmlContent: Joi.string().required(),
  textContent: Joi.string().allow(''),
  variables: Joi.array().items(templateVariableSchema).default([]),
  isActive: Joi.boolean().default(true),
});

/**
 * Update template schema
 */
const updateTemplateSchema = Joi.object({
  name: Joi.string().trim().max(200),
  category: Joi.string()
    .valid('booking', 'payment', 'itinerary', 'reminder', 'notification', 'marketing', 'other'),
  subject: Joi.string(),
  htmlContent: Joi.string(),
  textContent: Joi.string().allow(''),
  variables: Joi.array().items(templateVariableSchema),
  isActive: Joi.boolean(),
}).min(1);

/**
 * Send email schema
 */
const sendEmailSchema = Joi.object({
  templateId: Joi.string().pattern(objectIdPattern).required(),
  to: Joi.string().email().required(),
  cc: Joi.array().items(Joi.string().email()).default([]),
  bcc: Joi.array().items(Joi.string().email()).default([]),
  variables: Joi.object().default({}),
  relatedTo: Joi.object({
    model: Joi.string().valid('Booking', 'Lead', 'Itinerary', 'Payment', 'User'),
    id: Joi.string().pattern(objectIdPattern),
  }),
});

module.exports = {
  createTemplateSchema,
  updateTemplateSchema,
  sendEmailSchema,
};
