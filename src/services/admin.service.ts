import prisma from '../config/database';
import { Paginated } from '../types/api.types';
import { ListUsersQuery, ListAuditLogsQuery, AdminStatsResponse } from '../types/admin.types';
import { getSessionStats } from './session.service';

export async function listUsers(queryParams: ListUsersQuery): Promise<Paginated<any>> {
  const {
    page,
    limit,
    status,
    q,
    email_verified: emailVerified,
    two_factor_enabled: twoFactorEnabled,
    from,
    to
  } = queryParams;

  const where: any = {};
  if (status) where.status = status;
  if (q) {
    where.OR = [
      { email: { contains: q } },
      { first_name: { contains: q } },
      { last_name: { contains: q } }
    ];
  }
  if (typeof emailVerified === 'boolean') where.email_verified = emailVerified;
  if (typeof twoFactorEnabled === 'boolean') where.two_factor_enabled = twoFactorEnabled;
  if (from || to) {
    where.created_at = {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {})
    };
  }

  const [items, totalItems] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.user.count({ where })
  ]);

  const totalPages = Math.ceil(totalItems / limit) || 1;
  return {
    items,
    page,
    limit,
    totalItems,
    totalPages
  };
}

export async function getUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw Object.assign(new Error('User not found'), {
      status: 404,
      code: 'USER_NOT_FOUND',
    });
  }
  return user;
}

export async function updateUserStatus(userId: string, status: 'active' | 'inactive' | 'suspended' | 'pending_verification') {
  const user = await prisma.user.update({ 
    where: { id: userId }, 
    data: { status } 
  });
  return user;
}

export async function updateUserAdmin(userId: string, isAdmin: boolean) {
  const user = await prisma.user.update({ 
    where: { id: userId }, 
    data: { is_admin: isAdmin } 
  });
  return user;
}

export async function listAuditLogs(queryParams: ListAuditLogsQuery): Promise<Paginated<any>> {
  const {
    page,
    limit,
    userId,
    action,
    success,
    from,
    to
  } = queryParams;

  const where: any = {};
  if (userId) where.user_id = userId;
  if (action) where.action = action;
  if (typeof success === 'boolean') where.success = success;
  if (from || to) {
    where.created_at = {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {})
    };
  }

  const [items, totalItems] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.auditLog.count({ where })
  ]);

  const totalPages = Math.ceil(totalItems / limit) || 1;
  return {
    items,
    page,
    limit,
    totalItems,
    totalPages
  };
}

export async function getStats(): Promise<AdminStatsResponse> {
  const [userCount, oauthCount, sessionStats] = await Promise.all([
    prisma.user.count(),
    prisma.oAuthAccount.count(),
    getSessionStats()
  ]);
  return {
    userCount,
    oauthCount,
    activeSessions: sessionStats.activeSessionsCount
  };
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

export async function getLockedUsers() {
  const lockedUsers = await prisma.user.findMany({
    where: {
      locked_until: {
        not: null,
        gt: new Date(), // locked_until > current time
      },
    },
    select: {
      id: true,
      email: true,
      first_name: true,
      last_name: true,
      failed_login_attempts: true,
      locked_until: true,
      last_login_at: true,
      created_at: true,
    },
    orderBy: {
      locked_until: 'desc', // Most recently locked first
    },
  });

  return lockedUsers.map((user) => ({
    ...user,
    lockout_remaining_time: user.locked_until
      ? Math.max(0, user.locked_until.getTime() - new Date().getTime())
      : 0,
  }));
}
