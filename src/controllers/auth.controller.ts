import { Request, Response, NextFunction } from 'express';
import * as AuthService from '../services/auth.service';
import { LoginRequestBody, RegisterRequestBody } from '../types/auth.types';
import { getClientIP } from '../utils/user-agent.util';

export async function register(
  req: Request<any, any, RegisterRequestBody>,
  res: Response,
  next: NextFunction
) {
  try {
    const { email, password } = req.body;
    const ipAddress = getClientIP(req);
    const userAgent = req.get('User-Agent');
    const result = await AuthService.register(email, password, ipAddress, userAgent);
    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: sanitizeUser(result.user),
        tokens:
          result.accessToken && result.refreshToken
            ? toTokens(result.accessToken, result.refreshToken)
            : null,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request<any, any, LoginRequestBody>, res: Response, next: NextFunction) {
  try {
    const { email, password, code, backup_code } = req.body;
    const ipAddress = getClientIP(req);
    const userAgent = req.get('User-Agent');
    const result = await AuthService.login(email, password, ipAddress, code, backup_code, userAgent);
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: sanitizeUser(result.user),
        tokens: toTokens(result.accessToken, result.refreshToken),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request<any, any, { refresh_token: string }>, res: Response, next: NextFunction) {
  try {
    const { refresh_token } = req.body;
    const result = await AuthService.refresh(refresh_token);
    return res.status(200).json({
      success: true,
      message: 'Token refreshed',
      data: { tokens: toTokens(result.accessToken, result.refreshToken) },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.user as any).id;
    const { refresh_token, revoke_all } = req.body as { refresh_token?: string; revoke_all?: boolean };
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    await AuthService.revokeCurrentAccessSession(userId, token, !!revoke_all);
    await AuthService.logout(userId, refresh_token);
    return res.status(200).json({
      success: true,
      message: 'Logged out',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyEmail(
  req: Request<any, any, { token: string }>,
  res: Response,
  next: NextFunction
) {
  try {
    const { token } = req.body;
    await AuthService.verifyEmail(token);
    return res.status(200).json({
      success: true,
      message: 'Email verified',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function resendVerification(
  req: Request<any, any, { email: string }>,
  res: Response,
  next: NextFunction
) {
  try {
    const { email } = req.body;
    await AuthService.resendVerification(email);
    return res.status(200).json({
      success: true,
      message: 'Verification email sent',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(
  req: Request<any, any, { email: string }>,
  res: Response,
  next: NextFunction
) {
  try {
    const { email } = req.body;
    await AuthService.forgotPassword(email);
    return res.status(200).json({
      success: true,
      message: 'Password reset email sent',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(
  req: Request<any, any, { token: string; new_password: string }>,
  res: Response,
  next: NextFunction
) {
  try {
    const { token, new_password } = req.body;
    await AuthService.resetPassword(token, new_password);
    return res.status(200).json({
      success: true,
      message: 'Password reset successful',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function changePassword(
  req: Request<any, any, { current_password: string; new_password: string }>,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = (req.user as any).id;
    const { current_password, new_password } = req.body;
    await AuthService.changePassword(userId, current_password, new_password);
    return res.status(200).json({
      success: true,
      message: 'Password changed',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

function sanitizeUser(user: any) {
  const { password_hash, ...rest } = user;
  return rest;
}

function toTokens(accessToken: string, refreshToken: string) {
  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: 'Bearer',
  };
}
