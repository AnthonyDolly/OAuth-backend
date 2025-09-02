import prisma from '../config/database';
import { hashPassword, verifyPassword } from '../utils/encryption.util';
import {
  generateTokens,
  revokeAllUserRefreshTokens,
  rotateRefreshToken,
} from './token.service';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import redis from '../config/redis';
import speakeasy from 'speakeasy';
import { verifyAccessToken } from '../config/jwt';
import logger from '../utils/logger.util';
import {
  buildVerificationEmail,
  buildResetPasswordEmail,
  sendEmail,
} from './email.service';
import { createUserSession } from './session.service';
import config from '../config/env';

const requireVerification = config.features.emailVerificationRequired;

export async function register(email: string, password: string, ipAddress?: string, userAgent?: string) {
  const password_hash = await hashPassword(password);
  const email_verification_token = uuidv4();

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser)
    throw Object.assign(new Error('Email already in use'), {
      status: 409,
      code: 'EMAIL_TAKEN',
    });

  const user = await prisma.user.create({
    data: {
      email,
      password_hash,
      status: 'pending_verification',
      email_verified: false,
      email_verification_token,
    },
  });

  if (requireVerification) {
    const verifyUrl = `${config.frontend.emailVerificationUrl}?token=${email_verification_token}`;
    void sendEmail(
      user.email,
      'Verifica tu email',
      buildVerificationEmail(verifyUrl)
    ).catch(() => {});
    return { user }; // sin tokens
  }

  const { accessToken, refreshToken } = await generateTokens(
    {
      id: user.id,
      email: user.email,
    },
    {
      ipAddress,
      userAgent,
      deviceInfo: userAgent ? { userAgent } : null
    }
  );

  // Create user session for tracking (only when returning tokens)
  const sessionInfo = await createUserSession({
    userId: user.id,
    ipAddress,
    userAgent
  });

  return { user, accessToken, refreshToken, sessionInfo };
}

export async function login(
  email: string,
  password: string,
  ipAddress?: string,
  code?: string,
  backupCode?: string,
  userAgent?: string
) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.password_hash)
    throw Object.assign(new Error('Invalid credentials'), {
      status: 401,
      code: 'INVALID_CREDENTIALS',
    });

  // Check if account is locked
  if (user.locked_until && user.locked_until > new Date()) {
    const remainingTime = Math.ceil(
      (user.locked_until.getTime() - Date.now()) / 60000
    );
    throw Object.assign(
      new Error(`Account locked. Try again in ${remainingTime} minutes`),
      {
        status: 423,
        code: 'ACCOUNT_LOCKED',
        remainingTime,
      }
    );
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    // Increment failed attempts
    await incrementFailedLoginAttempts(user.id, user.failed_login_attempts, user.locked_until);
    throw Object.assign(new Error('Invalid credentials'), {
      status: 401,
      code: 'INVALID_CREDENTIALS',
    });
  }

  if (requireVerification) {
    if (user.status === 'pending_verification')
      throw Object.assign(new Error('Email not verified'), {
        status: 403,
        code: 'NEEDS_EMAIL_VERIFICATION',
      });
  }

  if (user.status === 'suspended' || user.status === 'inactive') {
    throw Object.assign(new Error('Account suspended'), {
      status: 403,
      code: 'ACCOUNT_SUSPENDED',
    });
  }

  // If 2FA enabled, must provide TOTP code or valid backup code
  if (user.two_factor_enabled) {
    let passed2fa = false;
    if (code && user.two_factor_secret) {
      passed2fa = speakeasy.totp.verify({
        secret: user.two_factor_secret,
        encoding: 'base32',
        token: code,
        window: 1,
      });
    }
    if (!passed2fa && backupCode) {
      const codes = await prisma.twoFactorBackupCode.findMany({
        where: { user_id: user.id, used_at: null },
      });
      for (const c of codes) {
        const ok = await verifyPassword(backupCode, c.code_hash);
        if (ok) {
          await prisma.twoFactorBackupCode.update({
            where: { id: c.id },
            data: { used_at: new Date() },
          });
          passed2fa = true;
          break;
        }
      }
    }
    if (!passed2fa) {
      // Increment failed attempts for 2FA failure as well
      await incrementFailedLoginAttempts(user.id, user.failed_login_attempts, user.locked_until);
      throw Object.assign(new Error('Two-factor code required'), {
        status: 401,
        code: 'TOTP_REQUIRED',
      });
    }
  }

  // Successful login - update tracking fields and reset failed attempts
  await prisma.user.update({
    where: { id: user.id },
    data: {
      last_login_at: new Date(),
      last_login_ip: ipAddress || null,
      failed_login_attempts: 0,
      locked_until: null,
    },
  });

  const { accessToken, refreshToken } = await generateTokens(
    {
      id: user.id,
      email: user.email,
    },
    {
      ipAddress,
      userAgent,
      deviceInfo: userAgent ? { userAgent } : null
    }
  );

  // Create user session for tracking
  const sessionInfo = await createUserSession({
    userId: user.id,
    ipAddress,
    userAgent
  });

  return { user, accessToken, refreshToken, sessionInfo };
}

