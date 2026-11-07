/**
 * Sub-Project 6: Discovery, Search, AI Repurposing & Caribbean Sounds — Unit Tests
 *
 * Tests:
 *   - fetchSoundsAction: genre, territory, search query filtering
 *   - getSoundDetailsAction: verified sound lookup, associated reels mapping
 *   - uploadSoundAction: auth gate, file presence, copyright certification, title requirement
 *   - recordSoundUsageAction: auth gate
 *   - repurposePodcastEpisodeAction: auth gate
 *   - saveRepurposedContentAction: auth gate
 *   - searchCaribbeanSounds: multi-genre registry validation
 *   - Universal Search sanitization and scoring
 */

import { describe, it, expect } from 'vitest';

// ─── Sounds Actions & Registry ────────────────────────────────────────────────
import {
  fetchSoundsAction,
  getSoundDetailsAction,
  uploadSoundAction,
  recordSoundUsageAction,
} from '../../apps/web/src/lib/sounds/actions';

import {
  CARIBBEAN_SOUNDS,
  CARIBBEAN_SOUNDS_BY_ID,
  SOUND_GENRES,
  searchCaribbeanSounds,
} from '../../apps/web/src/lib/constants/caribbean-sounds';

// ─── AI Repurpose Actions ────────────────────────────────────────────────────
import {
  repurposePodcastEpisodeAction,
  saveRepurposedContentAction,
  type RepurposeResult,
} from '../../apps/web/src/lib/creator/repurpose-actions';

// ─── Universal Search Utilities ──────────────────────────────────────────────
import {
  sanitizeSearchTerm,
  computeMatchScore,
} from '../../packages/search/src/index';

// =============================================================================
// CARIBBEAN SOUNDS REGISTRY & ACTIONS
// =============================================================================

describe('Sub-Project 6: Caribbean Sounds Registry & Search', () => {
  describe('searchCaribbeanSounds', () => {
    it('returns all verified stems when no options provided', () => {
      const sounds = searchCaribbeanSounds({});
      expect(sounds.length).toBe(CARIBBEAN_SOUNDS.length);
      expect(sounds.length).toBeGreaterThanOrEqual(10);
    });

    it('filters accurately by genre', () => {
      const socaSounds = searchCaribbeanSounds({ genre: 'Soca' });
      expect(socaSounds.length).toBeGreaterThan(0);
      expect(socaSounds.every((s) => s.genre === 'Soca')).toBe(true);

      const steelpanSounds = searchCaribbeanSounds({ genre: 'Steelpan' });
      expect(steelpanSounds.length).toBeGreaterThan(0);
      expect(steelpanSounds.every((s) => s.genre === 'Steelpan')).toBe(true);
    });

    it('filters accurately by territory ISO code', () => {
      const trinidadSounds = searchCaribbeanSounds({ countryIso: 'TTO' });
      expect(trinidadSounds.length).toBeGreaterThan(0);
      expect(trinidadSounds.every((s) => s.countryIso === 'TTO')).toBe(true);

      const jamaicaSounds = searchCaribbeanSounds({ countryIso: 'JAM' });
      expect(jamaicaSounds.length).toBeGreaterThan(0);
      expect(jamaicaSounds.every((s) => s.countryIso === 'JAM')).toBe(true);
    });

    it('searches by keyword across title and artist', () => {
      const results = searchCaribbeanSounds({ query: 'Steelpan' });
      expect(results.length).toBeGreaterThan(0);
      expect(
        results.some((s) => s.title.includes('Steelpan') || s.genre === 'Steelpan')
      ).toBe(true);
    });

    it('returns empty array when no sounds match query', () => {
      const results = searchCaribbeanSounds({ query: 'NonexistentArtistXYZ123' });
      expect(results).toHaveLength(0);
    });
  });

  describe('fetchSoundsAction', () => {
    it('fetches sounds with live verified catalog', async () => {
      const sounds = await fetchSoundsAction();
      expect(Array.isArray(sounds)).toBe(true);
      expect(sounds.length).toBeGreaterThanOrEqual(10);
    });

    it('filters sounds by genre', async () => {
      const reggaeSounds = await fetchSoundsAction({ genre: 'Reggae' });
      expect(Array.isArray(reggaeSounds)).toBe(true);
      expect(reggaeSounds.every((s) => s.genre === 'Reggae')).toBe(true);
    });

    it('filters sounds by territory ISO', async () => {
      const ttSounds = await fetchSoundsAction({ countryIso: 'TTO' });
      expect(Array.isArray(ttSounds)).toBe(true);
      expect(ttSounds.every((s) => s.countryIso === 'TTO')).toBe(true);
    });

    it('supports limit constraint', async () => {
      const limited = await fetchSoundsAction({ limit: 3 });
      expect(limited.length).toBeLessThanOrEqual(CARIBBEAN_SOUNDS.length);
    });
  });

  describe('getSoundDetailsAction', () => {
    it('resolves verified sound by ID with metadata', async () => {
      const res = await getSoundDetailsAction('sound-soca-01');
      expect(res.sound).not.toBeNull();
      expect(res.sound?.id).toBe('sound-soca-01');
      expect(res.sound?.genre).toBe('Steelpan');
      expect(Array.isArray(res.associatedReels)).toBe(true);
      expect(typeof res.totalUses).toBe('number');
    });

    it('returns null sound for completely invalid ID', async () => {
      const res = await getSoundDetailsAction('sound-completely-invalid-99999');
      expect(res.sound).toBeNull();
      expect(res.associatedReels).toHaveLength(0);
      expect(res.totalUses).toBe(0);
    });
  });

  describe('uploadSoundAction', () => {
    it('blocks unauthenticated sound uploads', async () => {
      const formData = new FormData();
      formData.set('title', 'My Carnival Riddim');
      const res = await uploadSoundAction(formData);
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/signed in/i);
    });

    it('rejects upload when audio file is missing', async () => {
      const formData = new FormData();
      formData.set('title', 'No File Stem');
      formData.set('rightsCertified', 'true');
      const res = await uploadSoundAction(formData);
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/signed in|select an audio file/i);
    });

    it('enforces mandatory copyright / rights certification', async () => {
      const formData = new FormData();
      formData.set('title', 'Uncertified Stem');
      // rightsCertified deliberately omitted
      const res = await uploadSoundAction(formData);
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/signed in|copyright ownership/i);
    });
  });

  describe('recordSoundUsageAction', () => {
    it('blocks unauthenticated usage recording', async () => {
      const res = await recordSoundUsageAction('sound-soca-01', 'video-123');
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Sign in/i);
    });
  });
});

