import React from 'react';
import { redirect } from 'next/navigation';
import { Settings, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { createSupabaseServerClient, getCurrentUser } from '../../lib/supabase/server';
import SettingsView, { type NotificationPrefsData } from '../../components/settings-view';
import type { ProfileData } from '../../components/profile-edit-modal';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login?next=/settings');
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    redirect('/login?next=/settings');
  }

  const [profileResult, notifResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('notification_preferences').select('*').eq('profile_id', user.id).maybeSingle(),
  ]);

  if (!profileResult.data) {
    redirect('/login?next=/settings');
  }

  const profile = profileResult.data as unknown as ProfileData & {
    created_at?: string;
    theme_preference?: string | null;
    language_preference?: string | null;
    status?: string | null;
  };

  const defaultNotifPrefs: NotificationPrefsData = {
    push_enabled: true,
    email_enabled: true,
    sms_enabled: false,
    likes_enabled: true,
    comments_enabled: true,
    follows_enabled: true,
    mentions_enabled: true,
    messages_enabled: true,
    community_enabled: true,
    payments_enabled: true,
    marketing_enabled: false,
  };

  const notifPrefs: NotificationPrefsData = notifResult.data
    ? {
        push_enabled: notifResult.data.push_enabled ?? true,
        email_enabled: notifResult.data.email_enabled ?? true,
        sms_enabled: notifResult.data.sms_enabled ?? false,
        likes_enabled: notifResult.data.likes_enabled ?? true,
        comments_enabled: notifResult.data.comments_enabled ?? true,
        follows_enabled: notifResult.data.follows_enabled ?? true,
        mentions_enabled: notifResult.data.mentions_enabled ?? true,
        messages_enabled: notifResult.data.messages_enabled ?? true,
        community_enabled: notifResult.data.community_enabled ?? true,
        payments_enabled: (notifResult.data as any).payments_enabled ?? true,
        marketing_enabled: notifResult.data.marketing_enabled ?? false,
      }
    : defaultNotifPrefs;

  return (
    <div className="min-h-screen bg-transparent text-brand-sandstone">
      <header className="sticky top-0 z-40 bg-[#0F172A]/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between gap-4">
        <Link
          href={`/profile/${profile.username}`}
          className="flex items-center gap-2 text-slate-300 hover:text-brand-sandstone text-xs font-bold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Profile
        </Link>
        <div className="flex items-center gap-2 text-xs font-black text-brand-sandstone">
          <Settings className="w-4 h-4 text-brand-caribbeanSea" />
          <span>Account Settings</span>
        </div>
      </header>

      <main>
        <SettingsView
          initialProfile={profile}
          initialNotificationPrefs={notifPrefs}
          userEmail={user.email}
        />
      </main>
    </div>
  );
}