async function incrementFailedLoginAttempts(
  userId: string,
  currentAttempts: number,
  currentLockedUntil?: Date | null
) {
  const now = new Date();
  const maxAttempts = config.security.maxLoginAttempts;

  // Check if user is currently locked
  if (currentLockedUntil && currentLockedUntil > now) {
    // User is still locked, don't increment attempts
    logger.warn(`Failed login attempt for locked user ${userId}`, {
      userId,
      lockedUntil: currentLockedUntil,
      remainingTime: Math.ceil((currentLockedUntil.getTime() - now.getTime()) / 60000)
    });
    return;
  }

  // Determine new attempts count and update data
  let newAttempts: number;
  let updateData: any = {};

  if (currentLockedUntil && currentLockedUntil <= now) {
    // Lockout period has expired, clear lockout and RESET attempts to 1
    updateData.locked_until = null; // Clear expired lockout
    newAttempts = 1; // Reset to 1 for first failed attempt after lockout
    logger.info(`Lockout period expired for user ${userId}, clearing lockout and resetting attempts to 1`, {
      userId,
      previousAttempts: currentAttempts,
      newAttempts,
      lockoutExpiredAt: currentLockedUntil
    });
  } else {
    // Normal increment
    newAttempts = currentAttempts + 1;
  }

  updateData.failed_login_attempts = newAttempts;

  // Lock account if max attempts reached
  if (newAttempts >= maxAttempts) {
    const lockoutDuration = config.security.lockoutDurationMinutes * 60 * 1000; // Convert to milliseconds
    updateData.locked_until = new Date(Date.now() + lockoutDuration);

    logger.warn(`Account locked for user ${userId} after ${newAttempts} failed attempts`, {
      userId,
      failedAttempts: newAttempts,
      lockoutDuration: config.security.lockoutDurationMinutes,
      lockedUntil: updateData.locked_until
    });
  }

  await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });
}

export async function refresh(refreshToken: string) {
  return rotateRefreshToken(refreshToken);
}

export async function logout(userId: string, refreshToken?: string) {
  if (refreshToken) {
    await revokeAllUserRefreshTokens(userId);
  }
  // Attempt to revoke current access token session via jti from Authorization header set in controller layer
}

export async function revokeCurrentAccessSession(
  userId: string,
  bearerToken?: string,
  revokeAll?: boolean
) {
  try {
    if (revokeAll) {
      const key = `jwt:user:${userId}:jtis`;
      const all = await redis.smembers(key);
      if (all && all.length) {
        const pipeline = redis.pipeline();
        for (const jti of all) pipeline.del(`jwt:session:${jti}`);
        pipeline.del(key);
        await pipeline.exec();
      }
      return;
    }
    if (!bearerToken) return;
    const payload = verifyAccessToken(bearerToken);
    if (!payload.jti) return;
    await redis.del(`jwt:session:${payload.jti}`);
    await redis.srem(`jwt:user:${userId}:jtis`, payload.jti);
  } catch {
    // ignore revocation errors
  }
}

export async function verifyEmail(token: string) {
  const user = await prisma.user.findFirst({
    where: { email_verification_token: token },
  });
  if (!user)
    throw Object.assign(new Error('Invalid token'), {
      status: 400,
      code: 'INVALID_TOKEN',
    });
  await prisma.user.update({
    where: { id: user.id },
    data: {
      email_verified: true,
      status: 'active',
      email_verification_token: null,
      email_verification_expires_at: null,
    },
  });
  return true;
}

export async function resendVerification(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw Object.assign(new Error('Invalid email'), {
      status: 400,
      code: 'INVALID_EMAIL',
    });
  }
  if (user.email_verified) {
    throw Object.assign(new Error('Email already verified'), {
      status: 400,
      code: 'EMAIL_ALREADY_VERIFIED',
    });
  }
  const token = uuidv4();
  await prisma.user.update({
    where: { id: user.id },
    data: { email_verification_token: token },
  });

  const verifyUrl = `${config.frontend.emailVerificationUrl}?token=${token}`;
  void sendEmail(
    user.email,
    'Verifica tu email',
    buildVerificationEmail(verifyUrl)
  ).catch(() => {});
}

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw Object.assign(new Error('Invalid email'), {
      status: 400,
      code: 'INVALID_EMAIL',
    });
  }
  const token = uuidv4();
  await prisma.user.update({
    where: { id: user.id },
    data: { password_reset_token: token },
  });

  const resetUrl = `${config.frontend.passwordResetUrl}?token=${token}`;
  void sendEmail(
    user.email,
    'Restablece tu contraseña',
    buildResetPasswordEmail(resetUrl)
  ).catch(() => {});
}

export async function resetPassword(token: string, newPassword: string) {
  const user = await prisma.user.findFirst({
    where: { password_reset_token: token },
  });
  if (!user)
    throw Object.assign(new Error('Invalid token'), {
      status: 400,
      code: 'INVALID_TOKEN',
    });
  const password_hash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { password_hash, password_reset_token: null },
  });
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.password_hash)
    throw Object.assign(new Error('Invalid user'), {
      status: 400,
      code: 'INVALID_USER',
    });
  const ok = await verifyPassword(currentPassword, user.password_hash);
  if (!ok)
    throw Object.assign(new Error('Invalid credentials'), {
      status: 401,
      code: 'INVALID_CREDENTIALS',
    });
  const password_hash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { password_hash } });
}

export default { register, login };
