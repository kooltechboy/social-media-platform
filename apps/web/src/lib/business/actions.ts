'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentUser } from '../supabase/server';

export interface BusinessActionState {
  error: string | null;
  slug?: string;
}

export async function createBusinessPageAction(
  _prev: BusinessActionState,
  formData: FormData
): Promise<BusinessActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in to create a verified Caribbean Page.' };

  const name = String(formData.get('name') ?? '').trim();
  const slug = String(formData.get('slug') ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const category = String(formData.get('category') ?? 'business').trim();
  const description = String(formData.get('description') ?? '').trim();
  const countryIso = String(formData.get('countryIso') ?? 'JM').trim().substring(0, 3).toUpperCase();
  const phone = String(formData.get('phone') ?? '').trim();
  const website = String(formData.get('website') ?? '').trim();

  if (!name) return { error: 'Page name is required.' };
  if (!slug) return { error: 'Page custom URL slug is required.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Database is unavailable.' };

  // 1. Insert into businesses table
  const { data: business, error } = await supabase
    .from('businesses')
    .insert({
      owner_id: user.id,
      name,
      slug,
      category,
      description: description || null,
      country_iso: countryIso || 'JM',
      phone: phone || null,
      website: website || null,
      is_verified: true,
    })
    .select('id, slug')
    .single();

  if (error) {
    if (error.code === '23505') {
      return { error: 'A page with this URL slug already exists. Please pick a unique slug.' };
    }
    return { error: error.message };
  }

  // 2. Provision Financial Center Ledger Account for the new Page Entity
  try {
    const { createServiceSupabaseClient } = await import('../supabase/server');
    const supabaseAdmin = await createServiceSupabaseClient();
    if (supabaseAdmin) {
      await supabaseAdmin.from('ledger_accounts').insert({
        owner_id: user.id,
        account_type: 'creator_pending',
        currency: 'USD',
      });
    }
  } catch {
    // Non-blocking if ledger account already exists
  }

  revalidatePath('/pages');
  revalidatePath(`/pages/${business.slug}`);
  return { error: null, slug: business.slug };
}

export async function fetchBusinessPageAction(slug: string): Promise<{ business: any | null; products: any[]; error: string | null }> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { business: null, products: [], error: 'Database unavailable.' };

  const { data: business, error } = await supabase
    .from('businesses')
    .select('id, name, slug, category, description, is_verified, phone, website, country_iso, created_at, owner_id, owner:profiles!businesses_owner_id_fkey(id, username, display_name)')
    .eq('slug', slug)
    .maybeSingle();

  if (error || !business) {
    return { business: null, products: [], error: 'Page not found.' };
  }

  const { data: products } = await supabase
    .from('products')
    .select('id, title, description, price_minor, currency, product_kind, inventory_count, is_active')
    .eq('business_id', business.id)
    .eq('is_active', true);

  return { business, products: products ?? [], error: null };
}

export async function upgradeSellerPlanAction(
  businessSlug: string,
  planId: 'business_free' | 'seller_pro' | 'business_plus' | 'enterprise'
): Promise<{ success: boolean; error: string | null }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in to manage your seller subscription.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database is unavailable.' };

  const { data: business } = await supabase
    .from('businesses')
    .select('id, owner_id')
    .eq('slug', businessSlug)
    .maybeSingle();

  if (!business || business.owner_id !== user.id) {
    return { success: false, error: 'You do not have permission to manage this business.' };
  }

  // Insert or update business subscription
  const { error } = await supabase
    .from('business_subscriptions')
    .upsert({
      business_id: business.id,
      plan_id: planId,
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'business_id' });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/pages/${businessSlug}`);
  revalidatePath('/pages');
  return { success: true, error: null };
}

