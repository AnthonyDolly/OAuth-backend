import passport from 'passport';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const MicrosoftStrategy = require('passport-microsoft').Strategy as any;
import config from '../config/env';
import prisma from '../config/database';
import { linkOAuthAccount } from '../services/user.service';

passport.use(
  'microsoft',
  new MicrosoftStrategy(
    {
      clientID: config.oauth.microsoft.clientId,
      clientSecret: config.oauth.microsoft.clientSecret,
      callbackURL: config.oauth.microsoft.callbackUrl,
      tenant: config.oauth.microsoft.tenantId
    },
    async (accessToken: string, _refreshToken: string, profile: any, done: any) => {
      try {
        const provider_id = profile.id;
        const provider_email = Array.isArray(profile.emails) ? profile.emails[0]?.value : profile._json?.userPrincipalName;
        
        // Check if OAuth account already exists
        const existing = await prisma.oAuthAccount.findUnique({
          where: {
            unique_provider_account: { provider: 'microsoft', provider_id },
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
              email: provider_email || `microsoft_${provider_id}@example.local`,
              display_name: profile.displayName || null,
              status: 'active',
              email_verified: !!provider_email,
            },
          });
        }
        
        // Link OAuth account using secure service
        await linkOAuthAccount(user.id, {
          provider: 'microsoft',
          provider_id,
          provider_email,
          provider_username: profile.username || null,
          raw_profile: profile as any,
          access_token: accessToken,
          bypassAdminCheck: true, // OAuth flow bypasses admin check
          requireValidation: true  // Validates with Microsoft API using access token
        });
        
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

export default passport;


