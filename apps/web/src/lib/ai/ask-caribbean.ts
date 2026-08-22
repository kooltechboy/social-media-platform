import { AskCaribbeanPlanner, type AskQueryPlan, type AskCaribbeanEntity } from '@caribbean/ai';
import { createServerSupabase } from '../supabase';

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

const planner = new AskCaribbeanPlanner();

export async function askCaribbean(query: string): Promise<AskResponse> {
  const plan = planner.plan(query);
  const results: AskResult[] = [];
  const supabase = createServerSupabase();

  if (!supabase || !plan.term) {
    return { query, plan, results, grounded: false };
  }

  const like = `%${plan.term.split(/\s+/).slice(0, 3).join('%')}%`;
  const locationHint = plan.locationHints[0];

  const runners: Array<Promise<void>> = [];

  if (plan.entities.includes('events')) {
    runners.push(
      (async () => {
        let request = supabase
          .from('events')
          .select('id, title, description, venue, starts_at, cities(name)')
          .or(`title.ilike.${like},description.ilike.${like},venue.ilike.${like}`)
          .order('starts_at', { ascending: true })
          .limit(5);
        if (locationHint) {
          const cityMatch = await supabase.from('cities').select('id').ilike('name', `%${locationHint}%`).limit(1);
          const cityId = cityMatch.data?.[0]?.id;
          if (cityId) request = request.eq('city_id', cityId);
        }
        const { data } = await request;
        for (const event of data ?? []) {
          results.push({
            entityType: 'events',
            entityId: event.id,
            title: event.title,
            snippet: `${new Date(event.starts_at).toDateString()}${event.venue ? ` • ${event.venue}` : ''}`,
            href: '/events',
          });
        }
      })(),
    );
  }

  if (plan.entities.includes('communities')) {
    runners.push(
      (async () => {
        const { data } = await supabase
          .from('communities')
          .select('id, name, description, member_count')
          .or(`name.ilike.${like},description.ilike.${like}`)
          .limit(5);
        for (const community of data ?? []) {
          results.push({
            entityType: 'communities',
            entityId: community.id,
            title: community.name,
            snippet: `${community.member_count} members${community.description ? ` • ${community.description}` : ''}`,
            href: '/communities',
          });
        }
      })(),
    );
  }

  if (plan.entities.includes('businesses')) {
    runners.push(
      (async () => {
        const { data } = await supabase
          .from('businesses')
          .select('id, name, category, description')
          .or(`name.ilike.${like},description.ilike.${like}`)
          .limit(5);
        for (const business of data ?? []) {
          results.push({
            entityType: 'businesses',
            entityId: business.id,
            title: business.name,
            snippet: `${business.category}${business.description ? ` • ${business.description}` : ''}`,
            href: '/marketplace',
          });
        }
      })(),
    );
  }

  if (plan.entities.includes('posts') || plan.entities.includes('profiles')) {
    runners.push(
      (async () => {
        const { data } = await supabase
          .from('posts')
          .select('id, content, created_at, profiles(display_name)')
          .ilike('content', like)
          .order('created_at', { ascending: false })
          .limit(5);
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

  await Promise.all(runners);

  return { query, plan, results, grounded: results.length > 0 };
}
