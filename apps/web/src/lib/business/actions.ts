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
  const rawWebsite = String(formData.get('website') ?? '').trim();
  let safeWebsite: string | null = null;
  if (rawWebsite) {
    try {
      const normalizedUrl = rawWebsite.startsWith('http://') || rawWebsite.startsWith('https://')
        ? rawWebsite
        : `https://${rawWebsite}`;
      const parsed = new URL(normalizedUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return { error: 'Website URL must start with http:// or https://' };
      }
      safeWebsite = parsed.toString();
    } catch {
      return { error: 'Please enter a valid website URL.' };
    }
  }

  if (!name) return { error: 'Page name is required.' };
  if (!slug) return { error: 'Page custom URL slug is required.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Database is unavailable.' };

  const avatarUrl = String(formData.get('avatarUrl') ?? '').trim() || null;
  const coverImageUrl = String(formData.get('coverImageUrl') ?? '').trim() || null;
  const contactEmail = String(formData.get('contactEmail') ?? '').trim() || null;

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
      website: safeWebsite,
      contact_email: contactEmail,
      avatar_url: avatarUrl,
      cover_image_url: coverImageUrl,
      is_verified: true,
      is_archived: false,
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
    .select('id, name, slug, category, description, is_verified, is_archived, phone, website, contact_email, avatar_url, cover_image_url, country_iso, created_at, owner_id, owner:profiles!businesses_owner_id_fkey(id, username, display_name)')
    .eq('slug', slug)
    .maybeSingle();

  if (error || !business) {
    return { business: null, products: [], error: 'Page not found.' };
  }

  const { data: products } = await supabase
    .from('products')
    .select('id, title, description, price_minor, currency, product_kind, inventory_count, is_active, status')
    .eq('business_id', business.id)
    .eq('is_active', true);

  return { business, products: products ?? [], error: null };
}

export async function updateBusinessPageAction(
  businessId: string,
  formData: FormData
): Promise<{ error: string | null; slug?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in to manage this Page.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Database is unavailable.' };

  const { data: existing } = await supabase
    .from('businesses')
    .select('id, owner_id, slug')
    .eq('id', businessId)
    .maybeSingle();

  if (!existing || existing.owner_id !== user.id) {
    return { error: 'You are not authorized to update this Page.' };
  }

  const name = String(formData.get('name') ?? '').trim();
  const category = String(formData.get('category') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const countryIso = String(formData.get('countryIso') ?? '').trim().substring(0, 3).toUpperCase();
  const phone = String(formData.get('phone') ?? '').trim();
  const rawWebsite = String(formData.get('website') ?? '').trim();
  const contactEmail = String(formData.get('contactEmail') ?? '').trim();
  const avatarUrl = String(formData.get('avatarUrl') ?? '').trim();
  const coverImageUrl = String(formData.get('coverImageUrl') ?? '').trim();

  if (!name) return { error: 'Page name cannot be empty.' };

  let safeWebsite: string | null = null;
  if (rawWebsite) {
    try {
      const normalized = rawWebsite.startsWith('http://') || rawWebsite.startsWith('https://')
        ? rawWebsite
        : `https://${rawWebsite}`;
      const parsed = new URL(normalized);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        safeWebsite = parsed.toString();
      }
    } catch {
      return { error: 'Please enter a valid website URL.' };
    }
  }

  const { error: updateErr } = await supabase
    .from('businesses')
    .update({
      name,
      category: category || undefined,
      description: description || null,
      country_iso: countryIso || undefined,
      phone: phone || null,
      website: safeWebsite,
      contact_email: contactEmail || null,
      avatar_url: avatarUrl || null,
      cover_image_url: coverImageUrl || null,
    })
    .eq('id', businessId)
    .eq('owner_id', user.id);

  if (updateErr) return { error: updateErr.message };

  revalidatePath('/pages');
  revalidatePath(`/pages/${existing.slug}`);
  revalidatePath(`/pages/${existing.slug}/manage`);
  return { error: null, slug: existing.slug };
}

export async function archiveBusinessPageAction(
  businessId: string
): Promise<{ error: string | null; isArchived?: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in to manage this Page.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Database is unavailable.' };

  const { data: existing } = await supabase
    .from('businesses')
    .select('id, owner_id, slug, is_archived')
    .eq('id', businessId)
    .maybeSingle();

  if (!existing || existing.owner_id !== user.id) {
    return { error: 'You are not authorized to archive this Page.' };
  }

  const nextArchived = !existing.is_archived;
  const { error: updateErr } = await supabase
    .from('businesses')
    .update({
      is_archived: nextArchived,
      archived_at: nextArchived ? new Date().toISOString() : null,
    })
    .eq('id', businessId)
    .eq('owner_id', user.id);

  if (updateErr) return { error: updateErr.message };

  revalidatePath('/pages');
  revalidatePath(`/pages/${existing.slug}`);
  revalidatePath(`/pages/${existing.slug}/manage`);
  return { error: null, isArchived: nextArchived };
}

export async function deleteBusinessPageAction(
  businessId: string,
  confirmationSlug: string
): Promise<{ error: string | null; success?: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in required.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Database is unavailable.' };

  const { data: existing } = await supabase
    .from('businesses')
    .select('id, owner_id, slug, name')
    .eq('id', businessId)
    .maybeSingle();

  if (!existing || existing.owner_id !== user.id) {
    return { error: 'You do not have permission to delete this Page.' };
  }

  if (confirmationSlug.trim().toLowerCase() !== existing.slug.trim().toLowerCase()) {
    return { error: `Confirmation slug does not match "${existing.slug}". Deletion cancelled for safety.` };
  }

  // If currently operating as this business identity, reset active identity to personal
  try {
    await supabase
      .from('user_active_identity')
      .delete()
      .eq('user_id', user.id)
      .eq('identity_id', businessId);
  } catch {
    // non-blocking
  }

  // Execute deletion enforced by owner_id RLS
  const { error: delErr } = await supabase
    .from('businesses')
    .delete()
    .eq('id', businessId)
    .eq('owner_id', user.id);

  if (delErr) return { error: delErr.message };

  revalidatePath('/pages');
  revalidatePath('/');
  return { error: null, success: true };
}

export async function upgradeSellerPlanAction(
  businessSlug: string,
  planId: 'business_free' | 'seller_pro' | 'business_plus' | 'enterprise',
  paymentIntentId?: string
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

  // Security gate: Paid subscription upgrades require a verified, succeeded payment intent
  if (planId !== 'business_free') {
    if (!paymentIntentId) {
      return { success: false, error: 'Paid subscription upgrades require a valid paymentIntentId.' };
    }

    const { data: intent } = await supabase
      .from('payment_intents')
      .select('id, payer_id, status')
      .eq('id', paymentIntentId)
      .maybeSingle();

    if (!intent || intent.payer_id !== user.id || intent.status !== 'succeeded') {
      return { success: false, error: 'Payment could not be verified or is not completed.' };
    }
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
