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
  Search,
  Music,
  Tv,
  GraduationCap,
  Trophy,
  Compass,
  Laptop,
  Check,
} from 'lucide-react';
import { CARIBBEAN_TERRITORIES } from '../../../lib/constants/caribbean-territories';
import { DIASPORA_COUNTRIES } from '../../../lib/constants/diaspora-hubs';
import { createUniversalPageAction } from '../../../lib/pages/actions';
import {
  UNIVERSAL_CATEGORY_GROUPS,
  type UniversalPageCategory,
  searchCategories,
  PageCategoryGroupKey,
} from '../../../lib/pages/categories';

const GROUP_ICONS: Record<PageCategoryGroupKey, React.ElementType> = {
  creator: Sparkles,
  business: Building2,
  media: Tv,
  community: Users,
  education: GraduationCap,
  institution: Landmark,
  sports: Trophy,
  faith: Compass,
  events: Sparkles,
  travel: MapPin,
  technology: Laptop,
  other: Globe,
};

export default function UniversalPageCreateWizard() {
  const router = useRouter();

  // Wizard Step (1 - 6)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State
  const [selectedGroup, setSelectedGroup] = useState<PageCategoryGroupKey>('creator');
  const [selectedCategory, setSelectedCategory] = useState<string>('Creator');
  const [categorySearchQuery, setCategorySearchQuery] = useState<string>('');

  // Step 2: Identity
  const [name, setName] = useState<string>('');
  const [slug, setSlug] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [coverImageUrl, setCoverImageUrl] = useState<string>('');

  // Step 3: Location
  const [countryIso, setCountryIso] = useState('');
  const [city, setCity] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [isGlobalDiaspora, setIsGlobalDiaspora] = useState<boolean>(false);

  // Step 4: Contact
  const [website, setWebsite] = useState<string>('');
  const [contactEmail, setContactEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');

  // Step 5: Specialized
  const [specializedField1, setSpecializedField1] = useState<string>(''); // e.g. Genre, Specialty, Mission
  const [specializedField2, setSpecializedField2] = useState<string>(''); // e.g. Portfolio, Hours, Programs

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-generate slug from name
  function handleNameChange(val: string) {
    setName(val);
    if (!slug || slug === name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) {
      const generated = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      setSlug(generated);
    }
  }

  // Handle final page launch
  async function handleCreatePage(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.set('name', name.trim());
      formData.set('slug', slug.trim());
      formData.set('category', selectedCategory);
      formData.set('description', description.trim());
      formData.set('countryIso', countryIso);
      formData.set('phone', phone.trim());
      formData.set('website', website.trim());
      formData.set('contactEmail', contactEmail.trim());
      formData.set('avatarUrl', avatarUrl.trim());
      formData.set('coverImageUrl', coverImageUrl.trim());

      const res = await createUniversalPageAction({ error: null }, formData);
      if (res.error) {
        setErrorMsg(res.error);
        setIsSubmitting(false);
      } else if (res.slug) {
        router.push(`/pages/${res.slug}`);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to create Page. Please try again.');
      setIsSubmitting(false);
    }
  }

  // Active Category Group Object
  const currentGroupObj = UNIVERSAL_CATEGORY_GROUPS.find((g) => g.key === selectedGroup);
  const filteredCategories = categorySearchQuery
    ? searchCategories(categorySearchQuery)
    : currentGroupObj?.categories || [];

  return (
    <div className="max-w-3xl mx-auto py-6 sm:py-10 px-4 space-y-8 animate-fadeIn">
      {/* Header & Back */}
      <div className="flex items-center justify-between">
        <Link
          href="/pages"
          className="inline-flex items-center gap-2 text-xs font-bold text-brand-sandstone/70 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Pages
        </Link>
        <span className="text-xs font-black uppercase tracking-wider text-brand-sunriseCoral">
          Step {currentStep} of 6
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-emerald-400 transition-all duration-300"
          style={{ width: `${(currentStep / 6) * 100}%` }}
        />
      </div>

      {/* Step Container Card */}
      <div className="surface-card rounded-3xl p-6 sm:p-10 border border-white/15 shadow-2xl space-y-6">
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold animate-shake">
            {errorMsg}
          </div>
        )}

        {/* ── STEP 1: What is this Page? ── */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="space-y-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-orange-400">
                Step 1 · Categorization
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">What is this Page?</h2>
              <p className="text-xs sm:text-sm text-brand-sandstone/70">
                Select the broad category that best represents this Page. You can always refine this later.
              </p>
            </div>

            {/* Category Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-brand-sandstone/50 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={categorySearchQuery}
                onChange={(e) => setCategorySearchQuery(e.target.value)}
                placeholder="Search categories (e.g., Musician, Restaurant, Non-profit, DJ, School)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-brand-sandstone/40 text-xs focus:outline-none focus:border-brand-sunriseCoral transition-colors"
              />
            </div>

            {/* Group Selector Pills (if not searching) */}
            {!categorySearchQuery && (
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                {UNIVERSAL_CATEGORY_GROUPS.map((grp) => {
                  const Icon = GROUP_ICONS[grp.key] || Building2;
                  const isSelected = selectedGroup === grp.key;
                  return (
                    <button
                      key={grp.key}
                      type="button"
                      onClick={() => {
                        setSelectedGroup(grp.key);
                        if (grp.categories[0]) {
                          setSelectedCategory(grp.categories[0].name);
                        }
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all ${
                        isSelected
                          ? 'bg-brand-sunriseCoral text-slate-950 shadow-md font-black'
                          : 'bg-white/5 text-brand-sandstone/80 hover:bg-white/10 hover:text-white border border-white/5'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{grp.name}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Categories Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
              {filteredCategories.map((cat: UniversalPageCategory) => {
                const isSelected = selectedCategory === cat.name;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex items-start justify-between ${
                      isSelected
                        ? 'bg-brand-sunriseCoral/15 border-brand-sunriseCoral text-white shadow-inner'
                        : 'bg-white/5 border-white/5 hover:border-white/20 text-slate-300'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-black text-white">{cat.name}</p>
                      <p className="text-[11px] text-brand-sandstone/60 leading-tight mt-0.5">
                        {cat.description}
                      </p>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-brand-sunriseCoral shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-end pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-6 py-3 rounded-2xl bg-brand-sunriseCoral hover:brightness-110 text-slate-950 font-black text-xs flex items-center gap-2 transition-all shadow-md"
              >
                <span>Continue: Page Identity</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Page Identity ── */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="space-y-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-orange-400">
                Step 2 · Identity
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">Page Identity</h2>
              <p className="text-xs sm:text-sm text-brand-sandstone/70">
                Provide the public name, unique handle, and visual assets for your Page.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-white uppercase tracking-wider mb-1.5">
                  Page Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Island Pulse Media, Kingston Jerk Hut, Blue Mountain Coffee"
                  className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-brand-sandstone/40 text-sm focus:outline-none focus:border-brand-sunriseCoral transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-white uppercase tracking-wider mb-1.5">
                  Page Handle / Custom URL *
                </label>
                <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 focus-within:border-brand-sunriseCoral transition-colors">
                  <span className="text-xs text-brand-sandstone/60 font-bold mr-1">tukubi.com/pages/</span>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ''))}
                    placeholder="island-pulse"
                    className="flex-1 bg-transparent text-white placeholder:text-brand-sandstone/40 text-xs font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-white uppercase tracking-wider mb-1.5">
                  Short Description / Bio
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this Page about? Tell the Caribbean community what you do..."
                  className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-brand-sandstone/40 text-xs focus:outline-none focus:border-brand-sunriseCoral transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-white uppercase tracking-wider mb-1.5">
                    Avatar Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://.../avatar.jpg"
                    className="w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-brand-sandstone/40 text-xs focus:outline-none focus:border-brand-sunriseCoral transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-white uppercase tracking-wider mb-1.5">
                    Cover Banner URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={coverImageUrl}
                    onChange={(e) => setCoverImageUrl(e.target.value)}
                    placeholder="https://.../cover.jpg"
                    className="w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-brand-sandstone/40 text-xs focus:outline-none focus:border-brand-sunriseCoral transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-5 py-2.5 rounded-2xl bg-white/10 text-white font-bold text-xs flex items-center gap-2 hover:bg-white/15 transition-all"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="button"
                disabled={!name.trim() || !slug.trim()}
                onClick={() => setCurrentStep(3)}
                className="px-6 py-3 rounded-2xl bg-brand-sunriseCoral hover:brightness-110 disabled:opacity-50 text-slate-950 font-black text-xs flex items-center gap-2 transition-all shadow-md"
              >
                <span>Continue: Location</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Location ── */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="space-y-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-orange-400">
                Step 3 · Geography
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">Location &amp; Reach</h2>
              <p className="text-xs sm:text-sm text-brand-sandstone/70">
                Anchor your Page in an island territory, diaspora hub, or select global presence.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-white uppercase tracking-wider mb-1.5">
                  Primary Country / Island Territory
                </label>
                <select
                  value={countryIso}
                  onChange={(e) => setCountryIso(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-brand-dusk border border-white/10 text-white text-xs font-bold focus:outline-none focus:border-brand-sunriseCoral transition-colors"
                >
                  <option value="">Select Country / Territory...</option>
                  <optgroup label="Caribbean Territories">
                    {CARIBBEAN_TERRITORIES.map((t) => (
                      <option key={t.iso} value={t.iso}>
                        {t.flag} {t.name} ({t.iso})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Diaspora Hubs">
                    {DIASPORA_COUNTRIES.map((d) => (
                      <option key={d.iso} value={d.iso}>
                        {d.flag} {d.name} ({d.iso})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-white uppercase tracking-wider mb-1.5">
                    City, Town, or Parish (Optional)
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Kingston, Port of Spain, Bridgetown"
                    className="w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-brand-sandstone/40 text-xs focus:outline-none focus:border-brand-sunriseCoral transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-white uppercase tracking-wider mb-1.5">
                    Street Address (Optional)
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. 12 Hope Road"
                    className="w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-brand-sandstone/40 text-xs focus:outline-none focus:border-brand-sunriseCoral transition-colors"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                <input
                  type="checkbox"
                  checked={isGlobalDiaspora}
                  onChange={(e) => setIsGlobalDiaspora(e.target.checked)}
                  className="rounded border-white/20 text-brand-sunriseCoral focus:ring-brand-sunriseCoral"
                />
                <div>
                  <p className="text-xs font-black text-white">Global Diaspora Outreach</p>
                  <p className="text-[11px] text-brand-sandstone/60">
                    This Page actively serves Caribbean diaspora communities worldwide.
                  </p>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-5 py-2.5 rounded-2xl bg-white/10 text-white font-bold text-xs flex items-center gap-2 hover:bg-white/15 transition-all"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="px-6 py-3 rounded-2xl bg-brand-sunriseCoral hover:brightness-110 text-slate-950 font-black text-xs flex items-center gap-2 transition-all shadow-md"
              >
                <span>Continue: Contact Info</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Contact & Social Info ── */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="space-y-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-orange-400">
                Step 4 · Contact Channels
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">Contact &amp; External Links</h2>
              <p className="text-xs sm:text-sm text-brand-sandstone/70">
                Provide public contact details so followers, customers, and partners can reach you.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-white uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-brand-caribbeanSea" /> Official Website (Optional)
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://myislandbrand.com"
                  className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-brand-sandstone/40 text-xs focus:outline-none focus:border-brand-sunriseCoral transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-white uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-orange-400" /> Public Contact Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="contact@myislandbrand.com"
                    className="w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-brand-sandstone/40 text-xs focus:outline-none focus:border-brand-sunriseCoral transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-white uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" /> Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (876) 555-0199"
                    className="w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-brand-sandstone/40 text-xs focus:outline-none focus:border-brand-sunriseCoral transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-5 py-2.5 rounded-2xl bg-white/10 text-white font-bold text-xs flex items-center gap-2 hover:bg-white/15 transition-all"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(5)}
                className="px-6 py-3 rounded-2xl bg-brand-sunriseCoral hover:brightness-110 text-slate-950 font-black text-xs flex items-center gap-2 transition-all shadow-md"
              >
                <span>Continue: Specialized Info</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 5: Specialized Category Fields ── */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="space-y-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-orange-400">
                Step 5 · Category Details
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                {selectedCategory} Details
              </h2>
              <p className="text-xs sm:text-sm text-brand-sandstone/70">
                Optional custom fields tailored to your category: {selectedCategory}.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-white uppercase tracking-wider mb-1.5">
                  {selectedGroup === 'creator'
                    ? 'Primary Genre or Creative Discipline'
                    : selectedGroup === 'business'
                    ? 'Main Speciality or Cuisine / Goods'
                    : selectedGroup === 'media'
                    ? 'Broadcast Frequency or Format'
                    : 'Primary Mission Focus'}
                </label>
                <input
                  type="text"
                  value={specializedField1}
                  onChange={(e) => setSpecializedField1(e.target.value)}
                  placeholder="e.g. Roots Reggae, Authentic Jerk Chicken, Diaspora Advocacy..."
                  className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-brand-sandstone/40 text-xs focus:outline-none focus:border-brand-sunriseCoral transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-white uppercase tracking-wider mb-1.5">
                  {selectedGroup === 'business'
                    ? 'Hours of Operation'
                    : selectedGroup === 'creator'
                    ? 'Notable Work or Portfolio Link'
                    : 'Key Programs & Initiatives'}
                </label>
                <input
                  type="text"
                  value={specializedField2}
                  onChange={(e) => setSpecializedField2(e.target.value)}
                  placeholder="e.g. Mon-Sat 10am - 9pm, Annual Carnival Mas Camp, Caribbean Youth Relief..."
                  className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-brand-sandstone/40 text-xs focus:outline-none focus:border-brand-sunriseCoral transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="px-5 py-2.5 rounded-2xl bg-white/10 text-white font-bold text-xs flex items-center gap-2 hover:bg-white/15 transition-all"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(6)}
                className="px-6 py-3 rounded-2xl bg-brand-sunriseCoral hover:brightness-110 text-slate-950 font-black text-xs flex items-center gap-2 transition-all shadow-md"
              >
                <span>Continue: Review &amp; Launch</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 6: Review & Finish ── */}
        {currentStep === 6 && (
          <form onSubmit={handleCreatePage} className="space-y-6">
            <div className="space-y-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                Step 6 · Final Review
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">Review &amp; Launch Page</h2>
              <p className="text-xs sm:text-sm text-brand-sandstone/70">
                Review your Page identity. You will be designated as the Page Owner with full management access.
              </p>
            </div>

            {/* Summary Preview Card */}
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center overflow-hidden shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">🌴</span>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-black text-white truncate">{name}</h3>
                  <p className="text-xs text-brand-sunriseCoral font-bold">tukubi.com/pages/{slug}</p>
                  <p className="text-[11px] text-brand-sandstone/60">
                    {selectedCategory} · {countryIso} 🌴
                  </p>
                </div>
              </div>

              {description && (
                <p className="text-xs text-brand-sandstone/80 leading-relaxed italic border-t border-white/5 pt-3">
                  &ldquo;{description}&rdquo;
                </p>
              )}

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-white/5">
                <div>
                  <span className="text-brand-sandstone/60 block text-[10px] uppercase font-bold">Category</span>
                  <span className="text-white font-bold">{selectedCategory}</span>
                </div>
                <div>
                  <span className="text-brand-sandstone/60 block text-[10px] uppercase font-bold">Territory</span>
                  <span className="text-white font-bold">{countryIso}</span>
                </div>
                {website && (
                  <div>
                    <span className="text-brand-sandstone/60 block text-[10px] uppercase font-bold">Website</span>
                    <span className="text-white font-bold truncate block">{website}</span>
                  </div>
                )}
                {contactEmail && (
                  <div>
                    <span className="text-brand-sandstone/60 block text-[10px] uppercase font-bold">Email</span>
                    <span className="text-white font-bold truncate block">{contactEmail}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-1">
              <p className="font-black flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Ready for Caribbean Discovery
              </p>
              <p className="text-emerald-300/80">
                Immediately after launching, your Page Dashboard will open with publishing tools, team roles, and customization options.
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setCurrentStep(5)}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-2xl bg-white/10 text-white font-bold text-xs flex items-center gap-2 hover:bg-white/15 transition-all"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-400 hover:brightness-110 text-slate-950 font-black text-sm flex items-center gap-2 transition-all shadow-xl shadow-orange-500/20"
              >
                {isSubmitting ? (
                  <span>Launching Page...</span>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Launch Page Now</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
