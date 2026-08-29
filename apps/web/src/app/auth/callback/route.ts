import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '../../../lib/supabase/server';
import { sanitizeRedirectUrl } from '../../../lib/auth/redirect-utils';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const rawNext = searchParams.get('next');
  const next = sanitizeRedirectUrl(rawNext);

  // If OAuth provider returned an error, redirect to login with user-friendly error message
  if (error) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', errorDescription || error || 'Authentication could not be completed.');
    return NextResponse.redirect(loginUrl);
  }

  if (code) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (!exchangeError && data.user) {
        // Ensure profile row exists for OAuth user
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id, username')
          .eq('id', data.user.id)
          .maybeSingle();

        if (!existingProfile) {
          const defaultUsername = (data.user.email?.split('@')[0] || `user_${data.user.id.slice(0, 8)}`).replace(/[^a-zA-Z0-9_.]/g, '').slice(0, 30);
          const fullName = data.user.user_metadata?.full_name || data.user.user_metadata?.name || defaultUsername;
          const avatarUrl = data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || null;

          try {
            await supabase.from('profiles').insert({
              id: data.user.id,
              username: defaultUsername,
              display_name: fullName,
              avatar_url: avatarUrl,
              account_type: 'personal',
              updated_at: new Date().toISOString(),
            });
          } catch (dbErr) {
            console.warn('OAuth profile creation fallback handled by DB triggers:', dbErr);
          }
        }

        // Return user to sanitized destination URL (home '/' by default)
        return NextResponse.redirect(new URL(next, request.url));
      }
    }
  }

  // Fallback to login with message if code exchange failed
  const fallbackUrl = new URL('/login', request.url);
  if (!code) {
    fallbackUrl.searchParams.set('error', 'Authentication session expired. Please sign in again.');
  }
  return NextResponse.redirect(fallbackUrl);
}
