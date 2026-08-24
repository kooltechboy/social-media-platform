import React from 'react';
import { redirect } from 'next/navigation';
import { Settings, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { createSupabaseServerClient, getCurrentUser } from '../../lib/supabase/server';
import ProfileEditForm from '../../components/profile-edit-form';

export const dynamic = 'force-dynamic';

interface ProfileRow {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  website: string | null;
}

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, display_name, bio, website')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) redirect('/login');

  const profileRow = profile as unknown as ProfileRow;

  return (
    <div className="min-h-screen bg-[#090D16] text-brand-sandstone">
      <header className="sticky top-0 z-50 bg-[#0F172A]/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center gap-4">
        <Link
          href={`/profile/${user.username}`}
          className="flex items-center gap-2 text-slate-300 hover:text-brand-sandstone text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Profile
        </Link>
        <h1 className="text-lg font-extrabold text-brand-sandstone flex items-center gap-2">
          <Settings className="w-5 h-5 text-brand-caribbeanSea" /> Account Settings
        </h1>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6">
        <section className="bg-brand-dusk/70 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-sm font-bold text-brand-sandstone mb-4">Edit Profile</h2>
          <ProfileEditForm
            currentDisplayName={profileRow.display_name}
            currentBio={profileRow.bio ?? ''}
            currentWebsite={profileRow.website ?? ''}
            username={profileRow.username}
          />
        </section>

        <section className="bg-brand-dusk/70 border border-slate-800 rounded-2xl p-6 space-y-3">
          <h2 className="text-sm font-bold text-brand-sandstone">Account</h2>
          <div className="text-xs text-brand-sandstone/60 space-y-2">
            <p>
              <span className="text-brand-sandstone/40">Email:</span>{' '}
              <span className="text-slate-200">{user.email}</span>
            </p>
            <p>
              <span className="text-brand-sandstone/40">Username:</span>{' '}
              <span className="text-slate-200">@{profileRow.username}</span>
            </p>
          </div>
        </section>

        <section className="bg-brand-dusk/70 border border-rose-900/40 rounded-2xl p-6 space-y-3">
          <h2 className="text-sm font-bold text-rose-400">Danger Zone</h2>
          <p className="text-xs text-brand-sandstone/60">
            Account deletion permanently removes your profile, posts, and all associated data. This action cannot be undone.
          </p>
          <button
            disabled
            className="bg-rose-500/10 border border-rose-500/40 text-rose-400 font-bold text-xs px-4 py-2 rounded-xl opacity-60 cursor-not-allowed"
          >
            Delete Account (coming soon)
          </button>
        </section>
      </main>
    </div>
  );
}
