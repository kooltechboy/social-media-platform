import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '../../../lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error && data.user) {
        // Check if user has completed cultural identity setup
        const { data: identity } = await supabase
          .from('profile_identity')
          .select('origin_country_iso')
          .eq('profile_id', data.user.id)
          .maybeSingle();

        if (!identity?.origin_country_iso) {
          // Send new OAuth users into onboarding
          return NextResponse.redirect(new URL('/signup/caribbean', request.url));
        }

        // Return user to requested URL
        const forwardUrl = next.startsWith('/') ? `${origin}${next}` : `${origin}/`;
        return NextResponse.redirect(forwardUrl);
      }
    }
  }

  // Fallback to home if no code or exchange failed
  return NextResponse.redirect(new URL(next.startsWith('/') ? next : '/', request.url));
}
