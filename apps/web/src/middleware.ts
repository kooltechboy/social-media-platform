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
  '/api/oembed',
  '/api/webhooks/carriers',
  '/embed',
  '/manifest.webmanifest',
  '/manifest.json',
  '/robots.txt',
  '/sitemap.xml',
  '/sw.js',
  '/offline',
  '/terms',
  '/privacy',
  '/help',
  '/learn',
  '/api/v1/help',
  '/explore',
  '/search',
  '/sounds',
  '/map',
  '/podcasts',
  '/reels',
  '/marketplace',
  '/events',
  '/post',
  '/profile',
  '/admin/bootstrap',
  '/live',
  '/communities',
  '/pages',
];

import { checkRateLimit, getRateLimitHeaders, type RateLimitTier } from './lib/rate-limit/sliding-window';

function detectLocaleFromHeaders(header: string | null): string {
  if (!header) return 'en';
  const lower = header.toLowerCase();
  if (lower.startsWith('ht') || lower.includes('kreyol') || lower.includes('creole')) return 'ht';
  if (lower.startsWith('pap') || lower.includes('papiamentu') || lower.includes('papiamento')) return 'pap';
  if (lower.startsWith('es')) return 'es';
  if (lower.startsWith('fr')) return 'fr';
  if (lower.startsWith('nl')) return 'nl';
  return 'en';
}

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  const pathname = request.nextUrl.pathname;

  // ── Fast classification (no I/O) ──
  const isAuthGatewayRoute = AUTH_GATEWAY_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  const isPublicExemptRoute =
    PUBLIC_EXEMPT_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    ) ||
    pathname.startsWith('/api/payments/webhooks/') ||
    (pathname.startsWith('/api/v1/podcasts/') && pathname.endsWith('/rss'));

  // Determine if this route actually needs an auth check. Public-exempt
  // routes and the root `/` page (which renders its own public front door)
  // never need getUser(), so we can skip the expensive Supabase call entirely.
  const needsAuthCheck = !isPublicExemptRoute && pathname !== '/';

  // ── Rate limit tier selection (no I/O) ──
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';

  let tier: RateLimitTier = 'burst';
  if (isAuthGatewayRoute && request.method !== 'GET') {
    tier = 'auth';
  } else if (pathname.startsWith('/api/auth/') && request.method !== 'GET') {
    tier = 'auth';
  } else if (pathname.startsWith('/api/')) {
    tier = 'api';
  }

  // ── Build the base response and headers ──
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);

  let response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // 0. Language & Locale Detection
  const existingLocale = request.cookies.get('tukubi_locale')?.value;
  let targetLocale = existingLocale;
  if (!existingLocale) {
    const acceptLang = request.headers.get('accept-language');
    targetLocale = detectLocaleFromHeaders(acceptLang);
    response.cookies.set('tukubi_locale', targetLocale, {
      path: '/',
      maxAge: 31536000,
      sameSite: 'lax',
    });
  }

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

  // ── Create Supabase client (no I/O yet — lazy until getUser) ──
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

  // ── Run rate limiting + auth IN PARALLEL to avoid serial latency ──
  // On mobile networks, running these sequentially (Redis ~200-1200ms + Supabase
  // auth ~300-800ms) regularly exceeds Vercel's Edge Middleware timeout.
  // By parallelizing, total wall-clock time = max(rateLimit, auth) instead of sum.
  const [rateLimitResult, authResult] = await Promise.all([
    checkRateLimit(clientIp, tier),
    needsAuthCheck
      ? supabase.auth.getUser()
      : Promise.resolve({ data: { user: null } } as { data: { user: any } }),
  ]);

  // Apply rate limit headers to response
  const rateLimitHeaders = getRateLimitHeaders(rateLimitResult);
  for (const [k, v] of Object.entries(rateLimitHeaders)) {
    response.headers.set(k, v);
  }

  // ── Rate limit enforcement ──
  if (!rateLimitResult.success) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Too Many Requests', message: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: rateLimitHeaders }
      );
    }
    return new NextResponse('Too Many Requests. Please slow down and try again later.', {
      status: 429,
      headers: { 'Content-Type': 'text/plain', ...rateLimitHeaders },
    });
  }

  // ── Auth resolution ──
  let user = authResult.data?.user ?? null;

  // In automated E2E test environments, recognize test session cookie if supabase auth is absent
  if (!user && process.env.PLAYWRIGHT_TEST === '1') {
    const testSessionCookie = request.cookies.get('tukubi_user_session')?.value;
    if (testSessionCookie) {
      try {
        const parsed = JSON.parse(decodeURIComponent(testSessionCookie));
        if (parsed?.id) {
          user = { id: parsed.id, email: parsed.email, user_metadata: parsed } as any;
        }
      } catch {}
    }
  }

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

    // 4b. Root route (/) renders the Public Front Door for first-time / unauthenticated visitors
    if (pathname === '/') {
      return response;
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
     * - sw.js, manifest.webmanifest, manifest.json
     * - static asset extensions (.svg, .png, .jpg, .jpeg, .gif, .webp, .ico, .css, .js)
     */
    '/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
};
