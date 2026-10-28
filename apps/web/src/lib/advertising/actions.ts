'use server';

import { getCurrentUser, getAuthorizedUser, createSupabaseServerClient, createServiceSupabaseClient } from '../supabase/server';
import { validateCampaign, type CampaignInput, type AIAdBrief, type GeneratedAdCopy, generateAdCopyPrompt } from '@caribbean/advertising';

// Internal helper to get or create an advertiser ID for the current user
async function getOrCreateAdvertiserId(supabase: any, userId: string): Promise<string | null> {
  // First try to find existing advertiser for this profile
  const { data: existing } = await supabase
    .from('advertisers')
    .select('id')
    .eq('profile_id', userId)
    .single();

  if (existing?.id) return existing.id;

  // Otherwise, create one
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, country_iso')
    .eq('id', userId)
    .single();

  const advertiserName = profile?.display_name ? `${profile.display_name} Ads` : 'My Ads';
  
  const { data: newAdv, error } = await supabase
    .from('advertisers')
    .insert({
      profile_id: userId,
      name: advertiserName,
      billing_country_iso: profile?.country_iso || 'JAM'
    })
    .select('id')
    .single();

  if (error || !newAdv) return null;
  return newAdv.id;
}

export async function createCampaignAction(input: any): Promise<{campaignId: string | null; error?: string}> {
  const user = await getCurrentUser();
  if (!user) return { campaignId: null, error: 'Unauthorized' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { campaignId: null, error: 'Internal Error' };

  const advertiserId = await getOrCreateAdvertiserId(supabase, user.id);
  if (!advertiserId) return { campaignId: null, error: 'Could not resolve advertiser profile' };

  const campaignInput: CampaignInput = {
    advertiserId,
    name: input.name,
    objective: input.objective as any,
    budgetTotalMinor: input.budgetTotalMinor,
    budgetDailyMinor: input.budgetDailyMinor,
    currency: input.currency || 'USD',
    startsAt: input.startsAt || new Date().toISOString(),
  };

  const valResult = validateCampaign(campaignInput);
  if (!valResult.valid) {
    return { campaignId: null, error: valResult.errors.join(', ') };
  }

  const { data, error } = await supabase
    .from('campaigns')
    .insert({
      advertiser_id: advertiserId,
      name: campaignInput.name,
      objective: campaignInput.objective,
      objective_v2: input.objective_v2 || input.objective,
      status: 'draft',
      moderation_status: 'pending',
      budget_total_minor: campaignInput.budgetTotalMinor,
      budget_daily_minor: campaignInput.budgetDailyMinor,
      funded_amount_minor: 0,
      spent_amount_minor: 0,
      currency: campaignInput.currency,
      starts_at: campaignInput.startsAt,
      source_post_id: input.sourcePostId || null,
      page_id: input.pageId || null,
    })
    .select('id')
    .single();

  if (error) return { campaignId: null, error: error.message };
  return { campaignId: data.id };
}

export async function createAdSetAction(input: any): Promise<{adSetId: string | null; error?: string}> {
  const user = await getCurrentUser();
  if (!user) return { adSetId: null, error: 'Unauthorized' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { adSetId: null, error: 'Internal Error' };

  const { data, error } = await supabase
    .from('ad_sets')
    .insert({
      campaign_id: input.campaignId,
      name: input.name || 'Ad Set 1',
      country_iso: input.country_iso,
      interest_keys: input.interest_keys || [],
      placement: input.placement || 'feed',
      placements: input.placements || ['feed'],
      bid_cpm_minor: input.bid_cpm_minor || 800,
    })
    .select('id')
    .single();

  if (error) return { adSetId: null, error: error.message };
  return { adSetId: data.id };
}

export async function createAdAction(input: any): Promise<{adId: string | null; error?: string}> {
  const user = await getCurrentUser();
  if (!user) return { adId: null, error: 'Unauthorized' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { adId: null, error: 'Internal Error' };

  const rawDestUrl = String(input.destination_url || 'https://tukubi.com').trim();
  let safeDestUrl = 'https://tukubi.com';
  if (rawDestUrl.startsWith('/') && !rawDestUrl.startsWith('//')) {
    safeDestUrl = rawDestUrl;
  } else {
    try {
      const parsed = new URL(rawDestUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return { adId: null, error: 'Destination URL must use http:// or https://' };
      }
      safeDestUrl = parsed.toString();
    } catch {
      return { adId: null, error: 'Invalid destination URL' };
    }
  }

  const { data, error } = await supabase
    .from('ads')
    .insert({
      ad_set_id: input.adSetId,
      headline: input.headline,
      body: input.body,
      media_path: input.media_path,
      destination_url: safeDestUrl,
      cta_text: input.cta_text || input.ai_generated_cta || 'Learn More',
      is_approved: false, // Requires moderation clearance before delivery
      creative_type: input.creative_type || 'single_image',
      ai_brief: input.ai_brief,
      ai_generated_headline: input.ai_generated_headline,
      ai_generated_copy: input.ai_generated_copy,
      ai_generated_cta: input.ai_generated_cta,
    })
    .select('id')
    .single();

  if (error) return { adId: null, error: error.message };
  return { adId: data.id };
}

export async function fetchAdvertiserCampaignsAction(): Promise<{campaigns: any[]; error?: string}> {
  const user = await getCurrentUser();
  if (!user) return { campaigns: [], error: 'Unauthorized' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { campaigns: [], error: 'Internal Error' };

  const { data, error } = await supabase
    .from('campaigns')
    .select(`
      id,
      name,
      objective,
      objective_v2,
      status,
      moderation_status,
      moderation_reason,
      budget_total_minor,
      budget_daily_minor,
      funded_amount_minor,
      spent_amount_minor,
      currency,
      created_at,
      source_post_id,
      page_id,
      ad_sets (
        id,
        ads (
          id
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (error) return { campaigns: [], error: error.message };

  // Compute actual campaign performance metrics directly from real ad_events, ad_impressions, and ad_clicks tables.
  const campaigns = await Promise.all(data.map(async (camp: any) => {
    let spendMinor = 0;
    let impressions = 0;
    let clicks = 0;
    
    // We fetch impressions and clicks for ads belonging to this campaign without double-counting dual-written rows
    for (const adSet of camp.ad_sets || []) {
      for (const ad of adSet.ads || []) {
        const { count: impCount } = await supabase.from('ad_events').select('*', { count: 'exact', head: true }).eq('ad_id', ad.id).eq('event_type', 'impression');
        const { count: clickCount } = await supabase.from('ad_events').select('*', { count: 'exact', head: true }).eq('ad_id', ad.id).eq('event_type', 'click');
        
        const { data: impOld } = await supabase.from('ad_impressions').select('cost_minor').eq('ad_id', ad.id);
        const { count: clickOld } = await supabase.from('ad_clicks').select('id, impression_id!inner(ad_id)', { count: 'exact', head: true }).eq('impression_id.ad_id', ad.id);
        
        impressions += Math.max(impCount || 0, impOld?.length || 0);
        clicks += Math.max(clickCount || 0, clickOld || 0);
        if (impOld) {
          spendMinor += impOld.reduce((acc: number, row: any) => acc + (row.cost_minor || 0), 0);
        }
      }
    }

    const actualSpend = (camp.spent_amount_minor !== undefined && camp.spent_amount_minor !== null && camp.spent_amount_minor > 0)
      ? camp.spent_amount_minor
      : spendMinor;
    const funded = camp.funded_amount_minor || 0;
    const remainingMinor = Math.max(0, funded - actualSpend);
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    
    return {
      id: camp.id,
      name: camp.name,
      objective: camp.objective_v2 || camp.objective,
      status: camp.status,
      moderationStatus: camp.moderation_status || 'pending',
      moderationReason: camp.moderation_reason || null,
      budgetTotalMinor: camp.budget_total_minor,
      budgetDailyMinor: camp.budget_daily_minor,
      fundedAmountMinor: funded,
      spendMinor: actualSpend,
      remainingMinor,
      impressions,
      clicks,
      ctr,
      createdAt: camp.created_at,
    };
  }));

  return { campaigns };
}

export async function updateCampaignStatusAction(campaignId: string, status: 'active' | 'paused'): Promise<{error?: string}> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Unauthorized' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Internal Error' };

  // Fetch campaign to verify ownership, funding, and moderation clearance
  const { data: campaign, error: fetchErr } = await supabase
    .from('campaigns')
    .select('id, status, moderation_status, moderation_reason, funded_amount_minor, spent_amount_minor, advertiser_id, advertisers!inner(profile_id)')
    .eq('id', campaignId)
    .single();

  if (fetchErr || !campaign) {
    return { error: 'Campaign not found' };
  }

  if ((campaign.advertisers as any)?.profile_id !== user.id) {
    return { error: 'Forbidden: You do not own this campaign' };
  }

  if (status === 'active') {
    if ((campaign.funded_amount_minor || 0) <= 0) {
      return { error: 'Campaign must be funded with prepaid balance before activation. Please complete checkout.' };
    }
    if ((campaign.spent_amount_minor || 0) >= (campaign.funded_amount_minor || 0)) {
      return { error: 'Campaign budget is exhausted. Please fund additional budget to reactivate.' };
    }
    if (campaign.moderation_status === 'rejected') {
      return { error: `Campaign was rejected by moderation: ${campaign.moderation_reason || 'Policy violation'}.` };
    }
    if (campaign.moderation_status !== 'approved') {
      return { error: 'Campaign is awaiting moderation approval before it can be activated.' };
    }
  }

  const { error } = await supabase
    .from('campaigns')
    .update({ status })
    .eq('id', campaignId);

  if (error) return { error: error.message };
  return {};
}

export async function generateAIAdCopyAction(brief: AIAdBrief): Promise<{copy: GeneratedAdCopy | null; error?: string}> {
  try {
    const user = await getCurrentUser();
    if (!user) return { copy: null, error: 'Unauthorized' };

    const prompt = generateAdCopyPrompt(brief);
    
    // Hardcode an openrouter key if possible, but fallback to stub for testing if unconfigured.
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      // Stub response for development without API key
      return { 
        copy: {
          headline: 'Experience Caribbean Magic',
          primaryText: 'Discover the best of the Caribbean with our exclusive offers. Book now and save on your next island adventure!',
          cta: 'Learn More',
          hashtags: ['#Caribbean', '#Travel', '#IslandLife', '#Vacation', '#Paradise']
        }
      };
    }
    
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "anthropic/claude-3-haiku",
        messages: [
          {"role": "user", "content": prompt}
        ]
      })
    });
    
    const json = await response.json();
    const text = json.choices?.[0]?.message?.content || "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return { copy: parsed };
    }
    
    return { copy: null, error: 'Failed to parse AI output' };
  } catch (err: any) {
    return { copy: null, error: err.message };
  }
}

/**
 * Initiates authoritative PayPal prepaid funding for a campaign.
 * Verifies campaign ownership, checks minimum spend ($10.00 / 1000 minor units),
 * and creates an authorized PayPal order via the backend payment engine.
 */
export async function initiateCampaignCheckoutAction(campaignId: string): Promise<{
  success: boolean;
  approvalUrl?: string;
  orderId?: string;
  intentId?: string;
  error?: string;
}> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database service unavailable' };

  const { data: campaign, error: campErr } = await supabase
    .from('campaigns')
    .select('id, name, budget_total_minor, currency, advertiser_id, advertisers!inner(profile_id)')
    .eq('id', campaignId)
    .single();

  if (campErr || !campaign) {
    return { success: false, error: 'Campaign not found' };
  }

  if ((campaign.advertisers as any)?.profile_id !== user.id) {
    return { success: false, error: 'Forbidden: You do not own this campaign' };
  }

  const amountMinor = Number(campaign.budget_total_minor) || 1000;
  if (amountMinor < 1000) {
    return { success: false, error: 'Minimum campaign budget is $10.00 (1000 minor units)' };
  }

  try {
    const { ProviderRegistry } = await import('@caribbean/payments');
    const registry = new ProviderRegistry();
    const paypal = registry.get('paypal');

    const idempotencyKey = `ad_fund_${campaign.id}_${Date.now()}`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.tukubi.com';
    const serviceClient = (await createServiceSupabaseClient()) || supabase;

    // Pre-create or record payment intent with canonical schema columns
    const { data: preIntent } = await serviceClient
      .from('payment_intents')
      .insert({
        payer_id: user.id,
        amount_minor: amountMinor,
        currency: campaign.currency || 'USD',
        product_type: 'business_ad',
        reference_type: 'ad_campaign',
        reference_id: campaign.id,
        idempotency_key: idempotencyKey,
        selected_provider: 'paypal',
        status: 'requires_payment',
      })
      .select('id')
      .single();

    const intentQuery = preIntent?.id ? `&intentId=${encodeURIComponent(preIntent.id)}` : '';
    const returnUrl = `${appUrl}/ads?checkout=success&campaignId=${campaign.id}${intentQuery}`;
    const cancelUrl = `${appUrl}/ads?checkout=cancel&campaignId=${campaign.id}`;

    const chargeResult = await paypal.charge({
      amountMinor,
      currency: campaign.currency || 'USD',
      idempotencyKey,
      returnUrl,
      cancelUrl,
      metadata: {
        productType: 'business_ad',
        campaignId: campaign.id,
        intentId: preIntent?.id || idempotencyKey,
      },
    });

    if (!chargeResult.success || !chargeResult.redirectUrl) {
      return { success: false, error: chargeResult.errorMessage || 'Failed to obtain PayPal approval URL' };
    }

    if (preIntent?.id && chargeResult.providerTransactionId) {
      await serviceClient
        .from('payment_intents')
        .update({
          provider_transaction_id: chargeResult.providerTransactionId,
        })
        .eq('id', preIntent.id);
    }

    return {
      success: true,
      approvalUrl: chargeResult.redirectUrl,
      orderId: chargeResult.providerTransactionId,
      intentId: preIntent?.id,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to initiate PayPal checkout',
    };
  }
}

/**
 * Staff / Admin: Fetches campaigns awaiting moderation review.
 */
export async function fetchPendingCampaignsForAdminAction(): Promise<{
  campaigns: any[];
  error?: string;
}> {
  const auth = await getAuthorizedUser(['admin', 'management', 'superadmin', 'super_admin', 'moderator']);
  if (!auth.isLoggedIn || !auth.isAuthorized || !auth.user) {
    return { campaigns: [], error: 'Forbidden: Administrative access required' };
  }

  const serviceClient = await createServiceSupabaseClient();
  if (!serviceClient) return { campaigns: [], error: 'Service temporarily unavailable' };

  const { data, error } = await serviceClient
    .from('campaigns')
    .select(`
      id,
      name,
      objective,
      objective_v2,
      status,
      moderation_status,
      moderation_reason,
      budget_total_minor,
      funded_amount_minor,
      currency,
      created_at,
      source_post_id,
      page_id,
      advertisers (
        id,
        name,
        profile_id,
        profiles (
          id,
          display_name,
          username,
          avatar_url
        )
      ),
      ad_sets (
        id,
        name,
        placement,
        country_iso,
        bid_cpm_minor,
        ads (
          id,
          headline,
          body,
          media_path,
          destination_url,
          creative_type,
          is_approved,
          rejection_reason
        )
      )
    `)
    .eq('moderation_status', 'pending')
    .order('created_at', { ascending: false });

  if (error) return { campaigns: [], error: error.message };
  return { campaigns: data || [] };
}

/**
 * Staff / Admin: Approves a campaign and all its ads for delivery.
 */
export async function approveCampaignAdminAction(campaignId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const auth = await getAuthorizedUser(['admin', 'management', 'superadmin', 'super_admin', 'moderator']);
  if (!auth.isLoggedIn || !auth.isAuthorized || !auth.user) {
    return { success: false, error: 'Forbidden: Administrative access required' };
  }

  const serviceClient = await createServiceSupabaseClient();
  if (!serviceClient) return { success: false, error: 'Service temporarily unavailable' };

  // Fetch campaign to check funded status
  const { data: campaign, error: fetchErr } = await serviceClient
    .from('campaigns')
    .select('id, funded_amount_minor, spent_amount_minor')
    .eq('id', campaignId)
    .single();

  if (fetchErr || !campaign) {
    return { success: false, error: 'Campaign not found' };
  }

  const isFunded = Number(campaign.funded_amount_minor || 0) > Number(campaign.spent_amount_minor || 0);

  const { error: campErr } = await serviceClient
    .from('campaigns')
    .update({
      moderation_status: 'approved',
      moderated_at: new Date().toISOString(),
      moderated_by: auth.user.id,
      status: isFunded ? 'active' : 'draft',
    })
    .eq('id', campaignId);

  if (campErr) return { success: false, error: campErr.message };

  // Approve child ads
  const { data: adSets } = await serviceClient
    .from('ad_sets')
    .select('id')
    .eq('campaign_id', campaignId);

  if (adSets && adSets.length > 0) {
    const adSetIds = adSets.map((s: any) => s.id);
    await serviceClient
      .from('ads')
      .update({
        is_approved: true,
        moderated_at: new Date().toISOString(),
        moderated_by: auth.user.id,
        rejection_reason: null,
      })
      .in('ad_set_id', adSetIds);
  }

  // Audit log entry
  try {
    await serviceClient.from('audit_logs').insert({
      actor_id: auth.user.id,
      action: 'campaign.approve',
      target_type: 'campaign',
      target_id: campaignId,
      metadata: { isFunded },
    });
  } catch {}

  return { success: true };
}

/**
 * Staff / Admin: Rejects a campaign with a documented policy reason.
 */
export async function rejectCampaignAdminAction(campaignId: string, reason: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const auth = await getAuthorizedUser(['admin', 'management', 'superadmin', 'super_admin', 'moderator']);
  if (!auth.isLoggedIn || !auth.isAuthorized || !auth.user) {
    return { success: false, error: 'Forbidden: Administrative access required' };
  }

  if (!reason || reason.trim().length === 0) {
    return { success: false, error: 'Rejection reason is required' };
  }

  const serviceClient = await createServiceSupabaseClient();
  if (!serviceClient) return { success: false, error: 'Service temporarily unavailable' };

  const { error: campErr } = await serviceClient
    .from('campaigns')
    .update({
      moderation_status: 'rejected',
      moderation_reason: reason.trim(),
      moderated_at: new Date().toISOString(),
      moderated_by: auth.user.id,
      status: 'paused',
    })
    .eq('id', campaignId);

  if (campErr) return { success: false, error: campErr.message };

  // Reject child ads
  const { data: adSets } = await serviceClient
    .from('ad_sets')
    .select('id')
    .eq('campaign_id', campaignId);

  if (adSets && adSets.length > 0) {
    const adSetIds = adSets.map((s: any) => s.id);
    await serviceClient
      .from('ads')
      .update({
        is_approved: false,
        rejection_reason: reason.trim(),
        moderated_at: new Date().toISOString(),
        moderated_by: auth.user.id,
      })
      .in('ad_set_id', adSetIds);
  }

  // Audit log entry
  try {
    await serviceClient.from('audit_logs').insert({
      actor_id: auth.user.id,
      action: 'campaign.reject',
      target_type: 'campaign',
      target_id: campaignId,
      metadata: { reason: reason.trim() },
    });
  } catch {}

  return { success: true };
}

