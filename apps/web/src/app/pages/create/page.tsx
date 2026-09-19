'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Sparkles,
  Landmark,
  Users,
  Radio,
  Palette,
  HeartHandshake,
  Store,
  MapPin,
  Camera,
  Globe,
  Mail,
  Phone,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import { CARIBBEAN_TERRITORIES } from '../../../lib/constants/caribbean-territories';
import { DIASPORA_COUNTRIES } from '../../../lib/constants/diaspora-hubs';
import { createBusinessPageAction } from '../../../lib/business/actions';
import { createSupabaseBrowserClient } from '../../../lib/supabase/browser';

type PageEntityType =
  | 'business'
  | 'creator'
  | 'organization'
  | 'brand'
  | 'media'
  | 'cultural'
  | 'community'
  | 'other';

interface EntityClass {
  id: PageEntityType;
  title: string;
  description: string;
  icon: React.ReactNode;
  badge: string;
}

const ENTITY_CLASSES: EntityClass[] = [
  {
    id: 'business',
    title: 'Business & Storefront',
    description: 'Retail, restaurants, hotels, services, trade, and culinary brands.',
    icon: <Store className="w-6 h-6 text-brand-sunriseCoral" />,
    badge: 'COMMERCE',
  },
  {
    id: 'creator',
    title: 'Creator & Artist Hub',
    description: 'Musicians, DJs, painters, designers, performers, and writers.',
    icon: <Sparkles className="w-6 h-6 text-brand-caribbeanSea" />,
    badge: 'CREATIVE',
  },
  {
    id: 'organization',
    title: 'Organization & NGO',
    description: 'Non-profits, foundations, educational bodies, and diaspora societies.',
    icon: <Landmark className="w-6 h-6 text-brand-goldenHour" />,
    badge: 'OFFICIAL',
  },
  {
    id: 'brand',
    title: 'Brand or Product Line',
    description: 'Fashion labels, rum distilleries, coffee roasters, cosmetics, and lifestyle goods.',
    icon: <Palette className="w-6 h-6 text-purple-400" />,
    badge: 'BRAND',
  },
  {
    id: 'media',
    title: 'Media & Publication',
    description: 'Radio networks, podcasts, news outlets, magazines, and content channels.',
    icon: <Radio className="w-6 h-6 text-rose-400" />,
    badge: 'BROADCAST',
  },
  {
    id: 'cultural',
    title: 'Cultural Group / Mas Band',
    description: 'Carnival mas bands, folklore troupes, steelpan orchestras, and heritage groups.',
    icon: <Users className="w-6 h-6 text-yellow-400" />,
    badge: 'HERITAGE',
  },
];

const CATEGORY_PRESETS: Record<PageEntityType, string[]> = {
  business: ['Restaurant & Bar', 'Retail & Boutique', 'Hotel & Hospitality', 'Professional Services', 'Tourism & Travel', 'Health & Wellness', 'Other Business'],
  creator: ['Musician & DJ', 'Visual Artist', 'Fashion Designer', 'Content Creator', 'Culinary Chef', 'Author / Poet', 'Photographer', 'Other Creator'],
  organization: ['Diaspora Association', 'Youth & Education', 'Community Development', 'Cultural Heritage', 'Charity / Relief', 'Professional Guild'],
  brand: ['Apparel & Island Wear', 'Spices & Culinary', 'Artisan Goods', 'Beverage & Rum', 'Beauty & Sea Moss', 'Technology & Audio'],
  media: ['Radio Station', 'Podcast Show', 'News & Diaspora Media', 'Entertainment Channel', 'Magazine & Blog'],
  cultural: ['Carnival Mas Band', 'Steelpan Orchestra', 'Folklore & Dance', 'Festival & Carnival', 'Cultural Heritage Archive'],
  community: ['Island Alumni Network', 'Neighborhood Guild', 'Diaspora City Circle'],
  other: ['General Community Page', 'Public Interest'],
};

