import { AskCaribbeanPlanner, type AskQueryPlan, type AskCaribbeanEntity } from '@caribbean/ai';
import { createSupabaseServerClient } from '../supabase/server';

export interface AskResult {
  entityType: AskCaribbeanEntity;
  entityId: string;
  title: string;
  snippet: string;
  href: string;
}

export interface AskResponse {
  query: string;
  plan: AskQueryPlan;
  results: AskResult[];
  grounded: boolean;
}

const STOPWORDS = new Set([
  'what', 'which', 'where', 'when', 'who', 'are', 'is', 'the', 'this', 'that', 'show', 'find',
  'me', 'in', 'on', 'of', 'for', 'and', 'with', 'near', 'happening', 'biggest', 'top', 'any',
  'about', 'can', 'you', 'caribbean', 'weekend', 'week', 'today', 'tonight',
]);

export function extractKeywords(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length >= 3 && !STOPWORDS.has(word))
    .slice(0, 5);
}

function buildOrPattern(keywords: string[], column: string): string {
  return keywords.map((keyword) => `${column}.ilike.%${keyword}%`).join(',');
}

export async function askCaribbean(query: string): Promise<AskResponse> {
  const planner = new AskCaribbeanPlanner();
  const plan = planner.plan(query);
  const keywords = extractKeywords(query);
  const results: AskResult[] = [];

  const supabase = await createSupabaseServerClient();
  if (!supabase || keywords.length === 0) {
    return { query, plan, results, grounded: false };
  }

  const horizonEnd = plan.timeWindowDays
    ? new Date(Date.now() + plan.timeWindowDays * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const searches: Array<Promise<void>> = [];

  if (plan.entities.includes('events')) {
    searches.push(
      (async () => {
        let request = supabase
          .from('events')
          .select('id, title, description, starts_at, venue, cities(name)')
          .gte('starts_at', new Date().toISOString())
          .order('starts_at', { ascending: true })
          .limit(20);
        if (horizonEnd) request = request.lte('starts_at', horizonEnd);
        const { data } = await request;
        for (const event of (data ?? []) as unknown as Array<{
          id: string; title: string; description: string | null; starts_at: string;
          venue: string | null; cities: { name: string } | null;
        }>) {
          const haystack = `${event.title} ${event.description ?? ''} ${event.venue ?? ''} ${event.cities?.name ?? ''}`.toLowerCase();
          const matchesKeyword = keywords.some((keyword) => haystack.includes(keyword));
          const matchesLocation =
            plan.locationHints.length === 0 ||
            plan.locationHints.some((hint) => haystack.includes(hint.toLowerCase()));
          if (matchesKeyword && matchesLocation) {
            results.push({
              entityType: 'events',
              entityId: event.id,
              title: event.title,
              snippet: `${new Date(event.starts_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} • ${event.venue ?? event.cities?.name ?? 'Caribbean'}`,
              href: '/events',
            });
          }
        }
      })(),
    );
  }

  if (plan.entities.includes('communities')) {
    searches.push(
      (async () => {
        const { data } = await supabase
          .from('communities')
          .select('id, name, slug, description, member_count')
          .or(buildOrPattern(keywords, 'name'))
          .limit(10);
        for (const community of (data ?? []) as Array<{ id: string; name: string; description: string | null; member_count: number }>) {
          results.push({
            entityType: 'communities',
            entityId: community.id,
            title: community.name,
            snippet: community.description ?? `${community.member_count} members`,
            href: '/communities',
          });
        }
      })(),
    );
  }

  if (plan.entities.includes('posts')) {
    searches.push(
      (async () => {
        const { data } = await supabase
          .from('posts')
          .select('id, content, profiles(display_name)')
          .or(buildOrPattern(keywords, 'content'))
          .order('created_at', { ascending: false })
          .limit(10);
        for (const post of (data ?? []) as unknown as Array<{ id: string; content: string | null; profiles: { display_name: string } | null }>) {
          results.push({
            entityType: 'posts',
            entityId: post.id,
            title: post.profiles?.display_name ?? 'Community post',
            snippet: (post.content ?? '').slice(0, 140),
            href: '/',
          });
        }
      })(),
    );
  }

  if (plan.entities.includes('businesses')) {
    searches.push(
      (async () => {
        const { data } = await supabase
          .from('businesses')
          .select('id, name, slug, category, description')
          .or(buildOrPattern(keywords, 'name'))
          .limit(10);
        for (const business of (data ?? []) as Array<{ id: string; name: string; slug?: string; category: string; description: string | null }>) {
          results.push({
            entityType: 'businesses',
            entityId: business.id,
            title: business.name,
            snippet: `${business.category}${business.description ? ` — ${business.description.slice(0, 100)}` : ''}`,
            href: business.slug ? `/pages/${business.slug}` : '/marketplace',
          });
        }
      })(),
    );
  }

  if (plan.entities.includes('creators') || plan.entities.includes('profiles')) {
    searches.push(
      (async () => {
        const pattern = `${buildOrPattern(keywords, 'display_name')},${buildOrPattern(keywords, 'username')}`;
        const { data } = await supabase
          .from('profiles')
          .select('id, display_name, username, bio')
          .or(pattern)
          .limit(10);
        for (const profile of (data ?? []) as Array<{ id: string; display_name: string; username: string; bio: string | null }>) {
          results.push({
            entityType: 'profiles',
            entityId: profile.id,
            title: profile.display_name,
            snippet: profile.bio ?? `@${profile.username}`,
            href: `/profile/${profile.username}`,
          });
        }
      })(),
    );
  }

  if (plan.entities.includes('podcasts')) {
    searches.push(
      (async () => {
        const { data } = await supabase
          .from('podcasts')
          .select('id, title, slug, description')
          .or(buildOrPattern(keywords, 'title'))
          .limit(10);
        for (const podcast of (data ?? []) as Array<{ id: string; title: string; slug: string; description: string | null }>) {
          results.push({
            entityType: 'podcasts',
            entityId: podcast.id,
            title: podcast.title,
            snippet: podcast.description ?? 'Caribbean Podcast Show',
            href: `/podcasts/${podcast.slug}`,
          });
        }
      })(),
    );
  }

  if (plan.entities.includes('videos')) {
    searches.push(
      (async () => {
        const { data } = await supabase
          .from('livestreams')
          .select('id, title, state, profiles(display_name)')
          .or(buildOrPattern(keywords, 'title'))
          .limit(10);
        for (const stream of (data ?? []) as unknown as Array<{ id: string; title: string; state: string; profiles: { display_name: string } | null }>) {
          results.push({
            entityType: 'videos',
            entityId: stream.id,
            title: stream.title,
            snippet: `${stream.state === 'live' ? '🔴 Live Now' : 'Broadcast'} • ${stream.profiles?.display_name ?? 'Creator'}`,
            href: `/live?id=${stream.id}`,
          });
        }
      })(),
    );
  }

  if (plan.entities.includes('products')) {
    searches.push(
      (async () => {
        const { data } = await supabase
          .from('products')
          .select('id, title, description, price_minor, currency')
          .or(buildOrPattern(keywords, 'title'))
          .limit(10);
        for (const product of (data ?? []) as Array<{ id: string; title: string; description: string | null; price_minor: number; currency: string }>) {
          results.push({
            entityType: 'products',
            entityId: product.id,
            title: product.title,
            snippet: `${(product.price_minor / 100).toFixed(2)} ${product.currency} — ${product.description ?? 'SpotPay Verified Product'}`,
            href: '/marketplace',
          });
        }
      })(),
    );
  }

  await Promise.all(searches);

  return { query, plan, results: results.slice(0, 25), grounded: results.length > 0 };
}