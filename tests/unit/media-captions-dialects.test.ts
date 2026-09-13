import { describe, it, expect } from 'vitest';
import {
  detectCaribbeanDialect,
  translateDialectText,
  CARIBBEAN_DIALECT_DETAILS,
} from '../../packages/localization/src';
import {
  generateDialectCaptions,
  findActiveCue,
  exportToWebVTT,
  parseWebVTT,
  formatTimestampVTT,
  parseTimestampVTT,
  type CaptionTrack,
} from '../../packages/media/src';


describe('Caribbean Dialects Subsystem (@caribbean/localization)', () => {
  it('accurately identifies Jamaican Patois vernacular', () => {
    const text = 'Wah gwaan bredren, mi deh yah pon di beach road, hold a vibes!';
    const result = detectCaribbeanDialect(text);

    expect(result.dialect).toBe('jam');
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.matchedMarkers.length).toBeGreaterThan(0);
  });

  it('accurately identifies Haitian Creole (Kreyòl Ayisyen)', () => {
    const text = "Sak pase tout moun! Nou la n'ap boule nan bèl chalè sa a.";
    const result = detectCaribbeanDialect(text);

    expect(result.dialect).toBe('ht');
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.matchedMarkers.length).toBeGreaterThan(0);
  });

  it('accurately identifies Papiamentu (ABC Islands)', () => {
    const text = 'Con ta bay tur hende! Bon bini na Kòrsou dushi yiu, tur kos bon.';
    const result = detectCaribbeanDialect(text);

    expect(result.dialect).toBe('pap');
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.matchedMarkers.length).toBeGreaterThan(0);
  });

  it('accurately identifies Trinidadian Creole', () => {
    const text = 'Doh study dat, let we lime by de stage for sweet soca bacchanal!';
    const result = detectCaribbeanDialect(text);

    expect(result.dialect).toBe('tri');
    expect(result.confidence).toBeGreaterThan(0.4);
    expect(result.matchedMarkers.length).toBeGreaterThan(0);
  });

  it('provides rich metadata for all Caribbean dialects', () => {
    expect(CARIBBEAN_DIALECT_DETAILS.jam.flag).toBe('🇯🇲');
    expect(CARIBBEAN_DIALECT_DETAILS.ht.flag).toBe('🇭🇹');
    expect(CARIBBEAN_DIALECT_DETAILS.pap.flag).toBe('🇨🇼');
    expect(CARIBBEAN_DIALECT_DETAILS.tri.flag).toBe('🇹🇹');
    expect(CARIBBEAN_DIALECT_DETAILS.guy.flag).toBe('🇬🇾');
    expect(CARIBBEAN_DIALECT_DETAILS.bah.flag).toBe('🇧🇸');
  });

  it('translates Caribbean vernacular into Standard English', () => {
    const patois = 'Wah gwaan fam, everything criss today!';
    const translated = translateDialectText(patois, 'en');

    expect(translated.hasTranslation).toBe(true);
    expect(translated.translatedText).toContain("What's going on");
  });

  it('translates Haitian Creole into French when requested', () => {
    const kreyol = 'Sak pase tout moun!';
    const translated = translateDialectText(kreyol, 'fr');

    expect(translated.hasTranslation).toBe(true);
    expect(translated.translatedText).toContain("Qu'est-ce qui se passe");
  });
});

describe('Media Captions Engine (@caribbean/media)', () => {
  it('formats and parses WebVTT timestamps correctly', () => {
    expect(formatTimestampVTT(0)).toBe('00:00:00.000');
    expect(formatTimestampVTT(65.5)).toBe('00:01:05.500');
    expect(formatTimestampVTT(3661.123)).toBe('01:01:01.123');

    expect(parseTimestampVTT('00:01:05.500')).toBe(65.5);
    expect(parseTimestampVTT('01:01:01.123')).toBeCloseTo(3661.123, 2);
  });

  it('generates synchronized dialect captions with valid timestamps and non-overlapping intervals', () => {
    const transcript =
      'Wah gwaan fam! Mi deh yah inna downtown Kingston today. Di whole place criss and everybody hold a vibes!';
    const track = generateDialectCaptions(transcript, 15, 'jam');

    expect(track.dialect).toBe('jam');
    expect(track.cues.length).toBeGreaterThan(0);

    for (let i = 0; i < track.cues.length; i++) {
      const cue = track.cues[i];
      expect(cue.startTimeSec).toBeLessThan(cue.endTimeSec);
      expect(cue.text.length).toBeGreaterThan(0);
      expect(cue.translations?.en).toBeDefined();

      if (i > 0) {
        expect(cue.startTimeSec).toBeGreaterThanOrEqual(track.cues[i - 1].endTimeSec);
      }
    }
  });

  it('accurately finds active cue via findActiveCue binary search', () => {
    const track: CaptionTrack = {
      id: 'test-track',
      label: 'Test',
      language: 'en',
      cues: [
        { id: '1', startTimeSec: 0.5, endTimeSec: 3.0, text: 'First line' },
        { id: '2', startTimeSec: 3.5, endTimeSec: 6.0, text: 'Second line' },
        { id: '3', startTimeSec: 6.5, endTimeSec: 9.0, text: 'Third line' },
      ],
    };

    // Before any cue
    expect(findActiveCue(track.cues, 0.2)).toBeNull();

    // Inside first cue
    expect(findActiveCue(track.cues, 1.5)?.id).toBe('1');

    // In silence gap between cues
    expect(findActiveCue(track.cues, 3.2)).toBeNull();

    // Inside second cue
    expect(findActiveCue(track.cues, 4.0)?.id).toBe('2');

    // Inside third cue boundary
    expect(findActiveCue(track.cues, 9.0)?.id).toBe('3');

    // After all cues
    expect(findActiveCue(track.cues, 12.0)).toBeNull();
  });

  it('exports to and parses from standard WebVTT format faithfully', () => {
    const sampleTrack: CaptionTrack = {
      id: 'vtt-test',
      label: 'Caribbean Reels Track',
      language: 'jam',
      dialect: 'jam',
      cues: [
        {
          id: 'cue-1',
          startTimeSec: 1.0,
          endTimeSec: 4.5,
          text: 'Wah gwaan Kingston crew!',
          dialect: 'jam',
        },
        {
          id: 'cue-2',
          startTimeSec: 5.0,
          endTimeSec: 9.0,
          text: 'Hold a vibes pon di beach road.',
          dialect: 'jam',
        },
      ],
    };

    const vttOutput = exportToWebVTT(sampleTrack);
    expect(vttOutput).toContain('WEBVTT');
    expect(vttOutput).toContain('00:00:01.000 --> 00:00:04.500');
    expect(vttOutput).toContain('Wah gwaan Kingston crew!');

    const parsed = parseWebVTT(vttOutput);
    expect(parsed.cues.length).toBe(2);
    expect(parsed.cues[0].startTimeSec).toBe(1.0);
    expect(parsed.cues[0].endTimeSec).toBe(4.5);
    expect(parsed.cues[0].text).toBe('Wah gwaan Kingston crew!');
  });
});
