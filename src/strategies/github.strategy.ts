import passport from 'passport';
import { Strategy as GitHubStrategy, Profile } from 'passport-github2';
import { VerifyCallback } from 'passport-oauth2';
import config from '../config/env';
import prisma from '../config/database';
import { linkOAuthAccount } from '../services/user.service';

passport.use(
  'github',
  new GitHubStrategy(
    {
      clientID: config.oauth.github.clientId,
      clientSecret: config.oauth.github.clientSecret,
      callbackURL: config.oauth.github.callbackUrl
    },
    async (accessToken: string, _refreshToken: string, profile: Profile, done: VerifyCallback) => {
      try {
        const provider_id = profile.id;
        const provider_email = (profile.emails && profile.emails[0]?.value) || null;
        
        // Check if OAuth account already exists
        const existing = await prisma.oAuthAccount.findUnique({
          where: {
            unique_provider_account: { provider: 'github', provider_id },
          },
        });
        
        if (existing) {
          const user = await prisma.user.findUnique({
            where: { id: existing.user_id },
          });
          return done(null, user || false);
        }
        
        // Try to find user by email if available
        let user = provider_email
          ? await prisma.user.findUnique({ where: { email: provider_email } })
          : null;
          
        // Create new user if not found
        if (!user) {
          user = await prisma.user.create({
            data: {
              email: provider_email || `github_${provider_id}@example.local`,
              display_name: profile.displayName || profile.username || null,
              avatar_url: (profile.photos && profile.photos[0]?.value) || null,
              status: 'active',
              email_verified: !!provider_email,
            },
          });
        }
        
        // Link OAuth account using secure service  
        await linkOAuthAccount(user.id, {
          provider: 'github',
          provider_id,
          provider_email,
          provider_username: profile.username || null,
          raw_profile: profile as any,
          access_token: accessToken,
          bypassAdminCheck: true, // OAuth flow bypasses admin check
          requireValidation: true  // Validates with GitHub API (public API)
        });
        
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

export default passport;


