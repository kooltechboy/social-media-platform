'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentUser } from '../supabase/server';
import {
  RELIEF_CATEGORY_METADATA,
  validateDonationAmount,
  isDisasterDeclarationVerified,
} from './types';
import type {
  CreateReliefCampaignInput,
  DonateToReliefInput,
  ReliefCampaign,
  ReliefCategory,
  ReliefDonation,
  ReliefVerificationStatus,
} from './types';

export interface ReliefActionState {
  error: string | null;
  success?: boolean;
}

function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Gracefully ignore outside Next.js request context (e.g. tests)
  }
}

/**
 * Creates a new Caribbean community relief or disaster recovery campaign.
 * Automatically initiates campaign in 'pending' verification and 'locked' disbursement status.
 */
export async function createReliefCampaignAction(
  inputOrFormData: CreateReliefCampaignInput | FormData
): Promise<{ data: ReliefCampaign | null; campaign?: ReliefCampaign | null; error: string | null }> {
  const user = await getCurrentUser();
  if (!user) {
    return { data: null, campaign: null, error: 'Sign in required to launch a relief campaign.' };
  }

  let title = '';
  let description = '';
  let category: ReliefCategory = 'hurricane_relief';
  let goalMinor = 0;
  let currency = 'USD';
  let targetCountryIso: string | null = null;
  let targetCityId: string | null = null;
  let communityId: string | null = null;
  let disasterDeclarationRef: string | null = null;
  let supportingEvidenceUrls: string[] = [];
  let coverImageUrl: string | null = null;
  let deadlineAt: string | null = null;

  if (inputOrFormData instanceof FormData) {
    title = String(inputOrFormData.get('title') ?? '').trim();
    description = String(inputOrFormData.get('description') ?? '').trim();
    category = String(inputOrFormData.get('category') ?? 'hurricane_relief') as ReliefCategory;
    const rawGoal = inputOrFormData.get('goalMinor') ?? inputOrFormData.get('goal_minor');
    goalMinor = rawGoal ? Number.parseInt(String(rawGoal), 10) : 0;
    currency = String(inputOrFormData.get('currency') ?? 'USD').toUpperCase();
    targetCountryIso = String(inputOrFormData.get('targetCountryIso') ?? inputOrFormData.get('target_country_iso') ?? '') || null;
    targetCityId = String(inputOrFormData.get('targetCityId') ?? inputOrFormData.get('target_city_id') ?? '') || null;
    communityId = String(inputOrFormData.get('communityId') ?? inputOrFormData.get('community_id') ?? '') || null;
    disasterDeclarationRef = String(inputOrFormData.get('disasterDeclarationRef') ?? inputOrFormData.get('disaster_declaration_ref') ?? '').trim() || null;
    coverImageUrl = String(inputOrFormData.get('coverImageUrl') ?? inputOrFormData.get('cover_image_url') ?? '').trim() || null;
    deadlineAt = String(inputOrFormData.get('deadlineAt') ?? inputOrFormData.get('deadline_at') ?? '').trim() || null;

    const rawUrls = inputOrFormData.get('supportingEvidenceUrls') ?? inputOrFormData.get('supporting_evidence_urls');
    if (typeof rawUrls === 'string' && rawUrls) {
      try {
        const parsed = JSON.parse(rawUrls);
        if (Array.isArray(parsed)) {
          supportingEvidenceUrls = parsed.map((u) => String(u).trim()).filter(Boolean);
        }
      } catch {
        supportingEvidenceUrls = rawUrls.split(',').map((u) => u.trim()).filter(Boolean);
      }
    }
  } else {
    title = (inputOrFormData.title ?? '').trim();
    description = (inputOrFormData.description ?? '').trim();
    category = inputOrFormData.category;
    goalMinor = inputOrFormData.goal_minor;
    currency = (inputOrFormData.currency ?? 'USD').toUpperCase();
    targetCountryIso = inputOrFormData.target_country_iso ?? null;
    targetCityId = inputOrFormData.target_city_id ?? null;
    communityId = inputOrFormData.community_id ?? null;
    disasterDeclarationRef = inputOrFormData.disaster_declaration_ref ? inputOrFormData.disaster_declaration_ref.trim() : null;
    supportingEvidenceUrls = inputOrFormData.supporting_evidence_urls ?? [];
    coverImageUrl = inputOrFormData.cover_image_url ?? null;
    deadlineAt = inputOrFormData.deadline_at ?? null;
  }

  // Validation
  if (!title) return { data: null, campaign: null, error: 'Campaign title is required.' };
  if (!description) return { data: null, campaign: null, error: 'Campaign description is required.' };
  if (!Object.prototype.hasOwnProperty.call(RELIEF_CATEGORY_METADATA, category)) {
    return { data: null, campaign: null, error: 'Invalid relief category.' };
  }

  // Minimum goal: $100 / 10,000 minor units
  if (!Number.isInteger(goalMinor) || goalMinor < 10000) {
    return { data: null, campaign: null, error: 'Campaign goal must be at least $100 (10,000 minor units).' };
  }

  // Validate disaster declaration reference protocol if provided
  if (disasterDeclarationRef && !isDisasterDeclarationVerified(disasterDeclarationRef)) {
    return { data: null, campaign: null, error: 'Invalid disaster declaration protocol reference.' };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { data: null, campaign: null, error: 'Database unavailable.' };

  const insertPayload = {
    creator_id: user.id,
    community_id: communityId,
    title,
    description,
    category,
    target_country_iso: targetCountryIso,
    target_city_id: targetCityId,
    goal_minor: goalMinor,
    raised_minor: 0,
    currency,
    verification_status: 'pending' as const,
    disbursement_status: 'locked' as const,
    disaster_declaration_ref: disasterDeclarationRef,
    supporting_evidence_urls: supportingEvidenceUrls,
    cover_image_url: coverImageUrl,
    deadline_at: deadlineAt ? new Date(deadlineAt).toISOString() : null,
    is_active: true,
    donations_count: 0,
  };

  const { data: campaign, error } = await supabase
    .from('relief_campaigns')
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    return { data: null, campaign: null, error: error.message };
  }

  safeRevalidatePath('/relief');
  return { data: campaign as ReliefCampaign, campaign: campaign as ReliefCampaign, error: null };
}

