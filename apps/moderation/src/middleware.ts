import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  const isLoginRoute = request.nextUrl.pathname.startsWith('/login');

  if (!user) {
    if (!isLoginRoute) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return response;
  }

  // Defense-in-depth: Verify moderator role authorization in middleware
  const { data: account } = await supabase
    .from('accounts')
    .select('role, status')
    .or(`profile_id.eq.${user.id},id.eq.${user.id}`)
    .maybeSingle();

  const isAuthorized = account && account.status === 'active' && ['moderator', 'admin', 'management', 'superadmin', 'super_admin'].includes(account.role);

  if (!isAuthorized) {
    if (!isLoginRoute) {
      return NextResponse.redirect(new URL('/login?error=unauthorized', request.url));
    }
  } else if (isLoginRoute) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
