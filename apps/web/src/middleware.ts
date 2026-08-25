import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_ROUTES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/explore',
  '/terms',
  '/privacy',
  '/auth/callback',
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
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  const isOnboardingPage = pathname.startsWith('/onboarding') || pathname.startsWith('/signup');

  // Gated user check: if user is logged in, not on public/onboarding route, verify identity setup
  if (user && !isPublicRoute && !isOnboardingPage) {
    const { data: identity } = await supabase
      .from('profile_identity')
      .select('origin_country_iso')
      .eq('profile_id', user.id)
      .maybeSingle();

    if (!identity?.origin_country_iso) {
      return NextResponse.redirect(new URL('/signup/caribbean', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};
