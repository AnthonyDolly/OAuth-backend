import { Request, Response, NextFunction } from 'express';
import { generateTokens } from '../services/token.service';
import { createUserSession } from '../services/session.service';
import { getClientIP } from '../utils/user-agent.util';
import config from '../config/env';
import prisma from '../config/database';

export async function callback(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const user = req.user as any;

    // Extract device context for both tokens and session
    const ipAddress = getClientIP(req);
    const userAgent = req.get('User-Agent');

    const { accessToken, refreshToken } = await generateTokens(
      { id: user.id, email: user.email },
      {
        ipAddress,
        userAgent,
        deviceInfo: userAgent ? { userAgent } : null,
      }
    );

    // Update last login info (same as regular login)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        last_login_at: new Date(),
        last_login_ip: ipAddress || null,
        failed_login_attempts: 0,
        locked_until: null,
      },
    });

    // Create user session for OAuth login tracking
    await createUserSession({
      userId: user.id,
      ipAddress,
      userAgent,
    });
    // Redirect to frontend with tokens (using hash to avoid server logs)
    const frontendUrl = config.frontend.url;
    const redirectUrl = `${frontendUrl}/oauth/callback#access_token=${encodeURIComponent(
      accessToken
    )}&refresh_token=${encodeURIComponent(
      refreshToken
    )}&token_type=Bearer&user_id=${encodeURIComponent(
      user.id
    )}&email=${encodeURIComponent(user.email)}`;

    return res.redirect(redirectUrl);
  } catch (err) {
    // En caso de error, redirigir al frontend con mensaje de error
    const frontendUrl = config.frontend.url;
    const errorRedirect = config.frontend.errorRedirect;
    const errorUrl = `${frontendUrl}${errorRedirect}?error=oauth_error&message=${encodeURIComponent(
      'Error en autenticación OAuth'
    )}`;

    return res.redirect(errorUrl);
  }
}
