'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  Settings,
  Edit3,
  Archive,
  Trash2,
  ShoppingBag,
  Users,
  CheckCircle,
  ExternalLink,
  ShieldAlert,
  Save,
  Globe,
  Mail,
  Phone,
  Camera,
  RefreshCw,
  UserPlus,
  Shield,
  AlertTriangle,
  FileText,
  Clock,
  Send,
  UserMinus,
} from 'lucide-react';
import {
  updatePageDetailsAction,
  togglePageDeactivationAction,
  deletePagePermanentlyAction,
  updatePageRoleAction,
  removePageRoleAction,
  type PageMemberSummary,
  type PageRoleType,
} from '../../../../lib/pages/actions';
import { CARIBBEAN_TERRITORIES } from '../../../../lib/constants/caribbean-territories';
import { ALL_UNIVERSAL_CATEGORIES } from '../../../../lib/pages/categories';

interface PageManagementClientProps {
  business: {
    id: string;
    name: string;
    slug: string;
    category?: string;
    page_type?: string;
    description?: string;
    country_iso?: string;
    phone?: string;
    website?: string;
    contact_email?: string;
    avatar_url?: string;
    cover_image_url?: string;
    is_deactivated?: boolean;
    is_archived?: boolean;
    created_at: string;
  };
  products: any[];
  members: PageMemberSummary[];
  followerCount: number;
  currentUserRole: PageRoleType;
  currentUser: {
    id: string;
    displayName: string;
  };
}