/**
 * Executes a donation to a Caribbean relief campaign with atomic idempotency and ledger safety.
 */
export async function donateToReliefCampaignAction(
  inputOrFormData: DonateToReliefInput | FormData
): Promise<{ data: ReliefDonation | null; donation?: ReliefDonation | null; error: string | null; success?: boolean }> {
  let campaignId = '';
  let amountMinor = 0;
  let currency = 'USD';
  let isAnonymous = false;
  let donorName: string | null = null;
  let donorMessage: string | null = null;
  let idempotencyKey: string | null = null;

  if (inputOrFormData instanceof FormData) {
    campaignId = String(inputOrFormData.get('campaignId') ?? inputOrFormData.get('campaign_id') ?? '').trim();
    const rawAmount = inputOrFormData.get('amountMinor') ?? inputOrFormData.get('amount_minor');
    amountMinor = rawAmount ? Number.parseInt(String(rawAmount), 10) : 0;
    currency = String(inputOrFormData.get('currency') ?? 'USD').toUpperCase();
    isAnonymous = String(inputOrFormData.get('isAnonymous') ?? inputOrFormData.get('is_anonymous') ?? '') === 'true';
    donorName = String(inputOrFormData.get('donorName') ?? inputOrFormData.get('donor_name') ?? '').trim() || null;
    donorMessage = String(inputOrFormData.get('donorMessage') ?? inputOrFormData.get('donor_message') ?? '').trim() || null;
    idempotencyKey = String(inputOrFormData.get('idempotencyKey') ?? inputOrFormData.get('idempotency_key') ?? '').trim() || null;
  } else {
    campaignId = inputOrFormData.campaign_id;
    amountMinor = inputOrFormData.amount_minor;
    currency = (inputOrFormData.currency ?? 'USD').toUpperCase();
    isAnonymous = Boolean(inputOrFormData.is_anonymous);
    donorName = inputOrFormData.donor_name ?? null;
    donorMessage = inputOrFormData.donor_message ?? null;
    idempotencyKey = inputOrFormData.idempotency_key ?? null;
  }

  if (!campaignId) {
    return { data: null, donation: null, error: 'Campaign ID is required.' };
  }

  const amountValidation = validateDonationAmount(amountMinor);
  if (!amountValidation.isValid) {
    return { data: null, donation: null, error: amountValidation.error ?? 'Invalid donation amount.' };
  }

  const user = await getCurrentUser();
  const donorId = user ? user.id : null;

  if (!idempotencyKey) {
    const randomSuffix = Math.random().toString(36).substring(2, 10);
    idempotencyKey = `relief_don_${campaignId}_${Date.now()}_${randomSuffix}`;
  }

  const finalDonorName = isAnonymous ? 'Anonymous Supporter' : donorName || 'Community Supporter';

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { data: null, donation: null, error: 'Database unavailable.' };

  const insertPayload = {
    campaign_id: campaignId,
    donor_id: donorId,
    amount_minor: amountMinor,
    currency,
    is_anonymous: isAnonymous,
    donor_name: finalDonorName,
    donor_message: donorMessage,
    idempotency_key: idempotencyKey,
  };

  const { data: donation, error } = await supabase
    .from('relief_donations')
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    return { data: null, donation: null, error: error.message };
  }

  safeRevalidatePath('/relief');
  safeRevalidatePath(`/relief/${campaignId}`);
  return {
    data: donation as ReliefDonation,
    donation: donation as ReliefDonation,
    error: null,
    success: true,
  };
}

