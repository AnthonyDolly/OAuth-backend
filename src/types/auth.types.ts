export interface RegisterRequestBody {
	email: string;
	password: string;
}

export interface LoginRequestBody {
	email: string;
	password: string;
	code?: string;
	backup_code?: string;
}

export interface Tokens {
	access_token: string;
	refresh_token: string;
	token_type: 'Bearer';
}

export interface AuthTokensInternal {
	accessToken: string;
	refreshToken: string;
}

export interface AuthenticatedUserPayload {
	id: string;
	email: string;
}