export default function PageManagementClient({
  business,
  products,
  members,
  followerCount,
  currentUserRole,
  currentUser,
}: PageManagementClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'edit' | 'roles' | 'danger'>('overview');

  // Edit form state
  const [name, setName] = useState(business.name);
  const [category, setCategory] = useState(business.category || 'Creator');
  const [description, setDescription] = useState(business.description || '');
  const [countryIso, setCountryIso] = useState(business.country_iso || 'JM');
  const [phone, setPhone] = useState(business.phone || '');
  const [website, setWebsite] = useState(business.website || '');
  const [contactEmail, setContactEmail] = useState(business.contact_email || '');
  const [avatarUrl, setAvatarUrl] = useState(business.avatar_url || '');
  const [coverImageUrl, setCoverImageUrl] = useState(business.cover_image_url || '');

  // Lifecycle & Status
  const [isDeactivated, setIsDeactivated] = useState(
    Boolean(business.is_deactivated || business.is_archived)
  );
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Role management state
  const [newMemberUsername, setNewMemberUsername] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<PageRoleType>('editor');
  const [isAddingMember, setIsAddingMember] = useState(false);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner = currentUserRole === 'owner';

  // Handle Save Page Details
  async function handleUpdatePage(e: React.FormEvent) {
    e.preventDefault();
    setStatusMessage(null);

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set('name', name.trim());
        formData.set('category', category.trim());
        formData.set('description', description.trim());
        formData.set('countryIso', countryIso);
        formData.set('phone', phone.trim());
        formData.set('website', website.trim());
        formData.set('contactEmail', contactEmail.trim());
        formData.set('avatarUrl', avatarUrl.trim());
        formData.set('coverImageUrl', coverImageUrl.trim());

        const res = await updatePageDetailsAction(business.id, formData);
        if (res.error) {
          setStatusMessage({ type: 'error', text: res.error });
        } else {
          setStatusMessage({ type: 'success', text: 'Page information saved successfully!' });
        }
      } catch (err: any) {
        setStatusMessage({ type: 'error', text: err?.message || 'Failed to update Page.' });
      }
    });
  }

  // Handle Deactivate / Reactivate
  async function handleToggleDeactivation() {
    if (!isOwner) {
      setStatusMessage({ type: 'error', text: 'Only the Page Owner can deactivate or reactivate.' });
      return;
    }

    startTransition(async () => {
      try {
        const res = await togglePageDeactivationAction(business.id);
        if (res.error) {
          setStatusMessage({ type: 'error', text: res.error });
        } else {
          setIsDeactivated(Boolean(res.isDeactivated));
          setStatusMessage({
            type: 'success',
            text: res.isDeactivated
              ? 'Page deactivated. It is now hidden from public discovery.'
              : 'Page reactivated! It is now live for all Caribbean visitors.',
          });
        }
      } catch (err: any) {
        setStatusMessage({ type: 'error', text: err?.message || 'Failed to change page status.' });
      }
    });
  }

  // Handle Add Member Role
  async function handleAddMemberRole(e: React.FormEvent) {
    e.preventDefault();
    if (!newMemberUsername.trim()) return;

    setIsAddingMember(true);
    setStatusMessage(null);
    try {
      const res = await updatePageRoleAction(business.id, newMemberUsername.trim(), newMemberRole);
      if (res.error) {
        setStatusMessage({ type: 'error', text: res.error });
      } else {
        setStatusMessage({ type: 'success', text: `Added @${newMemberUsername.trim()} as ${newMemberRole}!` });
        setNewMemberUsername('');
        router.refresh();
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Failed to add team member.' });
    } finally {
      setIsAddingMember(false);
    }
  }

  // Handle Remove Member Role
  async function handleRemoveMemberRole(targetUserId: string, username: string) {
    if (!confirm(`Are you sure you want to remove @${username} from this Page?`)) return;

    setStatusMessage(null);
    try {
      const res = await removePageRoleAction(business.id, targetUserId);
      if (res.error) {
        setStatusMessage({ type: 'error', text: res.error });
      } else {
        setStatusMessage({ type: 'success', text: `Removed @${username} from Page roles.` });
        router.refresh();
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Failed to remove member.' });
    }
  }

  // Handle Permanent Delete
  async function handlePermanentDelete(e: React.FormEvent) {
    e.preventDefault();
    if (deleteConfirmationInput.trim().toLowerCase() !== business.slug.toLowerCase()) {
      setStatusMessage({
        type: 'error',
        text: `Please enter "${business.slug}" exactly to confirm deletion.`,
      });
      return;
    }

    setIsDeleting(true);
    setStatusMessage(null);
    try {
      const res = await deletePagePermanentlyAction(business.id, deleteConfirmationInput.trim());
      if (res.error) {
        setStatusMessage({ type: 'error', text: res.error });
        setIsDeleting(false);
      } else {
        router.push('/pages');
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Failed to delete Page.' });
      setIsDeleting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-10 px-4 space-y-8 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/pages/${business.slug}`}
            className="w-10 h-10 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">{business.name}</h1>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-brand-sunriseCoral/20 text-brand-sunriseCoral border border-brand-sunriseCoral/30">
                {currentUserRole}
              </span>
            </div>
            <p className="text-xs text-brand-sandstone/60">
              tukubi.com/pages/{business.slug} · Dashboard &amp; Administration
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href={`/pages/${business.slug}`}
            className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center gap-1.5 transition-all min-h-[40px]"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>View Public Page</span>
          </Link>
        </div>
      </div>

      {/* Deactivated Notice */}
      {isDeactivated && (
        <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="font-black text-white">Page is Deactivated</p>
              <p className="text-amber-300/80">
                This Page is hidden from search, directory, and feeds. Only team members can view it.
              </p>
            </div>
          </div>
          {isOwner && (
            <button
              type="button"
              onClick={handleToggleDeactivation}
              disabled={isPending}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:brightness-110 text-slate-950 font-black text-xs shrink-0 transition-all shadow-md"
            >
              Reactivate Page
            </button>
          )}
        </div>
      )}

      {/* Feedback Message */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'overview'
              ? 'bg-brand-sunriseCoral text-slate-950 shadow-md'
              : 'text-brand-sandstone/70 hover:text-white hover:bg-white/5'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Overview</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('edit')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'edit'
              ? 'bg-brand-sunriseCoral text-slate-950 shadow-md'
              : 'text-brand-sandstone/70 hover:text-white hover:bg-white/5'
          }`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Edit Profile</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('roles')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'roles'
              ? 'bg-brand-sunriseCoral text-slate-950 shadow-md'
              : 'text-brand-sandstone/70 hover:text-white hover:bg-white/5'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Team &amp; Roles ({members.length})</span>
        </button>

        {isOwner && (
          <button
            type="button"
            onClick={() => setActiveTab('danger')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'danger'
                ? 'bg-rose-500 text-white shadow-md'
                : 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Lifecycle &amp; Delete</span>
          </button>
        )}
      </div>

      {/* ── TAB 1: OVERVIEW ── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="surface-card rounded-3xl p-5 border border-white/10 space-y-1">
              <span className="text-[10px] font-black uppercase text-brand-sandstone/60 tracking-wider">
                Followers
              </span>
              <p className="text-2xl font-black text-white">{followerCount}</p>
              <p className="text-[10px] text-brand-sandstone/50">Verified platform followers</p>
            </div>

            <div className="surface-card rounded-3xl p-5 border border-white/10 space-y-1">
              <span className="text-[10px] font-black uppercase text-brand-sandstone/60 tracking-wider">
                Team Members
              </span>
              <p className="text-2xl font-black text-brand-sunriseCoral">{members.length}</p>
              <p className="text-[10px] text-brand-sandstone/50">Active administrators &amp; editors</p>
            </div>

            <div className="surface-card rounded-3xl p-5 border border-white/10 space-y-1">
              <span className="text-[10px] font-black uppercase text-brand-sandstone/60 tracking-wider">
                Status
              </span>
              <p className={`text-2xl font-black ${isDeactivated ? 'text-amber-400' : 'text-emerald-400'}`}>
                {isDeactivated ? 'Deactivated' : 'Active'}
              </p>
              <p className="text-[10px] text-brand-sandstone/50">
                {isDeactivated ? 'Hidden from discovery' : 'Public across the Caribbean'}
              </p>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="surface-card rounded-3xl p-6 border border-white/10 shadow-xl space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                href={`/pages/${business.slug}?tab=home`}
                className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-white group-hover:text-brand-sunriseCoral transition-colors">
                      Publish Page Post
                    </p>
                    <p className="text-[10px] text-brand-sandstone/60">Post an update to your followers</p>
                  </div>
                </div>
                <ArrowLeft className="w-4 h-4 text-white/40 rotate-180" />
              </Link>

              <button
                type="button"
                onClick={() => setActiveTab('roles')}
                className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-between transition-colors group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-white group-hover:text-purple-400 transition-colors">
                      Invite Team Member
                    </p>
                    <p className="text-[10px] text-brand-sandstone/60">Add an administrator or editor</p>
                  </div>
                </div>
                <ArrowLeft className="w-4 h-4 text-white/40 rotate-180" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: EDIT PROFILE ── */}
      {activeTab === 'edit' && (
        <form onSubmit={handleUpdatePage} className="surface-card rounded-3xl p-6 sm:p-8 border border-white/10 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h2 className="text-lg font-black text-white">Edit Page Profile</h2>
              <p className="text-xs text-brand-sandstone/60">Update public identity and contact channels.</p>
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-2.5 rounded-2xl bg-brand-sunriseCoral hover:brightness-110 disabled:opacity-50 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-white uppercase tracking-wider mb-1.5">
                  Page Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-brand-sunriseCoral"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-white uppercase tracking-wider mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-brand-dusk border border-white/10 text-white text-xs font-bold focus:outline-none focus:border-brand-sunriseCoral"
                >
                  {ALL_UNIVERSAL_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.groupName} · {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-white uppercase tracking-wider mb-1.5">
                Description / Bio
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-brand-sunriseCoral resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-black text-white uppercase tracking-wider mb-1.5">
                  Territory ISO
                </label>
                <select
                  value={countryIso}
                  onChange={(e) => setCountryIso(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-brand-dusk border border-white/10 text-white text-xs font-bold focus:outline-none focus:border-brand-sunriseCoral"
                >
                  {CARIBBEAN_TERRITORIES.map((t) => (
                    <option key={t.iso} value={t.iso}>
                      {t.flag} {t.name} ({t.iso})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-white uppercase tracking-wider mb-1.5">
                  Phone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-brand-sunriseCoral"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-white uppercase tracking-wider mb-1.5">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-brand-sunriseCoral"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-white uppercase tracking-wider mb-1.5">
                  Website URL
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-brand-sunriseCoral"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-white uppercase tracking-wider mb-1.5">
                  Avatar URL
                </label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-brand-sunriseCoral"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-white uppercase tracking-wider mb-1.5">
                Cover Banner URL
              </label>
              <input
                type="url"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-brand-sunriseCoral"
              />
            </div>
          </div>
        </form>
      )}

      {/* ── TAB 3: TEAM & ROLES ── */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          {/* Add Team Member Card */}
          <form onSubmit={handleAddMemberRole} className="surface-card rounded-3xl p-6 border border-white/10 shadow-xl space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-brand-sunriseCoral" />
              <span>Add Page Team Member</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  required
                  value={newMemberUsername}
                  onChange={(e) => setNewMemberUsername(e.target.value)}
                  placeholder="Username (e.g. carib_dj or @carib_dj)..."
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-brand-sandstone/40 focus:outline-none focus:border-brand-sunriseCoral"
                />
              </div>
              <div>
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value as PageRoleType)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-brand-dusk border border-white/10 text-white text-xs font-bold focus:outline-none focus:border-brand-sunriseCoral"
                >
                  <option value="admin">Administrator</option>
                  <option value="editor">Editor / Content Mgr</option>
                  <option value="moderator">Moderator</option>
                  <option value="analyst">Analyst</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <p className="text-[11px] text-brand-sandstone/60">
                Team members can manage content or settings according to their assigned role.
              </p>
              <button
                type="submit"
                disabled={isAddingMember || !newMemberUsername.trim()}
                className="px-5 py-2.5 rounded-2xl bg-brand-sunriseCoral hover:brightness-110 disabled:opacity-50 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md"
              >
                <span>Add Member</span>
              </button>
            </div>
          </form>

          {/* Members List */}
          <div className="surface-card rounded-3xl p-6 border border-white/10 shadow-xl space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              Active Team Members ({members.length})
            </h3>

            <div className="divide-y divide-white/5">
              {members.map((member) => {
                const isPrimaryOwner = member.role === 'owner';
                const canRemove = isOwner && !isPrimaryOwner;

                return (
                  <div key={member.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center overflow-hidden">
                        {member.avatarUrl ? (
                          <img src={member.avatarUrl} alt={member.displayName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-black text-white">{member.displayName.charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-black text-white">{member.displayName}</p>
                          <span className="text-[10px] text-brand-sandstone/60">@{member.username}</span>
                        </div>
                        <span className="text-[10px] font-black uppercase text-brand-sunriseCoral">
                          {member.role}
                        </span>
                      </div>
                    </div>

                    {canRemove && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMemberRole(member.userId, member.username)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-brand-sandstone/60 hover:text-rose-300 transition-colors"
                        title="Remove member"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: DANGER ZONE (OWNER ONLY) ── */}
      {activeTab === 'danger' && isOwner && (
        <div className="surface-card rounded-3xl p-6 sm:p-8 border border-rose-500/30 shadow-xl space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              <span>Page Lifecycle &amp; Deletion</span>
            </h2>
            <p className="text-xs text-brand-sandstone/60">
              Control the active visibility of your Page or permanently remove it from TUKUBI.
            </p>
          </div>

          {/* Deactivation Box */}
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black text-white">
                  {isDeactivated ? 'Reactivate Page' : 'Deactivate Page'}
                </h4>
                <p className="text-[11px] text-brand-sandstone/70 leading-relaxed max-w-lg mt-0.5">
                  {isDeactivated
                    ? 'Reactivate this Page to make it publicly discoverable in Search, Explore, and Feeds again.'
                    : 'Temporarily hide this Page from public view. All your posts, followers, and products are preserved. You can reactivate anytime.'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggleDeactivation}
                disabled={isPending}
                className={`px-5 py-2.5 rounded-2xl font-black text-xs transition-all ${
                  isDeactivated
                    ? 'bg-emerald-500 hover:brightness-110 text-slate-950 shadow-md'
                    : 'bg-amber-500 hover:brightness-110 text-slate-950 shadow-md'
                }`}
              >
                {isDeactivated ? 'Reactivate' : 'Deactivate'}
              </button>
            </div>
          </div>

          {/* Permanent Deletion Box */}
          <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-4">
            <div>
              <h4 className="text-xs font-black text-rose-300">Permanently Delete Page</h4>
              <p className="text-[11px] text-rose-300/80 leading-relaxed mt-0.5">
                Permanently deletes this Page, team roles, and removes it from followers. This action is irreversible.
              </p>
            </div>

            {!isDeleteModalOpen ? (
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="px-5 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black text-xs flex items-center gap-1.5 transition-all shadow-md"
              >
                <Trash2 className="w-4 h-4" />
                <span>Begin Permanent Deletion</span>
              </button>
            ) : (
              <form onSubmit={handlePermanentDelete} className="space-y-3 pt-2 border-t border-rose-500/30">
                <p className="text-xs text-white font-bold">
                  Type <span className="font-mono text-rose-400 bg-rose-500/20 px-1.5 py-0.5 rounded">{business.slug}</span> to confirm:
                </p>
                <input
                  type="text"
                  required
                  value={deleteConfirmationInput}
                  onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                  placeholder={business.slug}
                  className="w-full px-4 py-2.5 rounded-2xl bg-brand-dusk border border-rose-500/40 text-white text-xs font-mono focus:outline-none"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={isDeleting || deleteConfirmationInput.trim().toLowerCase() !== business.slug.toLowerCase()}
                    className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-black text-xs transition-all shadow-md"
                  >
                    {isDeleting ? 'Deleting...' : 'I understand, delete permanently'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDeleteModalOpen(false);
                      setDeleteConfirmationInput('');
                    }}
                    className="px-4 py-2.5 rounded-2xl bg-white/10 text-white font-bold text-xs hover:bg-white/15 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
