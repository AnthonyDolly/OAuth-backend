export interface ListUsersQuery {
  page: number;
  limit: number;
  status?: 'active' | 'inactive' | 'suspended' | 'pending_verification';
  q?: string;
  email_verified?: boolean;
  two_factor_enabled?: boolean;
  from?: Date;
  to?: Date;
}

export interface ListAuditLogsQuery {
  page: number;
  limit: number;
  userId?: string;
  action?: string;
  success?: boolean;
  from?: Date;
  to?: Date;
}

export interface UpdateUserStatusBody {
  status: 'active' | 'inactive' | 'suspended' | 'pending_verification';
}

export interface UpdateUserAdminBody {
  is_admin: boolean;
}

export interface AdminStatsResponse {
  userCount: number;
  oauthCount: number;
  activeSessions: number;
}
