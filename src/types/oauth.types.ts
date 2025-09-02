export type OAuthProvider = 'google' | 'microsoft' | 'github' | 'linkedin';

export interface OAuthLinkPayload {
	provider: OAuthProvider;
	provider_id: string;
	provider_email?: string | null;
	provider_username?: string | null;
	raw_profile?: any;
}


