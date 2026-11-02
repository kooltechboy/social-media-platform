import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('HomeRail Zero-Mock Data & Character Encoding Integrity', () => {
  const homeRailPath = join(__dirname, '../../apps/web/src/components/rails/home-rail.tsx');
  const homeRailSource = readFileSync(homeRailPath, 'utf-8');

  it('verifies hardcoded mock arrays are eradicated from HomeRail source', () => {
    expect(homeRailSource).not.toContain('DEFAULT_CARIBBEAN_TRENDS');
    expect(homeRailSource).not.toContain('DEFAULT_SUGGESTED_PEOPLE');
    expect(homeRailSource).not.toContain('Maria Rodriguez');
    expect(homeRailSource).not.toContain('Jahmar Reid');
    expect(homeRailSource).not.toContain('mariarodriguez');
    expect(homeRailSource).not.toContain('jahmarreid');
    expect(homeRailSource).not.toContain('124000');
    expect(homeRailSource).not.toContain('96000');
  });

  it('verifies HomeRail contains zero mojibake corruption characters', () => {
    // Characters caused by Latin-1 / UTF-8 charset mismatches: Â, Ã, â€
    expect(homeRailSource).not.toContain('\u00C2'); // Â
    expect(homeRailSource).not.toContain('Â·');
    expect(homeRailSource).not.toContain('â€”');
    expect(homeRailSource).not.toContain('\u00C3');
  });

  it('verifies proper unicode middle dot is used for separators', () => {
    expect(homeRailSource).toContain('\\u00B7');
  });

  it('verifies honest empty state is present when no trending topics exist', () => {
    expect(homeRailSource).toContain('No trending topics right now');
    expect(homeRailSource).toContain('Tag your posts with hashtags like #Carnival');
  });

  it('verifies honest community exploration prompt is present when suggested people is empty', () => {
    expect(homeRailSource).toContain('Explore authentic Caribbean creators, artists, and businesses across the diaspora');
    expect(homeRailSource).toContain('Explore community');
  });

  it('verifies real props contract is preserved', () => {
    expect(homeRailSource).toContain('suggestedPeople');
    expect(homeRailSource).toContain('trendingTopics');
    expect(homeRailSource).toContain('activeLiveStream');
    expect(homeRailSource).toContain('managedPages');
    expect(homeRailSource).toContain('followedPages');
  });
});
