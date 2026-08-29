import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { sanitizeRedirectUrl } from './lib/auth/redirect-utils';

/**
 * Authentication gateway routes:
 * Unauthenticated users access these to authenticate.
 * Authenticated users are automatically redirected away to home or their target destination.
 */
const AUTH_GATEWAY_ROUTES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
];

/**
 * Public routes explicitly exempt from authentication requirements.
 */
const PUBLIC_EXEMPT_ROUTES = [
  '/auth/callback',
  '/api/auth/check-username',
  '/api/v1/health',
  '/api/webhooks/stripe',
  '/api/payments/providers',
];

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  const pathname = request.nextUrl.pathname;

  // Check if route is an auth gateway route (/login, /signup, etc.)
  const isAuthGatewayRoute = AUTH_GATEWAY_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Check if route is a publicly exempt route
  const isPublicExemptRoute =
    PUBLIC_EXEMPT_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    ) ||
    pathname.startsWith('/api/payments/webhooks/') ||
    // Public RSS feeds for podcast distribution
    (pathname.startsWith('/api/v1/podcasts/') && pathname.endsWith('/rss'));

  let response = NextResponse.next({ request });

  // If Supabase environment is not configured, pass through in non-production environments
  if (!url || !anonKey) {
    if (process.env.NODE_ENV === 'production') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Service Unavailable' }, { status: 503 });
      }
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return response;
  }

  // Create SSR-compatible Supabase client to inspect and refresh auth session cookies
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  // 1. Authenticated users should NEVER see login/signup gateway screens
  if (user && isAuthGatewayRoute) {
    const rawNext = request.nextUrl.searchParams.get('next');
    const safeNext = sanitizeRedirectUrl(rawNext);
    return NextResponse.redirect(new URL(safeNext, request.url));
  }

  // 2. Publicly exempt routes pass through freely
  if (isPublicExemptRoute) {
    return response;
  }

  // 3. Auth gateway routes are accessible to unauthenticated visitors
  if (isAuthGatewayRoute) {
    return response;
  }

  // 4. If visitor is NOT authenticated:
  if (!user) {
    // 4a. API routes return 401 Unauthorized JSON
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required to access this resource.' },
        { status: 401 }
      );
    }

    // 4b. Root route (/) redirects cleanly to /login without redundant ?next=/
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // 4c. All other protected application routes redirect to /login with preserved next destination
    const loginUrl = new URL('/login', request.url);
    const returnPath = pathname + (request.nextUrl.search || '');
    loginUrl.searchParams.set('next', returnPath);
    return NextResponse.redirect(loginUrl);
  }

  // 5. Authenticated user accessing protected application route
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static asset extensions (.svg, .png, .jpg, .jpeg, .gif, .webp, .ico, .css, .js)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
};
