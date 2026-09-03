'use client';

import React, { useState, useTransition, useEffect } from 'react';
import {
  X,
  User,
  Shield,
  Briefcase,
  Share2,
  MapPin,
  Camera,
  Loader2,
  CheckCircle,
  AlertCircle,
  BadgeCheck,
  Lock,
  KeyRound,
  ExternalLink,
} from 'lucide-react';
import {
  updateFullProfileAction,
  uploadAvatarAction,
  uploadCoverAction,
  removeCoverAction,
  type FullProfileUpdatePayload,
} from '../lib/profile/profile-actions';
import { CARIBBEAN_TERRITORIES } from '../lib/constants/caribbean-territories';
import { DIASPORA_COUNTRIES } from '../lib/constants/diaspora-hubs';
import UserAvatar from './user-avatar';
import OfficialBadge from './official/official-badge';
import { useAuth } from './auth-provider';

export interface ProfileData {
  id: string;
  username: string;
  display_name: string;
  account_type?: 'personal' | 'creator' | 'business' | 'organization' | null;
  first_name?: string | null;
  last_name?: string | null;
  bio?: string | null;
  pronouns?: string | null;
  website?: string | null;
  avatar_url?: string | null;
  cover_url?: string | null;
  banner_url?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  relationship_status?: string | null;
  country?: string | null;
  island?: string | null;
  city?: string | null;
  address?: string | null;
  phone?: string | null;
  cultural_interests?: string[] | null;
  job_title?: string | null;
  employer?: string | null;
  industry?: string | null;
  education?: string | null;
  school?: string | null;
  skills?: string[] | null;
  professional_bio?: string | null;
  social_links?: Record<string, string> | null;
  profile_visibility?: string | null;
  dob_visibility?: string | null;
  address_visibility?: string | null;
  relationship_visibility?: string | null;
  online_status_enabled?: boolean | null;
  messaging_permission?: string | null;
  interaction_permission?: string | null;
  is_verified?: boolean | null;
  is_official?: boolean | null;
  is_system_account?: boolean | null;
}

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProfile: ProfileData;
  onProfileUpdated?: (updated: ProfileData) => void;
}

type TabType = 'profile' | 'about' | 'social' | 'privacy' | 'account' | 'security';

