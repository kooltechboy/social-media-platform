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

// ===== TYPES =====
export interface BriefData {
  title: string;
  description: string;
  budget_range_cents_min: number;
  budget_range_cents_max: number;
  content_types: string[];
  target_islands: string[];
  target_diaspora_cities: string[];
  deadline: string;
}

export interface MarketplaceProfileData {
  categories: string[];
  min_collaboration_budget_cents: number;
  typical_turnaround_days: number;
  languages: string[];
  collaboration_types: string[];
  media_kit_url?: string;
  is_available: boolean;
}

// ---- Upsert creator marketplace profile ----
export async function upsertCreatorMarketplaceProfileAction(
  data: MarketplaceProfileData
): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in to manage your creator profile.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Database unavailable.' };

  const { error } = await supabase
    .from('creator_marketplace_profiles')
    .upsert(
      { creator_id: user.id, ...data, updated_at: new Date().toISOString() },
      { onConflict: 'creator_id' }
    );

  if (error) return { error: error.message };
  revalidatePath('/creator-marketplace');
  return {};
}

// ---- Create brand campaign brief ----
export async function createBriefAction(data: BriefData): Promise<{ id?: string; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in to post a brief.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Database unavailable.' };

  if (!data.title.trim()) return { error: 'Brief title is required.' };
  if (!data.description.trim()) return { error: 'Brief description is required.' };
  if (data.budget_range_cents_min > data.budget_range_cents_max) {
    return { error: 'Minimum budget cannot exceed maximum budget.' };
  }

  const { data: row, error } = await supabase
    .from('brand_campaign_briefs')
    .insert({ business_id: user.id, ...data, status: 'open' })
    .select('id')
    .single();

  if (error) return { error: error.message };
  revalidatePath('/creator-marketplace');
  return { id: row.id };
}

// ---- Apply to a brief ----
export interface ApplicationData {
  briefId: string;
  proposal: string;
  rateCents: number;
}

export async function applyToBriefAction(input: ApplicationData): Promise<{ id?: string; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in to apply to campaigns.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Database unavailable.' };

  if (!input.proposal.trim()) return { error: 'Proposal is required.' };
  if (input.rateCents <= 0) return { error: 'Rate must be greater than zero.' };

  const { data: row, error } = await supabase
    .from('creator_applications')
    .insert({
      brief_id: input.briefId,
      creator_id: user.id,
      proposal: input.proposal.trim(),
      rate_cents: input.rateCents,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error) return { error: error.message };
  revalidatePath('/creator-marketplace');
  return { id: row.id };
}

// ---- Fetch my applications (as creator) ----
export async function fetchMyApplicationsAction(): Promise<{ applications: any[] }> {
  const user = await getCurrentUser();
  if (!user) return { applications: [] };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { applications: [] };

  const { data } = await supabase
    .from('creator_applications')
    .select('*, brand_campaign_briefs(id, title, deadline, budget_range_cents_max)')
    .eq('creator_id', user.id)
    .order('created_at', { ascending: false });

  return { applications: data || [] };
}

// ---- Fetch my creator marketplace profile ----
export async function fetchMyCreatorMarketplaceProfileAction(): Promise<{ profile: any | null }> {
  const user = await getCurrentUser();
  if (!user) return { profile: null };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { profile: null };

  const { data } = await supabase
    .from('creator_marketplace_profiles')
    .select('*')
    .eq('creator_id', user.id)
    .maybeSingle();

  return { profile: data };
}
