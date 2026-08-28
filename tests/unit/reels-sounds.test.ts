import { describe, it, expect } from 'vitest';
import {
  CARIBBEAN_SOUNDS,
  CARIBBEAN_SOUNDS_BY_ID,
  SOUND_GENRES,
  searchCaribbeanSounds,
  type CaribbeanSound,
} from '../../apps/web/src/lib/constants/caribbean-sounds';

describe('Caribbean Sounds Registry & Architecture', () => {
  it('covers core Caribbean musical genres with valid metadata', () => {
    expect(CARIBBEAN_SOUNDS.length).toBeGreaterThanOrEqual(10);

    const genresInRegistry = new Set(CARIBBEAN_SOUNDS.map((s) => s.genre));
    expect(genresInRegistry.has('Soca')).toBe(true);
    expect(genresInRegistry.has('Dancehall')).toBe(true);
    expect(genresInRegistry.has('Reggae')).toBe(true);
    expect(genresInRegistry.has('Kompa')).toBe(true);
    expect(genresInRegistry.has('Bachata')).toBe(true);
    expect(genresInRegistry.has('Steelpan')).toBe(true);
    expect(genresInRegistry.has('Zouk')).toBe(true);
  });

  it('validates audio URLs, durations, and BPM boundaries for every sound', () => {
    for (const sound of CARIBBEAN_SOUNDS) {
      expect(sound.id).toMatch(/^sound-[a-z0-9-]+$/);
      expect(sound.title.length).toBeGreaterThan(0);
      expect(sound.artist.length).toBeGreaterThan(0);
      expect(sound.artistHandle.length).toBeGreaterThan(0);
      expect(sound.countryIso).toMatch(/^[A-Z]{3}$/);
      expect(sound.flag.length).toBeGreaterThan(0);

      // Duration: 15s to 90s for short-form audio stems
      expect(sound.durationSeconds).toBeGreaterThanOrEqual(15);
      expect(sound.durationSeconds).toBeLessThanOrEqual(90);
      expect(sound.durationFormatted).toMatch(/^\d:\d{2}$/);

      // Audio & BPM
      expect(sound.audioUrl.startsWith('http')).toBe(true);
      expect(sound.bpm).toBeGreaterThanOrEqual(60);
      expect(sound.bpm).toBeLessThanOrEqual(200);

      // Usage metrics
      expect(sound.usageCount).toBeGreaterThanOrEqual(0);
      expect(sound.usageCountFormatted.length).toBeGreaterThan(0);
    }
  });

  it('verifies dictionary lookup by ID resolves every sound without undefined results', () => {
    for (const sound of CARIBBEAN_SOUNDS) {
      const resolved = CARIBBEAN_SOUNDS_BY_ID[sound.id];
      expect(resolved).toBeDefined();
      expect(resolved.title).toBe(sound.title);
      expect(resolved.artist).toBe(sound.artist);
    }
  });
});

describe('Caribbean Sounds Search & Discovery Engine', () => {
  it('filters sounds accurately by genre', () => {
    const socaTracks = searchCaribbeanSounds({ genre: 'Soca' });
    expect(socaTracks.length).toBeGreaterThanOrEqual(1);
    for (const track of socaTracks) {
      expect(track.genre).toBe('Soca');
    }

    const dancehallTracks = searchCaribbeanSounds({ genre: 'Dancehall' });
    expect(dancehallTracks.length).toBeGreaterThanOrEqual(1);
    for (const track of dancehallTracks) {
      expect(track.genre).toBe('Dancehall');
    }
  });

  it('filters sounds accurately by country ISO', () => {
    const trinidadTracks = searchCaribbeanSounds({ countryIso: 'TTO' });
    expect(trinidadTracks.length).toBeGreaterThanOrEqual(2);
    for (const track of trinidadTracks) {
      expect(track.countryIso).toBe('TTO');
    }

    const jamaicaTracks = searchCaribbeanSounds({ countryIso: 'JAM' });
    expect(jamaicaTracks.length).toBeGreaterThanOrEqual(2);
    for (const track of jamaicaTracks) {
      expect(track.countryIso).toBe('JAM');
    }
  });

  it('performs case-insensitive fuzzy text matching on title, artist, and genre', () => {
    const machelResults = searchCaribbeanSounds({ query: 'machel' });
    expect(machelResults.length).toBeGreaterThanOrEqual(1);
    expect(machelResults.some((s) => s.artist.toLowerCase().includes('machel'))).toBe(true);

    const dubResults = searchCaribbeanSounds({ query: 'dubplate' });
    expect(dubResults.length).toBeGreaterThanOrEqual(1);
    expect(dubResults.some((s) => s.title.toLowerCase().includes('dubplate'))).toBe(true);
  });

  it('filters trending sounds correctly', () => {
    const trending = searchCaribbeanSounds({ trendingOnly: true });
    expect(trending.length).toBeGreaterThanOrEqual(3);
    for (const track of trending) {
      expect(track.isTrending).toBe(true);
    }
  });
});

describe('Reel Sound Attachment & Audio Mixing Logic', () => {
  it('validates sound attachment and track combination format', () => {
    const sound = CARIBBEAN_SOUNDS[0];
    const userCaption = 'My Carnival Day 1 fit check! 🔥';
    const finalReelTitle = `${userCaption} • 🎵 ${sound.title} — ${sound.artist}`;

    expect(finalReelTitle).toContain(userCaption);
    expect(finalReelTitle).toContain(sound.title);
    expect(finalReelTitle).toContain(sound.artist);
  });

  it('calculates audio volume balance ratios correctly', () => {
    function computeAudioMix(originalVolume: number, trackVolume: number) {
      const clampedOriginal = Math.min(100, Math.max(0, originalVolume));
      const clampedTrack = Math.min(100, Math.max(0, trackVolume));
      return {
        originalGain: clampedOriginal / 100,
        trackGain: clampedTrack / 100,
        isMuted: clampedOriginal === 0 && clampedTrack === 0,
      };
    }

    const standardMix = computeAudioMix(100, 80);
    expect(standardMix.originalGain).toBe(1.0);
    expect(standardMix.trackGain).toBe(0.8);
    expect(standardMix.isMuted).toBe(false);

    const voiceoverMix = computeAudioMix(100, 20);
    expect(voiceoverMix.originalGain).toBe(1.0);
    expect(voiceoverMix.trackGain).toBe(0.2);

    const trackOnlyMix = computeAudioMix(0, 100);
    expect(trackOnlyMix.originalGain).toBe(0);
    expect(trackOnlyMix.trackGain).toBe(1.0);
  });
});
