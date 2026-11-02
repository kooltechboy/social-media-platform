import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '../../../../lib/supabase/server';
import {
  validateUsername,
  generateUsernameSuggestions,
} from '../../../../lib/auth/validation';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawUsername = searchParams.get('username') || '';

  const validation = validateUsername(rawUsername);
  if (!validation.isValid) {
    if (validation.isReserved) {
      return NextResponse.json(
        {
          available: false,
          error: validation.error,
          suggestions: generateUsernameSuggestions(rawUsername),
        },
        { status: 200 }
      );
    }
    return NextResponse.json(
      {
        available: false,
        error: validation.error,
      },
      { status: 400 }
    );
  }

  const cleanUsername = rawUsername.trim().toLowerCase();

  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ available: true });
    }

    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id, username')
      .ilike('username', cleanUsername)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json({
        available: false,
        suggestions: generateUsernameSuggestions(cleanUsername),
      });
    }

    return NextResponse.json({ available: true });
  } catch {
    return NextResponse.json(
      { error: 'Service temporarily unavailable. Please try again.' },
      { status: 503 }
    );
  }
}
