import dotenv from 'dotenv';
import Joi from 'joi';

dotenv.config();

export type NodeEnv = 'development' | 'production' | 'test';

export interface AppConfig {
  server: {
    nodeEnv: NodeEnv;
    port: number;
    apiVersion: string;
    baseUrl: string;
    useRealGeolocationInDev: boolean;
    defaultPassword: string;
  };
  database: {
    host: string;
    port: number;
    user: string;
    password: string;
    name: string;
    ssl: boolean;
    timezone: string;
    pool: {
      connectionLimit: number;
      acquireTimeout: number;
      timeout: number;
    };
  };
  redis: {
    host: string;
    port: number;
    password: string;
    db: number;
    ttlSeconds: number;
    keyPrefix: string;
  };
  jwt: {
    algorithm: 'HS256' | 'RS256';
    secret?: string;
    privateKey?: string;
    publicKey?: string;
    expiresIn: string;
    refreshSecret?: string;
    refreshExpiresIn: string;
    issuer: string;
    audience: string;
  };
  oauth: {
    google: { clientId: string; clientSecret: string; callbackUrl: string };
    microsoft: {
      clientId: string;
      clientSecret: string;
      tenantId: string;
      callbackUrl: string;
    };
    github: { clientId: string; clientSecret: string; callbackUrl: string };
    linkedin: { clientId: string; clientSecret: string; callbackUrl: string };
  };
  email: {
    service: string;
    host: string;
    port: number;
    secure: boolean;
    user: string;
    password: string;
  };
  frontend: {
    url: string;
    successRedirect: string;
    errorRedirect: string;
    emailVerificationUrl: string;
    passwordResetUrl: string;
  };
  security: {
    bcryptRounds: number;
    maxLoginAttempts: number;
    lockoutDurationMinutes: number;
    rateLimit: {
      windowMs: number;
      maxRequests: number;
      authWindowMs: number;
      authMaxRequests: number;
    };
    cors: {
      origin: string[];
      credentials: boolean;
      methods: string[];
      allowedHeaders: string[];
    };
  };
  logging: {
    level: string;
    file: string;
    errorFile: string;
    maxSize: string;
    maxFiles: string;
  };
  audit: {
    logEnabled: boolean;
    retentionDays: number;
  };
  sms: {
    accountSid: string;
    authToken: string;
    verifyServiceSid: string;
  };
  features: {
    twoFactorEnabled: boolean;
    emailVerificationRequired: boolean;
    oauthAccountLinking: boolean;
    adminPanel: boolean;
    auditLogging: boolean;
    rateLimiting: boolean;
    phoneVerificationEnabled: boolean;
  };
}

