import prisma from '../config/database';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import redis from '../config/redis';
import { hashValue } from '../utils/encryption.util';
import { validateProviderAccount } from './oauth-validation.service';
import {
  getUserSessions,
  revokeUserSession,
  revokeAllUserSessions,
} from './session.service';
import logger from '../utils/logger.util';

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
  const { password_hash, ...rest } = user as any;
  return rest;
}

export async function updateProfile(userId: string, data: any) {
  const user = await prisma.user.update({ where: { id: userId }, data });
  const { password_hash, ...rest } = user as any;
  return rest;
}

export async function listSessions(userId: string) {
  return getUserSessions(userId);
}

export async function revokeSession(userId: string, sessionId: string) {
  return revokeUserSession(userId, sessionId);
}

export async function revokeAllSessions(userId: string) {
  return revokeAllUserSessions(userId);
}

export async function listOAuthAccounts(userId: string) {
  return prisma.oAuthAccount.findMany({ where: { user_id: userId } });
}

export async function linkOAuthAccount(
  userId: string,
  payload: {
    provider: string;
    provider_id: string;
    provider_email?: string | null;
    provider_username?: string | null;
    raw_profile?: any;
    access_token?: string;
    requireValidation?: boolean;
    bypassAdminCheck?: boolean;
  }
) {
  // Get user info to check admin status
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw Object.assign(new Error('User not found'), {
      status: 404,
      code: 'USER_NOT_FOUND',
    });
  }

  // Security Check: Only admins can manually link accounts (unless bypassed for OAuth flow)
  if (!payload.bypassAdminCheck && !user.is_admin) {
    logger.warn(
      `Non-admin user ${userId} attempted manual OAuth account linking`,
      {
        userId,
        provider: payload.provider,
        providerId: payload.provider_id,
        userEmail: user.email,
      }
    );
    throw Object.assign(
      new Error('Manual OAuth account linking is restricted to administrators'),
      {
        status: 403,
        code: 'ADMIN_REQUIRED',
      }
    );
  }

  // Check if account already exists
  const existing = await prisma.oAuthAccount.findUnique({
    where: {
      unique_provider_account: {
        provider: payload.provider as any,
        provider_id: payload.provider_id,
      },
    },
  });

  if (existing) {
    if (existing.user_id !== userId) {
      logger.warn(`OAuth account linking conflict`, {
        existingUserId: existing.user_id,
        requestingUserId: userId,
        provider: payload.provider,
        providerId: payload.provider_id,
      });
      throw Object.assign(
        new Error('This OAuth account is already linked to another user'),
        {
          status: 409,
          code: 'ACCOUNT_ALREADY_LINKED',
        }
      );
    }
    return existing;
  }

  // Provider validation (if enabled and not bypassed)
  if (payload.requireValidation !== false) {
    const validationResult = await validateProviderAccount(
      payload.provider as 'google' | 'microsoft' | 'github' | 'linkedin',
      payload.provider_id,
      payload.access_token
    );

    if (!validationResult.isValid) {
      logger.warn(`Failed OAuth provider validation`, {
        userId,
        provider: payload.provider,
        providerId: payload.provider_id,
        error: validationResult.errorMessage,
      });

      // For GitHub (public API), we can be strict
      if (payload.provider === 'github') {
        throw Object.assign(
          new Error(
            `Invalid ${payload.provider} account: ${validationResult.errorMessage}`
          ),
          {
            status: 400,
            code: 'INVALID_PROVIDER_ACCOUNT',
          }
        );
      }

      // For other providers that require tokens, just warn
      logger.warn(
        `Proceeding with unvalidated ${payload.provider} account due to missing access token`
      );
    } else {
      // Update payload with verified information
      if (validationResult.verifiedEmail) {
        payload.provider_email = validationResult.verifiedEmail;
      }
      if (validationResult.verifiedUsername) {
        payload.provider_username = validationResult.verifiedUsername;
      }

      logger.info(`Successfully validated OAuth provider account`, {
        userId,
        provider: payload.provider,
        providerId: payload.provider_id,
        verifiedEmail: validationResult.verifiedEmail,
      });
    }
  }

  // Log the account linking for security audit
  logger.info(`OAuth account linking`, {
    userId,
    userEmail: user.email,
    isAdmin: user.is_admin,
    provider: payload.provider,
    providerId: payload.provider_id,
    providerEmail: payload.provider_email,
    bypassAdminCheck: payload.bypassAdminCheck || false,
    requireValidation: payload.requireValidation !== false,
  });

  // Create the OAuth account link
  return prisma.oAuthAccount.create({
    data: {
      user_id: userId,
      provider: payload.provider as any,
      provider_id: payload.provider_id,
      provider_email: payload.provider_email || null,
      provider_username: payload.provider_username || null,
      raw_profile: payload.raw_profile || null,
    },
  });
}

export async function unlinkOAuthAccount(userId: string, accountId: string) {
  const account = await prisma.oAuthAccount.findFirst({
    where: { id: accountId, user_id: userId },
  });
  if (!account)
    throw Object.assign(new Error('OAuth account not found'), { status: 404 });
  await prisma.oAuthAccount.delete({ where: { id: account.id } });
}

export async function deleteAccount(userId: string) {
  // Revoke all refresh tokens
  await prisma.refreshToken.updateMany({
    where: { user_id: userId, revoked_at: null },
    data: { revoked_at: new Date() },
  });
  // Revoke all access token sessions in Redis
  const setKey = `jwt:user:${userId}:jtis`;
  const all = await redis.smembers(setKey);
  if (all && all.length) {
    const pipeline = redis.pipeline();
    for (const jti of all) pipeline.del(`jwt:session:${jti}`);
    pipeline.del(setKey);
    await pipeline.exec();
  }
  // Soft delete user
  await prisma.user.update({
    where: { id: userId },
    data: {
      status: 'inactive',
      two_factor_enabled: false,
      two_factor_secret: null,
      deleted_at: new Date(),
    },
  });
}

