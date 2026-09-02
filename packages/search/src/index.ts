export type SearchEntity =
  | 'profiles'
  | 'posts'
  | 'communities'
  | 'businesses'
  | 'events'
  | 'podcasts'
  | 'videos'
  | 'creators'
  | 'products'
  | 'pages'
  | 'locations';

export interface SearchQuery {
  term: string;
  entities?: SearchEntity[];
  limit?: number;
  offset?: number;
  countryIso?: string;
  viewerId?: string;
}

export interface SearchHit {
  entityType: SearchEntity;
  entityId: string;
  title: string;
  subtitle?: string;
  snippet?: string;
  avatarUrl?: string | null;
  badge?: string;
  metadata?: Record<string, unknown>;
  score: number;
}

export interface UniversalSearchResults {
  query: string;
  totalHits: number;
  hits: SearchHit[];
  byEntity: {
    profiles: SearchHit[];
    creators: SearchHit[];
    businesses: SearchHit[];
    merchants: SearchHit[];
    pages: SearchHit[];
    communities: SearchHit[];
    events: SearchHit[];
    posts: SearchHit[];
  };
}

export interface SearchIndexPort {
  search(query: SearchQuery): Promise<SearchHit[]>;
}

export const MAX_TERM_LENGTH = 200;

/**
 * Normalizes and strips dangerous SQL/regex characters from query string
 * while preserving Caribbean letters, accents, spaces, and alphanumeric chars.
 */
export function sanitizeSearchTerm(term: string): string {
  if (!term) return '';
  return term
    .trim()
    .slice(0, MAX_TERM_LENGTH)
    .replace(/[^\p{L}\p{N}_\-\s@#.\p{Extended_Pictographic}\p{Regional_Indicator}\p{Emoji}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalizes accents and whitespace for robust partial matching
 */
export function normalizeForSearch(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Computes a string matching score between a target text and a query
 * based on prefix match, exact match, word boundary match, and substring match.
 */
export function computeMatchScore(target: string, query: string, boost = 1.0): number {
  if (!target || !query) return 0;
  const tNorm = normalizeForSearch(target);
  const qNorm = normalizeForSearch(query);

  if (!qNorm) return 0;
  if (tNorm === qNorm) return 100 * boost;
  if (tNorm.startsWith(qNorm)) return 80 * boost;

  const words = tNorm.split(/\s+/);
  if (words.some((w) => w.startsWith(qNorm))) return 65 * boost;
  if (tNorm.includes(qNorm)) return 40 * boost;

  // Partial sub-word matches for length >= 3
  if (qNorm.length >= 3) {
    const qParts = qNorm.split(/\s+/).filter(Boolean);
    let matchedParts = 0;
    for (const part of qParts) {
      if (tNorm.includes(part)) matchedParts++;
    }
    if (matchedParts > 0) {
      return (matchedParts / qParts.length) * 35 * boost;
    }
  }

  return 0;
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
    { pattern: /\b(restaurants?|food|eat|eating|menu|kitchen|dining|chef|catering)\b/i, entities: ['businesses', 'products', 'locations'] },
    { pattern: /\b(events?|parties|party|festivals?|carnival|concerts?|weekend|fete|socafete)\b/i, entities: ['events', 'communities'] },
    { pattern: /\b(creators?|artists?|musicians?|influencers?|dancers?|comedians?|singers?)\b/i, entities: ['creators', 'profiles', 'podcasts'] },
    { pattern: /\b(podcasts?|episodes?|listen|audio|interviews?)\b/i, entities: ['podcasts'] },
    { pattern: /\b(videos?|watch|reels?|stream|live)\b/i, entities: ['videos', 'posts'] },
    { pattern: /\b(communities?|groups?|join|hubs?|diaspora|islands?)\b/i, entities: ['communities', 'profiles'] },
    { pattern: /\b(merchants?|stores?|shop|buy|products?|fashion|crafts?)\b/i, entities: ['products', 'businesses'] },
  ];

  public planEntityRetrieval(term: string): SearchEntity[] {
    const matched = new Set<SearchEntity>(['profiles', 'businesses', 'communities', 'posts']);
    for (const { pattern, entities } of this.patterns) {
      if (pattern.test(term)) {
        entities.forEach((entity) => matched.add(entity));
      }
    }
    return [...matched];
  }
}
