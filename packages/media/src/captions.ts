/**
 * TUKUBI Caribbean Dialect Subtitle & Captioning Subsystem
 * WebVTT / SRT parser, serializer, timestamp synchronizer,
 * and automated Caribbean dialect subtitle generator.
 */

import {
  CaribbeanDialect,
  detectCaribbeanDialect,
  translateDialectText,
} from '@caribbean/localization';

export interface CaptionCue {
  id: string;
  startTimeSec: number;
  endTimeSec: number;
  text: string;
  dialect?: CaribbeanDialect;
  translations?: {
    en?: string;
    fr?: string;
    es?: string;
  };
  confidence?: number;
}

export interface CaptionTrack {
  id: string;
  label: string;
  language: string;
  dialect?: CaribbeanDialect;
  cues: CaptionCue[];
  isDefault?: boolean;
}

/**
 * Formats seconds into standard WebVTT timestamp: 00:00:00.000
 */
export function formatTimestampVTT(totalSeconds: number): string {
  const validSec = Math.max(0, totalSeconds);
  const hours = Math.floor(validSec / 3600);
  const minutes = Math.floor((validSec % 3600) / 60);
  const seconds = Math.floor(validSec % 60);
  const milliseconds = Math.floor((validSec % 1) * 1000);

  const hh = hours.toString().padStart(2, '0');
  const mm = minutes.toString().padStart(2, '0');
  const ss = seconds.toString().padStart(2, '0');
  const ms = milliseconds.toString().padStart(3, '0');

  return `${hh}:${mm}:${ss}.${ms}`;
}

/**
 * Parses WebVTT or SRT timestamp (HH:MM:SS.mmm or MM:SS.mmm) into seconds.
 */
export function parseTimestampVTT(timestamp: string): number {
  const cleaned = timestamp.trim().replace(',', '.');
  const parts = cleaned.split(':');

  if (parts.length === 3) {
    const hours = parseFloat(parts[0]);
    const minutes = parseFloat(parts[1]);
    const seconds = parseFloat(parts[2]);
    return hours * 3600 + minutes * 60 + seconds;
  } else if (parts.length === 2) {
    const minutes = parseFloat(parts[0]);
    const seconds = parseFloat(parts[1]);
    return minutes * 60 + seconds;
  }
  return 0;
}

/**
 * Finds the active caption cue at a given playback timestamp in seconds.
 * Performs fast lookup over sorted cues.
 */
export function findActiveCue(cues: CaptionCue[], currentTimeSec: number): CaptionCue | null {
  if (!cues || cues.length === 0) return null;

  // Binary search for candidate cue
  let low = 0;
  let high = cues.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const cue = cues[mid];

    if (currentTimeSec >= cue.startTimeSec && currentTimeSec <= cue.endTimeSec) {
      return cue;
    }

    if (currentTimeSec < cue.startTimeSec) {
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }

  // Fallback linear check for any overlapping cues
  for (const cue of cues) {
    if (currentTimeSec >= cue.startTimeSec && currentTimeSec <= cue.endTimeSec) {
      return cue;
    }
  }

  return null;
}

/**
 * Exports a CaptionTrack into standard WebVTT format string.
 */
