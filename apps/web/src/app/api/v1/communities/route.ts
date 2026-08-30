import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, getCurrentUser } from '../../../../lib/supabase/server';
import { CommunityPolicy } from '@caribbean/communities';

export const dynamic = 'force-dynamic';

const policy = new CommunityPolicy();

// GET /api/v1/communities
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();
  const country = searchParams.get('country')?.trim();
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 50);
  const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
  }

  try {
    let query = supabase
      .from('communities')
      .select('id, name, slug, description, join_policy, member_count, country_iso, created_by, created_at, countries(name, flag_emoji)', { count: 'exact' })
      .order('member_count', { ascending: false })
      .range(offset, offset + limit - 1);

    if (country) {
      query = query.eq('country_iso', country.toUpperCase());
    }

    if (q) {
      const sanitized = q.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim();
      if (sanitized) {
        query = query.or(`name.ilike.%${sanitized}%,description.ilike.%${sanitized}%`);
      }
    }

    const { data, count, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      communities: data ?? [],
      total: count ?? 0,
      limit,
      offset,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch communities' },
      { status: 500 }
    );
  }
}

// POST /api/v1/communities
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Authentication required to create a community' },
      { status: 401 }
    );
  }

  let body: { name?: string; description?: string; joinPolicy?: string; countryIso?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const name = String(body.name ?? '').trim();
  const description = body.description ? String(body.description).trim() : null;
  const joinPolicy = body.joinPolicy ?? 'public';
  const countryIso = body.countryIso ? String(body.countryIso).trim().toUpperCase() : null;

  if (!name || name.length < 3 || name.length > 80) {
    return NextResponse.json(
      { error: 'Community name must be between 3 and 80 characters' },
      { status: 400 }
    );
  }

  if (!['public', 'private', 'invite_only'].includes(joinPolicy)) {
    return NextResponse.json(
      { error: 'joinPolicy must be public, private, or invite_only' },
      { status: 400 }
    );
  }

  const slug = policy.slugify(name);
  if (!slug) {
    return NextResponse.json(
      { error: 'Could not generate a valid slug from community name' },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
  }

  try {
    // Check if slug already taken
    const { data: existing } = await supabase
      .from('communities')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    const uniqueSlug = existing ? `${slug}-${Math.floor(100 + Math.random() * 900)}` : slug;

    const { data: newCommunity, error: insertError } = await supabase
      .from('communities')
      .insert({
        name,
        slug: uniqueSlug,
        description,
        join_policy: joinPolicy,
        country_iso: countryIso,
        created_by: user.id,
        member_count: 1,
      })
      .select('id, name, slug, description, join_policy, member_count, country_iso, created_at')
      .single();

    if (insertError) throw insertError;

    // Add creator as active member
    await supabase.from('community_members').insert({
      community_id: newCommunity.id,
      profile_id: user.id,
      membership_status: 'active',
    });

    return NextResponse.json({ community: newCommunity }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to create community' },
      { status: 500 }
    );
  }
}
