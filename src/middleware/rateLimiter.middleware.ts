import rateLimit from 'express-rate-limit';
import config from '../config/env';

export const generalRateLimiter = rateLimit({
  windowMs: config.security.rateLimit.windowMs,
  max: config.security.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false
});

export const authRateLimiter = rateLimit({
  windowMs: config.security.rateLimit.authWindowMs,
  max: config.security.rateLimit.authMaxRequests,
  standardHeaders: true,
  legacyHeaders: false
});


