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
  Lock,
  Globe,
} from 'lucide-react';
import {
  updateProfileBasicAction,
  updateProfilePersonalInfoAction,
  updateProfileProfessionalAction,
  updateProfileSocialAction,
  updateProfilePrivacyAction,
  type ActionResponse,
} from '../lib/profile/profile-actions';
import { AvatarUpload, CoverUpload } from './avatar-upload';
import { CARIBBEAN_TERRITORIES } from '../lib/constants/caribbean-territories';
import { DIASPORA_COUNTRIES } from '../lib/constants/diaspora-hubs';

export interface ProfileData {
  id: string;
  username: string;
  display_name: string;
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
}

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProfile: ProfileData;
}

type TabType = 'photos' | 'about' | 'personal' | 'work' | 'social' | 'privacy';

export default function ProfileEditModal({ isOpen, onClose, initialProfile }: ProfileEditModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('about');
  const [profile, setProfile] = useState<ProfileData>(initialProfile);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ error: string | null; success: string | null }>({
    error: null,
    success: null,
  });

  useEffect(() => {
    setProfile(initialProfile);
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

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>, actionFn: (prev: ActionResponse, fd: FormData) => Promise<ActionResponse>) => {
    e.preventDefault();
    setFeedback({ error: null, success: null });
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const res = await actionFn({ success: false }, formData);
        if (res.success) {
          setFeedback({ error: null, success: res.message || 'Saved successfully.' });
        } else {
          setFeedback({ error: res.error || 'Failed to update.', success: null });
        }
      } catch {
        setFeedback({ error: 'A network error occurred. Please try again.', success: null });
      }
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-profile-title"
    >
      <div className="bg-[#0D1527] border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#0F172A]">
          <div>
            <h2 id="edit-profile-title" className="text-base font-extrabold text-brand-sandstone">
              Edit Profile
            </h2>
            <p className="text-xs text-brand-sandstone/60">Customize your public Caribbean identity</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-full text-brand-sandstone/60 hover:text-brand-sandstone hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 overflow-x-auto px-4 bg-[#090D16] scrollbar-none">
          {[
            { id: 'photos', label: 'Photos', icon: Camera },
            { id: 'about', label: 'About', icon: User },
            { id: 'personal', label: 'Personal', icon: MapPin },
            { id: 'work', label: 'Work & School', icon: Briefcase },
            { id: 'social', label: 'Social Links', icon: Share2 },
            { id: 'privacy', label: 'Privacy', icon: Shield },
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
                className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
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

        {/* Feedback Messages */}
        <div className="px-6 pt-3">
          {feedback.error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{feedback.error}</span>
            </div>
          )}
          {feedback.success && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{feedback.success}</span>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB: PHOTOS */}
          {activeTab === 'photos' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-brand-caribbeanSea mb-3">
                  Profile Photo
                </h3>
                <AvatarUpload
                  currentAvatarUrl={profile.avatar_url}
                  displayName={profile.display_name}
                  onAvatarUpdated={(url) => setProfile((p) => ({ ...p, avatar_url: url }))}
                />
              </div>

              <div className="pt-4 border-t border-slate-800">
                <h3 className="text-xs font-black uppercase tracking-wider text-brand-caribbeanSea mb-3">
                  Cover Banner
                </h3>
                <CoverUpload
                  currentCoverUrl={profile.cover_url}
                  onCoverUpdated={(url) => setProfile((p) => ({ ...p, cover_url: url }))}
                />
              </div>
            </div>
          )}

          {/* TAB: ABOUT YOU */}
          {activeTab === 'about' && (
            <form
              onSubmit={(e) => handleFormSubmit(e, updateProfileBasicAction)}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="displayName" className="block text-xs font-bold text-brand-sandstone/70 mb-1">
                    Display Name *
                  </label>
                  <input
                    id="displayName"
                    name="displayName"
                    required
                    maxLength={100}
                    defaultValue={profile.display_name}
                    className="w-full bg-[#131D33] border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea"
                  />
                </div>
                <div>
                  <label htmlFor="username" className="block text-xs font-bold text-brand-sandstone/70 mb-1">
                    Username (@handle) *
                  </label>
                  <input
                    id="username"
                    name="username"
                    required
                    maxLength={30}
                    defaultValue={profile.username}
                    className="w-full bg-[#131D33] border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="pronouns" className="block text-xs font-bold text-brand-sandstone/70 mb-1">
                    Pronouns (Optional)
                  </label>
                  <input
                    id="pronouns"
                    name="pronouns"
                    maxLength={50}
                    placeholder="e.g. they/them, she/her, he/him"
                    defaultValue={profile.pronouns ?? ''}
                    className="w-full bg-[#131D33] border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea"
                  />
                </div>
                <div>
                  <label htmlFor="website" className="block text-xs font-bold text-brand-sandstone/70 mb-1">
                    Personal Website
                  </label>
                  <input
                    id="website"
                    name="website"
                    type="url"
                    placeholder="https://yoursite.com"
                    defaultValue={profile.website ?? ''}
                    className="w-full bg-[#131D33] border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="bio" className="block text-xs font-bold text-brand-sandstone/70 mb-1">
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={3}
                  maxLength={500}
                  placeholder="Share your Caribbean roots, vibe, or background…"
                  defaultValue={profile.bio ?? ''}
                  className="w-full bg-[#131D33] border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea resize-none"
                />
                <span className="text-[10px] text-brand-sandstone/40">Max 500 characters.</span>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-xl bg-brand-caribbeanSea text-slate-950 font-extrabold text-xs hover:bg-brand-caribbeanSea transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isPending ? 'Saving changes…' : 'Save About Info'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB: PERSONAL & LOCATION */}
          {activeTab === 'personal' && (
            <form
              onSubmit={(e) => handleFormSubmit(e, updateProfilePersonalInfoAction)}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-xs font-bold text-brand-sandstone/70 mb-1">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    maxLength={100}
                    defaultValue={profile.first_name ?? ''}
                    className="w-full bg-[#131D33] border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-xs font-bold text-brand-sandstone/70 mb-1">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    maxLength={100}
                    defaultValue={profile.last_name ?? ''}
                    className="w-full bg-[#131D33] border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="dateOfBirth" className="block text-xs font-bold text-brand-sandstone/70 mb-1">
                    Date of Birth
                  </label>
                  <input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    defaultValue={profile.date_of_birth ?? ''}
                    className="w-full bg-[#131D33] border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea"
                  />
                </div>
                <div>
                  <label htmlFor="gender" className="block text-xs font-bold text-brand-sandstone/70 mb-1">
                    Gender (Optional)
                  </label>
                  <input
                    id="gender"
                    name="gender"
                    maxLength={50}
                    placeholder="e.g. Female, Male, Non-binary"
                    defaultValue={profile.gender ?? ''}
                    className="w-full bg-[#131D33] border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea"
                  />
                </div>
                <div>
                  <label htmlFor="relationshipStatus" className="block text-xs font-bold text-brand-sandstone/70 mb-1">
                    Relationship Status
                  </label>
                  <select
                    id="relationshipStatus"
                    name="relationshipStatus"
                    defaultValue={profile.relationship_status ?? ''}
                    className="w-full bg-[#131D33] border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea"
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="island" className="block text-xs font-bold text-brand-sandstone/70 mb-1">
                    Caribbean Island / Territory
                  </label>
                  <input
                    id="island"
                    name="island"
                    list="caribbean-islands-datalist"
                    placeholder="e.g. Trinidad, Barbados, Jamaica"
                    defaultValue={profile.island ?? ''}
                    className="w-full bg-[#131D33] border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea"
                  />
                  <datalist id="caribbean-islands-datalist">
                    {CARIBBEAN_TERRITORIES.map((t) => (
                      <option key={t.iso} value={t.name}>
                        {t.flag} {t.name}
                      </option>
                    ))}
                  </datalist>
                </div>
                <div>
                  <label htmlFor="city" className="block text-xs font-bold text-brand-sandstone/70 mb-1">
                    City / Town
                  </label>
                  <input
                    id="city"
                    name="city"
                    placeholder="e.g. Kingston, Port of Spain, Miami"
                    defaultValue={profile.city ?? ''}
                    className="w-full bg-[#131D33] border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea"
                  />
                </div>
                <div>
                  <label htmlFor="country" className="block text-xs font-bold text-brand-sandstone/70 mb-1">
                    Country (Residence)
                  </label>
                  <input
                    id="country"
                    name="country"
                    list="world-countries-datalist"
                    placeholder="e.g. United States, Canada, United Kingdom"
                    defaultValue={profile.country ?? ''}
                    className="w-full bg-[#131D33] border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea"
                  />
                  <datalist id="world-countries-datalist">
                    {DIASPORA_COUNTRIES.map((c) => (
                      <option key={c.iso} value={c.name}>
                        {c.flag} {c.name}
                      </option>
                    ))}
                    {CARIBBEAN_TERRITORIES.map((t) => (
                      <option key={`geo-${t.iso}`} value={t.name}>
                        {t.flag} {t.name}
                      </option>
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="address" className="block text-xs font-bold text-brand-sandstone/70 mb-1">
                    Address (Private by default)
                  </label>
                  <input
                    id="address"
                    name="address"
                    placeholder="Street or residential area"
                    defaultValue={profile.address ?? ''}
                    className="w-full bg-[#131D33] border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-xs font-bold text-brand-sandstone/70 mb-1">
                    Phone Number (Private)
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+1 (876) 000-0000"
                    defaultValue={profile.phone ?? ''}
                    className="w-full bg-[#131D33] border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-xl bg-brand-caribbeanSea text-slate-950 font-extrabold text-xs hover:bg-brand-caribbeanSea transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isPending ? 'Saving changes…' : 'Save Personal Details'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB: WORK & EDUCATION */}
          {activeTab === 'work' && (
            <form
              onSubmit={(e) => handleFormSubmit(e, updateProfileProfessionalAction)}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="jobTitle" className="block text-xs font-bold text-brand-sandstone/70 mb-1">
                    Job Title / Role
                  </label>
                  <input
                    id="jobTitle"
                    name="jobTitle"
                    placeholder="e.g. Music Producer, Software Engineer"
                    defaultValue={profile.job_title ?? ''}
                    className="w-full bg-[#131D33] border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea"
                  />
                </div>
                <div>
                  <label htmlFor="employer" className="block text-xs font-bold text-brand-sandstone/70 mb-1">
                    Company / Employer
                  </label>
                  <input
                    id="employer"
                    name="employer"
                    placeholder="e.g. Island Records, Self-Employed"
                    defaultValue={profile.employer ?? ''}
                    className="w-full bg-[#131D33] border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="industry" className="block text-xs font-bold text-brand-sandstone/70 mb-1">
                    Industry
                  </label>
                  <input
                    id="industry"
                    name="industry"
                    placeholder="e.g. Entertainment, Tourism, Tech"
                    defaultValue={profile.industry ?? ''}
                    className="w-full bg-[#131D33] border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea"
                  />
                </div>
                <div>
                  <label htmlFor="education" className="block text-xs font-bold text-brand-sandstone/70 mb-1">
                    Degree / Qualification
                  </label>
                  <input
                    id="education"
                    name="education"
                    placeholder="e.g. B.Sc. Computer Science"
                    defaultValue={profile.education ?? ''}
                    className="w-full bg-[#131D33] border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea"
                  />
                </div>
                <div>
                  <label htmlFor="school" className="block text-xs font-bold text-brand-sandstone/70 mb-1">
                    School / University
                  </label>
                  <input
                    id="school"
                    name="school"
                    placeholder="e.g. University of the West Indies"
                    defaultValue={profile.school ?? ''}
                    className="w-full bg-[#131D33] border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="skills" className="block text-xs font-bold text-brand-sandstone/70 mb-1">
                  Skills &amp; Expertise (Comma-separated)
                </label>
                <input
                  id="skills"
                  name="skills"
                  placeholder="e.g. Reggae Production, Culinary Arts, Sound Engineering, Event Hosting"
                  defaultValue={profile.skills?.join(', ') ?? ''}
                  className="w-full bg-[#131D33] border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea"
                />
              </div>

              <div>
                <label htmlFor="professionalBio" className="block text-xs font-bold text-brand-sandstone/70 mb-1">
                  Professional Summary
                </label>
                <textarea
                  id="professionalBio"
                  name="professionalBio"
                  rows={2}
                  maxLength={500}
                  placeholder="Summary of career background, projects, or creative portfolio…"
                  defaultValue={profile.professional_bio ?? ''}
                  className="w-full bg-[#131D33] border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-xl bg-brand-caribbeanSea text-slate-950 font-extrabold text-xs hover:bg-brand-caribbeanSea transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isPending ? 'Saving changes…' : 'Save Career Details'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB: SOCIAL LINKS */}
          {activeTab === 'social' && (
            <form
              onSubmit={(e) => handleFormSubmit(e, updateProfileSocialAction)}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="instagram" className="block text-xs font-bold text-brand-sandstone/70 mb-1">
                    Instagram Handle
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-brand-sandstone/40">@</span>
                    <input
                      id="instagram"
                      name="instagram"
                      placeholder="handle"
                      defaultValue={profile.social_links?.instagram ?? ''}
                      className="w-full bg-[#131D33] border border-slate-700 rounded-xl pl-7 pr-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="twitter" className="block text-xs font-bold text-brand-sandstone/70 mb-1">
                    X / Twitter Handle
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-brand-sandstone/40">@</span>
                    <input
                      id="twitter"
                      name="twitter"
                      placeholder="handle"
                      defaultValue={profile.social_links?.twitter ?? ''}
                      className="w-full bg-[#131D33] border border-slate-700 rounded-xl pl-7 pr-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="tiktok" className="block text-xs font-bold text-brand-sandstone/70 mb-1">
                    TikTok Handle
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-brand-sandstone/40">@</span>
                    <input
                      id="tiktok"
                      name="tiktok"
                      placeholder="handle"
                      defaultValue={profile.social_links?.tiktok ?? ''}
                      className="w-full bg-[#131D33] border border-slate-700 rounded-xl pl-7 pr-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="youtube" className="block text-xs font-bold text-brand-sandstone/70 mb-1">
                    YouTube Channel URL
                  </label>
                  <input
                    id="youtube"
                    name="youtube"
                    placeholder="https://youtube.com/@channel"
                    defaultValue={profile.social_links?.youtube ?? ''}
                    className="w-full bg-[#131D33] border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea"
                  />
                </div>

                <div>
                  <label htmlFor="linkedin" className="block text-xs font-bold text-brand-sandstone/70 mb-1">
                    LinkedIn Profile URL
                  </label>
                  <input
                    id="linkedin"
                    name="linkedin"
                    placeholder="https://linkedin.com/in/username"
                    defaultValue={profile.social_links?.linkedin ?? ''}
                    className="w-full bg-[#131D33] border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea"
                  />
                </div>

                <div>
                  <label htmlFor="facebook" className="block text-xs font-bold text-brand-sandstone/70 mb-1">
                    Facebook Profile URL
                  </label>
                  <input
                    id="facebook"
                    name="facebook"
                    placeholder="https://facebook.com/username"
                    defaultValue={profile.social_links?.facebook ?? ''}
                    className="w-full bg-[#131D33] border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-xl bg-brand-caribbeanSea text-slate-950 font-extrabold text-xs hover:bg-brand-caribbeanSea transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isPending ? 'Saving changes…' : 'Save Social Links'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB: PRIVACY & VISIBILITY */}
          {activeTab === 'privacy' && (
            <form
              onSubmit={(e) => handleFormSubmit(e, updateProfilePrivacyAction)}
              className="space-y-5"
            >
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#131D33] border border-slate-800 space-y-2">
                  <label htmlFor="profileVisibility" className="block text-xs font-extrabold text-brand-sandstone">
                    Profile Visibility
                  </label>
                  <p className="text-[11px] text-brand-sandstone/60">
                    Controls whether your profile is discoverable in public search and diaspora feeds.
                  </p>
                  <select
                    id="profileVisibility"
                    name="profileVisibility"
                    defaultValue={profile.profile_visibility ?? 'public'}
                    className="w-full bg-[#0D1527] border border-slate-700 rounded-xl px-3 py-2 text-xs text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea"
                  >
                    <option value="public">Public (Visible to all members and diaspora engines)</option>
                    <option value="followers">Followers Only</option>
                    <option value="private">Private (Only you can see your profile)</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-[#131D33] border border-slate-800 space-y-2">
                    <label htmlFor="dobVisibility" className="block text-xs font-bold text-brand-sandstone">
                      Date of Birth Visibility
                    </label>
                    <select
                      id="dobVisibility"
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
                    <label htmlFor="addressVisibility" className="block text-xs font-bold text-brand-sandstone">
                      Address Visibility
                    </label>
                    <select
                      id="addressVisibility"
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
                    <span className="text-xs font-bold text-brand-sandstone block">Online Activity Status</span>
                    <span className="text-[11px] text-brand-sandstone/60">
                      Show when you are currently active on the Tukubi platform
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
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-xl bg-brand-caribbeanSea text-slate-950 font-extrabold text-xs hover:bg-brand-caribbeanSea transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isPending ? 'Saving changes…' : 'Save Privacy Controls'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
