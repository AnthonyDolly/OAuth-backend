import { Router } from 'express';
import { ensureAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { updateProfileSchema, linkOAuthSchema, phoneVerificationSchema, verifyPhoneSchema } from '../validators/user.validator';
import * as UserController from '../controllers/user.controller';

const router = Router();

router.get('/profile', ensureAuth, UserController.getProfile);
router.put('/profile', ensureAuth, validate(updateProfileSchema), UserController.updateProfile);
router.delete('/profile', ensureAuth, UserController.deleteAccount);
router.get('/sessions', ensureAuth, UserController.listSessions);
router.delete('/sessions/:sessionId', ensureAuth, UserController.revokeSession);
router.delete('/sessions', ensureAuth, UserController.revokeAllSessions);

// OAuth endpoints
router.get('/oauth-accounts', ensureAuth, UserController.listOAuthAccounts);
router.post('/oauth-accounts/link', ensureAuth, validate(linkOAuthSchema), UserController.linkOAuthAccount);
router.delete('/oauth-accounts/:accountId', ensureAuth, UserController.unlinkOAuthAccount);

// 2FA endpoints (TOTP)
router.post('/enable-2fa', ensureAuth, UserController.enable2FA);
router.post('/disable-2fa', ensureAuth, UserController.disable2FA);
router.post('/verify-2fa', ensureAuth, UserController.verify2FA);
router.post('/backup-codes/regenerate', ensureAuth, UserController.generateBackupCodes);

// Phone verification endpoints
router.post('/send-phone-verification', ensureAuth, validate(phoneVerificationSchema), UserController.sendPhoneVerification);
router.post('/verify-phone', ensureAuth, validate(verifyPhoneSchema), UserController.verifyPhone);

// Security information endpoint
router.get('/security-info', ensureAuth, UserController.getSecurityInfo);

export default router;


