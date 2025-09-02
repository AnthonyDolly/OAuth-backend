import logger from '../utils/logger.util';

export interface ProviderValidationResult {
  isValid: boolean;
  verifiedEmail?: string;
  verifiedUsername?: string;
  errorMessage?: string;
}

/**
 * Validates if a provider_id actually exists with the OAuth provider
 */
export async function validateProviderAccount(
  provider: 'google' | 'microsoft' | 'github' | 'linkedin',
  providerId: string,
  accessToken?: string
): Promise<ProviderValidationResult> {
  try {
    switch (provider) {
      case 'github':
        return await validateGitHubUser(providerId);
      case 'google':
        return await validateGoogleUser(providerId, accessToken);
      case 'linkedin':
        return await validateLinkedInUser(providerId, accessToken);
      case 'microsoft':
        return await validateMicrosoftUser(providerId, accessToken);
      default:
        return { isValid: false, errorMessage: 'Unsupported provider' };
    }
  } catch (error) {
    logger.error('Provider validation error:', error);
    return { 
      isValid: false, 
      errorMessage: `Validation failed: ${(error as Error).message}` 
    };
  }
}

/**
 * Validate GitHub user by username or user ID
 */
async function validateGitHubUser(providerId: string): Promise<ProviderValidationResult> {
  try {
    // Try by user ID first (numeric)
    let url = `https://api.github.com/user/${providerId}`;
    let response = await fetch(url);
    
    // If not found by ID, try by username
    if (!response.ok && isNaN(Number(providerId))) {
      url = `https://api.github.com/users/${providerId}`;
      response = await fetch(url);
    }
    
    if (response.ok) {
      const user = await response.json();
      return {
        isValid: true,
        verifiedEmail: user.email,
        verifiedUsername: user.login
      };
    }
    
    return { 
      isValid: false, 
      errorMessage: `GitHub user '${providerId}' not found` 
    };
  } catch (error) {
    return { 
      isValid: false, 
      errorMessage: `GitHub API error: ${(error as Error).message}` 
    };
  }
}

/**
 * Validate Google user (requires valid access token)
 */
async function validateGoogleUser(
  providerId: string, 
  accessToken?: string
): Promise<ProviderValidationResult> {
  if (!accessToken) {
    logger.warn(`Google validation attempted without access token for ID: ${providerId}`);
    return { 
      isValid: false, 
      errorMessage: 'Google validation requires valid access token' 
    };
  }

  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (response.ok) {
      const user = await response.json();
      if (user.id === providerId) {
        return {
          isValid: true,
          verifiedEmail: user.email,
          verifiedUsername: user.name
        };
      } else {
        return {
          isValid: false,
          errorMessage: `Token belongs to different user (${user.id} vs ${providerId})`
        };
      }
    }

    return { 
      isValid: false, 
      errorMessage: 'Invalid Google access token' 
    };
  } catch (error) {
    return { 
      isValid: false, 
      errorMessage: `Google API error: ${(error as Error).message}` 
    };
  }
}

/**
 * Validate LinkedIn user (requires valid access token)
 */
async function validateLinkedInUser(
  providerId: string, 
  accessToken?: string
): Promise<ProviderValidationResult> {
  if (!accessToken) {
    logger.warn(`LinkedIn validation attempted without access token for ID: ${providerId}`);
    return { 
      isValid: false, 
      errorMessage: 'LinkedIn validation requires valid access token' 
    };
  }

  try {
    const response = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'LinkedIn-Version': '202405',
        'X-Restli-Protocol-Version': '2.0.0'
      }
    });

    if (response.ok) {
      const user = await response.json();
      if (user.sub === providerId) {
        return {
          isValid: true,
          verifiedEmail: user.email,
          verifiedUsername: user.name
        };
      } else {
        return {
          isValid: false,
          errorMessage: `Token belongs to different user (${user.sub} vs ${providerId})`
        };
      }
    }

    return { 
      isValid: false, 
      errorMessage: 'Invalid LinkedIn access token' 
    };
  } catch (error) {
    return { 
      isValid: false, 
      errorMessage: `LinkedIn API error: ${(error as Error).message}` 
    };
  }
}

/**
 * Validate Microsoft user (requires valid access token)
 */
async function validateMicrosoftUser(
  providerId: string, 
  accessToken?: string
): Promise<ProviderValidationResult> {
  if (!accessToken) {
    logger.warn(`Microsoft validation attempted without access token for ID: ${providerId}`);
    return { 
      isValid: false, 
      errorMessage: 'Microsoft validation requires valid access token' 
    };
  }

  try {
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (response.ok) {
      const user = await response.json();
      if (user.id === providerId) {
        return {
          isValid: true,
          verifiedEmail: user.mail || user.userPrincipalName,
          verifiedUsername: user.displayName
        };
      } else {
        return {
          isValid: false,
          errorMessage: `Token belongs to different user (${user.id} vs ${providerId})`
        };
      }
    }

    return { 
      isValid: false, 
      errorMessage: 'Invalid Microsoft access token' 
    };
  } catch (error) {
    return { 
      isValid: false, 
      errorMessage: `Microsoft API error: ${(error as Error).message}` 
    };
  }
}