/**
 * Administrative verification gate to verify or reject disaster campaigns.
 */
export async function verifyReliefCampaignAction(
  campaignId: string,
  status: ReliefVerificationStatus
): Promise<{ success: boolean; error: string | null }> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'Unauthorized. Sign in required.' };
  }

  if (!['verified', 'rejected'].includes(status)) {
    return { success: false, error: 'Invalid verification status.' };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database unavailable.' };

  const updatePayload: Record<string, unknown> = {
    verification_status: status,
    verified_at: new Date().toISOString(),
    verified_by: user.id,
  };

  if (status === 'verified') {
    updatePayload.disbursement_status = 'verified_ready';
  }

  const { error } = await supabase
    .from('relief_campaigns')
    .update(updatePayload)
    .eq('id', campaignId);

  if (error) {
    return { success: false, error: error.message };
  }

  safeRevalidatePath('/relief');
  safeRevalidatePath(`/relief/${campaignId}`);
  return { success: true, error: null };
}

/**
 * Fetches campaign details, creator profile, and recent sanitized donations.
 */
export async function fetchReliefCampaignAction(campaignId: string): Promise<{
  data: { campaign: ReliefCampaign; donations: ReliefDonation[] } | null;
  campaign: ReliefCampaign | null;
  donations: ReliefDonation[];
  error: string | null;
}> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { data: null, campaign: null, donations: [], error: 'Database unavailable.' };
  }

  const { data: campaign, error: campaignError } = await supabase
    .from('relief_campaigns')
    .select(
      '*, creator:profiles!relief_campaigns_creator_id_fkey(id, username, display_name, avatar_url), country:countries!relief_campaigns_target_country_iso_fkey(name, iso_code, flag_emoji), city:cities!relief_campaigns_target_city_id_fkey(name)'
    )
    .eq('id', campaignId)
    .maybeSingle();

  if (campaignError || !campaign) {
    return {
      data: null,
      campaign: null,
      donations: [],
      error: campaignError?.message ?? 'Campaign not found.',
    };
  }

  const { data: rawDonations } = await supabase
    .from('relief_donations')
    .select('*, donor:profiles!relief_donations_donor_id_fkey(id, username, display_name, avatar_url)')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false })
    .limit(50);

  const sanitizedDonations: ReliefDonation[] = (rawDonations || []).map((don: any) => {
    if (don.is_anonymous) {
      return {
        ...don,
        donor: null,
        donor_name: 'Anonymous Supporter',
      };
    }
    return don;
  });

  return {
    data: {
      campaign: campaign as ReliefCampaign,
      donations: sanitizedDonations,
    },
    campaign: campaign as ReliefCampaign,
    donations: sanitizedDonations,
    error: null,
  };
}