export async function enable2FA(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });

  const secret = speakeasy.generateSecret({
    name: `auth-backend:${user.email || userId}`,
  });
  const otpauth_url = secret.otpauth_url as string;
  const qrcode_data_url = await QRCode.toDataURL(otpauth_url);

  // Generate backup codes for initial setup
  const rawCodes: string[] = [];
  const backupCodeData: { user_id: string; code_hash: string }[] = [];
  for (let i = 0; i < 10; i++) {
    const raw = Math.random().toString(36).slice(2, 10).toUpperCase();
    rawCodes.push(raw);
    const code_hash = await hashValue(raw);
    backupCodeData.push({ user_id: userId, code_hash });
  }

  // Store secret and backup codes (but don't enable 2FA yet; wait until user verifies a code)
  await prisma.user.update({
    where: { id: userId },
    data: { two_factor_secret: secret.base32 },
  });

  // Delete any existing backup codes and create new ones
  await prisma.twoFactorBackupCode.deleteMany({ where: { user_id: userId } });
  await prisma.twoFactorBackupCode.createMany({ data: backupCodeData });

  return {
    secret: secret.base32,
    otpauth_url,
    qrcode_data_url,
    backup_codes: rawCodes,
  };
}

export async function disable2FA(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { two_factor_enabled: false, two_factor_secret: null },
  });
}

export async function verify2FA(userId: string, code: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.two_factor_secret) return false;
  const verified = speakeasy.totp.verify({
    secret: user.two_factor_secret,
    encoding: 'base32',
    token: code,
    window: 1,
  });
  if (verified && !user.two_factor_enabled) {
    await prisma.user.update({
      where: { id: userId },
      data: { two_factor_enabled: true },
    });
  }
  return verified;
}

export async function regenerateBackupCodes(userId: string) {
  // invalidate existing
  await prisma.twoFactorBackupCode.deleteMany({ where: { user_id: userId } });
  // generate 10 codes
  const rawCodes: string[] = [];
  const data: { user_id: string; code_hash: string }[] = [];
  for (let i = 0; i < 10; i++) {
    const raw = Math.random().toString(36).slice(2, 10).toUpperCase();
    rawCodes.push(raw);
    const code_hash = await hashValue(raw);
    data.push({ user_id: userId, code_hash });
  }
  await prisma.twoFactorBackupCode.createMany({ data });
  return rawCodes;
}

// Phone verification functions
export async function sendPhoneVerification(userId: string, phone: string) {
  const SMSService = (await import('./sms.service')).default;

  // Validate phone format
  if (!SMSService.validatePhoneNumber(phone)) {
    throw Object.assign(new Error('Invalid phone number format'), {
      status: 400,
      code: 'INVALID_PHONE_FORMAT',
    });
  }

  const formattedPhone = SMSService.formatPhoneNumber(phone);

  // Check if phone is already verified by another user
  const existingUser = await prisma.user.findFirst({
    where: {
      phone: formattedPhone,
      phone_verified: true,
      id: { not: userId },
    },
  });

  if (existingUser) {
    throw Object.assign(
      new Error('Phone number already verified by another user'),
      {
        status: 409,
        code: 'PHONE_ALREADY_VERIFIED',
      }
    );
  }

  // Send SMS verification code
  await SMSService.sendVerificationCode(formattedPhone, userId);

  // Update user's phone number (unverified)
  await prisma.user.update({
    where: { id: userId },
    data: {
      phone: formattedPhone,
      phone_verified: false,
    },
  });

  return { phone: formattedPhone };
}

export async function verifyPhone(userId: string, code: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { phone: true, phone_verified: true },
  });

  if (!user?.phone) {
    throw Object.assign(new Error('No phone number to verify'), {
      status: 400,
      code: 'NO_PHONE_TO_VERIFY',
    });
  }

  if (user.phone_verified) {
    throw Object.assign(new Error('Phone already verified'), {
      status: 400,
      code: 'PHONE_ALREADY_VERIFIED',
    });
  }

  const SMSService = (await import('./sms.service')).default;
  const isValid = await SMSService.verifyCode(user.phone, code);

  if (!isValid) {
    throw Object.assign(new Error('Invalid or expired verification code'), {
      status: 400,
      code: 'INVALID_VERIFICATION_CODE',
    });
  }

  // Mark phone as verified
  await prisma.user.update({
    where: { id: userId },
    data: { phone_verified: true },
  });

  return { phone: user.phone, verified: true };
}

export async function getUserSecurityInfo(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      failed_login_attempts: true,
      locked_until: true,
      last_login_at: true,
      last_login_ip: true,
      two_factor_enabled: true,
      phone_verified: true,
      email_verified: true,
    },
  });

  if (!user) {
    throw Object.assign(new Error('User not found'), {
      status: 404,
      code: 'USER_NOT_FOUND',
    });
  }

  return {
    failed_login_attempts: user.failed_login_attempts,
    is_locked: user.locked_until ? user.locked_until > new Date() : false,
    locked_until: user.locked_until,
    last_login_at: user.last_login_at,
    last_login_ip: user.last_login_ip,
    two_factor_enabled: user.two_factor_enabled,
    phone_verified: user.phone_verified,
    email_verified: user.email_verified,
  };
}