export function exportToWebVTT(track: CaptionTrack): string {
  const lines: string[] = [
    'WEBVTT',
    `NOTE Title: ${track.label} (TUKUBI Caribbean Captions)`,
    `NOTE Language: ${track.language}${track.dialect ? ` (Dialect: ${track.dialect})` : ''}`,
    '',
  ];

  for (let i = 0; i < track.cues.length; i++) {
    const cue = track.cues[i];
    lines.push(`${cue.id || (i + 1)}`);
    lines.push(
      `${formatTimestampVTT(cue.startTimeSec)} --> ${formatTimestampVTT(cue.endTimeSec)}`
    );
    lines.push(cue.text);
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Parses a standard WebVTT format string into a structured CaptionTrack.
 */
export function parseWebVTT(vttContent: string, trackId = 'track-1'): CaptionTrack {
  const lines = vttContent.replace(/\r\n/g, '\n').split('\n');
  const cues: CaptionCue[] = [];

  let i = 0;
  // Skip WEBVTT header and notes
  while (i < lines.length && !lines[i].includes('-->')) {
    i++;
  }

  let cueIndex = 1;
  while (i < lines.length) {
    const line = lines[i].trim();

    if (line.includes('-->')) {
      const timeTokens = line.split('-->');
      const start = parseTimestampVTT(timeTokens[0].trim());
      const end = parseTimestampVTT(timeTokens[1].trim().split(/\s+/)[0]);


      i++;
      const textLines: string[] = [];
      while (i < lines.length && lines[i].trim() !== '') {
        textLines.push(lines[i].trim());
        i++;
      }

      const cueText = textLines.join(' ');
      const detected = detectCaribbeanDialect(cueText);
      const enTrans = translateDialectText(cueText, 'en');
      const frTrans = translateDialectText(cueText, 'fr');
      const esTrans = translateDialectText(cueText, 'es');

      cues.push({
        id: `cue-${cueIndex++}`,
        startTimeSec: start,
        endTimeSec: end,
        text: cueText,
        dialect: detected.dialect,
        confidence: detected.confidence,
        translations: {
          en: enTrans.translatedText,
          fr: frTrans.hasTranslation ? frTrans.translatedText : undefined,
          es: esTrans.hasTranslation ? esTrans.translatedText : undefined,
        },
      });

    }
    i++;
  }

  // Determine dominant dialect
  const dominantDialect = cues.length > 0 ? cues[0].dialect : 'general';

  return {
    id: trackId,
    label: `Caribbean Subtitles (${dominantDialect?.toUpperCase()})`,
    language: 'en',
    dialect: dominantDialect,
    cues,
  };
}

/**
 * Automatically generates synchronized Caribbean dialect caption cues from a raw transcript or speech text.
 * Calculates duration segments, detects dialects, and builds bilingual translation cues.
 */
export function generateDialectCaptions(
  transcript: string,
  totalDurationSec: number,
  forcedDialect?: CaribbeanDialect
): CaptionTrack {
  if (!transcript || !transcript.trim()) {
    return {
      id: 'captions-empty',
      label: 'Empty Captions',
      language: 'en',
      cues: [],
    };
  }

  // Split transcript into natural phrase segments (by punctuation or 6-8 words)
  const rawSegments = transcript
    .split(/(?<=[.!?,\n])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const segments: string[] = [];
  for (const seg of rawSegments) {
    const words = seg.split(/\s+/);
    if (words.length > 10) {
      // Chunk into smaller digestible subtitle segments
      for (let w = 0; w < words.length; w += 6) {
        segments.push(words.slice(w, w + 6).join(' '));
      }
    } else {
      segments.push(seg);
    }
  }

  const validDuration = Math.max(2, totalDurationSec);
  const totalWords = segments.reduce((sum, s) => sum + s.split(/\s+/).length, 0);

  const cues: CaptionCue[] = [];
  let currentStart = 0.2; // Start with a brief 200ms lead-in

  for (let i = 0; i < segments.length; i++) {
    const text = segments[i];
    const wordsCount = text.split(/\s+/).length;
    
    // Proportional duration based on word count with 1.2s minimum
    const segDuration = Math.max(1.2, (wordsCount / (totalWords || 1)) * (validDuration - 0.5));
    const currentEnd = Math.min(validDuration, currentStart + segDuration);

    const dialectDetect = detectCaribbeanDialect(text);
    const dialect = forcedDialect || dialectDetect.dialect;

    const enTrans = translateDialectText(text, 'en');
    const frTrans = translateDialectText(text, 'fr');
    const esTrans = translateDialectText(text, 'es');

    cues.push({
      id: `cue-${i + 1}`,
      startTimeSec: Math.round(currentStart * 100) / 100,
      endTimeSec: Math.round(currentEnd * 100) / 100,
      text,
      dialect,
      confidence: dialectDetect.confidence,
      translations: {
        en: enTrans.translatedText,
        fr: frTrans.hasTranslation ? frTrans.translatedText : undefined,
        es: esTrans.hasTranslation ? esTrans.translatedText : undefined,
      },
    });


    currentStart = currentEnd + 0.1; // 100ms pause between cues
    if (currentStart >= validDuration) break;
  }

  const detectedDialect = forcedDialect || (cues[0]?.dialect ?? 'general');

  return {
    id: `captions-${Date.now()}`,
    label: `Caribbean (${detectedDialect.toUpperCase()})`,
    language: 'carib',
    dialect: detectedDialect,
    cues,
  };
}