const schema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().integer().min(1).max(65535).default(3001),
  API_VERSION: Joi.string().default('v1'),
  DEFAULT_PASSWORD: Joi.string().default('Password123@'),
  BASE_URL: Joi.string().uri().default('http://localhost:3001'),
  USE_REAL_GEOLOCATION_IN_DEV: Joi.boolean()
    .truthy('true')
    .falsy('false')
    .default(false),

  MYSQL_HOST: Joi.string().default('localhost'),
  MYSQL_PORT: Joi.number().integer().default(3306),
  MYSQL_USER: Joi.string().default('root'),
  MYSQL_PASSWORD: Joi.string().allow('').default('root'),
  MYSQL_DATABASE: Joi.string().default('auth_backend'),
  MYSQL_SSL: Joi.boolean().truthy('true').falsy('false').default(false),
  MYSQL_TIMEZONE: Joi.string().default('America/Lima'),
  MYSQL_CONNECTION_LIMIT: Joi.number().integer().default(10),
  MYSQL_ACQUIRE_TIMEOUT: Joi.number().integer().default(60000),
  MYSQL_TIMEOUT: Joi.number().integer().default(60000),

  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().integer().default(6380),
  REDIS_PASSWORD: Joi.string().allow('').default('root'),
  REDIS_DB: Joi.number().integer().default(0),
  REDIS_TTL: Joi.number().integer().default(3600),
  REDIS_KEY_PREFIX: Joi.string().default('auth:'),

  JWT_SECRET: Joi.string().min(32).allow(''),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().min(32).allow(''),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  JWT_ISSUER: Joi.string().default('auth-backend'),
  JWT_AUDIENCE: Joi.string().default('auth-frontend'),
  JWT_PRIVATE_KEY: Joi.string().allow(''),
  JWT_PUBLIC_KEY: Joi.string().allow(''),

  GOOGLE_CLIENT_ID: Joi.string().allow('').default(''),
  GOOGLE_CLIENT_SECRET: Joi.string().allow('').default(''),
  GOOGLE_CALLBACK_URL: Joi.string().allow('').default(''),

  MICROSOFT_CLIENT_ID: Joi.string().allow('').default(''),
  MICROSOFT_CLIENT_SECRET: Joi.string().allow('').default(''),
  MICROSOFT_TENANT_ID: Joi.string().allow('').default('common'),
  MICROSOFT_CALLBACK_URL: Joi.string().allow('').default(''),

  GITHUB_CLIENT_ID: Joi.string().allow('').default(''),
  GITHUB_CLIENT_SECRET: Joi.string().allow('').default(''),
  GITHUB_CALLBACK_URL: Joi.string().allow('').default(''),

  LINKEDIN_CLIENT_ID: Joi.string().allow('').default(''),
  LINKEDIN_CLIENT_SECRET: Joi.string().allow('').default(''),
  LINKEDIN_CALLBACK_URL: Joi.string().allow('').default(''),

  EMAIL_SERVICE: Joi.string().default('smtp'),
  EMAIL_HOST: Joi.string().default('smtp.gmail.com'),
  EMAIL_PORT: Joi.number().integer().default(587),
  EMAIL_SECURE: Joi.boolean().truthy('true').falsy('false').default(false),
  EMAIL_USER: Joi.string().allow('').default(''),
  EMAIL_PASSWORD: Joi.string().allow('').default(''),

  FRONTEND_URL: Joi.string().uri().default('http://localhost:4200'),
  FRONTEND_SUCCESS_REDIRECT: Joi.string().default('/auth/success'),
  FRONTEND_ERROR_REDIRECT: Joi.string().default('/auth/error'),
  FRONTEND_EMAIL_VERIFICATION_URL: Joi.string()
    .uri()
    .default('http://localhost:4200/auth/verify-email'),
  FRONTEND_PASSWORD_RESET_URL: Joi.string()
    .uri()
    .default('http://localhost:4200/auth/reset-password'),

  BCRYPT_ROUNDS: Joi.number().integer().min(4).default(12),

  RATE_LIMIT_WINDOW_MS: Joi.number().integer().default(60000),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().integer().default(100),
  RATE_LIMIT_AUTH_WINDOW_MS: Joi.number().integer().default(60000),
  RATE_LIMIT_AUTH_MAX_REQUESTS: Joi.number().integer().default(5),

  CORS_ORIGIN: Joi.string().default('http://localhost:4200'),
  CORS_CREDENTIALS: Joi.boolean().truthy('true').falsy('false').default(true),
  CORS_METHODS: Joi.string().default('GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS'),
  CORS_ALLOWED_HEADERS: Joi.string().default(
    'Content-Type,Authorization,X-Requested-With'
  ),

  LOG_LEVEL: Joi.string().default('info'),
  LOG_FILE: Joi.string().default('logs/app.log'),
  LOG_ERROR_FILE: Joi.string().default('logs/error.log'),
  LOG_MAX_SIZE: Joi.string().default('20m'),
  LOG_MAX_FILES: Joi.string().default('14d'),

  FEATURE_2FA_ENABLED: Joi.boolean()
    .truthy('true')
    .falsy('false')
    .default(true),
  FEATURE_EMAIL_VERIFICATION_REQUIRED: Joi.boolean()
    .truthy('true')
    .falsy('false')
    .default(true),
  FEATURE_OAUTH_ACCOUNT_LINKING: Joi.boolean()
    .truthy('true')
    .falsy('false')
    .default(true),
  FEATURE_ADMIN_PANEL: Joi.boolean()
    .truthy('true')
    .falsy('false')
    .default(true),
  FEATURE_AUDIT_LOGGING: Joi.boolean()
    .truthy('true')
    .falsy('false')
    .default(true),
  FEATURE_RATE_LIMITING: Joi.boolean()
    .truthy('true')
    .falsy('false')
    .default(false),

  AUDIT_LOG_ENABLED: Joi.boolean().truthy('true').falsy('false').default(true),
  AUDIT_LOG_RETENTION_DAYS: Joi.number().integer().min(1).default(90),

  TWILIO_ACCOUNT_SID: Joi.string().allow('').default(''),
  TWILIO_AUTH_TOKEN: Joi.string().allow('').default(''),
  TWILIO_VERIFY_SERVICE_SID: Joi.string().allow('').default(''),

  MAX_LOGIN_ATTEMPTS: Joi.number().integer().min(3).default(5),
  LOCKOUT_DURATION_MINUTES: Joi.number().integer().min(5).default(15),

  FEATURE_PHONE_VERIFICATION_ENABLED: Joi.boolean()
    .truthy('true')
    .falsy('false')
    .default(true),
}).unknown();