export default function ProfileEditModal({
  isOpen,
  onClose,
  initialProfile,
  onProfileUpdated,
}: ProfileEditModalProps) {
  const { refresh, user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ error: string | null; success: string | null }>({
    error: null,
    success: null,
  });

  // Media upload state
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);

  // Form State
  const [form, setForm] = useState<ProfileData>(initialProfile);

  useEffect(() => {
    setForm(initialProfile);
  }, [initialProfile]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isOfficial = form.is_official || form.username?.toLowerCase() === 'tukubi';
  const accountType = form.account_type || 'personal';

  // Handle local text field changes
  const handleChange = (
    field: keyof ProfileData,
    value: any
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFeedback({ error: null, success: null });
  };

  // Handle social links changes
  const handleSocialChange = (network: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      social_links: {
        ...(prev.social_links || {}),
        [network]: value,
      },
    }));
    setFeedback({ error: null, success: null });
  };

  // Handle avatar upload directly inside modal
  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type.toLowerCase())) {
      setFeedback({ error: 'Please select a JPG, PNG, WebP, or GIF image.', success: null });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFeedback({ error: 'Avatar image must be under 5MB.', success: null });
      return;
    }

    // Local instant preview
    const previewUrl = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, avatar_url: previewUrl }));
    setAvatarUploading(true);

    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await uploadAvatarAction(fd);
      if (res.success && res.data?.url) {
        setForm((prev) => ({ ...prev, avatar_url: res.data!.url }));
        setFeedback({ error: null, success: 'Photo uploaded!' });
        await refresh();
      } else {
        setFeedback({ error: res.error || 'Failed to upload photo.', success: null });
        setForm((prev) => ({ ...prev, avatar_url: initialProfile.avatar_url }));
      }
    } catch {
      setFeedback({ error: 'Network error uploading photo.', success: null });
      setForm((prev) => ({ ...prev, avatar_url: initialProfile.avatar_url }));
    } finally {
      setAvatarUploading(false);
    }
  };

  // Handle cover banner upload directly inside modal
  const handleCoverFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type.toLowerCase())) {
      setFeedback({ error: 'Please select a JPG, PNG, or WebP banner.', success: null });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFeedback({ error: 'Banner image must be under 10MB.', success: null });
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, cover_url: previewUrl, banner_url: previewUrl }));
    setCoverUploading(true);

    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await uploadCoverAction(fd);
      if (res.success && res.data?.url) {
        setForm((prev) => ({ ...prev, cover_url: res.data!.url, banner_url: res.data!.url }));
        setFeedback({ error: null, success: 'Banner updated!' });
      } else {
        setFeedback({ error: res.error || 'Failed to upload banner.', success: null });
        setForm((prev) => ({ ...prev, cover_url: initialProfile.cover_url, banner_url: initialProfile.cover_url }));
      }
    } catch {
      setFeedback({ error: 'Network error uploading banner.', success: null });
      setForm((prev) => ({ ...prev, cover_url: initialProfile.cover_url, banner_url: initialProfile.cover_url }));
    } finally {
      setCoverUploading(false);
    }
  };

  // Handle remove cover banner
  const handleRemoveCover = async () => {
    setCoverUploading(true);
    try {
      const res = await removeCoverAction();
      if (res.success) {
        setForm((prev) => ({ ...prev, cover_url: null, banner_url: null }));
        setFeedback({ error: null, success: 'Cover banner removed.' });
      } else {
        setFeedback({ error: res.error || 'Failed to remove cover.', success: null });
      }
    } catch {
      setFeedback({ error: 'Failed to remove cover banner.', success: null });
    } finally {
      setCoverUploading(false);
    }
  };

  // Master Save Action (Unified Single-Save)
  const handleSaveAll = () => {
    setFeedback({ error: null, success: null });

    const payload: FullProfileUpdatePayload = {
      displayName: form.display_name,
      username: form.username,
      accountType: form.account_type || 'personal',
      pronouns: form.pronouns || '',
      bio: form.bio || '',
      website: form.website || '',
      avatarUrl: form.avatar_url,
      coverUrl: form.cover_url,
      firstName: form.first_name || '',
      lastName: form.last_name || '',
      dateOfBirth: form.date_of_birth || '',
      gender: form.gender || '',
      relationshipStatus: form.relationship_status || '',
      address: form.address || '',
      phone: form.phone || '',
      country: form.country || '',
      island: form.island || '',
      city: form.city || '',
      culturalInterests: form.cultural_interests || [],
      jobTitle: form.job_title || '',
      employer: form.employer || '',
      industry: form.industry || '',
      education: form.education || '',
      school: form.school || '',
      skills: form.skills || [],
      professionalBio: form.professional_bio || '',
      socialLinks: form.social_links || {},
      profileVisibility: (form.profile_visibility as any) || 'public',
      dobVisibility: (form.dob_visibility as any) || 'private',
      addressVisibility: (form.address_visibility as any) || 'private',
      relationshipVisibility: (form.relationship_visibility as any) || 'public',
      onlineStatusEnabled: form.online_status_enabled !== false,
      messagingPermission: form.messaging_permission || 'everyone',
      interactionPermission: form.interaction_permission || 'everyone',
    };

    startTransition(async () => {
      try {
        const res = await updateFullProfileAction(payload);
        if (res.success) {
          setFeedback({ error: null, success: 'TUKUBI profile saved successfully!' });
          onProfileUpdated?.(form);
          await refresh();
          setTimeout(() => {
            onClose();
          }, 800);
        } else {
          setFeedback({ error: res.error || 'Failed to save changes.', success: null });
        }
      } catch {
        setFeedback({ error: 'A network error occurred while saving.', success: null });
      }
    });
  };

  const getAvatarLabel = () => {
    if (accountType === 'organization') return 'Organization Logo / Emblem';
    if (accountType === 'business') return 'Business Logo';
    if (accountType === 'creator') return 'Creator Identity Image';
    return 'Profile Photo';
  };

  const getAccountTypeBadgeLabel = () => {
    if (accountType === 'organization') return 'Organization';
    if (accountType === 'business') return 'Business';
    if (accountType === 'creator') return 'Creator';
    return 'Member';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-profile-modal-title"
    >
      <div className="bg-[#110D17] border border-slate-700/80 rounded-3xl w-full max-w-3xl max-h-[calc(100dvh-2rem)] flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.85)] overflow-hidden">
        {/* Sticky Header */}
        <div className="px-5 sm:px-6 py-3.5 border-b border-slate-800 flex items-center justify-between bg-[#1D1429]/95 backdrop-blur-md shrink-0">
          <div>
            <h2 id="edit-profile-modal-title" className="text-base font-black text-brand-sandstone flex items-center gap-2">
              <span>Edit Profile</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-caribbeanSea/10 text-brand-caribbeanSea border border-brand-caribbeanSea/30 uppercase font-black tracking-wider">
                {getAccountTypeBadgeLabel()}
              </span>
            </h2>
            <p className="text-[11px] text-brand-sandstone/60">Manage your TUKUBI public identity &amp; Caribbean story</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close edit profile dialog"
            className="p-2 rounded-full text-brand-sandstone/60 hover:text-brand-sandstone hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Profile Header Miniature Preview */}
        <div className="px-5 sm:px-6 pt-4 pb-2 shrink-0 bg-[#151020] border-b border-slate-800/80">
          <div className="rounded-2xl border border-slate-800 bg-brand-dusk/60 overflow-hidden shadow-inner">
            {/* Banner preview */}
            <div className="h-20 sm:h-24 relative w-full overflow-hidden bg-gradient-to-r from-sky-950 via-slate-900 to-amber-950/40">
              {form.cover_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={form.cover_url}
                  alt="Banner preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-brand-twilight via-slate-900 to-[#1A2642]" />
              )}
            </div>

            {/* Avatar & text preview */}
            <div className="p-3 sm:p-4 -mt-8 sm:-mt-10 relative flex items-end justify-between gap-3">
              <div className="flex items-end gap-3">
                <UserAvatar
                  src={form.avatar_url}
                  name={form.display_name || 'Member'}
                  size="lg"
                  className="ring-2 ring-brand-twilight shadow-lg"
                />
                <div className="mb-1 space-y-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-black text-brand-sandstone">
                      {form.display_name || 'Your Name'}
                    </span>
                    {isOfficial ? (
                      <OfficialBadge
                        size="xs"
                        showLabel={true}
                        label={form.username?.toLowerCase() === 'tukubi' ? 'Official TUKUBI' : 'Official Platform'}
                      />
                    ) : form.is_verified ? (
                      <BadgeCheck className="w-4 h-4 text-brand-caribbeanSea" aria-label="Verified" />
                    ) : null}
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-twilight text-brand-goldenHour border border-brand-goldenHour/30 font-bold">
                      {getAccountTypeBadgeLabel()}
                    </span>
                  </div>
                  <p className="text-xs text-brand-sandstone/60">
                    @{form.username || 'username'}
                    {form.pronouns && (
                      <span className="ml-1.5 text-[10px] text-brand-sandstone/40">({form.pronouns})</span>
                    )}
                  </p>
                </div>
              </div>

              <span className="text-[10px] text-brand-sandstone/40 hidden sm:inline-block italic">
                Live Preview
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 overflow-x-auto px-4 bg-[#181124] scrollbar-none shrink-0">
          {[
            { id: 'profile', label: 'Profile', icon: Camera },
            { id: 'about', label: 'About', icon: MapPin },
            { id: 'social', label: 'Social', icon: Share2 },
            { id: 'privacy', label: 'Privacy', icon: Shield },
            { id: 'account', label: 'Account', icon: User },
            { id: 'security', label: 'Security', icon: Lock },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id as TabType);
                  setFeedback({ error: null, success: null });
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                  isActive
                    ? 'border-brand-caribbeanSea text-brand-caribbeanSea'
                    : 'border-transparent text-brand-sandstone/60 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Status Feedback */}
        {feedback.error && (
          <div className="mx-5 sm:mx-6 mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{feedback.error}</span>
          </div>
        )}
        {feedback.success && (
          <div className="mx-5 sm:mx-6 mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{feedback.success}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* 1. PROFILE SECTION */}
          {activeTab === 'profile' && (
            <div className="space-y-5">
              {/* Media Upload Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-brand-dusk/50 border border-slate-800">
                {/* Avatar / Logo Upload */}
                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-brand-caribbeanSea">
                    {getAvatarLabel()}
                  </label>
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      src={form.avatar_url}
                      name={form.display_name}
                      size="lg"
                      className="ring-2 ring-slate-700"
                    />
                    <div className="space-y-1">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-caribbeanSea/20 hover:bg-brand-caribbeanSea text-brand-caribbeanSea hover:text-slate-950 border border-brand-caribbeanSea/30 text-xs font-bold transition-all cursor-pointer">
                        {avatarUploading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Camera className="w-3.5 h-3.5" />
                        )}
                        <span>{avatarUploading ? 'Uploading…' : 'Upload Image'}</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          onChange={handleAvatarFile}
                          disabled={avatarUploading}
                          className="hidden"
                        />
                      </label>
                      <p className="text-[10px] text-brand-sandstone/40">JPG, PNG, WebP up to 5MB.</p>
                    </div>
                  </div>
                </div>

                {/* Cover Banner Upload */}
                <div className="space-y-2 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-4">
                  <label className="block text-xs font-black uppercase tracking-wider text-brand-goldenHour">
                    Cover / Banner Image
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-goldenHour/20 hover:bg-brand-goldenHour text-brand-goldenHour hover:text-slate-950 border border-brand-goldenHour/30 text-xs font-bold transition-all cursor-pointer">
                      {coverUploading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Camera className="w-3.5 h-3.5" />
                      )}
                      <span>{coverUploading ? 'Uploading…' : form.cover_url ? 'Change Banner' : 'Upload Banner'}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleCoverFile}
                        disabled={coverUploading}
                        className="hidden"
                      />
                    </label>

                    {form.cover_url && (
                      <button
                        type="button"
                        onClick={handleRemoveCover}
                        disabled={coverUploading}
                        className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-colors cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-brand-sandstone/40">1500x500 recommended, up to 10MB.</p>
                </div>
              </div>

              {/* Text Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="modal-displayName" className="block text-xs font-bold text-brand-sandstone/80 mb-1">
                    Display Name *
                  </label>
                  <input
                    id="modal-displayName"
                    value={form.display_name}
                    onChange={(e) => handleChange('display_name', e.target.value)}
                    required
                    maxLength={100}
                    className="w-full bg-[#181124] border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="modal-username" className="block text-xs font-bold text-brand-sandstone/80 mb-1">
                    Username (@handle) *
                  </label>
                  <input
                    id="modal-username"
                    value={form.username}
                    onChange={(e) => handleChange('username', e.target.value)}
                    disabled={isOfficial}
                    required
                    maxLength={30}
                    className="w-full bg-[#181124] border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  {isOfficial && (
                    <span className="text-[10px] text-brand-caribbeanSea/70 mt-0.5 block">
                      Reserved official platform handle
                    </span>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="modal-bio" className="block text-xs font-bold text-brand-sandstone/80">
                    Bio &amp; Cultural Story
                  </label>
                  <span className="text-[10px] text-brand-sandstone/40">
                    {(form.bio || '').length}/500 chars
                  </span>
                </div>
                <textarea
                  id="modal-bio"
                  rows={3}
                  maxLength={500}
                  placeholder="Share your Caribbean roots, vibe, creative story, or business mission…"
                  value={form.bio ?? ''}
                  onChange={(e) => handleChange('bio', e.target.value)}
                  className="w-full bg-[#181124] border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea resize-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="modal-accountType" className="block text-xs font-bold text-brand-sandstone/80 mb-1">
                    Account Classification / Identity
                  </label>
                  <select
                    id="modal-accountType"
                    value={form.account_type || 'personal'}
                    onChange={(e) => handleChange('account_type', e.target.value)}
                    disabled={isOfficial}
                    className="w-full bg-[#181124] border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea transition-colors disabled:opacity-60"
                  >
                    <option value="personal">Personal / Member Profile</option>
                    <option value="creator">Digital Creator / Artist</option>
                    <option value="business">Commercial Business / Enterprise</option>
                    <option value="organization">Organization / Cultural Institution</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="modal-pronouns" className="block text-xs font-bold text-brand-sandstone/80 mb-1">
                    Pronouns (Optional)
                  </label>
                  <input
                    id="modal-pronouns"
                    placeholder="e.g. they/them, she/her, he/him"
                    value={form.pronouns ?? ''}
                    onChange={(e) => handleChange('pronouns', e.target.value)}
                    maxLength={50}
                    className="w-full bg-[#181124] border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 2. ABOUT SECTION */}
          {activeTab === 'about' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="modal-island" className="block text-xs font-bold text-brand-sandstone/80 mb-1">
                    Caribbean Territory / Island
                  </label>
                  <input
                    id="modal-island"
                    list="caribbean-territory-options"
                    placeholder="Select island/territory"
                    value={form.island ?? ''}
                    onChange={(e) => handleChange('island', e.target.value)}
                    className="w-full bg-[#181124] border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea transition-colors"
                  />
                  <datalist id="caribbean-territory-options">
                    {CARIBBEAN_TERRITORIES.map((t) => (
                      <option key={t.iso} value={t.name}>
                        {t.flag} {t.name}
                      </option>
                    ))}
                  </datalist>
                </div>

                <div>
                  <label htmlFor="modal-city" className="block text-xs font-bold text-brand-sandstone/80 mb-1">
                    City / Town
                  </label>
                  <input
                    id="modal-city"
                    placeholder="e.g. Kingston, Port of Spain, Miami"
                    value={form.city ?? ''}
                    onChange={(e) => handleChange('city', e.target.value)}
                    className="w-full bg-[#181124] border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="modal-country" className="block text-xs font-bold text-brand-sandstone/80 mb-1">
                    Country of Residence
                  </label>
                  <input
                    id="modal-country"
                    list="world-diaspora-country-options"
                    placeholder="Select country"
                    value={form.country ?? ''}
                    onChange={(e) => handleChange('country', e.target.value)}
                    className="w-full bg-[#181124] border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea transition-colors"
                  />
                  <datalist id="world-diaspora-country-options">
                    {DIASPORA_COUNTRIES.map((c) => (
                      <option key={c.iso} value={c.name}>
                        {c.flag} {c.name}
                      </option>
                    ))}
                    {CARIBBEAN_TERRITORIES.map((t) => (
                      <option key={`res-${t.iso}`} value={t.name}>
                        {t.flag} {t.name}
                      </option>
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="modal-jobTitle" className="block text-xs font-bold text-brand-sandstone/80 mb-1">
                    Job Title / Occupation
                  </label>
                  <input
                    id="modal-jobTitle"
                    placeholder="e.g. Creative Director, Engineer, Merchant"
                    value={form.job_title ?? ''}
                    onChange={(e) => handleChange('job_title', e.target.value)}
                    className="w-full bg-[#181124] border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="modal-employer" className="block text-xs font-bold text-brand-sandstone/80 mb-1">
                    Employer / Company
                  </label>
                  <input
                    id="modal-employer"
                    placeholder="e.g. Island Media, Self-Employed"
                    value={form.employer ?? ''}
                    onChange={(e) => handleChange('employer', e.target.value)}
                    className="w-full bg-[#181124] border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="modal-education" className="block text-xs font-bold text-brand-sandstone/80 mb-1">
                    Education / Degree
                  </label>
                  <input
                    id="modal-education"
                    placeholder="e.g. B.Sc. Computer Science"
                    value={form.education ?? ''}
                    onChange={(e) => handleChange('education', e.target.value)}
                    className="w-full bg-[#181124] border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="modal-school" className="block text-xs font-bold text-brand-sandstone/80 mb-1">
                    School / University
                  </label>
                  <input
                    id="modal-school"
                    placeholder="e.g. University of the West Indies"
                    value={form.school ?? ''}
                    onChange={(e) => handleChange('school', e.target.value)}
                    className="w-full bg-[#181124] border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="modal-dateOfBirth" className="block text-xs font-bold text-brand-sandstone/80 mb-1">
                    Date of Birth
                  </label>
                  <input
                    id="modal-dateOfBirth"
                    type="date"
                    value={form.date_of_birth ?? ''}
                    onChange={(e) => handleChange('date_of_birth', e.target.value)}
                    className="w-full bg-[#181124] border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="modal-gender" className="block text-xs font-bold text-brand-sandstone/80 mb-1">
                    Gender (Optional)
                  </label>
                  <input
                    id="modal-gender"
                    placeholder="e.g. Female, Male, Non-binary"
                    value={form.gender ?? ''}
                    onChange={(e) => handleChange('gender', e.target.value)}
                    className="w-full bg-[#181124] border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="modal-relationshipStatus" className="block text-xs font-bold text-brand-sandstone/80 mb-1">
                    Relationship Status
                  </label>
                  <select
                    id="modal-relationshipStatus"
                    value={form.relationship_status ?? ''}
                    onChange={(e) => handleChange('relationship_status', e.target.value)}
                    className="w-full bg-[#181124] border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea transition-colors"
                  >
                    <option value="">Prefer not to say</option>
                    <option value="Single">Single</option>
                    <option value="In a relationship">In a relationship</option>
                    <option value="Engaged">Engaged</option>
                    <option value="Married">Married</option>
                    <option value="It's complicated">It&apos;s complicated</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="modal-culturalInterests" className="block text-xs font-bold text-brand-sandstone/80 mb-1">
                  Interests &amp; Cultural Tags (Comma-separated)
                </label>
                <input
                  id="modal-culturalInterests"
                  placeholder="e.g. Reggae, Soca, Gastronomy, Carnival, Tech, Visual Arts"
                  value={form.cultural_interests?.join(', ') ?? ''}
                  onChange={(e) =>
                    handleChange(
                      'cultural_interests',
                      e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                    )
                  }
                  className="w-full bg-[#181124] border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea transition-colors"
                />
              </div>
            </div>
          )}

          {/* 3. SOCIAL SECTION */}
          {activeTab === 'social' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="modal-website" className="block text-xs font-bold text-brand-sandstone/80 mb-1">
                  Website URL
                </label>
                <input
                  id="modal-website"
                  type="url"
                  placeholder="https://yourwebsite.com"
                  value={form.website ?? ''}
                  onChange={(e) => handleChange('website', e.target.value)}
                  className="w-full bg-[#181124] border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="modal-instagram" className="block text-xs font-bold text-brand-sandstone/80 mb-1">
                    Instagram Handle
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-brand-sandstone/40 font-mono">@</span>
                    <input
                      id="modal-instagram"
                      placeholder="username"
                      value={form.social_links?.instagram ?? ''}
                      onChange={(e) => handleSocialChange('instagram', e.target.value.replace(/^@/, ''))}
                      className="w-full bg-[#181124] border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="modal-twitter" className="block text-xs font-bold text-brand-sandstone/80 mb-1">
                    X / Twitter Handle
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-brand-sandstone/40 font-mono">@</span>
                    <input
                      id="modal-twitter"
                      placeholder="username"
                      value={form.social_links?.twitter ?? ''}
                      onChange={(e) => handleSocialChange('twitter', e.target.value.replace(/^@/, ''))}
                      className="w-full bg-[#181124] border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="modal-tiktok" className="block text-xs font-bold text-brand-sandstone/80 mb-1">
                    TikTok Handle
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-brand-sandstone/40 font-mono">@</span>
                    <input
                      id="modal-tiktok"
                      placeholder="username"
                      value={form.social_links?.tiktok ?? ''}
                      onChange={(e) => handleSocialChange('tiktok', e.target.value.replace(/^@/, ''))}
                      className="w-full bg-[#181124] border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="modal-youtube" className="block text-xs font-bold text-brand-sandstone/80 mb-1">
                    YouTube URL / Channel
                  </label>
                  <input
                    id="modal-youtube"
                    placeholder="https://youtube.com/@channel"
                    value={form.social_links?.youtube ?? ''}
                    onChange={(e) => handleSocialChange('youtube', e.target.value)}
                    className="w-full bg-[#181124] border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="modal-linkedin" className="block text-xs font-bold text-brand-sandstone/80 mb-1">
                    LinkedIn Profile URL
                  </label>
                  <input
                    id="modal-linkedin"
                    placeholder="https://linkedin.com/in/username"
                    value={form.social_links?.linkedin ?? ''}
                    onChange={(e) => handleSocialChange('linkedin', e.target.value)}
                    className="w-full bg-[#181124] border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="modal-facebook" className="block text-xs font-bold text-brand-sandstone/80 mb-1">
                    Facebook Profile URL
                  </label>
                  <input
                    id="modal-facebook"
                    placeholder="https://facebook.com/username"
                    value={form.social_links?.facebook ?? ''}
                    onChange={(e) => handleSocialChange('facebook', e.target.value)}
                    className="w-full bg-[#181124] border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 4. PRIVACY SECTION */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-brand-dusk/60 border border-slate-800 space-y-2">
                <label htmlFor="modal-profileVisibility" className="block text-xs font-black text-brand-sandstone">
                  Profile Search &amp; Feed Visibility
                </label>
                <p className="text-[11px] text-brand-sandstone/60">
                  Controls discoverability in public search, diaspora directory, and community feeds.
                </p>
                <select
                  id="modal-profileVisibility"
                  value={form.profile_visibility ?? 'public'}
                  onChange={(e) => handleChange('profile_visibility', e.target.value)}
                  className="w-full bg-[#181124] border border-slate-700 rounded-xl px-3 py-2 text-xs text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea"
                >
                  <option value="public">Public (Visible to all members and diaspora search)</option>
                  <option value="followers">Followers Only (Restricted to accepted followers)</option>
                  <option value="private">Private (Only visible to you)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-brand-dusk/60 border border-slate-800 space-y-2">
                  <label htmlFor="modal-dobVisibility" className="block text-xs font-bold text-brand-sandstone">
                    Date of Birth Visibility
                  </label>
                  <select
                    id="modal-dobVisibility"
                    value={form.dob_visibility ?? 'private'}
                    onChange={(e) => handleChange('dob_visibility', e.target.value)}
                    className="w-full bg-[#181124] border border-slate-700 rounded-xl px-3 py-2 text-xs text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea"
                  >
                    <option value="private">Only Me (Private)</option>
                    <option value="followers">Followers Only</option>
                    <option value="public">Everyone</option>
                  </select>
                </div>

                <div className="p-4 rounded-2xl bg-brand-dusk/60 border border-slate-800 space-y-2">
                  <label htmlFor="modal-addressVisibility" className="block text-xs font-bold text-brand-sandstone">
                    Location &amp; Address Visibility
                  </label>
                  <select
                    id="modal-addressVisibility"
                    value={form.address_visibility ?? 'private'}
                    onChange={(e) => handleChange('address_visibility', e.target.value)}
                    className="w-full bg-[#181124] border border-slate-700 rounded-xl px-3 py-2 text-xs text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea"
                  >
                    <option value="private">Only Me (Private)</option>
                    <option value="followers">Followers Only</option>
                    <option value="public">Everyone</option>
                  </select>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-brand-dusk/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-brand-sandstone block">Online Activity Status</span>
                  <span className="text-[11px] text-brand-sandstone/60">
                    Display active presence indicator across messaging and communities
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.online_status_enabled !== false}
                    onChange={(e) => handleChange('online_status_enabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-caribbeanSea"></div>
                </label>
              </div>
            </div>
          )}

          {/* 5. ACCOUNT SECTION */}
          {activeTab === 'account' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-brand-dusk/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-brand-sandstone block">Primary Email</span>
                    <span className="text-xs text-brand-sandstone/70 font-mono">
                      {user?.email || 'Authenticated User'}
                    </span>
                  </div>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Verified
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-brand-dusk/60 border border-slate-800 space-y-3">
                <h4 className="text-xs font-black text-brand-sandstone uppercase tracking-wider">
                  Authentication &amp; Password Management
                </h4>
                <p className="text-xs text-brand-sandstone/60">
                  Password changes, linked OAuth providers, and login credentials are fully manageable through the Account Settings hub.
                </p>
                <a
                  href="/settings"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#181124] hover:bg-slate-800 text-brand-caribbeanSea text-xs font-bold border border-brand-caribbeanSea/30 transition-colors"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Open Account &amp; Password Settings</span>
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </div>

              <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-2">
                <h4 className="text-xs font-black text-rose-400">Account Deletion Safeguards</h4>
                <p className="text-[11px] text-brand-sandstone/60 leading-relaxed">
                  Permanent deletion of your TUKUBI identity, posts, ledger history, and media requires explicit verification under the Security &amp; Data Deletion policy in Settings.
                </p>
              </div>
            </div>
          )}

          {/* 6. SECURITY SECTION */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-brand-dusk/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-brand-sandstone block">Active Session</span>
                      <span className="text-[11px] text-brand-sandstone/60">
                        Current authenticated device • Cryptographically verified
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                    Active
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-brand-dusk/60 border border-slate-800 space-y-3">
                <h4 className="text-xs font-black text-brand-sandstone uppercase tracking-wider">
                  Two-Factor Authentication (MFA) &amp; Session Invalidation
                </h4>
                <p className="text-xs text-brand-sandstone/60">
                  Protect your Caribbean digital identity with TOTP multi-factor authentication and revoke stale device sessions instantly.
                </p>
                <a
                  href="/settings"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#181124] hover:bg-slate-800 text-brand-goldenHour text-xs font-bold border border-brand-goldenHour/30 transition-colors"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Configure MFA &amp; Manage All Sessions</span>
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Footer Actions */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-800 bg-[#1D1429]/95 backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isPending || avatarUploading || coverUploading}
            className="px-6 py-2 rounded-xl bg-gradient-to-r from-brand-caribbeanSea to-[#0284C7] hover:brightness-110 text-slate-950 font-black text-xs transition-all shadow-lg shadow-brand-caribbeanSea/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />}
            <span>{isPending ? 'Saving profile…' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
