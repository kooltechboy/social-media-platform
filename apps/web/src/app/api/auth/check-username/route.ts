import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '../../../../lib/supabase/server';

const USERNAME_REGEX = /^[a-zA-Z0-9_.]{3,30}$/;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawUsername = searchParams.get('username')?.trim().toLowerCase();

  if (!rawUsername) {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 });
  }

  if (!USERNAME_REGEX.test(rawUsername)) {
    return NextResponse.json(
      {
        available: false,
        error: 'Username must be 3-30 characters (letters, numbers, underscores, dots).',
      },
      { status: 400 }
    );
  }

  const reserved = [
    'admin', 'root', 'support', 'antilia', 'spotpay', 'official', 'help', 'api',
    'auth', 'explore', 'login', 'signup', 'settings', 'moderation', 'security'
  ];

  if (reserved.includes(rawUsername)) {
    return NextResponse.json(
      {
        available: false,
        error: 'This username is reserved by the platform.',
        suggestions: [`${rawUsername}_caribbean`, `${rawUsername}_official`, `the_${rawUsername}`],
      },
      { status: 200 }
    );
  }

  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      // Fallback if supabase not reachable
      return NextResponse.json({ available: true });
    }

    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id, username')
      .ilike('username', rawUsername)
      .maybeSingle();

    if (existingUser) {
      const randomSuffix = Math.floor(10 + Math.random() * 90);
      const suggestions = [
        `${rawUsername}${randomSuffix}`,
        `${rawUsername}_carib`,
        `iam_${rawUsername}`,
      ];

      return NextResponse.json({
        available: false,
        suggestions,
      });
    }

    return NextResponse.json({ available: true });
  } catch (err: any) {
    return NextResponse.json({ available: true, warning: 'Database check skipped' });
  }
}