const { value, error } = schema.validate(process.env, { abortEarly: false });
if (error) {
  // eslint-disable-next-line no-console
  console.error(
    'Invalid environment configuration:',
    error.details.map((d) => d.message).join('; ')
  );
  process.exit(1);
}

const parseCsv = (text: string): string[] =>
  text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

export const config: AppConfig = {
  server: {
    nodeEnv: value.NODE_ENV,
    port: value.PORT,
    apiVersion: value.API_VERSION,
    baseUrl: value.BASE_URL,
    useRealGeolocationInDev: value.USE_REAL_GEOLOCATION_IN_DEV,
    defaultPassword: value.DEFAULT_PASSWORD,
  },
  database: {
    host: value.MYSQL_HOST,
    port: value.MYSQL_PORT,
    user: value.MYSQL_USER,
    password: value.MYSQL_PASSWORD,
    name: value.MYSQL_DATABASE,
    ssl: value.MYSQL_SSL,
    timezone: value.MYSQL_TIMEZONE,
    pool: {
      connectionLimit: value.MYSQL_CONNECTION_LIMIT,
      acquireTimeout: value.MYSQL_ACQUIRE_TIMEOUT,
      timeout: value.MYSQL_TIMEOUT,
    },
  },
  redis: {
    host: value.REDIS_HOST,
    port: value.REDIS_PORT,
    password: value.REDIS_PASSWORD,
    db: value.REDIS_DB,
    ttlSeconds: value.REDIS_TTL,
    keyPrefix: value.REDIS_KEY_PREFIX,
  },
  jwt: {
    algorithm:
      value.JWT_PRIVATE_KEY && value.JWT_PUBLIC_KEY ? 'RS256' : 'HS256',
    secret:
      value.JWT_PRIVATE_KEY && value.JWT_PUBLIC_KEY
        ? undefined
        : value.JWT_SECRET,
    privateKey: value.JWT_PRIVATE_KEY || undefined,
    publicKey: value.JWT_PUBLIC_KEY || undefined,
    expiresIn: value.JWT_EXPIRES_IN,
    refreshSecret:
      value.JWT_PRIVATE_KEY && value.JWT_PUBLIC_KEY
        ? undefined
        : value.JWT_REFRESH_SECRET,
    refreshExpiresIn: value.JWT_REFRESH_EXPIRES_IN,
    issuer: value.JWT_ISSUER,
    audience: value.JWT_AUDIENCE,
  },
  oauth: {
    google: {
      clientId: value.GOOGLE_CLIENT_ID,
      clientSecret: value.GOOGLE_CLIENT_SECRET,
      callbackUrl: value.GOOGLE_CALLBACK_URL,
    },
    microsoft: {
      clientId: value.MICROSOFT_CLIENT_ID,
      clientSecret: value.MICROSOFT_CLIENT_SECRET,
      tenantId: value.MICROSOFT_TENANT_ID,
      callbackUrl: value.MICROSOFT_CALLBACK_URL,
    },
    github: {
      clientId: value.GITHUB_CLIENT_ID,
      clientSecret: value.GITHUB_CLIENT_SECRET,
      callbackUrl: value.GITHUB_CALLBACK_URL,
    },
    linkedin: {
      clientId: value.LINKEDIN_CLIENT_ID,
      clientSecret: value.LINKEDIN_CLIENT_SECRET,
      callbackUrl: value.LINKEDIN_CALLBACK_URL,
    },
  },
  email: {
    service: value.EMAIL_SERVICE,
    host: value.EMAIL_HOST,
    port: value.EMAIL_PORT,
    secure: value.EMAIL_SECURE,
    user: value.EMAIL_USER,
    password: value.EMAIL_PASSWORD,
  },
  frontend: {
    url: value.FRONTEND_URL,
    successRedirect: value.FRONTEND_SUCCESS_REDIRECT,
    errorRedirect: value.FRONTEND_ERROR_REDIRECT,
    emailVerificationUrl: value.FRONTEND_EMAIL_VERIFICATION_URL,
    passwordResetUrl: value.FRONTEND_PASSWORD_RESET_URL,
  },
  security: {
    bcryptRounds: value.BCRYPT_ROUNDS,
    maxLoginAttempts: value.MAX_LOGIN_ATTEMPTS,
    lockoutDurationMinutes: value.LOCKOUT_DURATION_MINUTES,
    rateLimit: {
      windowMs: value.RATE_LIMIT_WINDOW_MS,
      maxRequests: value.RATE_LIMIT_MAX_REQUESTS,
      authWindowMs: value.RATE_LIMIT_AUTH_WINDOW_MS,
      authMaxRequests: value.RATE_LIMIT_AUTH_MAX_REQUESTS,
    },
    cors: {
      origin: parseCsv(value.CORS_ORIGIN),
      credentials: value.CORS_CREDENTIALS,
      methods: parseCsv(value.CORS_METHODS),
      allowedHeaders: parseCsv(value.CORS_ALLOWED_HEADERS),
    },
  },
  logging: {
    level: value.LOG_LEVEL,
    file: value.LOG_FILE,
    errorFile: value.LOG_ERROR_FILE,
    maxSize: value.LOG_MAX_SIZE,
    maxFiles: value.LOG_MAX_FILES,
  },
  features: {
    twoFactorEnabled: value.FEATURE_2FA_ENABLED,
    emailVerificationRequired: value.FEATURE_EMAIL_VERIFICATION_REQUIRED,
    oauthAccountLinking: value.FEATURE_OAUTH_ACCOUNT_LINKING,
    adminPanel: value.FEATURE_ADMIN_PANEL,
    auditLogging: value.FEATURE_AUDIT_LOGGING,
    rateLimiting: value.FEATURE_RATE_LIMITING,
    phoneVerificationEnabled: value.FEATURE_PHONE_VERIFICATION_ENABLED,
  },
  sms: {
    accountSid: value.TWILIO_ACCOUNT_SID,
    authToken: value.TWILIO_AUTH_TOKEN,
    verifyServiceSid: value.TWILIO_VERIFY_SERVICE_SID,
  },
  audit: {
    logEnabled: value.AUDIT_LOG_ENABLED,
    retentionDays: value.AUDIT_LOG_RETENTION_DAYS,
  },
};

export default config;
