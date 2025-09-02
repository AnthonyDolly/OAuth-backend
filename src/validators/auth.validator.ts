import Joi from 'joi';

export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required()
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  code: Joi.string().length(6).pattern(/^[0-9]{6}$/).optional(),
  backup_code: Joi.string().min(6).max(64).optional()
});

export const refreshSchema = Joi.object({
  refresh_token: Joi.string().required()
});

export const verifyEmailSchema = Joi.object({
  token: Joi.string().required()
});

export const resendVerificationSchema = Joi.object({
  email: Joi.string().email().required()
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required()
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  new_password: Joi.string().min(8).max(128).required()
});

export const changePasswordSchema = Joi.object({
  current_password: Joi.string().required(),
  new_password: Joi.string().min(8).max(128).required()
});


