'use server';

import { getCurrentUser, createSupabaseServerClient } from '../supabase/server';
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
      status: 'active',
      budget_total_minor: campaignInput.budgetTotalMinor,
      budget_daily_minor: campaignInput.budgetDailyMinor,
      currency: campaignInput.currency,
      starts_at: campaignInput.startsAt,
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

  const { data, error } = await supabase
    .from('ads')
    .insert({
      ad_set_id: input.adSetId,
      headline: input.headline,
      body: input.body,
      media_path: input.media_path,
      destination_url: input.destination_url || 'https://tukubi.com',
      is_approved: true, // For MVP self-serve, auto-approve
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
      budget_total_minor,
      budget_daily_minor,
      currency,
      created_at,
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
    
    // We fetch impressions and clicks for ads belonging to this campaign
    for (const adSet of camp.ad_sets) {
      for (const ad of adSet.ads) {
        const { count: impCount } = await supabase.from('ad_events').select('*', { count: 'exact', head: true }).eq('ad_id', ad.id).eq('event_type', 'impression');
        const { count: clickCount } = await supabase.from('ad_events').select('*', { count: 'exact', head: true }).eq('ad_id', ad.id).eq('event_type', 'click');
        
        // Also fallback to older ad_impressions for backward compatibility if any
        const { data: impOld } = await supabase.from('ad_impressions').select('cost_minor').eq('ad_id', ad.id);
        const { count: clickOld } = await supabase.from('ad_clicks').select('id, impression_id!inner(ad_id)', { count: 'exact', head: true }).eq('impression_id.ad_id', ad.id);
        
        impressions += (impCount || 0) + (impOld?.length || 0);
        clicks += (clickCount || 0) + (clickOld || 0);
        if (impOld) {
          spendMinor += impOld.reduce((acc: number, row: any) => acc + (row.cost_minor || 0), 0);
        }
      }
    }

    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    
    return {
      id: camp.id,
      name: camp.name,
      objective: camp.objective_v2 || camp.objective,
      status: camp.status,
      budgetTotalMinor: camp.budget_total_minor,
      spendMinor: spendMinor,
      impressions,
      clicks,
      ctr,
    };
  }));

  return { campaigns };
}

export async function updateCampaignStatusAction(campaignId: string, status: 'active' | 'paused'): Promise<{error?: string}> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Unauthorized' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Internal Error' };

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

