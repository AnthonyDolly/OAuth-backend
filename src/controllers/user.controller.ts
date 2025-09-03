import { Request, Response, NextFunction } from 'express';
import * as UserService from '../services/user.service';
import { UpdateProfileBody } from '../types/user.types';
import { updateSessionAccess } from '../services/session.service';
import { getClientIP } from '../utils/user-agent.util';
import jwt from 'jsonwebtoken';

export async function getProfile(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = (req.user as any).id;
    const profile = await UserService.getProfile(userId);
    return res
      .status(200)
      .json({
        success: true,
        data: profile,
        timestamp: new Date().toISOString(),
      });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(
  req: Request<any, any, UpdateProfileBody>,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = (req.user as any).id;
    const updated = await UserService.updateProfile(userId, req.body);
    return res
      .status(200)
      .json({
        success: true,
        data: updated,
        timestamp: new Date().toISOString(),
      });
  } catch (err) {
    next(err);
  }
}

export async function deleteAccount(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = (req.user as any).id;
    await UserService.deleteAccount(userId);
    return res
      .status(200)
      .json({
        success: true,
        message: 'Account deleted',
        timestamp: new Date().toISOString(),
      });
  } catch (err) {
    next(err);
  }
}

export async function listSessions(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = (req.user as any).id;
    const sessions = await UserService.listSessions(userId);

    // Try to identify current session from Authorization header
    const authHeader = req.get('Authorization');
    let currentSessionJti = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.decode(token) as any;
        currentSessionJti = decoded?.jti;
      } catch {
        // Ignore token decode errors
      }
    }

    // Mark current session and update access time if we can identify it
    const enhancedSessions = sessions.map((session) => ({
      ...session,
      is_current:
        currentSessionJti &&
        session.session_token.startsWith(currentSessionJti?.slice(0, 8)),
    }));

    // Update current session access time
    if (currentSessionJti) {
      const ipAddress = getClientIP(req);
      updateSessionAccess(currentSessionJti, ipAddress).catch(() => {
        // Ignore errors in background update
      });
    }

    return res.status(200).json({
      success: true,
      data: enhancedSessions,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function revokeSession(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = (req.user as any).id;
    const { sessionId } = req.params as { sessionId: string };
    await UserService.revokeSession(userId, sessionId);
    return res
      .status(200)
      .json({
        success: true,
        message: 'Session revoked',
        timestamp: new Date().toISOString(),
      });
  } catch (err) {
    next(err);
  }
}

export async function revokeAllSessions(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = (req.user as any).id;
    await UserService.revokeAllSessions(userId);
    return res
      .status(200)
      .json({
        success: true,
        message: 'All sessions revoked',
        timestamp: new Date().toISOString(),
      });
  } catch (err) {
    next(err);
  }
}

export async function listOAuthAccounts(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = (req.user as any).id;
    const accounts = await UserService.listOAuthAccounts(userId);
    return res
      .status(200)
      .json({
        success: true,
        data: accounts,
        timestamp: new Date().toISOString(),
      });
  } catch (err) {
    next(err);
  }
}

export async function linkOAuthAccount(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = (req.user as any).id;

    // Manual linking through API (requires admin or special permissions)
    const payload = {
      ...req.body,
      bypassAdminCheck: false, // Manual API calls require admin check
      requireValidation: true, // Validate provider accounts when possible
    };

    const account = await UserService.linkOAuthAccount(userId, payload);
    return res
      .status(201)
      .json({
        success: true,
        data: account,
        timestamp: new Date().toISOString(),
      });
  } catch (err) {
    next(err);
  }
}

export async function unlinkOAuthAccount(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = (req.user as any).id;
    const { accountId } = req.params as { accountId: string };
    await UserService.unlinkOAuthAccount(userId, accountId);
    return res
      .status(200)
      .json({
        success: true,
        message: 'OAuth account unlinked',
        timestamp: new Date().toISOString(),
      });
  } catch (err) {
    next(err);
  }
}

export async function enable2FA(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = (req.user as any).id;
    const data = await UserService.enable2FA(userId);
    return res
      .status(200)
      .json({ success: true, data, timestamp: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
}

export async function disable2FA(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = (req.user as any).id;
    await UserService.disable2FA(userId);
    return res
      .status(200)
      .json({
        success: true,
        message: '2FA disabled',
        timestamp: new Date().toISOString(),
      });
  } catch (err) {
    next(err);
  }
}

export async function verify2FA(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = (req.user as any).id;
    const { code } = req.body as { code: string };
    const ok = await UserService.verify2FA(userId, code);
    if (!ok)
      return res
        .status(400)
        .json({
          success: false,
          message: 'Invalid 2FA code',
          timestamp: new Date().toISOString(),
        });
    return res
      .status(200)
      .json({
        success: true,
        message: '2FA verified',
        timestamp: new Date().toISOString(),
      });
  } catch (err) {
    next(err);
  }
}

export async function generateBackupCodes(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = (req.user as any).id;
    const codes = await UserService.regenerateBackupCodes(userId);
    return res
      .status(201)
      .json({
        success: true,
        data: { codes },
        timestamp: new Date().toISOString(),
      });
  } catch (err) {
    next(err);
  }
}

export async function sendPhoneVerification(
  req: Request<any, any, { phone: string }>,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = (req.user as any).id;
    const { phone } = req.body;
    const result = await UserService.sendPhoneVerification(userId, phone);
    return res.status(200).json({
      success: true,
      message: 'Verification code sent to phone',
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyPhone(
  req: Request<any, any, { code: string }>,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = (req.user as any).id;
    const { code } = req.body;
    const result = await UserService.verifyPhone(userId, code);
    return res.status(200).json({
      success: true,
      message: 'Phone verified successfully',
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function getSecurityInfo(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = (req.user as any).id;
    const securityInfo = await UserService.getUserSecurityInfo(userId);
    return res.status(200).json({
      success: true,
      message: 'Security dashboard data retrieved',
      data: securityInfo,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}
