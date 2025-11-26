const Joi = require('joi');
const { USER_ROLES, USER_STATUS } = require('../config/constants');

/**
 * Query schema for getting users list
 */
const getUsersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  role: Joi.string().valid(...Object.values(USER_ROLES)),
  status: Joi.string().valid(...Object.values(USER_STATUS)),
  search: Joi.string().min(1).max(100),
  sortBy: Joi.string().valid(
    'firstName',
    '-firstName',
    'lastName',
    '-lastName',
    'email',
    '-email',
    'createdAt',
    '-createdAt',
    'lastLogin',
    '-lastLogin'
  ),
});

/**
 * Schema for updating user
 */
const updateUserSchema = Joi.object({
  firstName: Joi.string().min(2).max(50),
  lastName: Joi.string().min(2).max(50),
  phone: Joi.string().min(10).max(20),
  avatar: Joi.string().uri(),
  status: Joi.string().valid(...Object.values(USER_STATUS)),
  role: Joi.string().valid(...Object.values(USER_ROLES)),
  agentCode: Joi.string().min(3).max(20),
  commission: Joi.object({
    percentage: Joi.number().min(0).max(100),
    type: Joi.string().valid('flat', 'percentage'),
  }),
  assignedAgent: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
  preferences: Joi.object({
    language: Joi.string().min(2).max(10),
    timezone: Joi.string().min(2).max(50),
    currency: Joi.string().min(3).max(3),
    notifications: Joi.object({
      email: Joi.boolean(),
      push: Joi.boolean(),
      sms: Joi.boolean(),
    }),
  }),
}).min(1);

/**
 * Schema for assigning role
 */
const assignRoleSchema = Joi.object({
  role: Joi.string()
    .valid(...Object.values(USER_ROLES))
    .required(),
});

module.exports = {
  getUsersQuerySchema,
  updateUserSchema,
  assignRoleSchema,
};
