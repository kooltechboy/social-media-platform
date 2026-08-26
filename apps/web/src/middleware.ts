import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const AUTH_GATEWAY_ROUTES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
];

const PROTECTED_ROUTES = [
  '/settings',
  '/creator-studio',
  '/spotpay',
  '/messages',
  '/notifications',
  '/create',
  '/admin',
  '/moderation',
];

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return NextResponse.next();

  let response = NextResponse.next({ request });
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
  const pathname = request.nextUrl.pathname;

  // 1. Once authenticated, users should NEVER see login/signup forms again — direct to home
  const isAuthGatewayRoute = AUTH_GATEWAY_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (user && isAuthGatewayRoute) {
    const rawNext = request.nextUrl.searchParams.get('next');
    const safeNext = rawNext && rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/';
    return NextResponse.redirect(new URL(safeNext, request.url));
  }

  // 2. Protected routes require active authentication — if not signed in, redirect to /login with return URL
  const isProtectedRoute = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (!user && isProtectedRoute) {
    const loginUrl = new URL('/login', request.url);
    const returnPath = pathname + (request.nextUrl.search || '');
    loginUrl.searchParams.set('next', returnPath);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};
