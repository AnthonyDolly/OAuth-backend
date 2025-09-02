import Joi from 'joi';

// Validation for listing users with query parameters
export const listUsersSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string().valid('active', 'inactive', 'suspended', 'pending_verification').optional(),
  q: Joi.string().max(255).optional(),
  email_verified: Joi.boolean().optional(),
  two_factor_enabled: Joi.boolean().optional(),
  from: Joi.date().optional(),
  to: Joi.date().optional()
});

// Validation for getting a specific user
export const getUserSchema = Joi.object({
  userId: Joi.string().uuid().required()
});

// Validation for updating user status
export const updateUserStatusSchema = {
  params: Joi.object({
    userId: Joi.string().uuid().required()
  }),
  body: Joi.object({
    status: Joi.string().valid('active', 'inactive', 'suspended', 'pending_verification').required()
  })
};

// Validation for updating user admin privileges
export const updateUserAdminSchema = {
  params: Joi.object({
    userId: Joi.string().uuid().required()
  }),
  body: Joi.object({
    is_admin: Joi.boolean().required()
  })
};

// Validation for listing audit logs with query parameters
export const listAuditLogsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(200).default(50),
  userId: Joi.string().uuid().optional(),
  action: Joi.string().max(100).optional(),
  success: Joi.boolean().optional(),
  from: Joi.date().optional(),
  to: Joi.date().optional()
});
