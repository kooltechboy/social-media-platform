import React from 'react';
import { Bell, Heart, MessageCircle, UserPlus, Calendar, Wallet, ShieldCheck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { createSupabaseServerClient, getCurrentUser } from '../../lib/supabase/server';
import NotificationMarkRead from '../../components/notification-mark-read';

export const dynamic = 'force-dynamic';

interface DBNotification {
  id: string;
  kind: string;
  payload: Record<string, string>;
  read_at: string | null;
  created_at: string;
  actor: { display_name: string; username: string } | null;
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function NotificationIcon({ kind }: { kind: string }) {
  const cls = 'w-4 h-4';
  if (kind === 'reaction' || kind === 'post_reaction') return <Heart className={`${cls} text-brand-goldenHour`} />;
  if (kind === 'comment') return <MessageCircle className={`${cls} text-brand-caribbeanSea`} />;
  if (kind === 'follow') return <UserPlus className={`${cls} text-brand-sunriseCoral`} />;
  if (kind === 'payment' || kind === 'creator_tip' || kind === 'live_gift') return <Wallet className={`${cls} text-brand-sunriseCoral`} />;
  if (kind === 'event_reminder') return <Calendar className={`${cls} text-brand-goldenHour`} />;
  if (kind === 'moderation_resolved' || kind === 'appeal_outcome') return <ShieldCheck className={`${cls} text-brand-caribbeanSea`} />;
  return <Bell className={`${cls} text-brand-sandstone/60`} />;
}

function notificationActionText(n: DBNotification): string {
  switch (n.kind) {
    case 'reaction':
    case 'post_reaction':
      return 'reacted to your post';
    case 'comment':
      return 'commented on your post';
    case 'follow':
      return 'started following you';
    case 'creator_tip':
      return `sent you a tip${n.payload?.amount ? ` of ${n.payload.amount}` : ''}`;
    case 'live_gift':
      return 'sent a gift during your stream';
    case 'payment':
      return n.payload?.message ?? 'processed a payment';
    case 'event_reminder':
      return n.payload?.event_title ? `Upcoming event: ${n.payload.event_title}` : 'You have an upcoming event';
    case 'moderation_resolved':
      return 'Your moderation appeal has been resolved';
    case 'appeal_outcome':
      return n.payload?.outcome === 'upheld'
        ? 'Your appeal was reviewed and upheld in your favor'
        : 'Your appeal has been reviewed';
    default:
      return n.payload?.message ?? 'sent you a notification';
  }
}

export default async function NotificationsPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="min-h-screen bg-[#090D16] text-brand-sandstone flex items-center justify-center p-6">
        <div className="bg-brand-dusk/70 border border-slate-800 rounded-2xl p-8 text-center max-w-sm">
          <Bell className="w-8 h-8 text-brand-caribbeanSea mx-auto mb-3" />
          <h1 className="text-lg font-bold text-brand-sandstone mb-2">Notifications</h1>
          <p className="text-sm text-brand-sandstone/60 mb-4">Sign in to see your notifications.</p>
          <Link href="/login" className="inline-block bg-brand-caribbeanSea hover:bg-brand-caribbeanSea text-slate-950 font-bold px-5 py-2 rounded-full text-xs transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();
  let notifications: DBNotification[] = [];
  let unreadCount = 0;

  if (supabase) {
    const { data } = await supabase
      .from('notifications')
      .select('id, kind, payload, read_at, created_at, actor:actor_id(display_name, username)')
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    notifications = (data ?? []) as unknown as DBNotification[];
    unreadCount = notifications.filter((n) => !n.read_at).length;
  }

  return (
    <div className="min-h-screen bg-[#090D16] text-brand-sandstone">
      <header className="sticky top-0 z-50 bg-[#0F172A]/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 text-slate-300 hover:text-brand-sandstone text-sm font-semibold">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <h1 className="text-lg font-extrabold text-brand-sandstone flex items-center gap-2">
          <Bell className="w-5 h-5 text-brand-caribbeanSea" /> Notifications
          {unreadCount > 0 && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-brand-caribbeanSea/20 text-brand-caribbeanSea border border-brand-caribbeanSea/40">
              {unreadCount} new
            </span>
          )}
        </h1>
        {unreadCount > 0 && (
          <div className="ml-auto">
            <NotificationMarkRead mode="all" />
          </div>
        )}
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-2">
        {notifications.length === 0 ? (
          <div className="bg-brand-dusk/60 border border-dashed border-slate-800 rounded-2xl p-10 text-center mt-6">
            <Bell className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-brand-sandstone/60">No notifications yet.</p>
            <p className="text-xs text-brand-sandstone/40 mt-1">When people interact with your content, you will see it here.</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-start gap-3 bg-brand-dusk/70 border rounded-2xl p-4 transition-colors ${
                !notification.read_at ? 'border-sky-600/40' : 'border-slate-800'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-brand-dusk flex items-center justify-center flex-shrink-0">
                <NotificationIcon kind={notification.kind} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200 leading-snug">
                  {notification.actor ? (
                    <Link href={`/profile/${notification.actor.username}`} className="font-bold text-brand-sandstone hover:underline">
                      {notification.actor.display_name}
                    </Link>
                  ) : (
                    <span className="font-bold text-brand-sandstone">System</span>
                  )}{' '}
                  {notificationActionText(notification)}
                </p>
                <span className="text-[11px] text-brand-sandstone/40 mt-0.5 block">
                  {relativeTime(notification.created_at)}
                </span>
              </div>
              {!notification.read_at && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="w-2 h-2 bg-brand-caribbeanSea rounded-full" aria-label="Unread" />
                  <NotificationMarkRead mode="single" notificationId={notification.id} />
                </div>
              )}
            </div>
          ))
        )}
        {notifications.length > 0 && (
          <p className="text-center text-xs text-brand-sandstone/40 py-6">
            Showing last {notifications.length} notification{notifications.length !== 1 ? 's' : ''}.
          </p>
        )}
      </main>
    </div>
  );
}
