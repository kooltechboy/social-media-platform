/**
 * Tukubi Caribbean Digital Ecosystem — Community Relief & Mutual Aid Types
 * Adheres to NASA-grade architecture, double-entry ledger safety, and regional disaster agency protocols.
 */

export type ReliefCategory =
  | 'hurricane_relief'
  | 'flood_disaster'
  | 'medical_aid'
  | 'community_rebuild'
  | 'education'
  | 'cultural_heritage';

export type ReliefVerificationStatus = 'pending' | 'verified' | 'rejected';
export type DisbursementStatus = 'locked' | 'verified_ready' | 'disbursed';

export interface ReliefCategoryMetadata {
  title: string;
  description: string;
  icon: string;
  protocol: string;
  agency: string;
}

export const RELIEF_CATEGORY_METADATA: Record<ReliefCategory, ReliefCategoryMetadata> = {
  hurricane_relief: {
    title: 'Hurricane Relief & Storm Recovery',
    description: 'Emergency provisions, evacuation, temporary shelter, and essentials for hurricane victims.',
    icon: 'Wind',
    protocol: 'CDEMA-HURR',
    agency: 'Caribbean Disaster Emergency Management Agency (CDEMA)',
  },
  flood_disaster: {
    title: 'Flood & Storm Surge Relief',
    description: 'Rapid clean water distribution, drainage recovery, and emergency containment for flooded communities.',
    icon: 'Droplets',
    protocol: 'ODPEM-FLOOD',
    agency: 'Office of Disaster Preparedness and Emergency Management (ODPEM)',
  },
  medical_aid: {
    title: 'Medical Aid & Emergency Care',
    description: 'Critical pharmaceutical supply, patient triage, field hospital gear, and emergency trauma support.',
    icon: 'HeartPulse',
    protocol: 'CARPHA-MED',
    agency: 'Caribbean Public Health Agency (CARPHA)',
  },
  community_rebuild: {
    title: 'Community Rebuild & Infrastructure',
    description: 'Rebuilding damaged homes, community clinics, civic centers, and critical public infrastructure.',
    icon: 'Hammer',
    protocol: 'NEMO-REBUILD',
    agency: 'National Emergency Management Organisation (NEMO)',
  },
  education: {
    title: 'Education & Youth Recovery',
    description: 'Restoring damaged schools, learning materials, computers, and student meals post-disaster.',
    icon: 'BookOpen',
    protocol: 'CARICOM-EDU',
    agency: 'CARICOM Education & Human Development Directorate',
  },
  cultural_heritage: {
    title: 'Cultural Heritage & Artisan Aid',
    description: 'Safeguarding vulnerable historic Caribbean landmarks, cultural artifacts, and heritage crafts.',
    icon: 'Landmark',
    protocol: 'UNESCO-CARIB-HERITAGE',
    agency: 'Caribbean Cultural Heritage & Preservation Trust',
  },
};

export interface ReliefCampaign {
  id: string;
  creator_id: string;
  community_id?: string | null;
  title: string;
  description: string;
  category: ReliefCategory;
  target_country_iso?: string | null;
  target_city_id?: string | null;
  goal_minor: number;
  raised_minor: number;
  currency: string;
  verification_status: ReliefVerificationStatus;
  verified_at?: string | null;
  verified_by?: string | null;
  disaster_declaration_ref?: string | null;
  supporting_evidence_urls: string[];
  cover_image_url?: string | null;
  disbursement_status: DisbursementStatus;
  deadline_at?: string | null;
  is_active: boolean;
  donations_count: number;
  created_at: string;
  updated_at: string;
  creator?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string | null;
  } | null;
  country?: {
    name: string;
    iso_code: string;
    flag_emoji?: string | null;
  } | null;
  city?: {
    name: string;
  } | null;
}

export interface ReliefDonation {
  id: string;
  campaign_id: string;
  donor_id?: string | null;
  amount_minor: number;
  currency: string;
  is_anonymous: boolean;
  donor_name?: string | null;
  donor_message?: string | null;
  idempotency_key: string;
  created_at: string;
  donor?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string | null;
  } | null;
}

export interface CreateReliefCampaignInput {
  title: string;
  description: string;
  category: ReliefCategory;
  goal_minor: number;
  currency?: string;
  target_country_iso?: string | null;
  target_city_id?: string | null;
  community_id?: string | null;
  disaster_declaration_ref?: string | null;
  supporting_evidence_urls?: string[];
  cover_image_url?: string | null;
  deadline_at?: string | null;
}

export interface DonateToReliefInput {
  campaign_id: string;
  amount_minor: number;
  currency?: string;
  is_anonymous?: boolean;
  donor_name?: string | null;
  donor_message?: string | null;
  idempotency_key?: string;
}

export const VERIFIED_DISASTER_AGENCIES = ['CDEMA', 'ODPEM', 'NEMO', 'CARPHA', 'DDM'] as const;

/**
 * Calculates campaign funding progress percentage (integer 0-100+).
 */
export function calculateCampaignProgress(raisedMinor: number, goalMinor: number): number {
  if (!Number.isFinite(raisedMinor) || !Number.isFinite(goalMinor)) return 0;
  if (goalMinor <= 0 || raisedMinor <= 0) return 0;
  return Math.round((raisedMinor / goalMinor) * 100);
}

/**
 * Formats minor currency units into a localized currency string.
 */
export function formatDonationAmount(
  amountMinor: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  const normCurrency = (currency || 'USD').toUpperCase().trim();
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: normCurrency,
    }).format(amountMinor / 100);
  } catch {
    return `$${(amountMinor / 100).toFixed(2)}`;
  }
}

/**
 * Validates donation amounts for ledger safety and business constraints.
 */
export function validateDonationAmount(amountMinor: number): { isValid: boolean; error?: string } {
  if (typeof amountMinor !== 'number' || !Number.isFinite(amountMinor) || !Number.isInteger(amountMinor)) {
    return { isValid: false, error: 'Donation amount must be an integer in minor currency units.' };
  }

  if (amountMinor <= 0) {
    return { isValid: false, error: 'Donation amount must be greater than zero.' };
  }

  // Minimum donation constraint: $1.00 (100 minor units)
  if (amountMinor < 100) {
    return { isValid: false, error: 'Minimum donation amount is 100 minor units ($1.00).' };
  }

  // Single transaction limit: $1,000,000.00
  if (amountMinor > 100_000_000) {
    return { isValid: false, error: 'Donation amount exceeds single-transaction limit.' };
  }

  return { isValid: true };
}

/**
 * Validates whether an official disaster declaration reference matches verified regional Caribbean protocols.
 */
export function isDisasterDeclarationVerified(ref?: string | null): boolean {
  if (!ref || typeof ref !== 'string') return false;
  const trimmed = ref.trim().toUpperCase();
  if (trimmed.length < 5) return false;
  return VERIFIED_DISASTER_AGENCIES.some((agency) => trimmed.startsWith(agency));
}
