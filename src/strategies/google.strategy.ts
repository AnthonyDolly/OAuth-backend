import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import config from '../config/env';
import prisma from '../config/database';
import { linkOAuthAccount } from '../services/user.service';

passport.use(
  'google',
  new GoogleStrategy(
    {
      clientID: config.oauth.google.clientId,
      clientSecret: config.oauth.google.clientSecret,
      callbackURL: config.oauth.google.callbackUrl,
    },
    async (
      _accessToken: string,
      _refreshToken: string,
      profile: Profile,
      done
    ) => {
      try {
        const provider_id = profile.id;
        const provider_email = profile.emails?.[0]?.value || null;
        const existing = await prisma.oAuthAccount.findUnique({
          where: {
            unique_provider_account: { provider: 'google', provider_id },
          },
        });
        if (existing) {
          const user = await prisma.user.findUnique({
            where: { id: existing.user_id },
          });
          return done(null, user || false);
        }
        let user = provider_email
          ? await prisma.user.findUnique({ where: { email: provider_email } })
          : null;
        if (!user) {
          user = await prisma.user.create({
            data: {
              email: provider_email || `google_${provider_id}@example.local`,
              display_name: profile.displayName || null,
              status: 'active',
              email_verified: !!provider_email,
            },
          });
        }
        await linkOAuthAccount(user.id, {
          provider: 'google',
          provider_id,
          provider_email,
          provider_username: profile.username || null,
          raw_profile: profile as any,
          access_token: _accessToken,
          bypassAdminCheck: true, // OAuth flow bypasses admin check
          requireValidation: true  // But still validates with Google API
        });
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

export default passport;
