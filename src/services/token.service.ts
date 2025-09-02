import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../config/jwt';
import prisma from '../config/database';
import { hashValue, verifyHash } from '../utils/encryption.util';
import config from '../config/env';
import { v4 as uuidv4 } from 'uuid';
import redis from '../config/redis';

function parseDurationToMs(text: string): number {
  const m = text.match(/^(\d+)([smhd])$/i);
  if (!m) return 0;
  const num = Number(m[1]);
  const unit = m[2].toLowerCase();
  switch (unit) {
    case 's': return num * 1000;
    case 'm': return num * 60 * 1000;
    case 'h': return num * 60 * 60 * 1000;
    case 'd': return num * 24 * 60 * 60 * 1000;
    default: return 0;
  }
}

export async function generateTokens(
  user: { id: string; email: string },
  deviceContext?: {
    ipAddress?: string;
    userAgent?: string;
    deviceInfo?: any;
  }
) {
  const accessJti = uuidv4();
  const refreshJti = uuidv4();
  const now = Math.floor(Date.now() / 1000); // Unix timestamp
  const accessPayload = { sub: user.id, email: user.email };
  const refreshPayload = { sub: user.id, email: user.email, iat: now, nonce: refreshJti };
  const accessToken = signAccessToken(accessPayload, accessJti);
  const refreshToken = signRefreshToken(refreshPayload, refreshJti);
  const tokenHash = await hashValue(refreshToken);
  const expiresMs = parseDurationToMs(config.jwt.refreshExpiresIn);
  
  await prisma.refreshToken.create({
    data: {
      user_id: user.id,
      token_hash: tokenHash,
      jti: refreshJti,
      expires_at: new Date(Date.now() + (expiresMs || 7 * 24 * 60 * 60 * 1000)),
      // Add device context information
      ip_address: deviceContext?.ipAddress || null,
      user_agent: deviceContext?.userAgent || null,
      device_info: deviceContext?.deviceInfo || null,
    }
  });
  // Store JWT session in Redis keyed by jti for access token TTL
  const accessTtlMs = parseDurationToMs(config.jwt.expiresIn);
  if (accessJti && accessTtlMs > 0) {
    await redis.set(`jwt:session:${accessJti}`, JSON.stringify({ userId: user.id, email: user.email }), 'PX', accessTtlMs);
    await redis.sadd(`jwt:user:${user.id}:jtis`, accessJti);
    // set expires on the set key roughly to access TTL to avoid unbounded growth
    await redis.pexpire(`jwt:user:${user.id}:jtis`, accessTtlMs);
  }
  return { accessToken, refreshToken };
}

export async function revokeRefreshToken(userId: string, refreshTokenPlain: string): Promise<boolean> {
  const tokens = await prisma.refreshToken.findMany({ where: { user_id: userId, revoked_at: null } });
  for (const t of tokens) {
    const match = await verifyHash(refreshTokenPlain, t.token_hash);
    if (match) {
      await prisma.refreshToken.update({ where: { id: t.id }, data: { revoked_at: new Date() } });
      return true;
    }
  }
  return false;
}

export async function revokeAllUserRefreshTokens(userId: string): Promise<number> {
  const res = await prisma.refreshToken.updateMany({ where: { user_id: userId, revoked_at: null }, data: { revoked_at: new Date() } });
  return res.count;
}

export async function rotateRefreshToken(refreshTokenPlain: string) {
  const payload = verifyRefreshToken(refreshTokenPlain);
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) throw Object.assign(new Error('Invalid token'), { status: 401, code: 'INVALID_REFRESH' });

  // Extract the jti from the token payload to find the exact token
  const tokenJti = payload.jti;
  if (!tokenJti) {
    throw Object.assign(new Error('Invalid token format'), { status: 401, code: 'INVALID_REFRESH' });
  }

  // Use a transaction to find and revoke the specific token by its jti
  const result = await prisma.$transaction(async (tx) => {
    // Find the token by its unique jti and ensure it's not revoked
    const tokenRecord = await tx.refreshToken.findFirst({
      where: {
        user_id: user.id,
        jti: tokenJti,
        revoked_at: null
      }
    });

    if (!tokenRecord) {
      throw Object.assign(new Error('Refresh token not found or already revoked'), { status: 401, code: 'INVALID_REFRESH' });
    }

    // Double-check: Verify the hash matches as an additional security layer
    const isValidToken = await verifyHash(refreshTokenPlain, tokenRecord.token_hash);
    if (!isValidToken) {
      throw Object.assign(new Error('Invalid refresh token'), { status: 401, code: 'INVALID_REFRESH' });
    }

    // Revoke the token
    await tx.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revoked_at: new Date() }
    });

    return tokenRecord;
  });

  // Use the device context from the original token for the new one
  return generateTokens(
    { id: user.id, email: user.email },
    {
      ipAddress: result.ip_address ?? undefined,
      userAgent: result.user_agent ?? undefined,
      deviceInfo: result.device_info ?? undefined
    }
  );
}

export default { generateTokens, revokeRefreshToken, revokeAllUserRefreshTokens, rotateRefreshToken };


