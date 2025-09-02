/**
 * Device information extracted from User-Agent
 */
export interface DeviceInfo {
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'api_client' | 'unknown';
  browser: string;
  os: string;
  version: string;
}

/**
 * Location and ISP information from IP geolocation API
 */
export interface LocationInfo {
  // Location data
  country?: string;
  country_code?: string;
  state?: string;           // Lima region
  region?: string;          // For backward compatibility
  city?: string;
  zipcode?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  localtime?: string;       // 2025-08-25T22:13:40
  
  // ISP data
  asn?: string;            // AS265691
  org?: string;            // WI-NET TELECOM S.A.C.
  isp?: string;            // Wi-net Telecom S.A.C.
  
  // Risk/Security data
  is_mobile?: boolean;     // Device mobility from API (not user-agent)
  is_vpn?: boolean;
  is_tor?: boolean;
  is_proxy?: boolean;
  is_datacenter?: boolean;
  risk_score?: number;
}

/**
 * Data required to create a new user session
 */
export interface SessionData {
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: DeviceInfo;
  location?: LocationInfo;
}

/**
 * Enhanced session info for API responses
 */
export interface SessionResponse {
  id: string;
  session_token: string;
  created_at: Date;
  last_accessed_at: Date;
  expires_at: Date;
  ip_address: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  location: any;
  is_active: boolean;
  is_current: boolean;
  location_display: string;
  security_flags: SecurityFlags | null;
  location_details: LocationDetails | null;
}

/**
 * Security flags extracted from location data
 */
export interface SecurityFlags {
  is_vpn: boolean;
  is_tor: boolean;
  is_proxy: boolean;
  is_datacenter: boolean;
  is_mobile: boolean;
  risk_score: number;
}

/**
 * Detailed location information
 */
export interface LocationDetails {
  state?: string;
  zipcode?: string;
  localtime?: string;
  asn?: string;
  org?: string;
  isp_name?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  } | null;
}

/**
 * Session statistics for admin dashboard
 */
export interface SessionStats {
  activeSessionsCount: number;
  totalSessionsCount: number;
  sessionsLast24h: number;
}

/**
 * User session creation result
 */
export interface SessionCreationResult {
  sessionId: string;
  sessionToken: string;
  expiresAt: Date;
  deviceInfo?: DeviceInfo;
  location?: LocationInfo | null;
}
