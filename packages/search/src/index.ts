export type SearchEntity =
  | 'profiles' | 'posts' | 'communities' | 'businesses' | 'events'
  | 'podcasts' | 'videos' | 'creators' | 'products' | 'locations';

export interface SearchQuery {
  term: string;
  entities?: SearchEntity[];
  limit?: number;
  countryIso?: string;
}

export interface SearchHit {
  entityType: SearchEntity;
  entityId: string;
  title: string;
  snippet: string;
  score: number;
}

export interface SearchIndexPort {
  search(query: SearchQuery): Promise<SearchHit[]>;
}

export const MAX_TERM_LENGTH = 200;

export function sanitizeSearchTerm(term: string): string {
  return term.trim().slice(0, MAX_TERM_LENGTH);
}

export class PostgresFullTextSearch implements SearchIndexPort {
  public async search(query: SearchQuery): Promise<SearchHit[]> {
    const term = sanitizeSearchTerm(query.term);
    if (!term) return [];
    return [];
  }

  public buildPostQuery(query: SearchQuery): { text: string; params: unknown[] } {
    const term = sanitizeSearchTerm(query.term);
    const params: unknown[] = [term, query.limit ?? 20];
    const countryFilter = query.countryIso
      ? ' AND (country_id IS NULL OR country_id IN (SELECT id FROM public.countries WHERE iso_code = $3))'
      : '';
    if (query.countryIso) params.push(query.countryIso);
    return {
      text: `SELECT id, author_id, content, ts_rank(
          to_tsvector('simple', content), websearch_to_tsquery('simple', $1)
        ) AS score
      FROM public.posts
      WHERE to_tsvector('simple', content) @@ websearch_to_tsquery('simple', $1)
        AND visibility = 'public'${countryFilter}
      ORDER BY score DESC, created_at DESC
      LIMIT $2`,
      params,
    };
  }
}

export interface SemanticSearchPlanner {
  planEntityRetrieval(term: string): SearchEntity[];
}

export class CaribAISemanticPlanner implements SemanticSearchPlanner {
  private readonly patterns: Array<{ pattern: RegExp; entities: SearchEntity[] }> = [
    { pattern: /\b(restaurants?|food|eat|eating|menu|kitchen)\b/i, entities: ['businesses', 'products', 'locations'] },
    { pattern: /\b(events?|parties|party|festivals?|carnival|concerts?|weekend)\b/i, entities: ['events'] },
    { pattern: /\b(creators?|artists?|musicians?|influencers?)\b/i, entities: ['creators', 'profiles'] },
    { pattern: /\b(podcasts?|episodes?|listen)\b/i, entities: ['podcasts'] },
    { pattern: /\b(videos?|watch|reels?)\b/i, entities: ['videos'] },
    { pattern: /\b(communities?|groups?|join)\b/i, entities: ['communities'] },
  ];

  public planEntityRetrieval(term: string): SearchEntity[] {
    const matched = new Set<SearchEntity>(['profiles', 'posts']);
    for (const { pattern, entities } of this.patterns) {
      if (pattern.test(term)) {
        entities.forEach((entity) => matched.add(entity));
      }
    }
    return [...matched];
  }
}
