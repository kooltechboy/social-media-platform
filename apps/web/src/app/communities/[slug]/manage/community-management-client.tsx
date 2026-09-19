'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  Shield,
  Settings,
  AlertTriangle,
  Archive,
  Trash2,
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
  Lock,
  Globe,
  FileText,
  UserCheck,
} from 'lucide-react';
import {
  updateCommunityAction,
  archiveCommunityAction,
  deleteCommunityAction,
} from '../../../../lib/communities/actions';

interface CommunityManagementClientProps {
  community: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    rules?: string | null;
    join_policy: 'public' | 'private' | 'invite_only';
    country_iso: string | null;
    avatar_url?: string | null;
    member_count: number;
    is_archived?: boolean;
    created_by: string | null;
    created_at?: string;
  };
  currentUserId: string;
  isCreator: boolean;
}

export default function CommunityManagementClient({
  community,
  currentUserId,
  isCreator,
}: CommunityManagementClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'danger'>('overview');

  // Form state
  const [name, setName] = useState(community.name);
  const [description, setDescription] = useState(community.description || '');
  const [rules, setRules] = useState(community.rules || '');
  const [joinPolicy, setJoinPolicy] = useState<'public' | 'private' | 'invite_only'>(
    community.join_policy || 'public'
  );
  const [avatarUrl, setAvatarUrl] = useState(community.avatar_url || '');

  // Status & loading states
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Archival state
  const [isArchived, setIsArchived] = useState(Boolean(community.is_archived));
  const [isArchiving, setIsArchiving] = useState(false);

  // Deletion state
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Handle identity switch
  const handleOperateAsHub = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tukubi_active_identity_id', community.id);
      localStorage.setItem('tukubi_active_identity_type', 'community');
      window.dispatchEvent(
        new CustomEvent('tukubi_identity_switched', {
          detail: {
            id: community.id,
            type: 'community',
            name: community.name,
            handle: community.slug,
            avatarUrl: community.avatar_url,
            badge: 'Hub Lead',
          },
        })
      );
      router.push(`/communities/${community.slug}`);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('rules', rules);
    formData.append('joinPolicy', joinPolicy);
    if (avatarUrl) formData.append('avatarUrl', avatarUrl);

    try {
      const res = await updateCommunityAction(community.id, formData);
      if (res.error) {
        setSaveError(res.error);
      } else {
        setSaveSuccess('Community settings saved successfully.');
      }
    } catch {
      setSaveError('An unexpected error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchiveToggle = async () => {
    const actionName = isArchived ? 'unarchive' : 'archive';
    if (!window.confirm(`Are you sure you want to ${actionName} this community hub?`)) {
      return;
    }

    setIsArchiving(true);
    try {
      const res = await archiveCommunityAction(community.id);
      if (res.error) {
        alert(res.error);
      } else if (typeof res.isArchived === 'boolean') {
        setIsArchived(res.isArchived);
      }
    } catch {
      alert('Failed to update archive status.');
    } finally {
      setIsArchiving(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmInput.trim().toLowerCase() !== community.name.trim().toLowerCase()) {
      setDeleteError(`Please type "${community.name}" exactly to confirm deletion.`);
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await deleteCommunityAction(community.id, deleteConfirmInput);
      if (res.error) {
        setDeleteError(res.error);
        setIsDeleting(false);
      } else {
        router.push('/communities');
      }
    } catch {
      setDeleteError('An unexpected error occurred while deleting.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-brand-sandstone p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <Link
          href={`/communities/${community.slug}`}
          className="flex items-center gap-1.5 text-slate-300 hover:text-brand-sandstone text-xs font-bold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to {community.name}
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOperateAsHub}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all"
          >
            <UserCheck className="w-3.5 h-3.5" /> Operate as Hub Lead
          </button>
          <Link
            href={`/communities/${community.slug}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-twilight hover:bg-slate-700/80 text-brand-sandstone border border-slate-700 text-xs font-bold transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" /> View Public Hub
          </Link>
        </div>
      </div>

      {/* Header Card */}
      <div className="bg-brand-dusk border border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-twilight border border-slate-700 flex items-center justify-center text-2xl font-black text-brand-sandstone shadow-inner flex-shrink-0">
              {community.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={community.avatar_url}
                  alt={community.name}
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                '🌴'
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black text-brand-sandstone">
                  {community.name}
                </h1>
                {isArchived && (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Archived
                  </span>
                )}
              </div>
              <p className="text-xs text-brand-sandstone/60">
                tukubi.com/communities/{community.slug} • {community.member_count} Members
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-brand-twilight text-brand-sandstone/80 border border-slate-700 flex items-center gap-1.5">
              {joinPolicy === 'public' ? (
                <>
                  <Globe className="w-3.5 h-3.5 text-emerald-400" /> Public Guild
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-amber-400" /> Private Hub
                </>
              )}
            </span>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'overview'
                ? 'bg-brand-caribbeanSea/20 text-brand-caribbeanSea border border-brand-caribbeanSea/30'
                : 'text-brand-sandstone/60 hover:text-brand-sandstone hover:bg-slate-800/50'
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'settings'
                ? 'bg-brand-caribbeanSea/20 text-brand-caribbeanSea border border-brand-caribbeanSea/30'
                : 'text-brand-sandstone/60 hover:text-brand-sandstone hover:bg-slate-800/50'
            }`}
          >
            Edit Information &amp; Rules
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('danger')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'danger'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'text-brand-sandstone/60 hover:text-rose-400 hover:bg-slate-800/50'
            }`}
          >
            Danger Zone
          </button>
        </div>
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-brand-dusk/70 border border-slate-800 rounded-3xl p-6 space-y-2">
            <p className="text-xs font-black uppercase text-brand-sandstone/60 tracking-wider">
              Total Community Members
            </p>
            <p className="text-3xl font-black text-brand-sandstone">
              {community.member_count.toLocaleString()}
            </p>
            <p className="text-[11px] text-brand-sandstone/50">
              Active members contributing to posts &amp; events
            </p>
          </div>

          <div className="bg-brand-dusk/70 border border-slate-800 rounded-3xl p-6 space-y-2">
            <p className="text-xs font-black uppercase text-brand-sandstone/60 tracking-wider">
              Join Policy
            </p>
            <p className="text-xl font-black text-emerald-400 capitalize">
              {community.join_policy.replace('_', ' ')}
            </p>
            <p className="text-[11px] text-brand-sandstone/50">
              {community.join_policy === 'public'
                ? 'Anyone in the Caribbean diaspora can join directly.'
                : 'Requires admin approval or direct invitation.'}
            </p>
          </div>

          <div className="bg-brand-dusk/70 border border-slate-800 rounded-3xl p-6 space-y-2">
            <p className="text-xs font-black uppercase text-brand-sandstone/60 tracking-wider">
              Hub Status
            </p>
            <p
              className={`text-xl font-black ${
                isArchived ? 'text-amber-400' : 'text-brand-caribbeanSea'
              }`}
            >
              {isArchived ? 'Archived' : 'Active & Live'}
            </p>
            <p className="text-[11px] text-brand-sandstone/50">
              {isArchived
                ? 'Hidden from explore & search discovery.'
                : 'Visible to diaspora members in Hub directory.'}
            </p>
          </div>
        </div>
      )}

      {/* Tab: Settings & Rules */}
      {activeTab === 'settings' && (
        <form
          onSubmit={handleUpdate}
          className="bg-brand-dusk/70 border border-slate-800 rounded-3xl p-6 space-y-6"
        >
          <div>
            <h2 className="text-lg font-black text-brand-sandstone flex items-center gap-2">
              <Settings className="w-5 h-5 text-brand-caribbeanSea" /> Hub Information &amp; Rules
            </h2>
            <p className="text-xs text-brand-sandstone/60">
              Update community name, description, joining policy, and diaspora rules.
            </p>
          </div>

          {saveSuccess && (
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> {saveSuccess}
            </div>
          )}

          {saveError && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> {saveError}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-brand-sandstone/80 mb-1.5">
                Community Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-brand-twilight border border-slate-700 text-brand-sandstone text-xs focus:outline-none focus:border-brand-caribbeanSea"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-sandstone/80 mb-1.5">
                Description &amp; Purpose
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="What brings this community together?"
                className="w-full px-4 py-2.5 rounded-xl bg-brand-twilight border border-slate-700 text-brand-sandstone text-xs focus:outline-none focus:border-brand-caribbeanSea resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-sandstone/80 mb-1.5">
                Community Guidelines &amp; Rules
              </label>
              <textarea
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                rows={4}
                placeholder="1. Respect cultural traditions...&#10;2. Keep discussions authentic..."
                className="w-full px-4 py-2.5 rounded-xl bg-brand-twilight border border-slate-700 text-brand-sandstone text-xs focus:outline-none focus:border-brand-caribbeanSea resize-none font-mono text-[11px]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-brand-sandstone/80 mb-1.5">
                  Join Policy
                </label>
                <select
                  value={joinPolicy}
                  onChange={(e) =>
                    setJoinPolicy(e.target.value as 'public' | 'private' | 'invite_only')
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-brand-twilight border border-slate-700 text-brand-sandstone text-xs focus:outline-none focus:border-brand-caribbeanSea"
                >
                  <option value="public">Public (Anyone can join)</option>
                  <option value="private">Private (Approval required)</option>
                  <option value="invite_only">Invite Only</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-sandstone/80 mb-1.5">
                  Avatar / Badge Image URL
                </label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 rounded-xl bg-brand-twilight border border-slate-700 text-brand-sandstone text-xs focus:outline-none focus:border-brand-caribbeanSea"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral text-slate-950 font-black text-xs hover:opacity-95 transition-opacity disabled:opacity-50 cursor-pointer shadow-lg shadow-brand-caribbeanSea/20"
            >
              {isSaving ? 'Saving...' : 'Save Hub Settings'}
            </button>
          </div>
        </form>
      )}

      {/* Tab: Danger Zone */}
      {activeTab === 'danger' && (
        <div className="bg-brand-dusk/70 border border-rose-500/20 rounded-3xl p-6 space-y-8">
          <div>
            <h2 className="text-lg font-black text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" /> Danger Zone
            </h2>
            <p className="text-xs text-brand-sandstone/60">
              Manage community archival or initiate permanent deletion.
            </p>
          </div>

          {/* Archival Box */}
          <div className="p-4 rounded-2xl bg-brand-twilight/50 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-xs font-black text-brand-sandstone flex items-center gap-1.5">
                <Archive className="w-4 h-4 text-amber-400" />{' '}
                {isArchived ? 'Unarchive Hub' : 'Archive Hub'}
              </h3>
              <p className="text-[11px] text-brand-sandstone/60 max-w-lg">
                {isArchived
                  ? 'Restore this community to the active directory, making it discoverable again.'
                  : 'Temporarily hide this community from public search. Existing discussions and members remain safe.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleArchiveToggle}
              disabled={isArchiving}
              className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-xs transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
            >
              {isArchiving
                ? 'Processing...'
                : isArchived
                ? 'Restore Hub'
                : 'Archive Community'}
            </button>
          </div>

          {/* Delete Box */}
          {isCreator && (
            <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-4">
              <div className="space-y-1">
                <h3 className="text-xs font-black text-rose-300 flex items-center gap-1.5">
                  <Trash2 className="w-4 h-4 text-rose-400" /> Delete Community Permanently
                </h3>
                <p className="text-[11px] text-brand-sandstone/60">
                  This action is irreversible. All community posts, member links, and discussions
                  will be removed.
                </p>
              </div>

              {deleteError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  {deleteError}
                </div>
              )}

              <div className="space-y-2">
                <p className="text-xs text-brand-sandstone/70">
                  To confirm, type <strong className="text-white font-mono">{community.name}</strong> below:
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="text"
                    value={deleteConfirmInput}
                    onChange={(e) => setDeleteConfirmInput(e.target.value)}
                    placeholder={community.name}
                    className="w-full sm:max-w-xs px-3.5 py-2 rounded-xl bg-brand-twilight border border-rose-500/30 text-brand-sandstone text-xs focus:outline-none focus:border-rose-400"
                  />
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting || deleteConfirmInput.trim().toLowerCase() !== community.name.trim().toLowerCase()}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
                  >
                    {isDeleting ? 'Deleting...' : 'Permanently Delete Hub'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
