const Joi = require('joi');

/**
 * Validation schema for creating a tenant
 */
const createTenantSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Tenant name is required',
      'string.min': 'Tenant name must be at least 2 characters',
      'string.max': 'Tenant name cannot exceed 100 characters',
    }),

  slug: Joi.string()
    .min(3)
    .max(50)
    .pattern(/^[a-z0-9-]+$/)
    .lowercase()
    .required()
    .messages({
      'string.empty': 'Slug is required',
      'string.pattern.base': 'Slug can only contain lowercase letters, numbers, and hyphens',
      'string.min': 'Slug must be at least 3 characters',
      'string.max': 'Slug cannot exceed 50 characters',
    }),

  domain: Joi.string()
    .pattern(/^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/)
    .lowercase()
    .optional()
    .messages({
      'string.pattern.base': 'Invalid domain format',
    }),

  customDomain: Joi.string()
    .pattern(/^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/)
    .lowercase()
    .optional()
    .messages({
      'string.pattern.base': 'Invalid custom domain format',
    }),

  status: Joi.string()
    .valid('active', 'suspended', 'trial', 'cancelled')
    .optional()
    .messages({
      'any.only': 'Status must be one of: active, suspended, trial, cancelled',
    }),

  subscription: Joi.object({
    plan: Joi.string().valid('free', 'starter', 'professional', 'enterprise').optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    isActive: Joi.boolean().optional(),
    features: Joi.object({
      maxUsers: Joi.number().integer().min(1).optional(),
      maxSuppliers: Joi.number().integer().min(1).optional(),
      maxQueries: Joi.number().integer().min(1).optional(),
      customDomain: Joi.boolean().optional(),
      whiteLabel: Joi.boolean().optional(),
      apiAccess: Joi.boolean().optional(),
    }).optional(),
  }).optional(),

  branding: Joi.object({
    logo: Joi.string().uri().optional().allow(''),
    favicon: Joi.string().uri().optional().allow(''),
    primaryColor: Joi.string()
      .pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
      .optional()
      .messages({
        'string.pattern.base': 'Invalid color hex code',
      }),
    secondaryColor: Joi.string()
      .pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
      .optional()
      .messages({
        'string.pattern.base': 'Invalid color hex code',
      }),
  }).optional(),

  settings: Joi.object({
    timezone: Joi.string().optional(),
    currency: Joi.string().length(3).uppercase().optional(),
    language: Joi.string().length(2).lowercase().optional(),
    dateFormat: Joi.string().optional(),
    emailNotifications: Joi.boolean().optional(),
    smsNotifications: Joi.boolean().optional(),
  }).optional(),

  contact: Joi.object({
    email: Joi.string().email().optional(),
    phone: Joi.string().optional(),
    address: Joi.object({
      street: Joi.string().optional(),
      city: Joi.string().optional(),
      state: Joi.string().optional(),
      country: Joi.string().optional(),
      zipCode: Joi.string().optional(),
    }).optional(),
  }).optional(),

  metadata: Joi.object().optional(),
});

/**
 * Validation schema for updating a tenant
 */
const updateTenantSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Tenant name must be at least 2 characters',
      'string.max': 'Tenant name cannot exceed 100 characters',
    }),

  domain: Joi.string()
    .pattern(/^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/)
    .lowercase()
    .optional()
    .allow(null, '')
    .messages({
      'string.pattern.base': 'Invalid domain format',
    }),

  customDomain: Joi.string()
    .pattern(/^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/)
    .lowercase()
    .optional()
    .allow(null, '')
    .messages({
      'string.pattern.base': 'Invalid custom domain format',
    }),

  status: Joi.string()
    .valid('active', 'suspended', 'trial', 'cancelled')
    .optional()
    .messages({
      'any.only': 'Status must be one of: active, suspended, trial, cancelled',
    }),

  subscription: Joi.object({
    plan: Joi.string().valid('free', 'starter', 'professional', 'enterprise').optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    isActive: Joi.boolean().optional(),
    features: Joi.object({
      maxUsers: Joi.number().integer().min(1).optional(),
      maxSuppliers: Joi.number().integer().min(1).optional(),
      maxQueries: Joi.number().integer().min(1).optional(),
      customDomain: Joi.boolean().optional(),
      whiteLabel: Joi.boolean().optional(),
      apiAccess: Joi.boolean().optional(),
    }).optional(),
  }).optional(),

  branding: Joi.object({
    logo: Joi.string().uri().optional().allow('', null),
    favicon: Joi.string().uri().optional().allow('', null),
    primaryColor: Joi.string()
      .pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
      .optional()
      .messages({
        'string.pattern.base': 'Invalid color hex code',
      }),
    secondaryColor: Joi.string()
      .pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
      .optional()
      .messages({
        'string.pattern.base': 'Invalid color hex code',
      }),
  }).optional(),

  settings: Joi.object({
    timezone: Joi.string().optional(),
    currency: Joi.string().length(3).uppercase().optional(),
    language: Joi.string().length(2).lowercase().optional(),
    dateFormat: Joi.string().optional(),
    emailNotifications: Joi.boolean().optional(),
    smsNotifications: Joi.boolean().optional(),
  }).optional(),

  contact: Joi.object({
    email: Joi.string().email().optional(),
    phone: Joi.string().optional(),
    address: Joi.object({
      street: Joi.string().optional(),
      city: Joi.string().optional(),
      state: Joi.string().optional(),
      country: Joi.string().optional(),
      zipCode: Joi.string().optional(),
    }).optional(),
  }).optional(),

  metadata: Joi.object().optional(),
})
  .min(1)
  .messages({
    'object.min': 'At least one field must be provided for update',
  });

/**
 * Validation schema for updating tenant branding
 */
const updateBrandingSchema = Joi.object({
  logo: Joi.string().uri().optional().allow('', null),
  favicon: Joi.string().uri().optional().allow('', null),
  primaryColor: Joi.string()
    .pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .optional()
    .messages({
      'string.pattern.base': 'Invalid color hex code',
    }),
  secondaryColor: Joi.string()
    .pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .optional()
    .messages({
      'string.pattern.base': 'Invalid color hex code',
    }),
})
  .min(1)
  .messages({
    'object.min': 'At least one branding field must be provided',
  });

/**
 * Validation schema for query parameters
 */
const getTenantQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(20),
  status: Joi.string().valid('active', 'suspended', 'trial', 'cancelled').optional(),
  plan: Joi.string().valid('free', 'starter', 'professional', 'enterprise').optional(),
  search: Joi.string().optional(),
  sortBy: Joi.string().optional().default('-createdAt'),
});

module.exports = {
  createTenantSchema,
  updateTenantSchema,
  updateBrandingSchema,
  getTenantQuerySchema,
};
