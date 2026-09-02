import { describe, it, expect } from 'vitest';
import {
  sanitizeSearchTerm,
  normalizeForSearch,
  computeMatchScore,
  CaribAISemanticPlanner,
} from '../../packages/search/src/index';

describe('Universal Search Sanitization & Matching Engine', () => {
  it('strips dangerous characters while preserving Caribbean accents and alphanumerics', () => {
    expect(sanitizeSearchTerm("Daniel'; DROP TABLE profiles;--")).toBe('Daniel DROP TABLE profiles--');
    expect(sanitizeSearchTerm('  Marcus Garvey 🇯🇲  ')).toBe('Marcus Garvey 🇯🇲');
    expect(sanitizeSearchTerm('Port-au-Prince & Kingston')).toBe('Port-au-Prince Kingston');
    expect(sanitizeSearchTerm('José Martí')).toBe('José Martí');
  });

  it('normalizes diacritics and accents for robust partial Caribbean search', () => {
    expect(normalizeForSearch('José')).toBe('jose');
    expect(normalizeForSearch('Curaçao')).toBe('curacao');
    expect(normalizeForSearch('Saint-Barthélemy')).toBe('saint-barthelemy');
  });

  it('scores exact matches higher than prefix matches and prefix matches higher than substrings', () => {
    const exactScore = computeMatchScore('Marcus Garvey', 'Marcus Garvey');
    const prefixScore = computeMatchScore('Marcus Garvey', 'Marcus');
    const substringScore = computeMatchScore('Marcus Garvey', 'Garvey');
    const partialScore = computeMatchScore('Marcus Garvey', 'Marc');

    expect(exactScore).toBeGreaterThan(prefixScore);
    expect(prefixScore).toBeGreaterThan(substringScore);
    expect(substringScore).toBeGreaterThan(0);
    expect(partialScore).toBeGreaterThan(0);
  });

  it('tolerates case differences and multi-word searches', () => {
    const score = computeMatchScore('Kingston Jerk Chicken', 'kingston jerk');
    expect(score).toBeGreaterThan(50);
  });

  it('plans semantic entity retrieval based on Caribbean queries', () => {
    const planner = new CaribAISemanticPlanner();

    const foodEntities = planner.planEntityRetrieval('best jerk restaurant in Montego Bay');
    expect(foodEntities).toContain('businesses');
    expect(foodEntities).toContain('products');

    const eventEntities = planner.planEntityRetrieval('carnival fete tickets');
    expect(eventEntities).toContain('events');
    expect(eventEntities).toContain('communities');

    const creatorEntities = planner.planEntityRetrieval('reggae musicians and artists');
    expect(creatorEntities).toContain('creators');
    expect(creatorEntities).toContain('profiles');
  });
});
