import { describe, it, expect } from 'vitest';
import { AskCaribbeanPlanner, isGrounded, CaribAIEngine } from '../../packages/ai/src/index';
import { CaribAISemanticPlanner, sanitizeSearchTerm, PostgresFullTextSearch } from '../../packages/search/src/index';

describe('Ask Caribbean query planner', () => {
  const planner = new AskCaribbeanPlanner();

  it('plans entity retrieval for event queries with diaspora locations', () => {
    const plan = planner.plan('What Caribbean events are happening in Miami this weekend?');
    expect(plan.entities).toContain('events');
    expect(plan.locationHints).toContain('miami');
    expect(plan.timeWindowDays).toBe(7);
  });

  it('plans business retrieval for restaurant queries', () => {
    const plan = planner.plan('Show me Jamaican restaurants near me');
    expect(plan.entities).toContain('businesses');
  });

  it('defaults to a seven-day window for weekly queries and one day for today', () => {
    expect(planner.plan('What is trending in Trinidad this week?').timeWindowDays).toBe(7);
    expect(planner.plan('Anything happening in Toronto today?').timeWindowDays).toBe(1);
    expect(planner.plan('Find Caribbean entrepreneurs in Toronto').timeWindowDays).toBeNull();
  });

  it('always includes the baseline entities', () => {
    const plan = planner.plan('Find podcasts about reggae');
    expect(plan.entities).toContain('podcasts');
    expect(plan.entities).toContain('profiles');
    expect(plan.entities).toContain('posts');
  });
});

describe('Grounded answers', () => {
  it('rejects ungrounded AI answers (no citations)', () => {
    expect(
      isGrounded({ answer: 'There are events in Miami.', citations: [] }),
    ).toBe(false);
    expect(
      isGrounded({
        answer: 'Soca Night is happening Saturday.',
        citations: [{ entityType: 'events', entityId: 'evt_1', title: 'Soca Night' }],
      }),
    ).toBe(true);
  });
});

describe('CaribAI engine fallback', () => {
  it('degrades gracefully without an API key', async () => {
    const engine = new CaribAIEngine({ apiKey: '' });
    const result = await engine.translateContent('Hello', 'es');
    expect(result).toContain('CaribAI Processing');
  });
});

describe('Search port implementation', () => {
  const search = new PostgresFullTextSearch();
  const planner = new CaribAISemanticPlanner();

  it('sanitizes and truncates search terms', () => {
    expect(sanitizeSearchTerm('  carnival  ')).toBe('carnival');
    expect(sanitizeSearchTerm('x'.repeat(300)).length).toBe(200);
    expect(sanitizeSearchTerm('')).toBe('');
  });

  it('returns no hits for empty terms without querying', async () => {
    expect(await search.search({ term: '   ' })).toEqual([]);
  });

  it('builds parameterized full-text queries with country filters', () => {
    const { text, params } = search.buildPostQuery({ term: 'dancehall', countryIso: 'JAM' });
    expect(text).toContain('websearch_to_tsquery');
    expect(text).toContain('SELECT id FROM public.countries WHERE iso_code = $3');
    expect(params).toEqual(['dancehall', 20, 'JAM']);
  });

  it('maps natural language to entity sets via the semantic planner', () => {
    expect(planner.planEntityRetrieval('Where can I eat Caribbean food?')).toContain('businesses');
    expect(planner.planEntityRetrieval('Who are the top reggae creators?')).toContain('creators');
    expect(planner.planEntityRetrieval('hello world')).not.toContain('events');
  });
});