export default function CreatePageWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [pageName, setPageName] = useState('');
  const [pageSlug, setPageSlug] = useState('');
  const [entityType, setEntityType] = useState<PageEntityType>('business');
  const [category, setCategory] = useState('Retail & Boutique');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);

  function handleNameChange(val: string) {
    setPageName(val);
    const slugified = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setPageSlug(slugified);
  }

  function handleEntityTypeChange(type: PageEntityType) {
    setEntityType(type);
    const presets = CATEGORY_PRESETS[type] || CATEGORY_PRESETS.other;
    if (presets && presets.length > 0) {
      setCategory(presets[0]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pageName.trim() || !pageSlug.trim()) {
      setErrorMessage('Page name and URL slug are required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    // Resolve country ISO
    const matchedTerritory = CARIBBEAN_TERRITORIES.find((t) => t.name === country || t.iso === country);
    const matchedDiaspora = DIASPORA_COUNTRIES.find((d) => d.name === country || d.iso === country);
    const resolvedIso = matchedTerritory?.iso || matchedDiaspora?.iso || 'JM';

    const formData = new FormData();
    formData.set('name', pageName.trim());
    formData.set('slug', pageSlug.trim());
    formData.set('category', category || entityType);
    formData.set('description', description.trim());
    formData.set('countryIso', resolvedIso);
    formData.set('phone', phone.trim());
    formData.set('website', website.trim());
    formData.set('contactEmail', contactEmail.trim());
    formData.set('avatarUrl', avatarUrl.trim());
    formData.set('coverImageUrl', coverImageUrl.trim());

    try {
      const res = await createBusinessPageAction({ error: null }, formData);
      if (res.error) {
        setErrorMessage(res.error);
      } else if (res.slug) {
        setCreatedSlug(res.slug);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create Page. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSwitchToPage() {
    if (!createdSlug) return;
    try {
      const supabase = createSupabaseBrowserClient();
      if (supabase) {
        const { data: business } = await supabase
          .from('businesses')
          .select('id')
          .eq('slug', createdSlug)
          .maybeSingle();

        if (business) {
          await supabase.rpc('switch_active_identity', {
            p_identity_id: business.id,
            p_identity_type: 'business',
          });
          if (typeof window !== 'undefined') {
            localStorage.setItem('tukubi_active_identity_id', business.id);
            localStorage.setItem('tukubi_active_identity_type', 'business');
          }
        }
      }
    } catch {
      // non-blocking
    }
    router.push(`/pages/${createdSlug}/manage`);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SUCCESS STATE: Page is published
  // ──────────────────────────────────────────────────────────────────────────
  if (createdSlug) {
    return (
      <div className="min-h-screen bg-transparent text-white p-4 sm:p-6 max-w-2xl mx-auto flex flex-col items-center justify-center text-center space-y-6 animate-fadeIn">
        <div className="w-20 h-20 rounded-3xl bg-brand-caribbeanSea/20 border-2 border-brand-caribbeanSea flex items-center justify-center text-brand-caribbeanSea shadow-2xl shadow-brand-caribbeanSea/30">
          <CheckCircle className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-black uppercase tracking-widest text-brand-caribbeanSea">
            Official Page Published
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white">{pageName}</h1>
          <p className="text-xs sm:text-sm text-brand-sandstone/70 max-w-md mx-auto">
            Your Page is live on TUKUBI! You can manage posts, update info, add products or events, and operate under your Page identity.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 w-full max-w-md text-left space-y-2">
          <p className="text-xs text-brand-sandstone/60">Direct Page Address:</p>
          <p className="text-sm font-mono font-bold text-brand-goldenHour truncate">
            tukubi.com/pages/{createdSlug}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
          <button
            onClick={handleSwitchToPage}
            className="w-full sm:flex-1 bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral text-slate-950 font-black py-3 rounded-2xl text-xs sm:text-sm shadow-xl shadow-brand-caribbeanSea/20 hover:brightness-110 transition-all flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" /> Manage Page Now
          </button>
          <Link
            href={`/pages/${createdSlug}`}
            className="w-full sm:flex-1 bg-white/10 hover:bg-white/15 text-white font-bold py-3 rounded-2xl text-xs sm:text-sm border border-white/15 transition-colors flex items-center justify-center gap-2"
          >
            View Live Page →
          </Link>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // WIZARD FORM
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-transparent text-white p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-8 animate-fadeIn">
      {/* Step Header */}
      <div className="border-b border-white/10 pb-5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-brand-sunriseCoral">
              Create a Caribbean Page • Step {step} of 4
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
            {step === 1 && 'What kind of Page are you creating?'}
            {step === 2 && 'Category & Geography'}
            {step === 3 && 'Visuals & Mission'}
            {step === 4 && 'Contact Details & Review'}
          </h1>
        </div>

        <Link
          href="/pages"
          className="text-xs text-brand-sandstone/60 hover:text-white px-3 py-1.5 rounded-xl border border-white/10 hover:bg-white/5 transition-colors"
        >
          Cancel
        </Link>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
          {errorMessage}
        </div>
      )}

      {/* ── STEP 1: Entity Type & Name ── */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              1. Choose Page Type
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ENTITY_CLASSES.map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => handleEntityTypeChange(opt.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-2.5 ${
                    entityType === opt.id
                      ? 'bg-brand-caribbeanSea/15 border-brand-caribbeanSea shadow-lg shadow-brand-caribbeanSea/10'
                      : 'bg-[#140C22]/80 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                      {opt.icon}
                    </div>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                      {opt.badge}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-white">{opt.title}</h3>
                    <p className="text-[11px] text-brand-sandstone/65 mt-1 leading-snug">
                      {opt.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Page / Organization Name *
              </label>
              <input
                type="text"
                value={pageName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Kingston Artisan Coffee Co. or Soca Kingdom"
                className="w-full bg-[#140C22] border border-white/15 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-brand-caribbeanSea transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Custom Page Link (URL Slug) *
              </label>
              <div className="flex items-center bg-[#0D0817] border border-white/15 rounded-2xl px-4 py-2.5 text-xs text-brand-sandstone/60 font-mono">
                <span>tukubi.com/pages/</span>
                <input
                  type="text"
                  value={pageSlug}
                  onChange={(e) => setPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}
                  className="bg-transparent text-brand-goldenHour font-bold focus:outline-none flex-1 ml-1"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="button"
              disabled={!pageName.trim() || !pageSlug.trim()}
              onClick={() => {
                setErrorMessage(null);
                setStep(2);
              }}
              className="bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral text-slate-950 font-black px-6 py-2.5 rounded-2xl text-xs flex items-center gap-2 transition-all shadow-md shadow-brand-caribbeanSea/20 disabled:opacity-50"
            >
              Continue to Category &amp; Location <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Category & Geography ── */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#140C22] border border-white/15 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-caribbeanSea cursor-pointer"
              >
                {(CATEGORY_PRESETS[entityType] || CATEGORY_PRESETS.other).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Island Nation / Diaspora Hub *
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full bg-[#140C22] border border-white/15 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-caribbeanSea cursor-pointer"
                >
                  <option value="">Select Country / Territory...</option>
                  <optgroup label="Caribbean Nations & Territories">
                    {CARIBBEAN_TERRITORIES.map((t) => (
                      <option key={t.iso} value={t.name}>
                        {t.flag} {t.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Global Diaspora Hubs">
                    {DIASPORA_COUNTRIES.map((c) => (
                      <option key={c.iso} value={c.name}>
                        {c.flag} {c.name}
                      </option>
                    ))}
                    <option value="Global Diaspora 🌍">🌍 Global Diaspora</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  City / Parish / District (Optional)
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Kingston, Port of Spain, Brooklyn, London"
                  className="w-full bg-[#140C22] border border-white/15 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-caribbeanSea"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs font-bold text-brand-sandstone/70 hover:text-white flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              type="button"
              disabled={!country}
              onClick={() => setStep(3)}
              className="bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral text-slate-950 font-black px-6 py-2.5 rounded-2xl text-xs flex items-center gap-2 transition-all shadow-md shadow-brand-caribbeanSea/20 disabled:opacity-50"
            >
              Continue to Visuals &amp; Bio <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Visuals & Mission ── */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Profile Image or Logo (Image URL)
              </label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://images.unsplash.com/... or direct image link"
                className="w-full bg-[#140C22] border border-white/15 rounded-2xl px-4 py-3 text-xs text-white placeholder-white/35 focus:outline-none focus:border-brand-caribbeanSea"
              />
              <p className="text-[10px] text-brand-sandstone/50 mt-1">
                Leave empty to use the default vibrant island badge.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Cover Banner Image (Image URL)
              </label>
              <input
                type="url"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/... (1200x400 recommended)"
                className="w-full bg-[#140C22] border border-white/15 rounded-2xl px-4 py-3 text-xs text-white placeholder-white/35 focus:outline-none focus:border-brand-caribbeanSea"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                About &amp; Mission Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell the Caribbean community about your story, mission, offerings, or cultural roots..."
                rows={4}
                className="w-full bg-[#140C22] border border-white/15 rounded-2xl p-4 text-xs text-white placeholder-white/35 focus:outline-none focus:border-brand-caribbeanSea resize-none"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="text-xs font-bold text-brand-sandstone/70 hover:text-white flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              type="button"
              onClick={() => setStep(4)}
              className="bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral text-slate-950 font-black px-6 py-2.5 rounded-2xl text-xs flex items-center gap-2 transition-all shadow-md shadow-brand-caribbeanSea/20"
            >
              Continue to Contact &amp; Review <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 4: Contact Information & Review ── */}
      {step === 4 && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <p className="text-xs text-brand-sandstone/70">
              Optional public contact info so supporters and customers can connect directly:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-brand-caribbeanSea" /> Website URL (Optional)
                </label>
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="e.g. https://yourbrand.com"
                  className="w-full bg-[#140C22] border border-white/15 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-white/35 focus:outline-none focus:border-brand-caribbeanSea"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-brand-goldenHour" /> Contact Email (Optional)
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="contact@yourbrand.com"
                  className="w-full bg-[#140C22] border border-white/15 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-white/35 focus:outline-none focus:border-brand-caribbeanSea"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-brand-sunriseCoral" /> Phone Number (Optional)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (876) 555-0199"
                className="w-full bg-[#140C22] border border-white/15 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-white/35 focus:outline-none focus:border-brand-caribbeanSea"
              />
            </div>
          </div>

          {/* Quick Review Card */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-brand-goldenHour">
              Page Summary
            </h4>
            <div className="text-xs space-y-1 text-brand-sandstone/80">
              <p><span className="text-white font-bold">Name:</span> {pageName}</p>
              <p><span className="text-white font-bold">Link:</span> tukubi.com/pages/{pageSlug}</p>
              <p><span className="text-white font-bold">Classification:</span> {category} ({entityType})</p>
              <p><span className="text-white font-bold">Location:</span> {city ? `${city}, ` : ''}{country}</p>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="text-xs font-bold text-brand-sandstone/70 hover:text-white flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral text-slate-950 font-black px-8 py-3 rounded-2xl text-xs sm:text-sm flex items-center gap-2 transition-all shadow-xl shadow-brand-caribbeanSea/30 disabled:opacity-50 hover:brightness-110"
            >
              {isSubmitting ? 'Publishing Page…' : 'Publish Page →'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
