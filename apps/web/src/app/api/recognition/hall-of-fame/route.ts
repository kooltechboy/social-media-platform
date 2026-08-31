import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'founding_1000';

    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
    }

    if (category === 'founding_1000' || category === 'founding_elite_100') {
      const { data: members, error } = await supabase
        .from('founder_members')
        .select(`
          founder_number, formatted_number, allocated_at,
          profile:profiles(id, username, display_name, avatar_url, is_verified, account_type),
          program:founder_programs(name, designation)
        `)
        .eq('is_revoked', false)
        .order('founder_number', { ascending: true })
        .limit(100);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ category, members: members ?? [] });
    }

    if (category === 'ambassadors') {
      const { data: ambassadors, error } = await supabase
        .from('ambassador_members')
        .select(`
          territory, appointed_at,
          profile:profiles(id, username, display_name, avatar_url, is_verified)
        `)
        .eq('status', 'active')
        .order('appointed_at', { ascending: true });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ category, members: ambassadors ?? [] });
    }

    if (category === 'council') {
      const { data: council, error } = await supabase
        .from('founders_council_members')
        .select(`
          seat_number, joined_at,
          profile:profiles(id, username, display_name, avatar_url, is_verified)
        `)
        .eq('status', 'active')
        .order('joined_at', { ascending: true });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ category, members: council ?? [] });
    }

    return NextResponse.json({ category, members: [] });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
