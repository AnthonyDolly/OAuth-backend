import prisma from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.util';
import { parseUserAgent } from '../utils/user-agent.util';
import { getLocationFromIP } from './geolocation.service';
import { 
  SessionData, 
  SessionResponse, 
  SessionStats, 
  SessionCreationResult,
  SecurityFlags,
  LocationDetails
} from '../types/session.types';

/**
 * Create a new user session with device and location tracking
 */
export async function createUserSession(sessionData: SessionData): Promise<SessionCreationResult> {
  const sessionToken = uuidv4();
  const deviceInfo = sessionData.userAgent ? parseUserAgent(sessionData.userAgent) : undefined;
  const location = await getLocationFromIP(sessionData.ipAddress);
  
  // Set session expiration (30 days from now)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  
  const session = await prisma.userSession.create({
    data: {
      user_id: sessionData.userId,
      session_token: sessionToken,
      expires_at: expiresAt,
      ip_address: sessionData.ipAddress || null,
      user_agent: sessionData.userAgent || null,
      device_type: deviceInfo?.deviceType || null,
      browser: deviceInfo?.browser || null,
      os: deviceInfo?.os || null,
      location: location ? (location as any) : null,
      is_active: true
    }
  });
  
  logger.info('User session created', {
    userId: sessionData.userId,
    sessionId: session.id,
    sessionToken,
    ipAddress: sessionData.ipAddress,
    deviceType: deviceInfo?.deviceType,
    browser: deviceInfo?.browser,
    os: deviceInfo?.os,
    location: location?.city
  });
  
  return {
    sessionId: session.id,
    sessionToken,
    expiresAt: session.expires_at,
    deviceInfo,
    location
  };
}

/**
 * Get all active sessions for a user with enhanced metadata
 */
export async function getUserSessions(userId: string): Promise<SessionResponse[]> {
  const sessions = await prisma.userSession.findMany({
    where: {
      user_id: userId,
      is_active: true,
      expires_at: { gt: new Date() } // Only non-expired sessions
    },
    orderBy: { last_accessed_at: 'desc' },
    select: {
      id: true,
      session_token: true,
      created_at: true,
      last_accessed_at: true,
      expires_at: true,
      ip_address: true,
      device_type: true,
      browser: true,
      os: true,
      location: true,
      is_active: true
    }
  });
  
  return sessions.map(session => enhanceSessionData(session));
}

/**
 * Update session last accessed time
 */
export async function updateSessionAccess(sessionToken: string, ipAddress?: string): Promise<void> {
  try {
    await prisma.userSession.updateMany({
      where: {
        session_token: sessionToken,
        is_active: true,
        expires_at: { gt: new Date() }
      },
      data: {
        last_accessed_at: new Date(),
        ip_address: ipAddress || undefined
      }
    });
  } catch (error) {
    logger.warn('Failed to update session access:', error);
  }
}

/**
 * Revoke a specific session for a user
 */
export async function revokeUserSession(userId: string, sessionId: string): Promise<boolean> {
  const session = await prisma.userSession.findFirst({
    where: {
      id: sessionId,
      user_id: userId,
      is_active: true
    }
  });
  
  if (!session) {
    throw Object.assign(new Error('Session not found'), {
      status: 404,
      code: 'SESSION_NOT_FOUND'
    });
  }
  
  await prisma.userSession.update({
    where: { id: sessionId },
    data: { is_active: false }
  });
  
  logger.info('User session revoked', {
    userId,
    sessionId,
    sessionToken: `${session.session_token.slice(0, 8)}...`,
    revokedAt: new Date()
  });
  
  return true;
}

/**
 * Revoke all sessions for a user (except optionally the current one)
 */
export async function revokeAllUserSessions(userId: string, exceptSessionToken?: string): Promise<number> {
  const whereClause: any = {
    user_id: userId,
    is_active: true
  };
  
  if (exceptSessionToken) {
    whereClause.session_token = { not: exceptSessionToken };
  }
  
  const { count } = await prisma.userSession.updateMany({
    where: whereClause,
    data: { is_active: false }
  });
  
  logger.info('User sessions revoked', {
    userId,
    revokedCount: count,
    exceptCurrent: !!exceptSessionToken,
    revokedAt: new Date()
  });
  
  return count;
}

/**
 * Clean up expired sessions (scheduled task)
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const { count } = await prisma.userSession.updateMany({
    where: {
      OR: [
        { expires_at: { lt: new Date() } },
        { is_active: false }
      ]
    },
    data: { is_active: false }
  });
  
  logger.info('Expired sessions cleaned up', {
    cleanedCount: count,
    cleanedAt: new Date()
  });
  
  return count;
}

/**
 * Get session statistics for admin dashboard
 */
export async function getSessionStats(): Promise<SessionStats> {
  const [activeSessionsCount, totalSessionsCount, sessionsLast24h] = await Promise.all([
    prisma.userSession.count({
      where: {
        is_active: true,
        expires_at: { gt: new Date() }
      }
    }),
    prisma.userSession.count(),
    prisma.userSession.count({
      where: {
        created_at: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }
    })
  ]);
  
  return {
    activeSessionsCount,
    totalSessionsCount,
    sessionsLast24h
  };
}

// ====================================================================
// PRIVATE UTILITY FUNCTIONS
// ====================================================================

/**
 * Enhance session data with location display and security flags
 */
function enhanceSessionData(session: any): SessionResponse {
  // Parse location data for better display
  const locationDisplay = buildLocationDisplay(session.location);
  const securityFlags = extractSecurityFlags(session.location);
  const locationDetails = extractLocationDetails(session.location);
  
  return {
    ...session,
    // Don't expose full session token in list
    session_token: `${session.session_token.slice(0, 8)}...`,
    is_current: false, // Will be set by controller if it matches current session
    location_display: locationDisplay,
    security_flags: securityFlags,
    location_details: locationDetails
  };
}

/**
 * Build human-readable location display string
 */
function buildLocationDisplay(location: any): string {
  if (!location || typeof location !== 'object') {
    return 'Unknown';
  }
  
  if (location.country && location.city) {
    return `${location.city}, ${location.country}`;
  } else if (location.country) {
    return location.country;
  } else if (location.city) {
    return location.city;
  }
  
  return 'Unknown';
}

/**
 * Extract security flags from location data
 */
function extractSecurityFlags(location: any): SecurityFlags | null {
  if (!location || typeof location !== 'object') {
    return null;
  }
  
  return {
    is_vpn: location.is_vpn || false,
    is_tor: location.is_tor || false,
    is_proxy: location.is_proxy || false,
    is_datacenter: location.is_datacenter || false,
    is_mobile: location.is_mobile || false,
    risk_score: location.risk_score || 0
  };
}

/**
 * Extract detailed location information
 */
function extractLocationDetails(location: any): LocationDetails | null {
  if (!location || typeof location !== 'object') {
    return null;
  }
  
  const coordinates = (location.latitude && location.longitude) ? {
    latitude: location.latitude,
    longitude: location.longitude
  } : null;
  
  return {
    state: location.state,
    zipcode: location.zipcode,
    localtime: location.localtime,
    asn: location.asn,
    org: location.org,
    isp_name: location.isp,
    coordinates
  };
}