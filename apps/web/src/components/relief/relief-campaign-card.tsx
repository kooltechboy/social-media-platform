'use client';

import React from 'react';
import Link from 'next/link';
import {
  Wind,
  Droplets,
  HeartPulse,
  Hammer,
  BookOpen,
  Landmark,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Heart,
  MapPin,
  Users,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';
import {
  RELIEF_CATEGORY_METADATA,
  calculateCampaignProgress,
  formatDonationAmount,
  isDisasterDeclarationVerified,
} from '../../lib/relief/types';
import type { ReliefCampaign, ReliefCategory } from '../../lib/relief/types';
import ReliefDonationModal from './relief-donation-modal';

export interface ReliefCampaignCardProps {
  campaign: ReliefCampaign;
  currentUserId?: string;
  onDonate?: (campaign: ReliefCampaign) => void;
  className?: string;
}

const TERRITORY_FLAGS: Record<string, string> = {
  JAM: '🇯🇲', JM: '🇯🇲',
  TTO: '🇹🇹', TT: '🇹🇹',
  BRB: '🇧🇧', BB: '🇧🇧',
  HTI: '🇭🇹', HT: '🇭🇹',
  DMA: '🇩🇲', DM: '🇩🇲',
  LCA: '🇱🇨', LC: '🇱🇨',
  GRD: '🇬🇩', GD: '🇬🇩',
  VCT: '🇻🇨', VC: '🇻🇨',
  ATG: '🇦🇬', AG: '🇦🇬',
  KNA: '🇰🇳', KN: '🇰🇳',
  BHS: '🇧🇸', BS: '🇧🇸',
  GUY: '🇬🇾', GY: '🇬🇾',
  SUR: '🇸🇷', SR: '🇸🇷',
  BLZ: '🇧🇿', BZ: '🇧🇿',
  DOM: '🇩🇴', DO: '🇩🇴',
  PRI: '🇵🇷', PR: '🇵🇷',
  CUB: '🇨🇺', CU: '🇨🇺',
  CUW: '🇨🇼', CW: '🇨🇼',
  ABW: '🇦🇼', AW: '🇦🇼',
  SXM: '🇸🇽', SX: '🇸🇽',
};

function getTerritoryFlag(iso?: string | null, fallbackEmoji?: string | null): string {
  if (fallbackEmoji) return fallbackEmoji;
  if (!iso) return '🌴';
  return TERRITORY_FLAGS[iso.toUpperCase()] || '🌴';
}

function getCategoryIcon(category: ReliefCategory) {
  switch (category) {
    case 'hurricane_relief':
      return Wind;
    case 'flood_disaster':
      return Droplets;
    case 'medical_aid':
      return HeartPulse;
    case 'community_rebuild':
      return Hammer;
    case 'education':
      return BookOpen;
    case 'cultural_heritage':
      return Landmark;
    default:
      return Heart;
  }
}

function useSafeState<T>(initialValue: T | (() => T)): [T, React.Dispatch<React.SetStateAction<T>>] {
  const internals =
    (React as any)?.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE ||
    (React as any)?.__SECRET_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
  const dispatcher = internals?.H || internals?.ReactCurrentDispatcher?.current;

  if (dispatcher) {
    return React.useState<T>(initialValue);
  }
  const val = typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue;
  return [val, () => {}];
}

export default function ReliefCampaignCard({
  campaign,
  currentUserId,
  onDonate,
  className = '',
}: ReliefCampaignCardProps) {
  const [isModalOpen, setIsModalOpen] = useSafeState(false);

  const categoryMeta = RELIEF_CATEGORY_METADATA[campaign.category] || {
    title: 'Disaster Relief & Mutual Aid',
    protocol: 'CARIB-EMERGENCY',
    icon: 'Heart',
    agency: 'Regional Mutual Aid Protocol',
  };

  const CategoryIconComponent = getCategoryIcon(campaign.category);
  const flagEmoji = getTerritoryFlag(
    campaign.target_country_iso || campaign.country?.iso_code,
    campaign.country?.flag_emoji
  );

  const locationDisplay =
    campaign.city?.name ||
    campaign.country?.name ||
    (campaign.target_country_iso ? `Territory (${campaign.target_country_iso})` : 'Pan-Caribbean Region');

  const progressPercent = calculateCampaignProgress(campaign.raised_minor, campaign.goal_minor);
  const formattedRaised = formatDonationAmount(campaign.raised_minor, campaign.currency);
  const formattedGoal = formatDonationAmount(campaign.goal_minor, campaign.currency);

  const isVerified = campaign.verification_status === 'verified';
  const isPending = campaign.verification_status === 'pending';
  const isRejected = campaign.verification_status === 'rejected';

  const handleOpenDonate = () => {
    if (onDonate) {
      onDonate(campaign);
    } else {
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <article
        className={`group relative overflow-hidden rounded-3xl bg-brand-dusk border border-slate-800/80 shadow-xl transition-all duration-300 hover:shadow-2xl hover:border-brand-sunriseCoral/40 flex flex-col justify-between ${className}`}
        aria-labelledby={`campaign-title-${campaign.id}`}
      >
        {/* Top Cover Visual */}
        <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-gradient-to-br from-brand-twilight via-slate-900 to-brand-dusk">
          {campaign.cover_image_url ? (
            <img
              src={campaign.cover_image_url}
              alt={campaign.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-sunriseCoral/20 via-brand-twilight/50 to-brand-caribbeanSea/20">
              <div className="flex flex-col items-center gap-2 text-brand-sandstone/70">
                <CategoryIconComponent className="w-12 h-12 text-brand-sunriseCoral/60" />
                <span className="text-xs font-semibold tracking-wider uppercase text-brand-goldenHour">
                  Caribbean Mutual Aid
                </span>
              </div>
            </div>
          )}

          {/* Top Badges Overlay */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
            {/* Category Badge & Protocol */}
            <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-950/85 backdrop-blur-md px-3 py-1 text-xs font-medium text-white border border-white/10 shadow-sm">
              <CategoryIconComponent className="w-3.5 h-3.5 text-brand-sunriseCoral shrink-0" />
              <span className="truncate max-w-[150px] sm:max-w-[200px]">{categoryMeta.title}</span>
              <span className="hidden sm:inline-block px-1.5 py-0.2 rounded bg-brand-sunriseCoral/20 text-[10px] font-mono font-bold text-brand-sunriseCoral">
                {categoryMeta.protocol}
              </span>
            </div>

            {/* Territory Flag & Parish */}
            <div className="inline-flex items-center gap-1 rounded-full bg-slate-950/85 backdrop-blur-md px-2.5 py-1 text-xs font-semibold text-white border border-white/10 shadow-sm shrink-0">
              <span className="text-base leading-none">{flagEmoji}</span>
              <span className="max-w-[110px] truncate text-slate-200">{locationDisplay}</span>
            </div>
          </div>

          {/* 0% Platform Fee Banner Tag */}
          <div className="absolute bottom-2.5 left-3">
            <span className="inline-flex items-center gap-1 rounded-md bg-brand-caribbeanSea/90 backdrop-blur-sm px-2 py-0.5 text-[11px] font-bold text-slate-950 shadow-sm">
              <Sparkles className="w-3 h-3" /> 0% Platform Fee Guarantee
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            {/* Trust Shield Verification Banner */}
            {isVerified && (
              <div className="flex items-center justify-between rounded-xl bg-emerald-950/40 border border-emerald-500/30 px-3.5 py-2 text-xs text-emerald-300">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-bold">Verified Disaster Response</span>
                </div>
                {campaign.disaster_declaration_ref && (
                  <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-200">
                    {campaign.disaster_declaration_ref}
                  </span>
                )}
              </div>
            )}

            {isPending && (
              <div className="rounded-xl bg-amber-950/40 border border-amber-500/30 px-3.5 py-2 text-xs text-amber-300 space-y-1">
                <div className="flex items-center gap-2 font-bold">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Pending Regional Verification</span>
                </div>
                <p className="text-[11px] text-amber-300/80 leading-snug">
                  Disbursements locked until disaster agency validation.
                  {campaign.disaster_declaration_ref && (
                    <span className="block font-mono text-[10px] text-amber-200/90 mt-0.5">
                      Ref: {campaign.disaster_declaration_ref}
                    </span>
                  )}
                </p>
              </div>
            )}

            {isRejected && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-950/40 border border-rose-500/30 px-3.5 py-2 text-xs text-rose-300 font-semibold">
                <ShieldX className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Verification Rejected</span>
              </div>
            )}

            {/* Campaign Title & Description */}
            <div>
              <h3
                id={`campaign-title-${campaign.id}`}
                className="font-bold text-lg sm:text-xl text-white group-hover:text-brand-sunriseCoral transition-colors line-clamp-2"
              >
                {campaign.title}
              </h3>
              <p className="mt-1.5 text-sm text-slate-300/90 line-clamp-3 leading-relaxed">
                {campaign.description}
              </p>
            </div>
          </div>

          {/* Progress & Financial Metrics */}
          <div className="space-y-2 pt-2">
            <div className="flex items-baseline justify-between text-xs sm:text-sm">
              <div>
                <span className="font-extrabold text-base sm:text-lg text-white">
                  {formattedRaised}
                </span>{' '}
                <span className="text-slate-400">raised of {formattedGoal}</span>
              </div>
              <span className="font-bold text-brand-goldenHour">{progressPercent}%</span>
            </div>

            {/* Accessible Progress Bar */}
            <div
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuetext={`${formattedRaised} of ${formattedGoal} raised`}
              className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-800"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-sunriseCoral via-brand-goldenHour to-brand-caribbeanSea transition-all duration-500 ease-out"
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              />
            </div>

            {/* Donor Count & Community Backing */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1.5 font-medium">
                <Users className="w-3.5 h-3.5 text-brand-sandstone/70" />
                <span>{`${campaign.donations_count} donors`}</span>
              </span>
              <span className="text-slate-400">
                {categoryMeta.protocol}
              </span>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleOpenDonate}
              aria-label={`Donate to ${campaign.title}`}
              className="w-full min-h-[44px] min-w-[44px] flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-sunriseCoral via-pink-600 to-brand-goldenHour hover:opacity-95 active:scale-[0.99] font-bold text-white shadow-lg shadow-brand-sunriseCoral/20 transition-all focus:outline-none focus:ring-2 focus:ring-brand-sunriseCoral focus:ring-offset-2 focus:ring-offset-slate-900 cursor-pointer"
            >
              <Heart className="w-4 h-4 fill-white text-white" />
              <span>Donate to Relief</span>
            </button>
          </div>
        </div>
      </article>

      {/* Embedded Accessible Donation Modal */}
      {!onDonate && (
        <ReliefDonationModal
          campaign={campaign}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          currentUserId={currentUserId}
        />
      )}
    </>
  );
}
