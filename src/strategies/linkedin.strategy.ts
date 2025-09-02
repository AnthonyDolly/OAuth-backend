import passport from 'passport';
import {
  Strategy as OAuth2Strategy,
  StrategyOptionsWithRequest,
} from 'passport-oauth2';
import config from '../config/env';
import prisma from '../config/database';
import { linkOAuthAccount } from '../services/user.service';

const LINKEDIN_CLIENT_ID = config.oauth.linkedin.clientId;
const LINKEDIN_CLIENT_SECRET = config.oauth.linkedin.clientSecret;
const LINKEDIN_CALLBACK_URL = config.oauth.linkedin.callbackUrl;
const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';

if (LINKEDIN_CLIENT_ID && LINKEDIN_CLIENT_SECRET) {
  const options: StrategyOptionsWithRequest = {
    authorizationURL: LINKEDIN_AUTH_URL,
    tokenURL: LINKEDIN_TOKEN_URL,
    clientID: LINKEDIN_CLIENT_ID,
    clientSecret: LINKEDIN_CLIENT_SECRET,
    callbackURL: LINKEDIN_CALLBACK_URL,
    scope: ['openid', 'profile', 'email'],
    passReqToCallback: true,
    // We will load userinfo manually
    skipUserProfile: true as unknown as boolean,
  } as any;

  const strategy = new OAuth2Strategy(
    options,
    async (
      req: any,
      accessToken: string,
      refreshToken: string,
      _params: any,
      _profile: any,
      done: (err: any, user?: any) => void
    ) => {
      try {
        // Fetch OIDC userinfo from LinkedIn
        const resp = await fetch('https://api.linkedin.com/v2/userinfo', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'LinkedIn-Version': '202405',
            'X-Restli-Protocol-Version': '2.0.0',
          },
        });
        
        if (!resp.ok) {
          const text = await resp.text().catch(() => '');
          return done(
            new Error(`LinkedIn userinfo error: ${resp.status} ${text}`)
          );
        }
        
        const userinfo: any = await resp.json();
        const provider_id = userinfo.sub;
        const provider_email = userinfo.email || (userinfo.email_verified ? userinfo.email : null);
        const displayName = userinfo.name || null;
        const avatarUrl = userinfo.picture || null;

        // Check if OAuth account already exists
        const existing = await prisma.oAuthAccount.findUnique({
          where: {
            unique_provider_account: { provider: 'linkedin', provider_id },
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
              email: provider_email || `linkedin_${provider_id}@example.local`,
              display_name: displayName,
              status: 'active',
              email_verified: !!provider_email,
            },
          });
        }

        // Link OAuth account to user using secure service
        await linkOAuthAccount(user.id, {
          provider: 'linkedin',
          provider_id,
          provider_email,
          provider_username: null,
          raw_profile: userinfo as any,
          access_token: accessToken,
          bypassAdminCheck: true, // OAuth flow bypasses admin check
          requireValidation: true  // Validates with LinkedIn API using access token
        });
        
        return done(null, user);
      } catch (err) {
        return done(err as any);
      }
    }
  );

  // Name the strategy 'linkedin' to keep routes working
  (strategy as any).name = 'linkedin';
  passport.use('linkedin', strategy);
}

export default passport;


