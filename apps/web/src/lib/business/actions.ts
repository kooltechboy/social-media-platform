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

  // 2. Provision SpotPay Ledger Account for the new Page Entity
  try {
    await supabase.from('ledger_accounts').insert({
      owner_id: user.id,
      account_type: 'merchant',
      currency: 'USD',
      balance_minor: 0,
    });
  } catch {
    // Non-blocking if ledger account already exists for user
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
    .select('id, name, slug, category, description, is_verified, phone, website, country_iso, created_at, owner_id')
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
