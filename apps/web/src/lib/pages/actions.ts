'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentUser } from '../supabase/server';

export interface PageActionResult {
  error: string | null;
  slug?: string;
  success?: boolean;
  isFollowing?: boolean;
  followerCount?: number;
  isDeactivated?: boolean;
}

export type PageRoleType = 'owner' | 'admin' | 'editor' | 'moderator' | 'analyst';

export interface PageMemberSummary {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  role: PageRoleType;
  createdAt: string;
}

export interface UniversalPageSummary {
  id: string;
  name: string;
  slug: string;
  category: string;
  pageType: string;
  description: string | null;
  isVerified: boolean;
  countryIso: string | null;
  avatarUrl: string | null;
  coverImageUrl: string | null;
  createdAt: string;
  followerCount: number;
  postCount: number;
  userRole?: PageRoleType | null;
  isDeactivated?: boolean;
}

// -----------------------------------------------------------------------------
// 1. Fetch Universal Pages for Directory
// -----------------------------------------------------------------------------
export async function fetchUniversalPagesAction(options?: {
  groupKey?: string;
  query?: string;
  territoryIso?: string;
  limit?: number;
}): Promise<UniversalPageSummary[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  try {
    let query = supabase
      .from('businesses')
      .select('id, name, slug, category, page_type, description, is_verified, country_iso, avatar_url, cover_image_url, created_at, is_deactivated, is_archived, deleted_at')
      .eq('is_deactivated', false)
      .eq('is_archived', false)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(options?.limit || 40);

    if (options?.query && options.query.trim()) {
      const q = options.query.trim();
      query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%,category.ilike.%${q}%`);
    }

    if (options?.territoryIso && options.territoryIso !== 'all') {
      query = query.eq('country_iso', options.territoryIso.toUpperCase());
    }

    const { data: pages, error } = await query;
    if (error || !pages) return [];

    const pageIds = pages.map((p: any) => p.id);
    if (pageIds.length === 0) return [];

    // Fetch follower counts in batch
    const { data: followers } = await supabase
      .from('page_followers')
      .select('page_id')
      .in('page_id', pageIds);

    const followerCountMap = new Map<string, number>();
    for (const f of followers || []) {
      followerCountMap.set(f.page_id, (followerCountMap.get(f.page_id) || 0) + 1);
    }

    return pages.map((p: any) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      category: p.category || 'Universal Caribbean Page',
      pageType: p.page_type || 'universal',
      description: p.description,
      isVerified: Boolean(p.is_verified),
      countryIso: p.country_iso,
      avatarUrl: p.avatar_url,
      coverImageUrl: p.cover_image_url,
      createdAt: p.created_at,
      followerCount: followerCountMap.get(p.id) || 0,
      postCount: 0,
    }));
  } catch (err) {
    console.error('fetchUniversalPagesAction error:', err);
    return [];
  }
}

// -----------------------------------------------------------------------------
// 2. Fetch User's Managed Pages (My Pages)
// -----------------------------------------------------------------------------
export async function fetchMyPagesAction(): Promise<UniversalPageSummary[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  try {
    // 1. Get all page roles where user is member
    const { data: roleRows } = await supabase
      .from('page_roles')
      .select('page_id, role, businesses!inner(id, name, slug, category, page_type, description, is_verified, country_iso, avatar_url, cover_image_url, created_at, is_deactivated, is_archived, deleted_at)')
      .eq('user_id', user.id)
      .is('businesses.deleted_at', null);

    // 2. Also fetch any pages where owner_id = user.id (safety union)
    const { data: ownedRows } = await supabase
      .from('businesses')
      .select('id, name, slug, category, page_type, description, is_verified, country_iso, avatar_url, cover_image_url, created_at, is_deactivated, is_archived, deleted_at')
      .eq('owner_id', user.id)
      .is('deleted_at', null);

    const pageMap = new Map<string, UniversalPageSummary>();

    if (ownedRows) {
      for (const p of ownedRows) {
        pageMap.set(p.id, {
          id: p.id,
          name: p.name,
          slug: p.slug,
          category: p.category || 'Universal Caribbean Page',
          pageType: p.page_type || 'universal',
          description: p.description,
          isVerified: Boolean(p.is_verified),
          countryIso: p.country_iso,
          avatarUrl: p.avatar_url,
          coverImageUrl: p.cover_image_url,
          createdAt: p.created_at,
          followerCount: 0,
          postCount: 0,
          userRole: 'owner',
          isDeactivated: Boolean(p.is_deactivated || p.is_archived),
        });
      }
    }

    if (roleRows) {
      for (const r of roleRows) {
        const b = (r as any).businesses;
        if (!b) continue;
        const existing = pageMap.get(b.id);
        if (existing) {
          existing.userRole = r.role as PageRoleType;
        } else {
          pageMap.set(b.id, {
            id: b.id,
            name: b.name,
            slug: b.slug,
            category: b.category || 'Universal Caribbean Page',
            pageType: b.page_type || 'universal',
            description: b.description,
            isVerified: Boolean(b.is_verified),
            countryIso: b.country_iso,
            avatarUrl: b.avatar_url,
            coverImageUrl: b.cover_image_url,
            createdAt: b.created_at,
            followerCount: 0,
            postCount: 0,
            userRole: r.role as PageRoleType,
            isDeactivated: Boolean(b.is_deactivated || b.is_archived),
          });
        }
      }
    }

    const pages = Array.from(pageMap.values());
    if (pages.length === 0) return [];

    // Attach follower counts
    const pageIds = pages.map((p) => p.id);
    const { data: followers } = await supabase
      .from('page_followers')
      .select('page_id')
      .in('page_id', pageIds);

    const followerCountMap = new Map<string, number>();
    for (const f of followers || []) {
      followerCountMap.set(f.page_id, (followerCountMap.get(f.page_id) || 0) + 1);
    }

    return pages.map((p) => ({
      ...p,
      followerCount: followerCountMap.get(p.id) || 0,
    }));
  } catch (err) {
    console.error('fetchMyPagesAction error:', err);
    return [];
  }
}

// -----------------------------------------------------------------------------
// 3. Fetch Full Page Details
// -----------------------------------------------------------------------------
export async function fetchPageDetailsAction(slug: string): Promise<{
  page: any | null;
  products: any[];
  posts: any[];
  members: PageMemberSummary[];
  followerCount: number;
  isFollowing: boolean;
  currentUserRole: PageRoleType | null;
  canManage: boolean;
  error: string | null;
}> {
  const user = await getCurrentUser();
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      page: null,
      products: [],
      posts: [],
      members: [],
      followerCount: 0,
      isFollowing: false,
      currentUserRole: null,
      canManage: false,
      error: 'Database unavailable.',
    };
  }

  try {
    const { data: business, error } = await supabase
      .from('businesses')
      .select('id, name, slug, category, page_type, description, is_verified, is_archived, is_deactivated, phone, website, contact_email, avatar_url, cover_image_url, country_iso, created_at, owner_id, custom_settings, deleted_at, owner:profiles!businesses_owner_id_fkey(id, username, display_name)')
      .eq('slug', slug)
      .is('deleted_at', null)
      .maybeSingle();

    if (error || !business) {
      return {
        page: null,
        products: [],
        posts: [],
        members: [],
        followerCount: 0,
        isFollowing: false,
        currentUserRole: null,
        canManage: false,
        error: 'Page not found.',
      };
    }

    // Check user role on page
    let currentUserRole: PageRoleType | null = null;
    if (user) {
      if (business.owner_id === user.id) {
        currentUserRole = 'owner';
      } else {
        const { data: roleRow } = await supabase
          .from('page_roles')
          .select('role')
          .eq('page_id', business.id)
          .eq('user_id', user.id)
          .maybeSingle();
        if (roleRow) {
          currentUserRole = roleRow.role as PageRoleType;
        }
      }
    }

    const canManage = currentUserRole === 'owner' || currentUserRole === 'admin';

    // If deactivated, non-members cannot view
    if ((business.is_deactivated || business.is_archived) && !currentUserRole) {
      return {
        page: null,
        products: [],
        posts: [],
        members: [],
        followerCount: 0,
        isFollowing: false,
        currentUserRole: null,
        canManage: false,
        error: 'This page is currently deactivated.',
      };
    }

    // Follower counts and state
    let followerCount = 0;
    let isFollowing = false;

    const { count: followersCountRes } = await supabase
      .from('page_followers')
      .select('*', { count: 'exact', head: true })
      .eq('page_id', business.id);

    followerCount = followersCountRes || 0;

    if (user) {
      const { data: followRow } = await supabase
        .from('page_followers')
        .select('user_id')
        .eq('page_id', business.id)
        .eq('user_id', user.id)
        .maybeSingle();
      isFollowing = Boolean(followRow);
    }

    // Parallel fetch: Products, Posts, and Members
    const [productsRes, postsRes, membersRes] = await Promise.all([
      supabase
        .from('products')
        .select('id, title, description, price_minor, currency, product_kind, inventory_count, is_active')
        .eq('business_id', business.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
      supabase
        .from('posts')
        .select('id, content, likes_count, comments_count, shares_count, created_at, cultural_tags, media_urls, author_id, profiles:profiles!posts_author_id_fkey(id, username, display_name, avatar_url)')
        .eq('page_id', business.id)
        .order('created_at', { ascending: false })
        .limit(20),
      canManage
        ? supabase
            .from('page_roles')
            .select('id, user_id, role, created_at, profiles:profiles!page_roles_user_id_fkey(id, username, display_name, avatar_url)')
            .eq('page_id', business.id)
            .order('created_at', { ascending: true })
        : Promise.resolve({ data: [] }),
    ]);

    const members: PageMemberSummary[] = (membersRes.data || []).map((m: any) => ({
      id: m.id,
      userId: m.user_id,
      username: m.profiles?.username || 'user',
      displayName: m.profiles?.display_name || 'Member',
      avatarUrl: m.profiles?.avatar_url || null,
      role: m.role as PageRoleType,
      createdAt: m.created_at,
    }));

    return {
      page: business,
      products: productsRes.data || [],
      posts: postsRes.data || [],
      members,
      followerCount,
      isFollowing,
      currentUserRole,
      canManage,
      error: null,
    };
  } catch (err: any) {
    console.error('fetchPageDetailsAction error:', err);
    return {
      page: null,
      products: [],
      posts: [],
      members: [],
      followerCount: 0,
      isFollowing: false,
      currentUserRole: null,
      canManage: false,
      error: err?.message || 'An error occurred fetching page details.',
    };
  }
}

// -----------------------------------------------------------------------------
// 4. Create Universal Page Action
// -----------------------------------------------------------------------------
export async function createUniversalPageAction(
  _prev: PageActionResult,
  formData: FormData
): Promise<PageActionResult> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in to create a verified Caribbean Page.' };

  const name = String(formData.get('name') ?? '').trim();
  const rawSlug = String(formData.get('slug') ?? '').trim().toLowerCase();
  const slug = rawSlug.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const category = String(formData.get('category') ?? 'Creator').trim();
  const description = String(formData.get('description') ?? '').trim();
  const countryIso = String(formData.get('countryIso') ?? 'JM').trim().substring(0, 3).toUpperCase();
  const phone = String(formData.get('phone') ?? '').trim();
  const contactEmail = String(formData.get('contactEmail') ?? '').trim();
  const avatarUrl = String(formData.get('avatarUrl') ?? '').trim() || null;
  const coverImageUrl = String(formData.get('coverImageUrl') ?? '').trim() || null;
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
  if (!slug) return { error: 'Page URL handle is required.' };
  if (slug.length < 3) return { error: 'Page URL handle must be at least 3 characters.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Database is unavailable.' };

  // 1. Insert into businesses table
  const { data: page, error } = await supabase
    .from('businesses')
    .insert({
      owner_id: user.id,
      name,
      slug,
      category,
      page_type: 'universal',
      description: description || null,
      country_iso: countryIso || 'JM',
      phone: phone || null,
      website: safeWebsite,
      contact_email: contactEmail || null,
      avatar_url: avatarUrl,
      cover_image_url: coverImageUrl,
      is_verified: true,
      is_archived: false,
      is_deactivated: false,
    })
    .select('id, slug')
    .single();

  if (error) {
    if (error.code === '23505') {
      return { error: 'A Page with this URL handle already exists. Please choose a unique handle.' };
    }
    return { error: error.message };
  }

  // 2. Assign creator as 'owner' in page_roles
  await supabase
    .from('page_roles')
    .insert({
      page_id: page.id,
      user_id: user.id,
      role: 'owner',
    })
    .select('id')
    .maybeSingle();

  revalidatePath('/pages');
  revalidatePath(`/pages/${page.slug}`);
  return { error: null, slug: page.slug, success: true };
}

// -----------------------------------------------------------------------------
// 5. Update Page Details Action
// -----------------------------------------------------------------------------
export async function updatePageDetailsAction(
  pageId: string,
  formData: FormData
): Promise<PageActionResult> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in to manage this Page.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Database is unavailable.' };

  // Verify permission: owner or admin
  const { data: roleRow } = await supabase
    .from('page_roles')
    .select('role')
    .eq('page_id', pageId)
    .eq('user_id', user.id)
    .maybeSingle();

  const { data: pageOwner } = await supabase
    .from('businesses')
    .select('id, owner_id, slug')
    .eq('id', pageId)
    .maybeSingle();

  if (!pageOwner) return { error: 'Page not found.' };

  const isOwner = pageOwner.owner_id === user.id;
  const isAdmin = roleRow?.role === 'admin' || roleRow?.role === 'owner';

  if (!isOwner && !isAdmin) {
    return { error: 'You do not have permission to manage this Page.' };
  }

  const name = String(formData.get('name') ?? '').trim();
  const category = String(formData.get('category') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const countryIso = String(formData.get('countryIso') ?? 'JM').trim().substring(0, 3).toUpperCase();
  const phone = String(formData.get('phone') ?? '').trim();
  const contactEmail = String(formData.get('contactEmail') ?? '').trim();
  const avatarUrl = String(formData.get('avatarUrl') ?? '').trim();
  const coverImageUrl = String(formData.get('coverImageUrl') ?? '').trim();
  const rawWebsite = String(formData.get('website') ?? '').trim();

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
    .eq('id', pageId);

  if (updateErr) return { error: updateErr.message };

  revalidatePath('/pages');
  revalidatePath(`/pages/${pageOwner.slug}`);
  revalidatePath(`/pages/${pageOwner.slug}/manage`);
  return { error: null, slug: pageOwner.slug, success: true };
}

// -----------------------------------------------------------------------------
// 6. Toggle Page Follow (Real Data)
// -----------------------------------------------------------------------------
export async function togglePageFollowAction(pageId: string): Promise<PageActionResult> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Please sign in to follow this Page.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Database unavailable.' };

  try {
    const { data: existing } = await supabase
      .from('page_followers')
      .select('id')
      .eq('page_id', pageId)
      .eq('user_id', user.id)
      .maybeSingle();

    let isFollowing = false;
    if (existing) {
      await supabase.from('page_followers').delete().eq('id', existing.id);
      isFollowing = false;
    } else {
      await supabase.from('page_followers').insert({
        page_id: pageId,
        user_id: user.id,
      });
      isFollowing = true;
    }

    const { count } = await supabase
      .from('page_followers')
      .select('*', { count: 'exact', head: true })
      .eq('page_id', pageId);

    return {
      error: null,
      success: true,
      isFollowing,
      followerCount: count || 0,
    };
  } catch (err: any) {
    console.error('togglePageFollowAction error:', err);
    return { error: err?.message || 'Failed to update follow status.' };
  }
}

// -----------------------------------------------------------------------------
// 7. Publish Post as Page
// -----------------------------------------------------------------------------
export async function createPagePostAction(
  pageId: string,
  content: string,
  culturalTags: string[] = [],
  mediaUrls: string[] = []
): Promise<PageActionResult> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in required.' };

  if (!content.trim() && mediaUrls.length === 0) {
    return { error: 'Post content cannot be empty.' };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Database is unavailable.' };

  // Check role: owner, admin, or editor
  const { data: page } = await supabase
    .from('businesses')
    .select('id, slug, owner_id')
    .eq('id', pageId)
    .maybeSingle();

  if (!page) return { error: 'Page not found.' };

  let isAuthorized = page.owner_id === user.id;
  if (!isAuthorized) {
    const { data: roleRow } = await supabase
      .from('page_roles')
      .select('role')
      .eq('page_id', pageId)
      .eq('user_id', user.id)
      .maybeSingle();
    isAuthorized = ['owner', 'admin', 'editor'].includes(roleRow?.role || '');
  }

  if (!isAuthorized) {
    return { error: 'You do not have permission to publish content for this Page.' };
  }

  const { error: insertErr } = await supabase.from('posts').insert({
    author_id: user.id,
    page_id: pageId,
    content: content.trim(),
    cultural_tags: culturalTags,
    media_urls: mediaUrls,
    visibility: 'public',
  });

  if (insertErr) return { error: insertErr.message };

  revalidatePath('/pages');
  revalidatePath(`/pages/${page.slug}`);
  revalidatePath('/');
  return { error: null, slug: page.slug, success: true };
}

// -----------------------------------------------------------------------------
// 8. Add or Update Page Team Role
// -----------------------------------------------------------------------------
export async function updatePageRoleAction(
  pageId: string,
  targetUsername: string,
  role: PageRoleType
): Promise<PageActionResult> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in required.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Database unavailable.' };

  // Check caller authorization (owner or admin)
  const { data: page } = await supabase
    .from('businesses')
    .select('id, slug, owner_id')
    .eq('id', pageId)
    .maybeSingle();

  if (!page) return { error: 'Page not found.' };

  let canManage = page.owner_id === user.id;
  if (!canManage) {
    const { data: callerRole } = await supabase
      .from('page_roles')
      .select('role')
      .eq('page_id', pageId)
      .eq('user_id', user.id)
      .maybeSingle();
    canManage = callerRole?.role === 'owner' || callerRole?.role === 'admin';
  }

  if (!canManage) {
    return { error: 'Only Page Owners and Admins can manage team roles.' };
  }

  // Resolve target user
  const cleanUsername = targetUsername.trim().replace(/^@/, '');
  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('id')
    .ilike('username', cleanUsername)
    .maybeSingle();

  if (!targetProfile) {
    return { error: `User "@${cleanUsername}" was not found.` };
  }

  if (targetProfile.id === page.owner_id && role !== 'owner') {
    return { error: 'Cannot change the primary Owner role through this action.' };
  }

  const { error: roleErr } = await supabase
    .from('page_roles')
    .upsert(
      {
        page_id: pageId,
        user_id: targetProfile.id,
        role,
      },
      { onConflict: 'page_id,user_id' }
    );

  if (roleErr) return { error: roleErr.message };

  revalidatePath(`/pages/${page.slug}/manage`);
  return { error: null, success: true };
}

// -----------------------------------------------------------------------------
// 9. Remove Page Team Role
// -----------------------------------------------------------------------------
export async function removePageRoleAction(
  pageId: string,
  targetUserId: string
): Promise<PageActionResult> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in required.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Database unavailable.' };

  const { data: page } = await supabase
    .from('businesses')
    .select('id, slug, owner_id')
    .eq('id', pageId)
    .maybeSingle();

  if (!page) return { error: 'Page not found.' };

  if (targetUserId === page.owner_id) {
    return { error: 'Cannot remove the primary Page Owner.' };
  }

  let canManage = page.owner_id === user.id;
  if (!canManage) {
    const { data: callerRole } = await supabase
      .from('page_roles')
      .select('role')
      .eq('page_id', pageId)
      .eq('user_id', user.id)
      .maybeSingle();
    canManage = callerRole?.role === 'owner' || callerRole?.role === 'admin';
  }

  if (!canManage) {
    return { error: 'Only Page Owners and Admins can remove team members.' };
  }

  const { error: delErr } = await supabase
    .from('page_roles')
    .delete()
    .eq('page_id', pageId)
    .eq('user_id', targetUserId);

  if (delErr) return { error: delErr.message };

  revalidatePath(`/pages/${page.slug}/manage`);
  return { error: null, success: true };
}

// -----------------------------------------------------------------------------
// 10. Deactivate & Reactivate Page Action
// -----------------------------------------------------------------------------
export async function togglePageDeactivationAction(pageId: string): Promise<PageActionResult> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in required.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Database unavailable.' };

  const { data: page } = await supabase
    .from('businesses')
    .select('id, slug, owner_id, is_deactivated, is_archived')
    .eq('id', pageId)
    .maybeSingle();

  if (!page || page.owner_id !== user.id) {
    return { error: 'Only the Page Owner can deactivate or reactivate this Page.' };
  }

  const nextDeactivated = !(page.is_deactivated || page.is_archived);

  const { error: updateErr } = await supabase
    .from('businesses')
    .update({
      is_deactivated: nextDeactivated,
      is_archived: nextDeactivated,
      deactivated_at: nextDeactivated ? new Date().toISOString() : null,
      archived_at: nextDeactivated ? new Date().toISOString() : null,
    })
    .eq('id', pageId)
    .eq('owner_id', user.id);

  if (updateErr) return { error: updateErr.message };

  revalidatePath('/pages');
  revalidatePath(`/pages/${page.slug}`);
  revalidatePath(`/pages/${page.slug}/manage`);
  return { error: null, success: true, isDeactivated: nextDeactivated };
}

// -----------------------------------------------------------------------------
// 11. Delete Page Permanently
// -----------------------------------------------------------------------------
export async function deletePagePermanentlyAction(
  pageId: string,
  confirmationSlug: string
): Promise<PageActionResult> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in required.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Database unavailable.' };

  const { data: page } = await supabase
    .from('businesses')
    .select('id, slug, owner_id')
    .eq('id', pageId)
    .maybeSingle();

  if (!page || page.owner_id !== user.id) {
    return { error: 'Only the Page Owner can permanently delete this Page.' };
  }

  if (confirmationSlug.trim().toLowerCase() !== page.slug.trim().toLowerCase()) {
    return { error: `Confirmation handle "${confirmationSlug}" does not match "${page.slug}".` };
  }

  // Soft-delete and archive cascaded dependencies
  const { error: deleteErr } = await supabase
    .from('businesses')
    .update({
      deleted_at: new Date().toISOString(),
      is_deactivated: true,
      is_archived: true,
    })
    .eq('id', pageId)
    .eq('owner_id', user.id);

  if (deleteErr) return { error: deleteErr.message };

  // Cascade cleanup roles and followers
  await Promise.all([
    supabase.from('page_roles').delete().eq('page_id', pageId),
    supabase.from('page_followers').delete().eq('page_id', pageId),
  ]);

  revalidatePath('/pages');
  return { error: null, success: true };
}
