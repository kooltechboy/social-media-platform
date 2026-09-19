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
} from 'lucide-react';
import {
  updateBusinessPageAction,
  archiveBusinessPageAction,
  deleteBusinessPageAction,
} from '../../../../lib/business/actions';
import { createSupabaseBrowserClient } from '../../../../lib/supabase/browser';
import { CARIBBEAN_TERRITORIES } from '../../../../lib/constants/caribbean-territories';

interface PageManagementClientProps {
  business: {
    id: string;
    name: string;
    slug: string;
    category?: string;
    description?: string;
    country_iso?: string;
    phone?: string;
    website?: string;
    contact_email?: string;
    avatar_url?: string;
    cover_image_url?: string;
    is_archived?: boolean;
    created_at: string;
  };
  products: any[];
  followerCount: number;
  currentUser: {
    id: string;
    displayName: string;
  };
}

export default function PageManagementClient({
  business,
  products,
  followerCount,
  currentUser,
}: PageManagementClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'edit' | 'products' | 'danger'>('overview');

  // Edit form state
  const [name, setName] = useState(business.name);
  const [category, setCategory] = useState(business.category || '');
  const [description, setDescription] = useState(business.description || '');
  const [countryIso, setCountryIso] = useState(business.country_iso || 'JM');
  const [phone, setPhone] = useState(business.phone || '');
  const [website, setWebsite] = useState(business.website || '');
  const [contactEmail, setContactEmail] = useState(business.contact_email || '');
  const [avatarUrl, setAvatarUrl] = useState(business.avatar_url || '');
  const [coverImageUrl, setCoverImageUrl] = useState(business.cover_image_url || '');

  const [isArchived, setIsArchived] = useState(Boolean(business.is_archived));
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Identity Switcher Handler
  const [isSwitchingIdentity, setIsSwitchingIdentity] = useState(false);

  async function handleSwitchToPageIdentity() {
    setIsSwitchingIdentity(true);
    try {
      const supabase = createSupabaseBrowserClient();
      if (supabase) {
        await supabase.rpc('switch_active_identity', {
          p_identity_id: business.id,
          p_identity_type: 'business',
        });
        if (typeof window !== 'undefined') {
          localStorage.setItem('tukubi_active_identity_id', business.id);
          localStorage.setItem('tukubi_active_identity_type', 'business');
        }
        setStatusMessage({ type: 'success', text: `You are now operating as "${business.name}".` });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Could not switch identity.' });
    } finally {
      setIsSwitchingIdentity(false);
    }
  }

  async function handleSaveDetails(e: React.FormEvent) {
    e.preventDefault();
    setStatusMessage(null);

    const formData = new FormData();
    formData.set('name', name);
    formData.set('category', category);
    formData.set('description', description);
    formData.set('countryIso', countryIso);
    formData.set('phone', phone);
    formData.set('website', website);
    formData.set('contactEmail', contactEmail);
    formData.set('avatarUrl', avatarUrl);
    formData.set('coverImageUrl', coverImageUrl);

    startTransition(async () => {
      const res = await updateBusinessPageAction(business.id, formData);
      if (res.error) {
        setStatusMessage({ type: 'error', text: res.error });
      } else {
        setStatusMessage({ type: 'success', text: 'Page information saved successfully.' });
      }
    });
  }

  async function handleToggleArchive() {
    setStatusMessage(null);
    startTransition(async () => {
      const res = await archiveBusinessPageAction(business.id);
      if (res.error) {
        setStatusMessage({ type: 'error', text: res.error });
      } else {
        setIsArchived(Boolean(res.isArchived));
        setStatusMessage({
          type: 'success',
          text: res.isArchived
            ? 'Page is now archived and hidden from public search.'
            : 'Page is now restored and visible to the public.',
        });
      }
    });
  }

  async function handleConfirmDelete() {
    if (deleteConfirmationInput.trim().toLowerCase() !== business.slug.toLowerCase()) {
      setStatusMessage({
        type: 'error',
        text: `Confirmation slug "${deleteConfirmationInput}" does not match "${business.slug}".`,
      });
      return;
    }

    setIsDeleting(true);
    setStatusMessage(null);

    try {
      const res = await deleteBusinessPageAction(business.id, deleteConfirmationInput);
      if (res.error) {
        setStatusMessage({ type: 'error', text: res.error });
        setIsDeleting(false);
      } else {
        router.push('/pages');
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Deletion failed.' });
      setIsDeleting(false);
    }
  }

  return (
    <div className="min-h-screen bg-transparent text-white p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 animate-fadeIn">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/pages/${business.slug}`}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-brand-sandstone/70 hover:text-white transition-colors"
            title="Return to public page"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">{business.name}</h1>
              {isArchived && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                  Archived
                </span>
              )}
            </div>
            <p className="text-xs text-brand-sandstone/60">
              Page Management &amp; Administrative Console
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleSwitchToPageIdentity}
            disabled={isSwitchingIdentity}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral text-slate-950 font-black text-xs shadow-md shadow-brand-caribbeanSea/20 hover:brightness-110 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSwitchingIdentity ? 'animate-spin' : ''}`} />
            <span>Operate as Page</span>
          </button>
          <Link
            href={`/pages/${business.slug}`}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <span>Live View</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {statusMessage && (
        <div
          role="alert"
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between animate-fadeIn ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="text-white/50 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Tabs Navigation Rail */}
      <div className="flex border-b border-white/10 gap-2 sm:gap-4 overflow-x-auto scrollbar-none text-xs sm:text-sm font-bold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-3 px-3 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'overview'
              ? 'border-brand-caribbeanSea text-brand-caribbeanSea font-black'
              : 'border-transparent text-brand-sandstone/70 hover:text-white'
          }`}
        >
          Overview &amp; Insights
        </button>
        <button
          onClick={() => setActiveTab('edit')}
          className={`py-3 px-3 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'edit'
              ? 'border-brand-caribbeanSea text-brand-caribbeanSea font-black'
              : 'border-transparent text-brand-sandstone/70 hover:text-white'
          }`}
        >
          Edit Page Info
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`py-3 px-3 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'products'
              ? 'border-brand-caribbeanSea text-brand-caribbeanSea font-black'
              : 'border-transparent text-brand-sandstone/70 hover:text-white'
          }`}
        >
          Storefront &amp; Catalog ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('danger')}
          className={`py-3 px-3 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'danger'
              ? 'border-rose-500 text-rose-400 font-black'
              : 'border-transparent text-brand-sandstone/70 hover:text-rose-400'
          }`}
        >
          Settings &amp; Danger Zone
        </button>
      </div>

      {/* ── TAB 1: OVERVIEW ── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-[#140C22]/90 border border-white/10 space-y-1 shadow-lg">
              <p className="text-[10px] font-black uppercase text-brand-sandstone/50">Followers</p>
              <h3 className="text-2xl font-black text-white">{followerCount}</h3>
              <p className="text-[11px] text-brand-sandstone/60">Diaspora supporters following your updates</p>
            </div>
            <div className="p-5 rounded-3xl bg-[#140C22]/90 border border-white/10 space-y-1 shadow-lg">
              <p className="text-[10px] font-black uppercase text-brand-sandstone/50">Listed Products</p>
              <h3 className="text-2xl font-black text-white">{products.length}</h3>
              <p className="text-[11px] text-brand-sandstone/60">Active items in Caribbean Marketplace</p>
            </div>
            <div className="p-5 rounded-3xl bg-[#140C22]/90 border border-white/10 space-y-1 shadow-lg">
              <p className="text-[10px] font-black uppercase text-brand-sandstone/50">Page Status</p>
              <h3 className="text-2xl font-black text-white">
                {isArchived ? 'Archived' : 'Active & Live'}
              </h3>
              <p className="text-[11px] text-brand-sandstone/60">
                {isArchived ? 'Hidden from search' : 'Discoverable across Caribbean network'}
              </p>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-[#140C22]/90 border border-white/10 space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              Quick Management Shortcuts
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                href="/create"
                className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between text-xs font-bold transition-all"
              >
                <span>Publish Update or Event</span>
                <span className="text-brand-caribbeanSea">→</span>
              </Link>
              <Link
                href="/marketplace/seller-center/create"
                className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between text-xs font-bold transition-all"
              >
                <span>Add Marketplace Product</span>
                <span className="text-brand-goldenHour">→</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: EDIT INFORMATION ── */}
      {activeTab === 'edit' && (
        <form onSubmit={handleSaveDetails} className="space-y-6">
          <div className="p-6 rounded-3xl bg-[#140C22]/90 border border-white/10 space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              Basic Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Page Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-black/40 border border-white/15 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-caribbeanSea"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-black/40 border border-white/15 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-caribbeanSea"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Description &amp; Story
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full bg-black/40 border border-white/15 rounded-2xl p-3.5 text-xs text-white focus:outline-none focus:border-brand-caribbeanSea resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Island Nation / Territory
              </label>
              <select
                value={countryIso}
                onChange={(e) => setCountryIso(e.target.value)}
                className="w-full bg-black/40 border border-white/15 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-caribbeanSea"
              >
                {CARIBBEAN_TERRITORIES.map((t) => (
                  <option key={t.iso} value={t.iso}>
                    {t.flag} {t.name} ({t.iso})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-[#140C22]/90 border border-white/10 space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              Branding &amp; Visuals
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Profile Avatar URL
              </label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-black/40 border border-white/15 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-caribbeanSea"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Cover Image URL
              </label>
              <input
                type="url"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-black/40 border border-white/15 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-caribbeanSea"
              />
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-[#140C22]/90 border border-white/10 space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              Contact Channels
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Website
                </label>
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://yourpage.com"
                  className="w-full bg-black/40 border border-white/15 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-caribbeanSea"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="info@yourpage.com"
                  className="w-full bg-black/40 border border-white/15 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-caribbeanSea"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (876) 555-0199"
                  className="w-full bg-black/40 border border-white/15 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-caribbeanSea"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-brand-caribbeanSea/20 hover:brightness-110 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isPending ? 'Saving…' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      )}

      {/* ── TAB 3: PRODUCTS & CATALOG ── */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-xs text-brand-sandstone/70">
              Manage items linked to this Page storefront:
            </p>
            <Link
              href="/marketplace/seller-center/create"
              className="px-4 py-2 rounded-xl bg-brand-goldenHour hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all"
            >
              <span>+ Add New Product</span>
            </Link>
          </div>

          {products.length === 0 ? (
            <div className="p-8 rounded-3xl bg-[#140C22]/90 border border-white/10 text-center space-y-3">
              <ShoppingBag className="w-8 h-8 text-brand-goldenHour/70 mx-auto" />
              <p className="text-xs text-brand-sandstone/60">
                No products are currently attached to this Page storefront.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl bg-[#140C22]/90 border border-white/10 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <h4 className="font-bold text-white">{p.title}</h4>
                    <p className="text-brand-goldenHour font-black">
                      ${(p.price_minor / 100).toFixed(2)} {p.currency || 'USD'}
                    </p>
                  </div>
                  <Link
                    href={`/marketplace/${p.id}`}
                    className="text-brand-caribbeanSea hover:underline font-bold"
                  >
                    View →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: DANGER ZONE ── */}
      {activeTab === 'danger' && (
        <div className="space-y-6">
          {/* Archive / Pause Section */}
          <div className="p-6 rounded-3xl bg-amber-500/5 border border-amber-500/20 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-black text-sm">
              <Archive className="w-5 h-5" />
              <span>Archive or Pause Page</span>
            </div>
            <p className="text-xs text-brand-sandstone/70 leading-relaxed">
              Archiving your Page hides it from public discovery, search results, and feed recommendations.
              All your products, followers, and content are preserved. You can restore your Page at any time.
            </p>
            <button
              type="button"
              disabled={isPending}
              onClick={handleToggleArchive}
              className={`px-5 py-2 rounded-xl font-black text-xs transition-colors ${
                isArchived
                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                  : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40'
              }`}
            >
              {isPending
                ? 'Updating…'
                : isArchived
                ? 'Restore & Unarchive Page'
                : 'Archive This Page'}
            </button>
          </div>

          {/* Permanent Deletion Section */}
          <div className="p-6 rounded-3xl bg-rose-500/5 border border-rose-500/20 space-y-3">
            <div className="flex items-center gap-2 text-rose-400 font-black text-sm">
              <Trash2 className="w-5 h-5" />
              <span>Permanent Deletion</span>
            </div>
            <p className="text-xs text-brand-sandstone/70 leading-relaxed">
              Permanently delete this Page. Once deleted, this Page, its URL slug, its storefront references,
              and all administrative history cannot be recovered.
            </p>
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="px-5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 font-black text-xs transition-colors"
            >
              Delete Page…
            </button>
          </div>
        </div>
      )}

      {/* ── CONFIRMATION MODAL FOR DELETION ── */}
      {isDeleteModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
        >
          <div className="w-full max-w-md bg-[#160E24] border border-rose-500/40 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400 font-black">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="text-base">Confirm Permanent Deletion</h3>
            </div>

            <p className="text-xs text-brand-sandstone/80 leading-relaxed">
              This action is <strong className="text-rose-400">irreversible</strong>. To confirm, please type
              the exact Page slug below:
            </p>

            <div className="p-2.5 rounded-xl bg-black/50 border border-white/10 text-center font-mono text-xs text-brand-goldenHour font-bold select-all">
              {business.slug}
            </div>

            <input
              type="text"
              value={deleteConfirmationInput}
              onChange={(e) => setDeleteConfirmationInput(e.target.value)}
              placeholder="Type slug here..."
              className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-400"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteConfirmationInput('');
                }}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmationInput.trim().toLowerCase() !== business.slug.toLowerCase() || isDeleting}
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs disabled:opacity-40 transition-colors"
              >
                {isDeleting ? 'Deleting Page…' : 'I Understand, Delete This Page'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
