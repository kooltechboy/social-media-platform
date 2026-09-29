import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  HeartHandshake,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Wind,
  Droplets,
  HeartPulse,
  Hammer,
  BookOpen,
  Landmark,
  Search,
  Filter,
  X,
  Plus,
  MapPin,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { createSupabaseServerClient, getCurrentUser } from '../../lib/supabase/server';
import ReliefCampaignCard from '../../components/relief/relief-campaign-card';
import type { ReliefCampaign, ReliefCategory } from '../../lib/relief/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Caribbean Community Relief & Mutual Aid — TUKUBI',
  description:
    'Pan-Caribbean crisis response, verified disaster recovery campaigns, and 100% mutual aid solidarity under CDEMA, ODPEM, and NEMO protocols.',
};

export interface ReliefPageSearchParams {
  category?: string;
  country?: string;
  q?: string;
  verified?: string;
}

const CARIBBEAN_ISLAND_TERRITORIES: Array<{
  code: string;
  name: string;
  flag: string;
}> = [
  { code: 'ALL', name: 'All Island Territories', flag: '🌴' },
  { code: 'JAM', name: 'Jamaica', flag: '🇯🇲' },
  { code: 'DMA', name: 'Dominica', flag: '🇩🇲' },
  { code: 'TTO', name: 'Trinidad & Tobago', flag: '🇹🇹' },
  { code: 'BRB', name: 'Barbados', flag: '🇧🇧' },
  { code: 'LCA', name: 'Saint Lucia', flag: '🇱🇨' },
  { code: 'GRD', name: 'Grenada', flag: '🇬🇩' },
  { code: 'VCT', name: 'St. Vincent & Grenadines', flag: '🇻🇨' },
  { code: 'HTI', name: 'Haiti', flag: '🇭🇹' },
  { code: 'BHS', name: 'Bahamas', flag: '🇧🇸' },
  { code: 'ATG', name: 'Antigua & Barbuda', flag: '🇦🇬' },
  { code: 'KNA', name: 'St. Kitts & Nevis', flag: '🇰🇳' },
  { code: 'BLZ', name: 'Belize', flag: '🇧🇿' },
  { code: 'GUY', name: 'Guyana', flag: '🇬🇾' },
  { code: 'SUR', name: 'Suriname', flag: '🇸🇷' },
  { code: 'DOM', name: 'Dominican Republic', flag: '🇩🇴' },
  { code: 'PRI', name: 'Puerto Rico', flag: '🇵🇷' },
  { code: 'CYM', name: 'Cayman Islands', flag: '🇰🇾' },
  { code: 'CUW', name: 'Curaçao', flag: '🇨🇼' },
  { code: 'ABW', name: 'Aruba', flag: '🇦🇼' },
  { code: 'SXM', name: 'Sint Maarten', flag: '🇸🇽' },
];

const CATEGORY_TABS: Array<{
  id: string;
  label: string;
  categoryKey?: ReliefCategory;
  icon: React.ComponentType<{ className?: string }>;
  protocol: string;
}> = [
  { id: 'all', label: 'All Relief', icon: Sparkles, protocol: 'REGIONAL' },
  { id: 'hurricane_relief', label: 'Hurricane', categoryKey: 'hurricane_relief', icon: Wind, protocol: 'CDEMA-HURR' },
  { id: 'flood_disaster', label: 'Flooding', categoryKey: 'flood_disaster', icon: Droplets, protocol: 'ODPEM-FLOOD' },
  { id: 'medical_aid', label: 'Medical', categoryKey: 'medical_aid', icon: HeartPulse, protocol: 'CARPHA-MED' },
  { id: 'community_rebuild', label: 'Rebuild', categoryKey: 'community_rebuild', icon: Hammer, protocol: 'NEMO-REBUILD' },
  { id: 'education', label: 'Education', categoryKey: 'education', icon: BookOpen, protocol: 'CARICOM-EDU' },
  { id: 'cultural_heritage', label: 'Culture', categoryKey: 'cultural_heritage', icon: Landmark, protocol: 'HERITAGE' },
];

