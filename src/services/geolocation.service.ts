import axios from 'axios';
import logger from '../utils/logger.util';
import { config } from '../config/env';
import { LocationInfo } from '../types/session.types';

/**
 * Get location information from IP address using ipquery.io API
 * Handles localhost detection and development mode
 */
export async function getLocationFromIP(ipAddress?: string): Promise<LocationInfo | null> {
  // Handle localhost/development cases (including IPv6-mapped addresses)
  const isLocalhost = isLocalhostIP(ipAddress);
  
  // In development, optionally use real geolocation for testing
  const useRealGeoInDev = config.server.useRealGeolocationInDev || 
                         process.env.USE_REAL_GEOLOCATION_IN_DEV === 'true';
  
  logger.info('Geolocation config', { 
    ipAddress,
    isLocalhost, 
    useRealGeoInDev
  });
  
  // Return localhost data if not using real geo in development
  if (isLocalhost && !useRealGeoInDev) {
    return getLocalhostLocation(ipAddress);
  }
  
  // Get external IP if localhost and wants real geolocation
  let targetIP = ipAddress;
  if (isLocalhost && useRealGeoInDev) {
    const externalIP = await getExternalIP();
    if (!externalIP) {
      return getFallbackLocation();
    }
    targetIP = externalIP;
  }
   
  return await fetchLocationFromAPI(targetIP, ipAddress);
}

/**
 * Check if IP address is localhost/local development
 */
function isLocalhostIP(ipAddress?: string): boolean {
  return !ipAddress || 
         ipAddress === '127.0.0.1' || 
         ipAddress === '::1' || 
         ipAddress === '::ffff:127.0.0.1' || 
         ipAddress.includes('127.0.0.1') ||
         ipAddress === 'unknown' ||
         ipAddress === 'localhost';
}

/**
 * Get localhost location data for development
 */
function getLocalhostLocation(ipAddress?: string): LocationInfo {
  logger.info('Using localhost location data (development mode)', { 
    ipAddress,
    hint: 'Set USE_REAL_GEOLOCATION_IN_DEV=true to use real geolocation in development'
  });
  
  return {
    // Location data
    country: 'Local',
    country_code: 'DEV',
    state: 'Development',
    region: 'Development',
    city: 'Localhost', 
    zipcode: '00000',
    timezone: 'UTC',
    localtime: new Date().toISOString(),
    latitude: 0,
    longitude: 0,
    
    // ISP data
    asn: 'AS00000',
    org: 'Local Development',
    isp: 'Localhost ISP',
    
    // Risk/Security data
    is_mobile: false,
    is_vpn: false,
    is_tor: false,
    is_proxy: false,
    is_datacenter: false,
    risk_score: 0
  };
}

/**
 * Get external IP address for development testing
 */
async function getExternalIP(): Promise<string | null> {
  try {
    logger.info('Development mode: fetching real external IP for geolocation testing...');
    
    const response = await axios.get('https://api.ipify.org?format=text', {
      timeout: 3000
    });
    
    if (response.status === 200) {
      const externalIP = response.data.trim();
      logger.info('External IP obtained for testing:', { targetIP: externalIP });
      return externalIP;
    }
    
    return null;
  } catch (error) {
    logger.warn('Failed to get external IP for testing', { error });
    return null;
  }
}

/**
 * Fetch location data from ipquery.io API
 */
async function fetchLocationFromAPI(targetIP?: string, originalIP?: string): Promise<LocationInfo | null> {
  try {
    const response = await axios.get(`https://api.ipquery.io/${targetIP}?format=json`, {
      timeout: 5000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'OAuth-Backend/1.0'
      }
    });

    logger.info('ipquery.io API response received', { 
      targetIP,
      originalIP,
      status: response.status 
    });
    
    if (response.status !== 200) {
      logger.warn(`ipquery.io API error: ${response.status} ${response.statusText}`, {
        targetIP,
        originalIP,
        status: response.status
      });
      return getFallbackLocation();
    }
    
    const data = response.data;
    
    // ipquery.io returns data directly, no wrapper object with "success" field
    if (!data.ip || !data.location) {
      logger.warn('ipquery.io API returned incomplete response', {
        targetIP,
        originalIP,
        response: data
      });
      return getFallbackLocation();
    }
    
    const result = mapLocationData(data);
    
    logger.info('Successfully retrieved location data', {
      targetIP,
      originalIP,
      country: result.country,
      city: result.city,
      isVpn: result.is_vpn,
      riskScore: result.risk_score
    });
    
    return result;
    
  } catch (error) {
    return handleLocationError(error, targetIP, originalIP);
  }
}

/**
 * Map ipquery.io response to LocationInfo interface
 */
function mapLocationData(data: any): LocationInfo {
  return {
    // Location data - COMPLETE mapping
    country: data.location?.country || 'Unknown',
    country_code: data.location?.country_code || 'XX',
    state: data.location?.state || 'Unknown',           // Lima region
    region: data.location?.state || 'Unknown',          // For backward compatibility  
    city: data.location?.city || 'Unknown',
    zipcode: data.location?.zipcode || '',
    latitude: data.location?.latitude,
    longitude: data.location?.longitude,
    timezone: data.location?.timezone || 'UTC',
    localtime: data.location?.localtime,               // 2025-08-25T22:13:40
    
    // ISP data - COMPLETE mapping
    asn: data.isp?.asn || '',                          // AS265691
    org: data.isp?.org || '',                          // WI-NET TELECOM S.A.C.
    isp: data.isp?.isp || '',                          // Wi-net Telecom S.A.C.
    
    // Risk/Security data - COMPLETE mapping
    is_mobile: data.risk?.is_mobile || false,         // API device mobility detection
    is_vpn: data.risk?.is_vpn || false,
    is_tor: data.risk?.is_tor || false,
    is_proxy: data.risk?.is_proxy || false,
    is_datacenter: data.risk?.is_datacenter || false,
    risk_score: data.risk?.risk_score || 0
  };
}

/**
 * Handle errors from location API calls
 */
function handleLocationError(error: unknown, targetIP?: string, originalIP?: string): LocationInfo {
  if (axios.isAxiosError(error)) {
    logger.warn('Failed to get location from ipquery.io (axios error)', {
      targetIP,
      originalIP,
      error: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText
    });
  } else if (error instanceof Error) {
    logger.warn('Failed to get location from ipquery.io', {
      targetIP,
      originalIP,
      error: error.message,
      errorType: error.constructor.name
    });
  } else {
    logger.warn('Unknown error getting location from ipquery.io', {
      targetIP,
      originalIP,
      error: String(error)
    });
  }
  
  return getFallbackLocation();
}

/**
 * Fallback location when API is unavailable
 */
export function getFallbackLocation(): LocationInfo {
  return {
    // Location data
    country: 'Unknown',
    country_code: 'XX',
    state: 'Unknown',
    region: 'Unknown', 
    city: 'Unknown',
    zipcode: '',
    timezone: 'UTC',
    localtime: undefined,
    latitude: undefined,
    longitude: undefined,
    
    // ISP data
    asn: '',
    org: '',
    isp: '',
    
    // Risk/Security data
    is_mobile: false,
    is_vpn: false,
    is_tor: false,
    is_proxy: false,
    is_datacenter: false,
    risk_score: 0
  };
}
