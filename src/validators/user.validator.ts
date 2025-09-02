import Joi from 'joi';

// TODO: add phone validation
export const updateProfileSchema = Joi.object({
  first_name: Joi.string().max(100).allow(null, ''),
  last_name: Joi.string().max(100).allow(null, ''),
  display_name: Joi.string().max(200).allow(null, ''),
  avatar_url: Joi.string().uri().allow(null, ''),
  phone: Joi.string().max(20).allow(null, ''),
  date_of_birth: Joi.date().iso().allow(null),
  gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say').allow(null, ''),
  locale: Joi.string().max(10).allow(null, ''),
  timezone: Joi.string().max(50).allow(null, '')
}).min(1);

export const linkOAuthSchema = Joi.object({
  provider: Joi.string().valid('google', 'microsoft', 'github', 'linkedin').required(),
  provider_id: Joi.string().required(),
  provider_email: Joi.string().email().allow(null, ''),
  provider_username: Joi.string().allow(null, ''),
  raw_profile: Joi.any(),
  access_token: Joi.string().allow(null, '').optional(),
  requireValidation: Joi.boolean().default(true).optional()
});

export const phoneVerificationSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^\+?[1-9]\d{9,14}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone number must be in international format (+1234567890)',
    }),
});

export const verifyPhoneSchema = Joi.object({
  code: Joi.string()
    .length(6)
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      'string.length': 'Verification code must be 6 digits',
      'string.pattern.base': 'Verification code must contain only numbers',
    }),
});


