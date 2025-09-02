import prisma from '../config/database';
import { linkOAuthAccount } from './user.service';
import logger from '../utils/logger.util';

type Provider = 'google' | 'microsoft' | 'github' | 'linkedin';

interface BasicProfile {
  id: string;
  email?: string | null;
  username?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  raw?: unknown;
}

/**
 * @deprecated Use linkOAuthAccount from user.service instead for better security
 * This function is kept for backward compatibility but now uses secure service internally
 */
export async function findOrCreateUserFromOAuth(provider: Provider, profile: BasicProfile) {
  logger.warn(`Using deprecated findOrCreateUserFromOAuth for ${provider}. Consider using linkOAuthAccount instead.`);
  // 1) If oauth account exists -> return its user
  const existingAccount = await prisma.oAuthAccount.findUnique({
    where: {
      unique_provider_account: { provider, provider_id: profile.id }
    }
  });
  if (existingAccount) {
    const user = await prisma.user.findUnique({ where: { id: existingAccount.user_id } });
    if (!user) throw new Error('Linked user not found');
    return user;
  }

  // 2) Try to match by email if present
  let user = profile.email ? await prisma.user.findUnique({ where: { email: profile.email } }) : null;

  // 3) Create user if not found
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: profile.email || `${provider}_${profile.id}@example.local`,
        display_name: profile.displayName || profile.username || null,
        avatar_url: profile.avatarUrl || null,
        status: 'active',
        email_verified: !!profile.email
      }
    });
  }

  // 4) Create oauth account link using secure service
  await linkOAuthAccount(user.id, {
    provider,
    provider_id: profile.id,
    provider_email: profile.email || null,
    provider_username: profile.username || null,
    raw_profile: profile.raw || null,
    bypassAdminCheck: true,  // OAuth flow bypasses admin check
    requireValidation: false // Skip validation for backward compatibility
  });

  return user;
}


