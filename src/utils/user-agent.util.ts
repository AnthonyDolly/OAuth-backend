import { DeviceInfo } from '../types/session.types';
import logger from './logger.util';

/**
 * Parse User-Agent string to extract device information
 * Handles browsers, mobile devices, tablets, and API clients
 */
export function parseUserAgent(userAgent: string = ''): DeviceInfo {
  // Handle empty or undefined userAgent
  if (!userAgent || userAgent.trim() === '') {
    logger.warn('Empty User-Agent received');
    return {
      deviceType: 'unknown',
      browser: 'Unknown',
      os: 'Unknown',
      version: ''
    };
  }
  
  const ua = userAgent.toLowerCase();
  
  // Handle API testing clients specifically
  const apiClient = detectApiClient(ua);
  if (apiClient) {
    return apiClient;
  }
  
  // Log original User-Agent for debugging
  if (process.env.NODE_ENV === 'development') {
    logger.info('Parsing User-Agent:', { original: userAgent });
  }
  
  // Detect device type
  const deviceType = detectDeviceType(ua);
  
  // Detect browser and version
  const { browser, version } = detectBrowser(ua);
  
  // Detect OS
  const os = detectOS(ua, deviceType);
  
  const result = {
    deviceType,
    browser: version ? `${browser} ${version}` : browser,
    os,
    version
  };
  
  // Log parsed result for debugging
  if (process.env.NODE_ENV === 'development') {
    logger.info('User-Agent parsed:', { original: userAgent, parsed: result });
  }
  
  return result;
}

/**
 * Detect API testing clients (Postman, Insomnia, cURL, etc.)
 */
function detectApiClient(ua: string): DeviceInfo | null {
  const apiClients = [
    { match: 'yaak', name: 'Yaak API Client' },
    { match: 'postman', name: 'Postman' },
    { match: 'insomnia', name: 'Insomnia' },
    { match: 'httpie', name: 'HTTPie' },
    { match: 'curl', name: 'cURL' },
    { match: 'wget', name: 'wget' }
  ];
  
  for (const client of apiClients) {
    if (ua === client.match || ua.includes(client.match)) {
      return {
        deviceType: 'api_client',
        browser: client.name,
        os: 'Unknown',
        version: ''
      };
    }
  }
  
  return null;
}

/**
 * Detect device type from User-Agent
 */
function detectDeviceType(ua: string): DeviceInfo['deviceType'] {
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return 'mobile';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    return 'tablet';
  } else if (ua.includes('mozilla') || ua.includes('webkit') || ua.includes('chrome') || ua.includes('safari') || ua.includes('firefox')) {
    return 'desktop';
  }
  
  return 'unknown';
}

/**
 * Detect browser and version from User-Agent
 * Order matters - more specific browsers first
 */
function detectBrowser(ua: string): { browser: string; version: string } {
  const browsers = [
    {
      match: ['edg/', 'edge/'],
      name: 'Edge',
      versionRegex: /(?:edg|edge)\/([0-9.]+)/
    },
    {
      match: ['opr/', 'opera/'],
      name: 'Opera',
      versionRegex: /(?:opr|opera)\/([0-9.]+)/
    },
    {
      match: ['firefox/'],
      name: 'Firefox',
      versionRegex: /firefox\/([0-9.]+)/
    },
    {
      match: ['chrome/'],
      name: 'Chrome',
      versionRegex: /chrome\/([0-9.]+)/,
      exclude: ['edge'] // Chrome-based browsers
    },
    {
      match: ['safari/'],
      name: 'Safari',
      versionRegex: /version\/([0-9.]+)/,
      exclude: ['chrome'] // Safari-based browsers
    },
    {
      match: ['msie', 'trident'],
      name: 'Internet Explorer',
      versionRegex: /(?:msie\s|rv:)([0-9.]+)/
    }
  ];
  
  for (const browser of browsers) {
    const hasMatch = browser.match.some(match => ua.includes(match));
    const hasExclusion = browser.exclude?.some(exclude => ua.includes(exclude));
    
    if (hasMatch && !hasExclusion) {
      const match = ua.match(browser.versionRegex);
      return {
        browser: browser.name,
        version: match ? match[1] : ''
      };
    }
  }
  
  return { browser: 'Unknown', version: '' };
}

/**
 * Detect operating system from User-Agent
 * Order matters - more specific OS first
 */
function detectOS(ua: string, deviceType: DeviceInfo['deviceType']): string {
  // Windows detection
  if (ua.includes('windows nt')) {
    const match = ua.match(/windows nt ([0-9.]+)/);
    if (match) {
      const ntVersion = match[1];
      const windowsVersions: Record<string, string> = {
        '10.0': 'Windows 10/11',
        '6.3': 'Windows 8.1',
        '6.2': 'Windows 8',
        '6.1': 'Windows 7',
        '6.0': 'Windows Vista'
      };
      return windowsVersions[ntVersion] || `Windows NT ${ntVersion}`;
    }
    return 'Windows';
  }
  
  // Android detection
  if (ua.includes('android')) {
    const match = ua.match(/android ([0-9.]+)/);
    return match ? `Android ${match[1]}` : 'Android';
  }
  
  // iOS detection (iPhone)
  if (ua.includes('iphone')) {
    const match = ua.match(/os ([0-9_]+)/);
    if (match) {
      const osVersion = match[1].replace(/_/g, '.');
      return `iOS ${osVersion}`;
    }
    return 'iOS';
  }
  
  // iPadOS detection
  if (ua.includes('ipad')) {
    const match = ua.match(/os ([0-9_]+)/);
    if (match) {
      const osVersion = match[1].replace(/_/g, '.');
      return `iPadOS ${osVersion}`;
    }
    return 'iPadOS';
  }
  
  // macOS detection
  if (ua.includes('mac os x')) {
    const match = ua.match(/mac os x ([0-9_]+)/);
    if (match) {
      const osVersion = match[1].replace(/_/g, '.');
      return `macOS ${osVersion}`;
    }
    return 'macOS';
  }
  
  // Linux detection
  if (ua.includes('linux')) {
    const linuxDistros = [
      { match: 'ubuntu', name: 'Ubuntu Linux' },
      { match: 'fedora', name: 'Fedora Linux' },
      { match: 'debian', name: 'Debian Linux' }
    ];
    
    for (const distro of linuxDistros) {
      if (ua.includes(distro.match)) {
        return distro.name;
      }
    }
    
    return 'Linux';
  }
  
  // Chrome OS
  if (ua.includes('cros')) {
    return 'Chrome OS';
  }
  
  return 'Unknown';
}
