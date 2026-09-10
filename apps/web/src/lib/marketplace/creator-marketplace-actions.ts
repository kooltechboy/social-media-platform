'use server';

import { createSupabaseServerClient, getCurrentUser } from '../supabase/server';
import { revalidatePath } from 'next/cache';

export async function fetchCreatorMarketplaceListingsAction(filters: { category?: string; island?: string; city?: string }) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { listings: [], error: 'Supabase client error' };
  let query = supabase
    .from('creator_marketplace_profiles')
    .select('*, profiles!inner(display_name, username, avatar_url, origin_country_id, current_city)');

  if (filters.category && filters.category !== 'ALL') {
    query = query.contains('categories', [filters.category]);
  }
  
  const { data, error } = await query;
  if (error) return { listings: [], error: error.message };
  return { listings: data || [] };
}

export async function upsertCreatorMarketplaceProfileAction(payload: any) {
  const supabase = await createSupabaseServerClient();
  const user = await getCurrentUser();
  if (!user || !supabase) return { error: 'Unauthorized' };

  const { error } = await supabase
    .from('creator_marketplace_profiles')
    .upsert({
      creator_id: user.id,
      categories: payload.categories || [],
      min_collaboration_budget_cents: payload.minBudgetCents || 0,
      typical_turnaround_days: payload.turnaroundDays || 7,
      languages: payload.languages || ['en'],
      collaboration_types: payload.collaborationTypes || [],
      media_kit_url: payload.mediaKitUrl,
      portfolio_urls: payload.portfolioUrls || [],
      is_available: payload.isAvailable ?? true,
      updated_at: new Date().toISOString()
    }, { onConflict: 'creator_id' });

  if (error) return { error: error.message };
  revalidatePath('/creator-marketplace');
  return { success: true };
}

export async function createBriefAction(payload: any) {
  const supabase = await createSupabaseServerClient();
  const user = await getCurrentUser();
  if (!user || !supabase) return { briefId: null, error: 'Unauthorized' };

  const { data, error } = await supabase
    .from('brand_campaign_briefs')
    .insert({
      business_id: user.id,
      title: payload.title,
      description: payload.description,
      budget_range_cents_min: payload.budgetMin,
      budget_range_cents_max: payload.budgetMax,
      content_types: payload.contentTypes || [],
      target_islands: payload.targetIslands || [],
      target_diaspora_cities: payload.targetCities || [],
      deadline: payload.deadline,
      status: 'open'
    })
    .select()
    .single();

  if (error) return { briefId: null, error: error.message };
  revalidatePath('/creator-marketplace');
  return { briefId: data.id };
}

export async function applyToBriefAction(briefId: string, proposal: string, rateCents: number) {
  const supabase = await createSupabaseServerClient();
  const user = await getCurrentUser();
  if (!user || !supabase) return { error: 'Unauthorized' };

  const { error } = await supabase
    .from('creator_applications')
    .insert({
      brief_id: briefId,
      creator_id: user.id,
      proposal,
      rate_cents: rateCents,
      status: 'pending'
    });

  if (error) return { error: error.message };
  return { success: true };
}
