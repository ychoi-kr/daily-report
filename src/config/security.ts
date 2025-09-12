/**
 * Security Configuration
 * Central configuration for all security-related settings
 */

export const securityConfig = {
  // Session Configuration
  session: {
    name: 'session',
    secret: process.env.SESSION_SECRET || 'change-this-secret-in-production',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
  },
  
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'change-this-jwt-secret-in-production',
    algorithm: 'HS256' as const,
    expiresIn: '24h',
    issuer: 'daily-report-system',
    audience: 'daily-report-users',
  },
  
  // CSRF Configuration
  csrf: {
    enabled: true,
    tokenLength: 32,
    cookieName: 'csrf-token',
    headerName: 'x-csrf-token',
    maxAge: 60 * 60 * 1000, // 1 hour
  },
  
  // Rate Limiting Configuration
  rateLimiting: {
    enabled: true,
    trustProxy: true,
    endpoints: {
      '/api/auth/login': {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 5,
        message: 'Too many login attempts. Please try again later.',
      },
      '/api/auth/register': {
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 3,
        message: 'Too many registration attempts. Please try again later.',
      },
      '/api/auth/password-reset': {
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 3,
        message: 'Too many password reset attempts. Please try again later.',
      },
      '/api/reports': {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 100,
        message: 'Too many requests. Please slow down.',
      },
      '/api/customers': {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 100,
        message: 'Too many requests. Please slow down.',
      },
      '/api/sales-persons': {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 50,
        message: 'Too many requests. Please slow down.',
      },
      default: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 200,
        message: 'Too many requests. Please slow down.',
      },
    },
  },
  
  // Password Policy
  password: {
    minLength: 8,
    maxLength: 100,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    specialChars: '@$!%*?&',
    commonPasswordsBlacklist: [
      'password',
      '123456',
      'qwerty',
      'admin',
      'letmein',
      'welcome',
      'monkey',
      'dragon',
    ],
    bcryptRounds: 10,
  },
  
  // Content Security Policy
  csp: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-eval'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
  
  // CORS Configuration
  cors: {
    enabled: true,
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    exposedHeaders: ['X-Request-Id'],
    maxAge: 86400, // 24 hours
  },
  
  // Security Headers
  headers: {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'X-DNS-Prefetch-Control': 'off',
    'X-Download-Options': 'noopen',
    'X-Permitted-Cross-Domain-Policies': 'none',
  },
  
  // File Upload Security
  fileUpload: {
    enabled: false, // Enable when needed
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'text/csv',
    ],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.csv'],
    uploadDir: '/tmp/uploads',
    scanForViruses: true, // Requires additional setup
  },
  
  // Logging Configuration
  logging: {
    enabled: true,
    level: process.env.LOG_LEVEL || 'info',
    securityEvents: true,
    includeIp: true,
    includeUserAgent: true,
    excludePaths: ['/health', '/metrics'],
    sanitizeFields: ['password', 'token', 'secret', 'apiKey'],
  },
  
  // Brute Force Protection
  bruteForce: {
    enabled: true,
    freeRetries: 2,
    minWait: 500, // 0.5 seconds
    maxWait: 15 * 60 * 1000, // 15 minutes
    lifetime: 24 * 60 * 60, // 24 hours
    storeType: 'memory', // Use 'redis' in production
  },
  
  // API Security
  api: {
    requireApiKey: false, // Enable for public API
    apiKeyHeader: 'X-API-Key',
    versioning: true,
    defaultVersion: 'v1',
    deprecationWarning: true,
    maxRequestSize: '10mb',
    timeout: 30000, // 30 seconds
  },
  
  // Database Security
  database: {
    enableSSL: process.env.NODE_ENV === 'production',
    connectionTimeout: 5000,
    maxConnections: 20,
    enableQueryLogging: process.env.NODE_ENV !== 'production',
    sanitizeErrors: true,
  },
  
  // Email Security
  email: {
    verifyRecipients: true,
    maxRecipientsPerEmail: 50,
    rateLimitPerHour: 100,
    requireTLS: true,
    blockDisposableEmails: true,
  },
  
  // Two-Factor Authentication
  twoFactor: {
    enabled: false, // Enable when implementing 2FA
    issuer: 'Daily Report System',
    window: 1,
    tokenLength: 6,
    backupCodesCount: 10,
  },
  
  // Environment-specific settings
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTesting: process.env.NODE_ENV === 'test',
};

// Type exports for TypeScript
export type SecurityConfig = typeof securityConfig;
export type RateLimitConfig = typeof securityConfig.rateLimiting.endpoints.default;
export type PasswordPolicy = typeof securityConfig.password;
export type CSPDirectives = typeof securityConfig.csp.directives;