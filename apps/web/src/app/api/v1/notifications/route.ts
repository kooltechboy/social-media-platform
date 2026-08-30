import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, getCurrentUser } from '../../../../lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/v1/notifications
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Authentication required' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get('unread_only') === 'true';
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '30', 10), 1), 100);
  const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
  }

  try {
    let query = supabase
      .from('notifications')
      .select('id, kind, entity_type, entity_id, payload, read_at, created_at, actor:profiles!actor_id(display_name, username, avatar_url)', { count: 'exact' })
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (unreadOnly) {
      query = query.is('read_at', null);
    }

    const [notifResult, unreadCountResult] = await Promise.all([
      query,
      supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .is('read_at', null),
    ]);

    if (notifResult.error) throw notifResult.error;

    return NextResponse.json({
      notifications: notifResult.data ?? [],
      total: notifResult.count ?? 0,
      unreadCount: unreadCountResult.count ?? 0,
      limit,
      offset,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// PATCH /api/v1/notifications
export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Authentication required' },
      { status: 401 }
    );
  }

  let body: { notificationId?: string; readAll?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
  }

  const now = new Date().toISOString();

  try {
    if (body.readAll) {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: now })
        .eq('recipient_id', user.id)
        .is('read_at', null);

      if (error) throw error;
      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    }

    if (body.notificationId) {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: now })
        .eq('id', body.notificationId)
        .eq('recipient_id', user.id);

      if (error) throw error;
      return NextResponse.json({ success: true, message: 'Notification marked as read' });
    }

    return NextResponse.json(
      { error: 'Provide either notificationId or readAll: true' },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to update notifications' },
      { status: 500 }
    );
  }
}