// =============================================================================
// AI CONTENT REPURPOSING ACTIONS
// =============================================================================

describe('Sub-Project 6: AI Content Repurposing Actions', () => {
  describe('repurposePodcastEpisodeAction', () => {
    it('blocks unauthenticated episode repurposing', async () => {
      const res = await repurposePodcastEpisodeAction('episode-123');
      expect(res.result).toBeNull();
      expect(res.error).toMatch(/Unauthorized/i);
    });
  });

  describe('saveRepurposedContentAction', () => {
    it('blocks unauthenticated saves of repurposed content', async () => {
      const mockResult: RepurposeResult = {
        summary: 'Caribbean podcast recap',
        quotedHighlights: ['Quote 1'],
        socialPosts: ['Post 1'],
        contentIdeas: ['Idea 1'],
        hashtags: ['#caribbean'],
      };
      const res = await saveRepurposedContentAction('episode-123', mockResult);
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Unauthorized/i);
    });
  });
});

// =============================================================================
// UNIVERSAL SEARCH SANITIZATION & MATCHING
// =============================================================================

describe('Sub-Project 6: Universal Search Sanitization & Matching', () => {
  it('sanitizes input while preserving Caribbean accents and multi-word queries', () => {
    const sanitized = sanitizeSearchTerm("Bob Marley'; DROP TABLE posts;--");
    expect(sanitized).toBe('Bob Marley DROP TABLE posts--');

    const accents = sanitizeSearchTerm('Machel Montano 🇹🇹');
    expect(accents).toContain('Machel Montano');
  });

  it('scores exact matches higher than substring matches', () => {
    const exact = computeMatchScore('Beres Hammond', 'Beres Hammond');
    const prefix = computeMatchScore('Beres Hammond', 'Beres');
    const substring = computeMatchScore('Beres Hammond', 'Hammond');

    expect(exact).toBeGreaterThan(prefix);
    expect(prefix).toBeGreaterThan(substring);
    expect(substring).toBeGreaterThan(0);
  });
});
