import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  MediaPipeline,
  classifyAspectRatio,
  getClampedAspectRatio,
  KNOWN_SIGNATURES,
  SURFACE_LIMITS,
} from '../../packages/media/src';
import {
  computeSinglePhotoContainerStyle,
  clampSlideIndex,
  getNextSlideIndex,
  getPrevSlideIndex,
  calculateActiveSlideIndex,
  getCarouselAnchorRatio,
} from '../../apps/web/src/components/media/tukubi-gallery';
import {
  computeVideoContainerStyle,
  formatVideoTime,
  calculateSeekTime,
} from '../../apps/web/src/components/media/tukubi-video-player';
import {
  clampZoomLevel,
  clampPanPosition,
  wrapViewerIndex,
  getNextViewerIndex,
  getPrevViewerIndex,
} from '../../apps/web/src/components/media/tukubi-media-viewer';
import AudioManager from '../../apps/web/src/lib/media/audio-manager';

describe('Phase 3 — Media & Storage Production Certification', () => {
  beforeEach(() => {
    AudioManager.reset();
  });

  // ===========================================================================
  // 1. Binary Magic Byte Sniffing & MIME Type Validation
  // ===========================================================================
  describe('1. Binary Magic Byte Sniffing & Anti-Spoofing', () => {
    const pipeline = new MediaPipeline();

    it('verifies all expected media formats are listed in KNOWN_SIGNATURES', () => {
      const knownMimes = KNOWN_SIGNATURES.map((s) => s.mime);
      expect(knownMimes).toContain('image/jpeg');
      expect(knownMimes).toContain('image/png');
      expect(knownMimes).toContain('image/gif');
      expect(knownMimes).toContain('image/webp');
      expect(knownMimes).toContain('image/avif');
      expect(knownMimes).toContain('image/heic');
      expect(knownMimes).toContain('video/mp4');
      expect(knownMimes).toContain('audio/mp3');
      expect(knownMimes).toContain('audio/wav');
    });

    it('detects valid JPEG, PNG, AVIF, HEIC, MP4, and MP3 headers', () => {
      expect(pipeline.validateMagicBytes([0xff, 0xd8, 0xff, 0x00]).detectedMime).toBe('image/jpeg');
      expect(pipeline.validateMagicBytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).detectedMime).toBe('image/png');
      expect(pipeline.validateMagicBytes([0x00, 0x00, 0x00, 0x1c, 0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66]).detectedMime).toBe('image/avif');
      expect(pipeline.validateMagicBytes([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63]).detectedMime).toBe('image/heic');
      expect(pipeline.validateMagicBytes([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70]).detectedMime).toBe('video/mp4');
      expect(pipeline.validateMagicBytes([0x49, 0x44, 0x33, 0x00]).detectedMime).toBe('audio/mp3');
    });

    it('rejects suspicious or non-media binary headers', () => {
      const exeHeader = [0x4d, 0x5a, 0x90, 0x00];
      const result = pipeline.validateMagicBytes(exeHeader);
      expect(result.valid).toBe(false);
      expect(result.detectedMime).toBeUndefined();
    });
  });

  // ===========================================================================
  // 2. Storage Bucket & Surface Limit Enforcement
  // ===========================================================================
  describe('2. Surface Upload Limits & Validation', () => {
    const pipeline = new MediaPipeline();

    it('enforces maximum size thresholds per surface', () => {
      expect(SURFACE_LIMITS.post.maxBytes).toBe(50 * 1024 * 1024);
      expect(SURFACE_LIMITS.story.maxBytes).toBe(25 * 1024 * 1024);
      expect(SURFACE_LIMITS.reel.maxBytes).toBe(500 * 1024 * 1024);
      expect(SURFACE_LIMITS.product.maxBytes).toBe(20 * 1024 * 1024);
      expect(SURFACE_LIMITS.podcast.maxBytes).toBe(2 * 1024 * 1024 * 1024);
    });

    it('validates uploads strictly within limits and permitted kinds', () => {
      // Valid post image
      const validPost = pipeline.validateUpload('image', 'post', 5 * 1024 * 1024);
      expect(validPost.valid).toBe(true);
      expect(validPost.errors).toHaveLength(0);

      // Oversized post
      const oversizedPost = pipeline.validateUpload('image', 'post', 60 * 1024 * 1024);
      expect(oversizedPost.valid).toBe(false);
      expect(oversizedPost.errors[0]).toContain('exceeds post limit');

      // Invalid kind on reel (reels allow only video)
      const invalidReel = pipeline.validateUpload('image', 'reel', 1024);
      expect(invalidReel.valid).toBe(false);
      expect(invalidReel.errors[0]).toContain('image is not allowed on reel');
    });
  });

  // ===========================================================================
  // 3. Aspect Ratio Clamping & Anti-CLS Framing
  // ===========================================================================
  describe('3. Aspect Ratio Intelligence & Anti-CLS Framing', () => {
    it('accurately bounds photo containers between 4:5 (0.8) and 16:9 (1.78)', () => {
      // Normal 1:1 square
      const square = computeSinglePhotoContainerStyle(1000, 1000);
      expect(square.aspectRatio).toBe('1 / 1');
      expect(square.needsAmbientBackdrop).toBe(false);

      // Normal 4:5 portrait
      const portrait = computeSinglePhotoContainerStyle(800, 1000);
      expect(portrait.aspectRatio).toBe('4 / 5');
      expect(portrait.needsAmbientBackdrop).toBe(false);

      // Normal 16:9 landscape
      const landscape = computeSinglePhotoContainerStyle(1920, 1080);
      expect(landscape.aspectRatio).toBe('16 / 9');
      expect(landscape.needsAmbientBackdrop).toBe(false);

      // Extreme tall (e.g. 9:16 = 0.5625) is clamped to 4:5 (0.8) with ambient backdrop enabled
      const extremeTall = computeSinglePhotoContainerStyle(1080, 1920);
      expect(extremeTall.clampedRatio).toBe(0.8);
      expect(extremeTall.needsAmbientBackdrop).toBe(true);

      // Extreme wide (e.g. 21:9 = 2.33) is clamped to 16:9 with ambient backdrop enabled
      const extremeWide = computeSinglePhotoContainerStyle(2100, 900);
      expect(extremeWide.clampedRatio).toBeCloseTo(16 / 9, 2);
      expect(extremeWide.needsAmbientBackdrop).toBe(true);
    });

    it('computes video container styling with 16:9 default and clamped bounds', () => {
      const defaultVideo = computeVideoContainerStyle();
      expect(defaultVideo.aspectRatio).toBe('16 / 9');
      expect(defaultVideo.needsAmbientBackdrop).toBe(false);

      const verticalReel = computeVideoContainerStyle('9:16');
      expect(verticalReel.clampedRatio).toBe(0.8);
      expect(verticalReel.needsAmbientBackdrop).toBe(true);
    });

    it('resolves carousel anchor ratio from the first image in set', () => {
      const anchor = getCarouselAnchorRatio([1080], [1080], ['1:1']);
      expect(anchor).toBe('1 / 1');
    });
  });

  // ===========================================================================
  // 4. Carousel, Lightbox & Video Player Navigation Math
  // ===========================================================================
  describe('4. Carousel & Lightbox Navigation Mathematics', () => {
    it('clamps carousel slides safely at index boundaries', () => {
      expect(clampSlideIndex(0, 5)).toBe(0);
      expect(clampSlideIndex(4, 5)).toBe(4);
      expect(clampSlideIndex(-1, 5)).toBe(0);
      expect(clampSlideIndex(99, 5)).toBe(4);
      expect(getNextSlideIndex(2, 5)).toBe(3);
      expect(getNextSlideIndex(4, 5)).toBe(4); // Does not overshoot end
      expect(getPrevSlideIndex(0, 5)).toBe(0); // Does not undershoot start
    });

    it('calculates active slide index from touch scroll position', () => {
      expect(calculateActiveSlideIndex(0, 400, 3)).toBe(0);
      expect(calculateActiveSlideIndex(390, 400, 3)).toBe(1);
      expect(calculateActiveSlideIndex(780, 400, 3)).toBe(2);
    });

    it('wraps lightbox viewer navigation indefinitely in loop', () => {
      expect(wrapViewerIndex(0, 3)).toBe(0);
      expect(wrapViewerIndex(2, 3)).toBe(2);
      expect(wrapViewerIndex(3, 3)).toBe(0); // Loops forward to beginning
      expect(wrapViewerIndex(-1, 3)).toBe(2); // Loops backward to end
      expect(getNextViewerIndex(2, 3)).toBe(0);
      expect(getPrevViewerIndex(0, 3)).toBe(2);
    });

    it('clamps zoom level between 1x and 4x', () => {
      expect(clampZoomLevel(0.5)).toBe(1);
      expect(clampZoomLevel(2.5)).toBe(2.5);
      expect(clampZoomLevel(10)).toBe(4);
    });

    it('clamps pan position strictly within viewport bounds when zoomed', () => {
      // Zoom 1x resets pan to (0, 0)
      expect(clampPanPosition({ x: 50, y: 50 }, 1)).toEqual({ x: 0, y: 0 });

      // Zoom 2x on 1000x800 container allows max pan of +/- 500 x +/- 400
      const clamped = clampPanPosition({ x: 9999, y: -9999 }, 2, { width: 1000, height: 800 });
      expect(clamped.x).toBe(500);
      expect(clamped.y).toBe(-400);
    });

    it('formats video timestamps and computes seek time correctly', () => {
      expect(formatVideoTime(0)).toBe('0:00');
      expect(formatVideoTime(45)).toBe('0:45');
      expect(formatVideoTime(75)).toBe('1:15');
      expect(formatVideoTime(3665)).toBe('1:01:05');

      expect(calculateSeekTime(0.5, 120)).toBe(60);
      expect(calculateSeekTime(0, 120)).toBe(0);
      expect(calculateSeekTime(1, 120)).toBe(120);
    });
  });

  // ===========================================================================
  // 5. Global Audio Manager Single-Master Policy
  // ===========================================================================
  describe('5. Global Audio Manager Single-Master Policy', () => {
    it('pauses currently playing sound when a new audio source claims master playback', () => {
      const pauseTrack1 = vi.fn();
      const muteTrack1 = vi.fn();
      const pauseTrack2 = vi.fn();
      const muteTrack2 = vi.fn();

      AudioManager.register('podcast-ep-1', { onPause: pauseTrack1, onMute: muteTrack1, kind: 'podcast' });
      AudioManager.register('sound-track-2', { onPause: pauseTrack2, onMute: muteTrack2, kind: 'sound' });

      // Podcast 1 starts playing
      AudioManager.claimAudio('podcast-ep-1', 'podcast');
      expect(AudioManager.getActiveSource()).toBe('podcast-ep-1');
      expect(AudioManager.getActiveKind()).toBe('podcast');

      // Sound 2 starts playing — must trigger pause on Podcast 1
      AudioManager.claimAudio('sound-track-2', 'sound');
      expect(pauseTrack1).toHaveBeenCalledTimes(1);
      expect(AudioManager.getActiveSource()).toBe('sound-track-2');
      expect(AudioManager.getActiveKind()).toBe('sound');
    });

    it('notifies subscribers upon audio release or complete stop', () => {
      const listener = vi.fn();
      const unsubscribe = AudioManager.subscribe(listener);

      AudioManager.claimAudio('feed-video-99', 'feed_video');
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          activeSource: 'feed-video-99',
          activeKind: 'feed_video',
        })
      );

      AudioManager.releaseAudio('feed-video-99');
      expect(AudioManager.getActiveSource()).toBeNull();

      unsubscribe();
    });
  });
});
