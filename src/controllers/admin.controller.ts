import { Request, Response, NextFunction } from 'express';
import * as AdminService from '../services/admin.service';
import {
  ListUsersQuery,
  ListAuditLogsQuery,
  UpdateUserStatusBody,
  UpdateUserAdminBody,
} from '../types/admin.types';

export async function listUsers(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const queryParams = (req as any).validatedQuery as ListUsersQuery;

    const result = await AdminService.listUsers(queryParams);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = req.params as { userId: string };
    const user = await AdminService.getUser(userId);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

export async function updateUserStatus(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { userId } = req.params as { userId: string };
    const { status } = req.body as UpdateUserStatusBody;
    const user = await AdminService.updateUserStatus(userId, status);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

export async function updateUserAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { userId } = req.params as { userId: string };
    const { is_admin } = req.body as UpdateUserAdminBody;
    const user = await AdminService.updateUserAdmin(userId, is_admin);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

export async function listAuditLogs(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const queryParams = (req as any).validatedQuery as ListAuditLogsQuery;

    const result = await AdminService.listAuditLogs(queryParams);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function stats(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await AdminService.getStats();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getUserSecurityInfo(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = req.params;
    const securityInfo = await AdminService.getUserSecurityInfo(userId);
    return res.status(200).json({
      success: true,
      message: 'Security information retrieved for user',
      data: { userId, ...securityInfo },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function getLockedUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const lockedUsers = await AdminService.getLockedUsers();
    return res.status(200).json({
      success: true,
      message: 'Locked users retrieved successfully',
      data: lockedUsers,
      count: lockedUsers.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}
