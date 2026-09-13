import React from 'react';
import { Bell, Heart, MessageCircle, MessageSquare, UserPlus, Calendar, Wallet, ShieldCheck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { createSupabaseServerClient, getCurrentUser } from '../../lib/supabase/server';
import NotificationMarkRead from '../../components/notification-mark-read';

export const dynamic = 'force-dynamic';

interface DBNotification {
  id: string;
  kind: string;
  entity_id?: string;
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
  const cls = 'w-4 h-4 md:w-5 md:h-5';
  if (kind === 'message') return <MessageSquare className={`${cls} text-brand-caribbeanSea`} />;
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
    case 'message':
      return n.payload?.preview ? `sent you a message: "${n.payload.preview}"` : 'sent you a direct message';
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
      <div className="min-h-screen bg-transparent text-brand-sandstone flex items-center justify-center p-6">
        <div className="surface-card rounded-3xl p-8 sm:p-10 text-center max-w-sm w-full space-y-5 border border-white/15 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center mx-auto text-orange-400">
            <Bell className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-black text-white">Notifications</h1>
            <p className="text-sm text-brand-sandstone/80 leading-relaxed">
              Sign in to see your updates, mentions, tips, orders, and Caribbean community reactions.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/login?next=/notifications"
              className="w-full inline-flex items-center justify-center bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-400 hover:brightness-110 text-slate-950 font-black px-6 py-3 rounded-2xl text-sm transition-all shadow-md shadow-orange-500/20 min-h-[44px]"
            >
              Sign In
            </Link>
          </div>
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
      .select('id, kind, entity_id, payload, read_at, created_at, actor:actor_id(display_name, username)')
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    notifications = (data ?? []) as unknown as DBNotification[];
    unreadCount = notifications.filter((n) => !n.read_at).length;
  }

  return (
    <div className="min-h-screen bg-transparent text-brand-sandstone pb-12">
      {/* Sticky Surface Header */}
      <header className="sticky top-0 z-50 surface-header backdrop-blur-xl border-b border-white/15 px-4 sm:px-6 py-4 shadow-xl">
        <div className="max-w-4xl 3xl:max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-brand-sandstone/70 hover:text-white text-sm md:text-base font-bold transition-colors min-h-[40px] md:min-h-[44px] px-2.5"
            >
              <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" /> Back
            </Link>
            <h1 className="text-lg sm:text-xl md:text-2xl font-black text-white flex items-center gap-2.5">
              <Bell className="w-5 h-5 md:w-6 md:h-6 text-orange-400" /> Notifications
              {unreadCount > 0 && (
                <span className="text-[11px] md:text-xs font-black px-2.5 md:px-3 py-0.5 md:py-1 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/40">
                  {unreadCount} new
                </span>
              )}
            </h1>
          </div>

          {unreadCount > 0 && (
            <div className="shrink-0">
              <NotificationMarkRead mode="all" />
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl 3xl:max-w-5xl mx-auto py-4 space-y-3 md:space-y-4">
        {notifications.length === 0 ? (
          <div className="surface-card rounded-3xl p-12 text-center space-y-4 max-w-md mx-auto mt-8 border border-white/10">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/15 flex items-center justify-center mx-auto text-brand-sandstone/60">
              <Bell className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg md:text-xl font-black text-white">No notifications yet</h3>
              <p className="text-sm md:text-base text-brand-sandstone/70 leading-relaxed md:leading-[1.6]">
                When Caribbean creators and friends interact with your content, tips, or orders, they&apos;ll appear here.
              </p>
            </div>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`surface-card surface-card-interactive rounded-2xl p-4 sm:p-5 md:p-6 flex items-start gap-4 md:gap-5 transition-all ${
                !notification.read_at
                  ? 'border-orange-500/40 bg-orange-950/10'
                  : 'border-white/10'
              }`}
            >
              <div className="w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-slate-900 border border-white/15 flex items-center justify-center flex-shrink-0 shadow-inner">
                <NotificationIcon kind={notification.kind} />
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <p className="text-sm sm:text-base md:text-[16px] text-brand-sandstone/90 leading-snug md:leading-relaxed">
                  {notification.actor ? (
                    <Link
                      href={`/profile/${notification.actor.username}`}
                      className="font-black text-white hover:text-orange-400 transition-colors"
                    >
                      {notification.actor.display_name}
                    </Link>
                  ) : (
                    <span className="font-black text-white">System</span>
                  )}{' '}
                  <span className="font-medium">{notificationActionText(notification)}</span>
                </p>
                {notification.payload?.post_id && (
                  <Link
                    href={`/?post=${notification.payload.post_id}`}
                    className="inline-flex items-center gap-1.5 text-xs md:text-sm font-black text-orange-400 hover:text-orange-300 mt-1 min-h-[36px] md:min-h-[40px]"
                  >
                    View Post →
                  </Link>
                )}
                {notification.payload?.event_id && (
                  <Link
                    href="/events"
                    className="inline-flex items-center gap-1.5 text-xs md:text-sm font-black text-amber-400 hover:text-amber-300 mt-1 min-h-[36px] md:min-h-[40px]"
                  >
                    View Event Details →
                  </Link>
                )}
                {notification.payload?.stream_id && (
                  <Link
                    href={`/live?id=${notification.payload.stream_id}`}
                    className="inline-flex items-center gap-1.5 text-xs md:text-sm font-black text-rose-400 hover:text-rose-300 mt-1 min-h-[36px] md:min-h-[40px]"
                  >
                    Join Live Stream →
                  </Link>
                )}
                {(notification.kind === 'message' || notification.payload?.conversation_id) && (
                  <Link
                    href={`/messages?c=${notification.payload?.conversation_id || notification.entity_id || ''}`}
                    className="inline-flex items-center gap-1.5 text-xs md:text-sm font-black text-brand-caribbeanSea hover:underline mt-1 min-h-[36px] md:min-h-[40px]"
                  >
                    Open Conversation →
                  </Link>
                )}
                <span className="text-xs md:text-sm text-brand-sandstone/50 font-medium block pt-0.5">
                  {relativeTime(notification.created_at)}
                </span>
              </div>
              {!notification.read_at && (
                <div className="flex items-center gap-2.5 flex-shrink-0 pt-1">
                  <span className="w-2.5 h-2.5 md:w-3 md:h-3 bg-orange-400 rounded-full animate-pulse" aria-label="Unread" />
                  <NotificationMarkRead mode="single" notificationId={notification.id} />
                </div>
              )}
            </div>
          ))
        )}
        {notifications.length > 0 && (
          <p className="text-center text-xs md:text-sm text-brand-sandstone/50 py-6 font-medium">
            Showing last {notifications.length} notification{notifications.length !== 1 ? 's' : ''}.
          </p>
        )}
      </main>
    </div>
  );
}

