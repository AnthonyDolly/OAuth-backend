export interface UpdateProfileBody {
	first_name?: string | null;
	last_name?: string | null;
	display_name?: string | null;
	avatar_url?: string | null;
	phone?: string | null;
	date_of_birth?: string | null;
	gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
	locale?: string | null;
	timezone?: string | null;
}

export interface Enable2FAResponse {
  secret: string;
  otpauth_url: string;
  qrcode_data_url: string;
  backup_codes: string[];
}

export interface BackupCodesResponse {
  codes: string[];
}

export interface PhoneVerificationRequest {
  phone: string;
}

export interface PhoneVerificationResponse {
  phone: string;
}

export interface VerifyPhoneRequest {
  code: string;
}

export interface VerifyPhoneResponse {
  phone: string;
  verified: boolean;
}

export interface SecurityInfoResponse {
  failed_login_attempts: number;
  is_locked: boolean;
  locked_until: Date | null;
  last_login_at: Date | null;
  last_login_ip: string | null;
  two_factor_enabled: boolean;
  phone_verified: boolean;
  email_verified: boolean;
}


