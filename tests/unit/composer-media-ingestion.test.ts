import { describe, it, expect } from 'vitest';
import { parseMediaPayload, type StructuredMediaItem } from '../../apps/web/src/lib/social/actions';

describe('Composer Media Ingestion - parseMediaPayload', () => {
  it('returns an empty array when input is null, undefined, or empty string', () => {
    expect(parseMediaPayload(null)).toEqual([]);
    expect(parseMediaPayload(undefined)).toEqual([]);
    expect(parseMediaPayload('')).toEqual([]);
    expect(parseMediaPayload('   ')).toEqual([]);
    expect(parseMediaPayload(null as unknown)).toEqual([]);
  });

  it('handles non-string non-array unexpected primitives safely', () => {
    expect(parseMediaPayload(12345)).toEqual([]);
    expect(parseMediaPayload({})).toEqual([]);
    expect(parseMediaPayload(true)).toEqual([]);
  });

  it('parses legacy comma-separated string URLs correctly and infers media type', () => {
    const raw = 'https://example.com/photo.jpg, https://example.com/clip.mp4, https://example.com/video_stream';
    const result = parseMediaPayload(raw);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      url: 'https://example.com/photo.jpg',
      type: 'image',
    });
    expect(result[1]).toEqual({
      url: 'https://example.com/clip.mp4',
      type: 'video',
    });
    expect(result[2]).toEqual({
      url: 'https://example.com/video_stream',
      type: 'video',
    });
  });

  it('parses JSON stringified array of string URLs (backward compatibility)', () => {
    const raw = JSON.stringify([
      'https://cdn.tukubi.caribbean/media/sunset.png',
      'https://cdn.tukubi.caribbean/media/carnival.mp4',
    ]);
    const result = parseMediaPayload(raw);

    expect(result).toEqual([
      { url: 'https://cdn.tukubi.caribbean/media/sunset.png', type: 'image' },
      { url: 'https://cdn.tukubi.caribbean/media/carnival.mp4', type: 'video' },
    ]);
  });

  it('parses structured media items JSON payload preserving dimensions, aspect ratio, type, and posterUrl', () => {
    const structuredItems: StructuredMediaItem[] = [
      {
        url: 'https://cdn.tukubi.caribbean/media/beach.jpg',
        width: 1080,
        height: 1350,
        aspectRatio: '4:5',
        type: 'image',
      },
      {
        url: 'https://cdn.tukubi.caribbean/media/steelpan.mp4',
        width: 1920,
        height: 1080,
        aspectRatio: '16:9',
        type: 'video',
        posterUrl: 'https://cdn.tukubi.caribbean/media/steelpan_poster.jpg',
      },
    ];

    const raw = JSON.stringify(structuredItems);
    const result = parseMediaPayload(raw);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      url: 'https://cdn.tukubi.caribbean/media/beach.jpg',
      width: 1080,
      height: 1350,
      aspectRatio: '4:5',
      type: 'image',
      posterUrl: undefined,
    });
    expect(result[1]).toEqual({
      url: 'https://cdn.tukubi.caribbean/media/steelpan.mp4',
      width: 1920,
      height: 1080,
      aspectRatio: '16:9',
      type: 'video',
      posterUrl: 'https://cdn.tukubi.caribbean/media/steelpan_poster.jpg',
    });
  });

  it('infers video type if structured item type is omitted but url indicates video', () => {
    const items = [
      {
        url: 'https://cdn.tukubi.caribbean/media/dancing.mp4',
        width: 720,
        height: 1280,
        aspectRatio: '9:16',
      },
      {
        url: 'https://cdn.tukubi.caribbean/media/photo.webp',
        width: 800,
        height: 800,
        aspectRatio: '1:1',
      },
    ];

    const result = parseMediaPayload(JSON.stringify(items));
    expect(result[0].type).toBe('video');
    expect(result[1].type).toBe('image');
  });

  it('safely falls back to comma splitting when JSON.parse fails on malformed input', () => {
    const malformed = 'https://example.com/one.jpg, https://example.com/two.jpg';
    const result = parseMediaPayload(malformed);
    expect(result).toHaveLength(2);
    expect(result[0].url).toBe('https://example.com/one.jpg');
    expect(result[1].url).toBe('https://example.com/two.jpg');
  });

  it('parses directly passed Array of string URLs or structured objects', () => {
    const stringArray = ['https://example.com/direct.jpg'];
    expect(parseMediaPayload(stringArray)).toEqual([
      { url: 'https://example.com/direct.jpg', type: 'image' },
    ]);

    const objectArray = [{ url: 'https://example.com/direct_obj.jpg', width: 100, height: 100 }];
    expect(parseMediaPayload(objectArray)).toEqual([
      {
        url: 'https://example.com/direct_obj.jpg',
        width: 100,
        height: 100,
        aspectRatio: undefined,
        type: 'image',
        posterUrl: undefined,
      },
    ]);
  });
});
