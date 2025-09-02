import { Router } from 'express';
import passport from 'passport';
import * as OAuthController from '../controllers/oauth.controller';

const router = Router();

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get('/google/callback', passport.authenticate('google', { session: false }), OAuthController.callback);

// Microsoft OAuth
router.get('/microsoft', passport.authenticate('microsoft', { scope: ['user.read'], session: false }));
router.get('/microsoft/callback', passport.authenticate('microsoft', { session: false }), OAuthController.callback);

// GitHub OAuth
router.get('/github', passport.authenticate('github', { scope: ['user:email'], session: false }));
router.get('/github/callback', passport.authenticate('github', { session: false }), OAuthController.callback);

// LinkedIn OAuth
router.get('/linkedin', passport.authenticate('linkedin', { scope: ['openid', 'profile', 'email'], session: false }));
router.get('/linkedin/callback', passport.authenticate('linkedin', { session: false }), OAuthController.callback);

export default router;


