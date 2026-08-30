'use client';

import React, { useState, useTransition } from 'react';
import {
  User,
  Shield,
  Bell,
  Lock,
  Palette,
  Globe,
  Download,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Loader2,
  Phone,
  Mail,
  Camera,
  LogOut,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from './auth-provider';
import { AvatarUpload, CoverUpload } from './avatar-upload';
import {
  updateProfileBasicAction,
  updateProfilePersonalInfoAction,
  updateProfileProfessionalAction,
  updateProfileSocialAction,
  updateProfilePrivacyAction,
  type ActionResponse,
} from '../lib/profile/profile-actions';
import {
  updateAccountAction,
  updatePasswordAction,
  updateNotificationPreferencesAction,
  updateThemeAction,
  updateLanguageAction,
  exportAccountDataAction,
  deactivateAccountAction,
  reactivateAccountAction,
} from '../lib/settings/settings-actions';
import type { ProfileData } from './profile-edit-modal';

export interface NotificationPrefsData {
  push_enabled: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
  likes_enabled: boolean;
  comments_enabled: boolean;
  follows_enabled: boolean;
  mentions_enabled: boolean;
  messages_enabled: boolean;
  community_enabled: boolean;
  payments_enabled: boolean;
  marketing_enabled: boolean;
}

interface SettingsViewProps {
  initialProfile: ProfileData & {
    created_at?: string;
    theme_preference?: string | null;
    language_preference?: string | null;
    status?: string | null;
  };
  initialNotificationPrefs: NotificationPrefsData;
  userEmail: string;
}

type SettingsSection =
  | 'account'
  | 'profile'
  | 'privacy'
  | 'notifications'
  | 'security'
  | 'appearance'
  | 'language'
  | 'data'
  | 'management';

export default function SettingsView({
  initialProfile,
  initialNotificationPrefs,
  userEmail,
}: SettingsViewProps) {
  const { signOut, refresh } = useAuth();
  const [activeSection, setActiveSection] = useState<SettingsSection>('account');
  const [profile, setProfile] = useState(initialProfile);
  const [notifPrefs, setNotifPrefs] = useState(initialNotificationPrefs);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ error: string | null; success: string | null }>({
    error: null,
    success: null,
  });

  // Danger zone confirmation state
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleGenericSubmit = (
    e: React.FormEvent<HTMLFormElement>,
    actionFn: (prev: ActionResponse, fd: FormData) => Promise<ActionResponse>
  ) => {
    e.preventDefault();
    setFeedback({ error: null, success: null });
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const res = await actionFn({ success: false }, formData);
        if (res.success) {
          setFeedback({ error: null, success: res.message || 'Saved successfully.' });
          await refresh();
        } else {
          setFeedback({ error: res.error || 'Failed to save changes.', success: null });
        }
      } catch {
        setFeedback({ error: 'A network error occurred. Please try again.', success: null });
      }
    });
  };

  const handleDownloadData = () => {
    startTransition(async () => {
      setFeedback({ error: null, success: null });
      try {
        const res = await exportAccountDataAction();
        if (res.success && res.data?.exportJson) {
          const blob = new Blob([res.data.exportJson], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `tukubi-account-data-${profile.username}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          setFeedback({ error: null, success: 'Account data package downloaded.' });
        } else {
          setFeedback({ error: res.error || 'Export failed.', success: null });
        }
      } catch {
        setFeedback({ error: 'Failed to export account data.', success: null });
      }
    });
  };

  const handleThemeChange = (theme: string) => {
    startTransition(async () => {
      const res = await updateThemeAction(theme);
      if (res.success) {
        setProfile((p) => ({ ...p, theme_preference: theme }));
        setFeedback({ error: null, success: res.message || 'Theme updated.' });
      } else {
        setFeedback({ error: res.error || 'Failed to update theme.', success: null });
      }
    });
  };

  const handleLanguageChange = (lang: string) => {
    startTransition(async () => {
      const res = await updateLanguageAction(lang);
      if (res.success) {
        setProfile((p) => ({ ...p, language_preference: lang }));
        setFeedback({ error: null, success: res.message || 'Language updated.' });
      } else {
        setFeedback({ error: res.error || 'Failed to update language.', success: null });
      }
    });
  };

  const handleDeactivate = () => {
    startTransition(async () => {
      const isDeactivated = profile.status === 'deactivated';
      const res = isDeactivated ? await reactivateAccountAction() : await deactivateAccountAction();
      if (res.success) {
        setProfile((p) => ({ ...p, status: isDeactivated ? 'active' : 'deactivated' }));
        setFeedback({ error: null, success: res.message || 'Account status updated.' });
      } else {
        setFeedback({ error: res.error || 'Failed to update status.', success: null });
      }
    });
  };

  const navItems: Array<{ id: SettingsSection; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'profile', label: 'Edit Profile', icon: Camera },
    { id: 'privacy', label: 'Privacy & Safety', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security & Password', icon: Lock },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'language', label: 'Language', icon: Globe },
    { id: 'data', label: 'Your Data', icon: Download },
    { id: 'management', label: 'Account Management', icon: AlertTriangle },
  ];

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-brand-sandstone tracking-tight">
            Settings &amp; Preferences
          </h1>
          <p className="text-xs text-brand-sandstone/60">
            Manage your Tukubi account credentials, privacy boundaries, and notifications.
          </p>
        </div>
        <Link
          href={`/profile/${profile.username}`}
          className="text-xs font-bold text-brand-caribbeanSea hover:underline flex items-center gap-1"
        >
          <span>View Public Profile</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <aside className="md:col-span-1 space-y-1">
          <nav className="bg-brand-dusk/60 border border-slate-800 rounded-2xl p-2 space-y-1" aria-label="Settings categories">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveSection(item.id);
                    setFeedback({ error: null, success: null });
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-brand-caribbeanSea text-slate-950 shadow-md font-black'
                      : 'text-brand-sandstone/70 hover:text-brand-sandstone hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="p-3 bg-brand-dusk/40 border border-slate-800 rounded-2xl">
            <span className="text-[11px] text-brand-sandstone/40 block font-semibold">Financial Settings</span>
            <Link
              href="/financial-center"
              className="text-xs font-bold text-brand-goldenHour hover:underline block mt-1"
            >
              TUKUBI Financial Center →
            </Link>
          </div>
        </aside>

        {/* Content Area */}
        <div className="md:col-span-3 space-y-6">
          {/* Feedback banner */}
          {feedback.error && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{feedback.error}</span>
            </div>
          )}
          {feedback.success && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{feedback.success}</span>
            </div>
          )}

          {/* 1. ACCOUNT */}
          {activeSection === 'account' && (
            <section className="bg-brand-dusk/70 border border-slate-800 rounded-3xl p-6 space-y-6">
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider text-brand-caribbeanSea">
                  Account Details
                </h2>
                <p className="text-xs text-brand-sandstone/60">
                  Primary credentials and contact information associated with your account.
                </p>
              </div>

              <form
                onSubmit={(e) => handleGenericSubmit(e, updateAccountAction)}
                className="space-y-4"
              >
                <div>
                  <label htmlFor="accountDisplayName" className="block text-xs font-bold text-brand-sandstone/70 mb-1">
                    Display Name
                  </label>
                  <input
                    id="accountDisplayName"
                    name="displayName"
                    required
                    maxLength={100}
                    defaultValue={profile.display_name}
                    className="w-full bg-[#131D33] border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-brand-sandstone/70 mb-1">
                      Email Address
                    </label>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-brand-sandstone/60">
                      <Mail className="w-3.5 h-3.5" />
                      <span>{userEmail}</span>
                    </div>
                    <span className="text-[10px] text-brand-sandstone/40">Managed via verified Supabase login.</span>
                  </div>

                  <div>
                    <label htmlFor="accountPhone" className="block text-xs font-bold text-brand-sandstone/70 mb-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 absolute left-3 top-2.5 text-brand-sandstone/40" />
                      <input
                        id="accountPhone"
                        name="phone"
                        type="tel"
                        placeholder="+1 (876) 000-0000"
                        defaultValue={profile.phone ?? ''}
                        className="w-full bg-[#131D33] border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#131D33] border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-brand-sandstone block">Account Status</span>
                    <span className="text-brand-sandstone/60">
                      Current standing: <strong className="text-emerald-400 uppercase">{profile.status || 'Active'}</strong>
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-black">
                    VERIFIED
                  </span>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-5 py-2 rounded-xl bg-brand-caribbeanSea text-slate-950 font-black text-xs hover:bg-brand-caribbeanSea transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{isPending ? 'Saving changes…' : 'Save Account Details'}</span>
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* 2. EDIT PROFILE */}
          {activeSection === 'profile' && (
            <section className="bg-brand-dusk/70 border border-slate-800 rounded-3xl p-6 space-y-6">
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider text-brand-caribbeanSea">
                  Profile Photos &amp; Information
                </h2>
                <p className="text-xs text-brand-sandstone/60">
                  Update your public photo, cover banner, and Caribbean identity.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-brand-sandstone mb-2">Avatar</h3>
                  <AvatarUpload
                    currentAvatarUrl={profile.avatar_url}
                    displayName={profile.display_name}
                    onAvatarUpdated={(url) => setProfile((p) => ({ ...p, avatar_url: url }))}
                  />
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <h3 className="text-xs font-bold text-brand-sandstone mb-2">Cover Banner</h3>
                  <CoverUpload
                    currentCoverUrl={profile.cover_url}
                    onCoverUpdated={(url) => setProfile((p) => ({ ...p, cover_url: url }))}
                  />
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <h3 className="text-xs font-bold text-brand-sandstone mb-3">Bio &amp; Details</h3>
                  <form
                    onSubmit={(e) => handleGenericSubmit(e, updateProfileBasicAction)}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="profDisplayName" className="block text-xs font-bold text-brand-sandstone/70 mb-1">
                          Display Name *
                        </label>
                        <input
                          id="profDisplayName"
                          name="displayName"
                          required
                          maxLength={100}
                          defaultValue={profile.display_name}
                          className="w-full bg-[#131D33] border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea"
                        />
                      </div>
                      <div>
                        <label htmlFor="profWebsite" className="block text-xs font-bold text-brand-sandstone/70 mb-1">
                          Website URL
                        </label>
                        <input
                          id="profWebsite"
                          name="website"
                          type="url"
                          placeholder="https://yoursite.com"
                          defaultValue={profile.website ?? ''}
                          className="w-full bg-[#131D33] border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="profBio" className="block text-xs font-bold text-brand-sandstone/70 mb-1">
                        Bio
                      </label>
                      <textarea
                        id="profBio"
                        name="bio"
                        rows={3}
                        maxLength={500}
                        placeholder="Tell your Caribbean story…"
                        defaultValue={profile.bio ?? ''}
                        className="w-full bg-[#131D33] border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea resize-none"
                      />
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={isPending}
                        className="px-5 py-2 rounded-xl bg-brand-caribbeanSea text-slate-950 font-black text-xs hover:bg-brand-caribbeanSea transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                      >
                        {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <span>{isPending ? 'Saving…' : 'Save Profile Changes'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </section>
          )}

          {/* 3. PRIVACY & SAFETY */}
          {activeSection === 'privacy' && (
            <section className="bg-brand-dusk/70 border border-slate-800 rounded-3xl p-6 space-y-6">
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider text-brand-caribbeanSea">
                  Privacy Boundaries
                </h2>
                <p className="text-xs text-brand-sandstone/60">
                  Control what information is shared publicly across diaspora feeds and search.
                </p>
              </div>

              <form
                onSubmit={(e) => handleGenericSubmit(e, updateProfilePrivacyAction)}
                className="space-y-4"
              >
                <div className="p-4 rounded-2xl bg-[#131D33] border border-slate-800 space-y-2">
                  <label htmlFor="setProfileVisibility" className="block text-xs font-bold text-brand-sandstone">
                    Account Visibility
                  </label>
                  <select
                    id="setProfileVisibility"
                    name="profileVisibility"
                    defaultValue={profile.profile_visibility ?? 'public'}
                    className="w-full bg-[#0D1527] border border-slate-700 rounded-xl px-3 py-2 text-xs text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea"
                  >
                    <option value="public">Public — Anyone can discover and view your profile</option>
                    <option value="followers">Followers Only — Only approved followers can view</option>
                    <option value="private">Private — Hidden from search and directory</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-[#131D33] border border-slate-800 space-y-2">
                    <label htmlFor="setDobVisibility" className="block text-xs font-bold text-brand-sandstone">
                      Date of Birth Visibility
                    </label>
                    <select
                      id="setDobVisibility"
                      name="dobVisibility"
                      defaultValue={profile.dob_visibility ?? 'private'}
                      className="w-full bg-[#0D1527] border border-slate-700 rounded-xl px-3 py-2 text-xs text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea"
                    >
                      <option value="private">Only Me (Private)</option>
                      <option value="followers">Followers Only</option>
                      <option value="public">Everyone</option>
                    </select>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#131D33] border border-slate-800 space-y-2">
                    <label htmlFor="setAddressVisibility" className="block text-xs font-bold text-brand-sandstone">
                      Address Visibility
                    </label>
                    <select
                      id="setAddressVisibility"
                      name="addressVisibility"
                      defaultValue={profile.address_visibility ?? 'private'}
                      className="w-full bg-[#0D1527] border border-slate-700 rounded-xl px-3 py-2 text-xs text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea"
                    >
                      <option value="private">Only Me (Private)</option>
                      <option value="followers">Followers Only</option>
                      <option value="public">Everyone</option>
                    </select>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#131D33] border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-brand-sandstone block">Online Status</span>
                    <span className="text-[11px] text-brand-sandstone/60">
                      Show when you are active on Tukubi
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="onlineStatusEnabled"
                      value="true"
                      defaultChecked={profile.online_status_enabled !== false}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-caribbeanSea"></div>
                  </label>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-5 py-2 rounded-xl bg-brand-caribbeanSea text-slate-950 font-black text-xs hover:bg-brand-caribbeanSea transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{isPending ? 'Saving…' : 'Save Privacy Settings'}</span>
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* 4. NOTIFICATIONS */}
          {activeSection === 'notifications' && (
            <section className="bg-brand-dusk/70 border border-slate-800 rounded-3xl p-6 space-y-6">
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider text-brand-caribbeanSea">
                  Notification Preferences
                </h2>
                <p className="text-xs text-brand-sandstone/60">
                  Select which notifications you receive across device push, email, and SMS.
                </p>
              </div>

              <form
                onSubmit={(e) => handleGenericSubmit(e, updateNotificationPreferencesAction)}
                className="space-y-5"
              >
                <div>
                  <h3 className="text-xs font-bold text-brand-sandstone/80 uppercase tracking-wider mb-2">
                    Notification Channels
                  </h3>
                  <div className="space-y-2">
                    {[
                      { key: 'push_enabled', label: 'Push Notifications', desc: 'Alerts sent to your mobile or browser.' },
                      { key: 'email_enabled', label: 'Email Notifications', desc: 'Updates and summaries sent to your email.' },
                      { key: 'sms_enabled', label: 'SMS Notifications', desc: 'Critical alerts sent via text message.' },
                    ].map((item) => (
                      <div
                        key={item.key}
                        className="p-3.5 rounded-2xl bg-[#131D33] border border-slate-800 flex items-center justify-between"
                      >
                        <div>
                          <span className="text-xs font-bold text-brand-sandstone block">{item.label}</span>
                          <span className="text-[11px] text-brand-sandstone/50">{item.desc}</span>
                        </div>
                        <input
                          type="checkbox"
                          name={item.key}
                          defaultChecked={(notifPrefs as any)[item.key]}
                          className="w-4 h-4 rounded text-brand-caribbeanSea focus:ring-brand-caribbeanSea"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <h3 className="text-xs font-bold text-brand-sandstone/80 uppercase tracking-wider mb-2">
                    Activity &amp; Ecosystem Alerts
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { key: 'likes_enabled', label: 'Likes & Reactions' },
                      { key: 'comments_enabled', label: 'Comments on Posts' },
                      { key: 'follows_enabled', label: 'New Followers' },
                      { key: 'mentions_enabled', label: 'Mentions & Tags' },
                      { key: 'messages_enabled', label: 'Direct Messages' },
                      { key: 'community_enabled', label: 'Diaspora Hub Updates' },
                      { key: 'payments_enabled', label: 'Payments & Financial Activity' },
                      { key: 'marketing_enabled', label: 'Platform Announcements' },
                    ].map((item) => (
                      <div
                        key={item.key}
                        className="p-3 rounded-xl bg-[#131D33] border border-slate-800 flex items-center justify-between"
                      >
                        <span className="text-xs text-brand-sandstone font-medium">{item.label}</span>
                        <input
                          type="checkbox"
                          name={item.key}
                          defaultChecked={(notifPrefs as any)[item.key]}
                          className="w-4 h-4 rounded text-brand-caribbeanSea focus:ring-brand-caribbeanSea"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-5 py-2 rounded-xl bg-brand-caribbeanSea text-slate-950 font-black text-xs hover:bg-brand-caribbeanSea transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{isPending ? 'Saving…' : 'Save Notifications'}</span>
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* 5. SECURITY */}
          {activeSection === 'security' && (
            <section className="bg-brand-dusk/70 border border-slate-800 rounded-3xl p-6 space-y-6">
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider text-brand-caribbeanSea">
                  Security &amp; Password
                </h2>
                <p className="text-xs text-brand-sandstone/60">
                  Update your authentication credentials and review account protection.
                </p>
              </div>

              <form
                onSubmit={(e) => handleGenericSubmit(e, updatePasswordAction)}
                className="space-y-4"
              >
                <div>
                  <label htmlFor="newPassword" className="block text-xs font-bold text-brand-sandstone/70 mb-1">
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    required
                    minLength={8}
                    placeholder="At least 8 characters"
                    className="w-full bg-[#131D33] border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea"
                  />
                  <span className="text-[10px] text-brand-sandstone/40">
                    Must include letters and numbers or symbols.
                  </span>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-xs font-bold text-brand-sandstone/70 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    minLength={8}
                    placeholder="Repeat new password"
                    className="w-full bg-[#131D33] border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-5 py-2 rounded-xl bg-brand-caribbeanSea text-slate-950 font-black text-xs hover:bg-brand-caribbeanSea transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{isPending ? 'Updating…' : 'Update Password'}</span>
                  </button>
                </div>
              </form>

              <div className="pt-4 border-t border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-brand-sandstone">Active Session</h3>
                <div className="p-4 rounded-2xl bg-[#131D33] border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-brand-sandstone block">Current Web Browser Session</span>
                    <span className="text-[11px] text-brand-sandstone/60">Signed in as {userEmail}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => void signOut()}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* 6. APPEARANCE */}
          {activeSection === 'appearance' && (
            <section className="bg-brand-dusk/70 border border-slate-800 rounded-3xl p-6 space-y-6">
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider text-brand-caribbeanSea">
                  Theme &amp; Appearance
                </h2>
                <p className="text-xs text-brand-sandstone/60">
                  Select your interface theme aesthetic.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { id: 'twilight', name: 'Caribbean Twilight (Default)', desc: 'Deep navy, twilight purple, and vibrant coral highlights.' },
                  { id: 'dark', name: 'Midnight Obsidian', desc: 'Ultra-dark slate contrast optimized for battery and OLED.' },
                  { id: 'light', name: 'Sunrise Glow (Light)', desc: 'Warm sandstone and bright tropical gold aesthetics.' },
                  { id: 'system', name: 'System Preference', desc: 'Sync automatically with your device settings.' },
                ].map((t) => {
                  const isSelected = (profile.theme_preference || 'twilight') === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleThemeChange(t.id)}
                      disabled={isPending}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-brand-caribbeanSea/10 border-brand-caribbeanSea ring-1 ring-brand-caribbeanSea'
                          : 'bg-[#131D33] border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-brand-sandstone">{t.name}</span>
                        {isSelected && <CheckCircle className="w-4 h-4 text-brand-caribbeanSea" />}
                      </div>
                      <p className="text-[11px] text-brand-sandstone/60">{t.desc}</p>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* 7. LANGUAGE */}
          {activeSection === 'language' && (
            <section className="bg-brand-dusk/70 border border-slate-800 rounded-3xl p-6 space-y-6">
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider text-brand-caribbeanSea">
                  Language &amp; Region
                </h2>
                <p className="text-xs text-brand-sandstone/60">
                  Select your preferred language for the Tukubi platform.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { code: 'en', name: 'English', native: 'English' },
                  { code: 'es', name: 'Spanish', native: 'Español' },
                  { code: 'fr', name: 'French', native: 'Français' },
                  { code: 'ht', name: 'Haitian Creole', native: 'Kreyòl Ayisyen' },
                  { code: 'nl', name: 'Dutch', native: 'Nederlands' },
                  { code: 'pap', name: 'Papiamento', native: 'Papiamentu' },
                ].map((lang) => {
                  const isSelected = (profile.language_preference || 'en') === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleLanguageChange(lang.code)}
                      disabled={isPending}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-brand-caribbeanSea/10 border-brand-caribbeanSea ring-1 ring-brand-caribbeanSea'
                          : 'bg-[#131D33] border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <span className="text-xs font-bold text-brand-sandstone block">{lang.native}</span>
                        <span className="text-[10px] text-brand-sandstone/50">{lang.name}</span>
                      </div>
                      {isSelected && <CheckCircle className="w-4 h-4 text-brand-caribbeanSea" />}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* 8. YOUR DATA */}
          {activeSection === 'data' && (
            <section className="bg-brand-dusk/70 border border-slate-800 rounded-3xl p-6 space-y-6">
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider text-brand-caribbeanSea">
                  Download Account Data
                </h2>
                <p className="text-xs text-brand-sandstone/60">
                  Export all profile information, preferences, and activity in an open JSON package.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#131D33] border border-slate-800 space-y-3">
                <div className="flex items-center gap-3">
                  <Download className="w-5 h-5 text-brand-caribbeanSea" />
                  <div>
                    <h3 className="text-xs font-bold text-brand-sandstone">Data Portability Package</h3>
                    <p className="text-[11px] text-brand-sandstone/60">
                      Contains your profile details, notification preferences, posts, and counters.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleDownloadData}
                    disabled={isPending}
                    className="px-4 py-2 rounded-xl bg-brand-caribbeanSea text-slate-950 font-black text-xs hover:bg-brand-caribbeanSea transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  >
                    {isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>Download JSON Package</span>
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* 9. ACCOUNT MANAGEMENT */}
          {activeSection === 'management' && (
            <section className="bg-brand-dusk/70 border border-slate-800 rounded-3xl p-6 space-y-6">
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider text-rose-400">
                  Account Management
                </h2>
                <p className="text-xs text-brand-sandstone/60">
                  Deactivate your account temporarily or request permanent deletion.
                </p>
              </div>

              {/* Deactivate Account */}
              <div className="p-5 rounded-2xl bg-[#131D33] border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-brand-sandstone">
                      {profile.status === 'deactivated' ? 'Account Deactivated' : 'Deactivate Account'}
                    </h3>
                    <p className="text-[11px] text-brand-sandstone/60">
                      Temporarily hide your profile and posts. You can reactivate anytime by returning here.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDeactivate}
                    disabled={isPending}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-brand-sandstone border border-slate-700 transition-colors cursor-pointer"
                  >
                    {profile.status === 'deactivated' ? 'Reactivate Account' : 'Deactivate'}
                  </button>
                </div>
              </div>

              {/* Permanent Deletion */}
              <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-900/40 space-y-3">
                <div>
                  <h3 className="text-xs font-bold text-rose-400">Permanently Delete Account</h3>
                  <p className="text-[11px] text-brand-sandstone/60">
                    Irreversibly deletes your profile, posts, media, comments, and relationship graph.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-black transition-colors cursor-pointer"
                >
                  Delete My Account
                </button>
              </div>

              {/* Delete Confirmation Modal */}
              {showDeleteModal && (
                <div
                  className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                  role="dialog"
                  aria-modal="true"
                >
                  <div className="bg-[#0F172A] border border-rose-500/40 rounded-3xl p-6 max-w-md w-full space-y-4">
                    <h3 className="text-sm font-black text-rose-400 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" /> Confirm Account Deletion
                    </h3>
                    <p className="text-xs text-brand-sandstone/70 leading-relaxed">
                      This action cannot be undone. To confirm, type your username{' '}
                      <strong className="text-brand-sandstone">@{profile.username}</strong> below:
                    </p>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder={profile.username}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-brand-sandstone focus:outline-none focus:border-rose-500"
                    />
                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowDeleteModal(false)}
                        className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={deleteConfirmText !== profile.username}
                        onClick={async () => {
                          await deactivateAccountAction();
                          await signOut();
                        }}
                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-xs font-black transition-colors"
                      >
                        Confirm Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
