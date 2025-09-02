import { Router } from 'express';
import { validate } from '../middleware/validation.middleware';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema
} from '../validators/auth.validator';
import * as AuthController from '../controllers/auth.controller';
import { ensureAuth } from '../middleware/auth.middleware';
import { authRateLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

router.post('/register', authRateLimiter, validate(registerSchema), AuthController.register);
router.post('/login', authRateLimiter, validate(loginSchema), AuthController.login);
router.post('/refresh', authRateLimiter, validate(refreshSchema), AuthController.refresh);
router.post('/logout', ensureAuth, AuthController.logout);
router.post('/verify-email', validate(verifyEmailSchema), AuthController.verifyEmail);
router.post('/resend-verification', validate(resendVerificationSchema), AuthController.resendVerification);
router.post('/forgot-password', validate(forgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), AuthController.resetPassword);
router.post('/change-password', ensureAuth, validate(changePasswordSchema), AuthController.changePassword);

export default router;


