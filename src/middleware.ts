import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { 
  applySecurityHeaders, 
  checkSecurityThreats, 
  checkRateLimit,
  generateCSRFToken,
  validateCSRFToken
} from './middleware/security';
import { securityConfig } from './config/security';

// Paths that require authentication
const protectedPaths = [
  '/dashboard',
  '/reports',
  '/customers',
  '/sales-persons',
  '/api/reports',
  '/api/customers',
  '/api/sales-persons',
];

// Paths that are public
const publicPaths = [
  '/login',
  '/api/auth/login',
  '/api/health',
  '/',
];

// API paths that need CSRF protection
const csrfProtectedPaths = [
  '/api/reports',
  '/api/customers',
  '/api/sales-persons',
  '/api/auth/logout',
];

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const pathname = request.nextUrl.pathname;
  
  // Apply security headers to all responses
  applySecurityHeaders(response);
  
  // Force HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    const proto = request.headers.get('x-forwarded-proto');
    if (proto !== 'https') {
      return NextResponse.redirect(
        `https://${request.headers.get('host')}${request.nextUrl.pathname}${request.nextUrl.search}`,
        { status: 301 }
      );
    }
  }
  
  // Check for security threats
  const securityCheck = checkSecurityThreats(request);
  if (!securityCheck.isValid) {
    console.error(`Security threat detected: ${securityCheck.reason}`);
    return new NextResponse(
      JSON.stringify({ error: 'Invalid request' }),
      { 
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
  
  // Rate limiting
  const clientIdentifier = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const rateLimitConfig = securityConfig.rateLimiting.endpoints[pathname as keyof typeof securityConfig.rateLimiting.endpoints] || securityConfig.rateLimiting.endpoints.default;
  const rateLimitResult = checkRateLimit(`${clientIdentifier}:${pathname}`, rateLimitConfig);
  
  if (!rateLimitResult.allowed) {
    return new NextResponse(
      JSON.stringify({ 
        error: 'Too many requests. Please try again later.',
        retryAfter: rateLimitResult.retryAfter 
      }),
      { 
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(rateLimitResult.retryAfter || 60),
        },
      }
    );
  }
  
  // Check authentication for protected paths
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));
  const isPublicPath = publicPaths.some(path => pathname === path);
  
  if (isProtectedPath && !isPublicPath) {
    const token = request.cookies.get('auth-token');
    
    if (!token) {
      // Redirect to login for web pages, return 401 for API routes
      if (pathname.startsWith('/api/')) {
        return new NextResponse(
          JSON.stringify({ error: 'Authentication required' }),
          { 
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // TODO: Validate JWT token here
    // For now, we'll just check if it exists
  }
  
  // CSRF Protection for state-changing operations
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const isCSRFProtectedPath = csrfProtectedPaths.some(path => pathname.startsWith(path));
    
    if (isCSRFProtectedPath) {
      const csrfToken = request.headers.get('x-csrf-token');
      const sessionToken = request.cookies.get('csrf-token')?.value;
      
      if (!csrfToken || !sessionToken) {
        // Generate new CSRF token for forms
        if (!pathname.startsWith('/api/')) {
          const newToken = generateCSRFToken();
          response.cookies.set('csrf-token', newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
          });
        } else {
          return new NextResponse(
            JSON.stringify({ error: 'CSRF token missing' }),
            { 
              status: 403,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
      } else if (!validateCSRFToken(csrfToken, sessionToken)) {
        return new NextResponse(
          JSON.stringify({ error: 'Invalid CSRF token' }),
          { 
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }
  }
  
  // Add security headers for API responses
  if (pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};