function buildQueryUrl(
  base: ReliefPageSearchParams,
  updates: Partial<ReliefPageSearchParams>
): string {
  const next = { ...base, ...updates };
  const params = new URLSearchParams();

  if (next.category && next.category !== 'all') {
    params.set('category', next.category);
  }
  if (next.country && next.country !== 'ALL' && next.country !== 'all') {
    params.set('country', next.country);
  }
  if (next.q && next.q.trim()) {
    params.set('q', next.q.trim());
  }
  if (next.verified === 'true') {
    params.set('verified', 'true');
  }

  const qs = params.toString();
  return qs ? `/relief?${qs}` : '/relief';
}

export default async function ReliefPage({
  searchParams,
}: {
  searchParams?: Promise<ReliefPageSearchParams>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const currentCategory = resolvedParams.category || 'all';
  const currentCountry = resolvedParams.country || 'ALL';
  const currentQuery = (resolvedParams.q || '').trim();
  const isVerifiedOnly = resolvedParams.verified === 'true';

  const [user, supabase] = await Promise.all([
    getCurrentUser(),
    createSupabaseServerClient(),
  ]);

  let campaigns: ReliefCampaign[] = [];

  if (supabase) {
    let query = supabase
      .from('relief_campaigns')
      .select(`
        id,
        creator_id,
        community_id,
        title,
        description,
        category,
        target_country_iso,
        target_city_id,
        goal_minor,
        raised_minor,
        currency,
        verification_status,
        verified_at,
        verified_by,
        disaster_declaration_ref,
        supporting_evidence_urls,
        cover_image_url,
        disbursement_status,
        deadline_at,
        is_active,
        donations_count,
        created_at,
        updated_at,
        creator:profiles!relief_campaigns_creator_id_fkey(id, username, display_name, avatar_url),
        country:countries!relief_campaigns_target_country_iso_fkey(name, iso_code, flag_emoji),
        city:cities!relief_campaigns_target_city_id_fkey(name)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (currentCategory && currentCategory !== 'all') {
      query = query.eq('category', currentCategory);
    }
    if (currentCountry && currentCountry !== 'ALL' && currentCountry !== 'all') {
      query = query.eq('target_country_iso', currentCountry.toUpperCase());
    }
    if (currentQuery) {
      query = query.or(`title.ilike.%${currentQuery}%,description.ilike.%${currentQuery}%`);
    }
    if (isVerifiedOnly) {
      query = query.eq('verification_status', 'verified');
    }

    const { data, error } = await query.limit(50);
    if (data && !error) {
      campaigns = data as unknown as ReliefCampaign[];
    }
  }

  const hasActiveFilters =
    currentCategory !== 'all' ||
    currentCountry !== 'ALL' ||
    Boolean(currentQuery) ||
    isVerifiedOnly;

  return (
    <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 animate-fadeIn">
      {/* ========================================================================= */}
      {/* 1. Trust & Safety Header: Caribbean Mutual Aid Protocol Banner            */}
      {/* ========================================================================= */}
      <section
        aria-labelledby="relief-hero-heading"
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-twilight via-slate-900 to-brand-dusk border border-brand-sunriseCoral/30 shadow-2xl p-6 sm:p-8 lg:p-10"
      >
        {/* Decorative background glow accents */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-sunriseCoral/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-brand-caribbeanSea/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-3xl space-y-4">
            {/* Top Guarantees & Badges */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-sunriseCoral/20 border border-brand-sunriseCoral/40 px-3.5 py-1 text-xs font-black text-brand-sunriseCoral uppercase tracking-wider">
                <HeartHandshake className="w-4 h-4 text-brand-sunriseCoral" />
                Caribbean Community Relief &amp; Mutual Aid
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 px-3 py-1 text-xs font-bold text-emerald-300">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                100% Mutual Aid Guarantee — 0% Platform Fees Deducted
              </span>
            </div>

            {/* Main Heading */}
            <h1
              id="relief-hero-heading"
              className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black text-white tracking-tight leading-tight"
            >
              Direct Solidarity for Our{' '}
              <span className="bg-gradient-to-r from-brand-sunriseCoral via-brand-goldenHour to-brand-caribbeanSea bg-clip-text text-transparent">
                Islands &amp; Communities
              </span>
            </h1>

            {/* Subtitle & Protocol Description */}
            <p className="text-sm sm:text-base text-brand-sandstone/90 leading-relaxed max-w-2xl">
              Rapid, transparent humanitarian response and crisis mutual aid across the West Indies.
              Every contribution is protected under regional disaster agency frameworks including{' '}
              <strong className="text-white font-semibold">CDEMA</strong> (Caribbean Disaster Emergency Management Agency),{' '}
              <strong className="text-white font-semibold">ODPEM</strong> (Office of Disaster Preparedness), and{' '}
              <strong className="text-white font-semibold">NEMO</strong> (National Emergency Management Organisation).
            </p>

            {/* Trust Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="flex items-start gap-2.5 rounded-2xl bg-slate-950/50 border border-white/10 p-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white">Agency Verified</h4>
                  <p className="text-[11px] text-brand-sandstone/70">
                    Validated against CDEMA, ODPEM &amp; NEMO emergency declarations.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-2xl bg-slate-950/50 border border-white/10 p-3">
                <Sparkles className="w-5 h-5 text-brand-goldenHour shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white">0% Platform Cut</h4>
                  <p className="text-[11px] text-brand-sandstone/70">
                    Tukubi charges 0% fees on all disaster and medical relief funds.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-2xl bg-slate-950/50 border border-white/10 p-3">
                <CheckCircle2 className="w-5 h-5 text-brand-caribbeanSea shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white">Escrow Safeguards</h4>
                  <p className="text-[11px] text-brand-sandstone/70">
                    Double-entry ledger security ensures transparent disbursements.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Primary CTA: Launch Fundraiser */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 lg:w-72">
            <Link
              href="/create?mode=fundraiser"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-brand-sunriseCoral via-brand-goldenHour to-brand-caribbeanSea hover:brightness-110 text-slate-950 font-black px-6 py-4 rounded-2xl text-sm sm:text-base min-h-[44px] transition-all shadow-xl shadow-brand-sunriseCoral/25 active:scale-[0.98]"
            >
              <Plus className="w-5 h-5 stroke-[3]" />
              <span>Launch Relief Fundraiser</span>
            </Link>

            <div className="rounded-2xl bg-slate-950/60 border border-white/10 p-3.5 text-center">
              <p className="text-[11px] text-brand-sandstone/80">
                Community member or local NGO needing emergency assistance?
                Verification takes under 2 hours.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. Filter Controls: Category Pills, Territory Selector, Search & Verified */}
      {/* ========================================================================= */}
      <section aria-label="Relief Campaign Filters" className="space-y-4">
        {/* Category Pills Slider / Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORY_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentCategory === tab.id;
            const targetUrl = buildQueryUrl(resolvedParams, { category: tab.id });

            return (
              <Link
                key={tab.id}
                href={targetUrl}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold min-h-[44px] shrink-0 transition-all ${
                  isActive
                    ? 'bg-brand-sunriseCoral text-white shadow-lg shadow-brand-sunriseCoral/25 ring-2 ring-brand-sunriseCoral/40'
                    : 'bg-brand-dusk/90 hover:bg-slate-800 text-brand-sandstone hover:text-white border border-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-brand-sunriseCoral'}`} />
                <span>{tab.label}</span>
                {tab.id !== 'all' && (
                  <span
                    className={`hidden md:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-brand-sandstone/70'
                    }`}
                  >
                    {tab.protocol}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Search Bar, Territory Dropdown & Verified Filter */}
        <form
          method="GET"
          action="/relief"
          role="search"
          aria-label="Filter relief campaigns"
          className="flex flex-col md:flex-row items-stretch md:items-center gap-3 bg-brand-dusk/95 border border-slate-800 rounded-3xl p-3 sm:p-4 shadow-xl"
        >
          {/* Preserve category if selected */}
          {currentCategory !== 'all' && (
            <input type="hidden" name="category" value={currentCategory} />
          )}

          {/* Preserve verified if selected */}
          {isVerifiedOnly && <input type="hidden" name="verified" value="true" />}

          {/* Text Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-sandstone/60 pointer-events-none" />
            <input
              type="text"
              name="q"
              defaultValue={currentQuery}
              placeholder="Search relief funds, disasters, storms, parishes..."
              aria-label="Search relief campaigns"
              className="w-full bg-slate-900 border border-slate-700/80 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-brand-sandstone/50 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-brand-sunriseCoral/50 focus:border-brand-sunriseCoral transition-all"
            />
          </div>

          {/* Island Territory Dropdown */}
          <div className="relative min-w-[190px]">
            <select
              name="country"
              defaultValue={currentCountry}
              aria-label="Filter by Island Territory"
              className="w-full appearance-none bg-slate-900 border border-slate-700/80 rounded-2xl pl-3.5 pr-10 py-2.5 text-xs sm:text-sm text-white min-h-[44px] focus:outline-none focus:ring-2 focus:ring-brand-sunriseCoral/50 focus:border-brand-sunriseCoral transition-all cursor-pointer"
            >
              {CARIBBEAN_ISLAND_TERRITORIES.map((territory) => (
                <option key={territory.code} value={territory.code} className="bg-slate-900 text-white">
                  {territory.flag} {territory.name} ({territory.code})
                </option>
              ))}
            </select>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-brand-sandstone/60">
              <Filter className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Action Buttons: Submit & Clear */}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              aria-label="Submit search"
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 bg-brand-sunriseCoral hover:brightness-110 text-white font-bold px-5 py-2.5 rounded-2xl text-xs sm:text-sm min-h-[44px] shadow-md shadow-brand-sunriseCoral/20 transition-all active:scale-[0.98]"
            >
              <Search className="w-4 h-4" />
              <span>Search</span>
            </button>

            {/* Verified Only Toggle Button / Link */}
            <Link
              href={buildQueryUrl(resolvedParams, {
                verified: isVerifiedOnly ? undefined : 'true',
              })}
              aria-label={isVerifiedOnly ? 'Show all campaigns' : 'Show verified campaigns only'}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold min-h-[44px] transition-all border ${
                isVerifiedOnly
                  ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-900 border-slate-700/80 text-brand-sandstone hover:text-white'
              }`}
            >
              <ShieldCheck className={`w-4 h-4 ${isVerifiedOnly ? 'text-emerald-400' : 'text-brand-sandstone'}`} />
              <span className="hidden sm:inline">Verified Only</span>
            </Link>

            {/* Clear Filters Reset */}
            {hasActiveFilters && (
              <Link
                href="/relief"
                aria-label="Clear all relief filters"
                className="inline-flex items-center gap-1 text-xs text-brand-sandstone/80 hover:text-brand-sunriseCoral px-3 py-2.5 rounded-2xl min-h-[44px] transition-colors"
              >
                <X className="w-4 h-4" />
                <span className="hidden lg:inline">Clear</span>
              </Link>
            )}
          </div>
        </form>
      </section>

      {/* ========================================================================= */}
      {/* 3. Campaign Grid: Responsive Layout or Encouraging Empty State            */}
      {/* ========================================================================= */}
      <section aria-label="Relief Campaigns List" className="space-y-6">
        {/* Results Counter & Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg sm:text-xl font-black text-white">Active Community Campaigns</h2>
            <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-slate-800 text-xs font-mono font-bold text-brand-sandstone">
              {campaigns.length}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-brand-sandstone/70">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Regional Ledger</span>
          </div>
        </div>

        {/* Empty State */}
        {campaigns.length === 0 ? (
          <div className="relative overflow-hidden rounded-3xl bg-brand-dusk/90 border border-slate-800 p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-5 shadow-2xl">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-brand-sunriseCoral/20 via-brand-twilight/40 to-brand-caribbeanSea/20 border border-brand-sunriseCoral/30 flex items-center justify-center mx-auto text-brand-sunriseCoral shadow-lg">
              <HeartHandshake className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl sm:text-2xl font-black text-white">
                No active relief campaigns found
              </h3>
              <p className="text-xs sm:text-sm text-brand-sandstone/80 max-w-md mx-auto leading-relaxed">
                There are currently no active mutual aid campaigns matching your criteria. If your
                community has been affected by severe weather or urgent hardship, you can launch a
                fundraiser now.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/create?mode=fundraiser"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-sunriseCoral hover:brightness-110 text-white font-black px-6 py-3 rounded-2xl text-xs sm:text-sm min-h-[44px] shadow-lg shadow-brand-sunriseCoral/25 transition-all"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Launch Relief Fundraiser</span>
              </Link>

              {hasActiveFilters && (
                <Link
                  href="/relief"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold px-5 py-3 rounded-2xl text-xs sm:text-sm min-h-[44px] transition-all"
                >
                  <X className="w-4 h-4" />
                  <span>Reset All Filters</span>
                </Link>
              )}
            </div>
          </div>
        ) : (
          /* Campaigns Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <ReliefCampaignCard
                key={campaign.id}
                campaign={campaign}
                currentUserId={user?.id}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
