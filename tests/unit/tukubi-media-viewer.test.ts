import { describe, it, expect } from 'vitest';
import {
  clampZoomLevel,
  clampPanPosition,
  wrapViewerIndex,
  getNextViewerIndex,
  getPrevViewerIndex,
  calculateSwipeDismiss,
  normalizeViewerMedia,
  toggleDoubleTapZoom,
} from '../../apps/web/src/components/media/tukubi-media-viewer';

describe('TukubiMediaViewer Helper Functions & Logic', () => {
  describe('clampZoomLevel', () => {
    it('clamps values below minimum to 1 by default', () => {
      expect(clampZoomLevel(0.5)).toBe(1);
      expect(clampZoomLevel(0)).toBe(1);
      expect(clampZoomLevel(-2)).toBe(1);
      expect(clampZoomLevel(0.999)).toBe(1);
    });

    it('clamps values above maximum to 4 by default', () => {
      expect(clampZoomLevel(4.1)).toBe(4);
      expect(clampZoomLevel(5)).toBe(4);
      expect(clampZoomLevel(100)).toBe(4);
    });

    it('preserves mid-range zoom levels', () => {
      expect(clampZoomLevel(1)).toBe(1);
      expect(clampZoomLevel(1.5)).toBe(1.5);
      expect(clampZoomLevel(2)).toBe(2);
      expect(clampZoomLevel(3.25)).toBe(3.25);
      expect(clampZoomLevel(4)).toBe(4);
    });

    it('respects custom min and max parameters', () => {
      expect(clampZoomLevel(0.5, 0.8, 3)).toBe(0.8);
      expect(clampZoomLevel(3.5, 0.8, 3)).toBe(3);
      expect(clampZoomLevel(2, 0.8, 3)).toBe(2);
    });
  });

  describe('clampPanPosition', () => {
    it('resets pan to (0, 0) whenever zoom is less than or equal to 1', () => {
      expect(clampPanPosition({ x: 120, y: 80 }, 1)).toEqual({ x: 0, y: 0 });
      expect(clampPanPosition({ x: -250, y: -180 }, 0.8)).toEqual({ x: 0, y: 0 });
      expect(clampPanPosition({ x: 0, y: 0 }, 1)).toEqual({ x: 0, y: 0 });
    });

    it('preserves pan coordinates that fall within boundary bounds when zoomed in', () => {
      // Default container: 1000x800. At 2x zoom: maxX = 500, maxY = 400.
      const pan = { x: 200, y: -150 };
      expect(clampPanPosition(pan, 2)).toEqual({ x: 200, y: -150 });
    });

    it('clamps pan coordinates that exceed container boundaries at given zoom level', () => {
      // Default container: 1000x800. At 2x zoom: maxX = 500, maxY = 400.
      const excessivePan = { x: 750, y: -650 };
      expect(clampPanPosition(excessivePan, 2)).toEqual({ x: 500, y: -400 });

      const negativeExcess = { x: -900, y: 800 };
      expect(clampPanPosition(negativeExcess, 2)).toEqual({ x: -500, y: 400 });
    });

    it('respects custom container dimensions for pan clamping', () => {
      const customContainer = { width: 600, height: 400 };
      // At 3x zoom with 600x400: maxX = (600 * 2) / 2 = 600, maxY = (400 * 2) / 2 = 400.
      expect(clampPanPosition({ x: 800, y: -500 }, 3, customContainer)).toEqual({ x: 600, y: -400 });
      expect(clampPanPosition({ x: 300, y: 200 }, 3, customContainer)).toEqual({ x: 300, y: 200 });
    });
  });

  describe('Index wrapping and navigation bounds', () => {
    it('wrapViewerIndex wraps index around boundaries', () => {
      expect(wrapViewerIndex(0, 3)).toBe(0);
      expect(wrapViewerIndex(1, 3)).toBe(1);
      expect(wrapViewerIndex(2, 3)).toBe(2);
      expect(wrapViewerIndex(3, 3)).toBe(0); // overflow wraps to start
      expect(wrapViewerIndex(4, 3)).toBe(1);
      expect(wrapViewerIndex(-1, 3)).toBe(2); // negative wraps to end
      expect(wrapViewerIndex(-2, 3)).toBe(1);
      expect(wrapViewerIndex(0, 0)).toBe(0);
      expect(wrapViewerIndex(2, -1)).toBe(0);
    });

    it('getNextViewerIndex advances index and wraps from last to first', () => {
      expect(getNextViewerIndex(0, 3)).toBe(1);
      expect(getNextViewerIndex(1, 3)).toBe(2);
      expect(getNextViewerIndex(2, 3)).toBe(0); // wraps
      expect(getNextViewerIndex(0, 1)).toBe(0); // single item does not advance
      expect(getNextViewerIndex(0, 0)).toBe(0);
    });

    it('getPrevViewerIndex reverses index and wraps from first to last', () => {
      expect(getPrevViewerIndex(2, 3)).toBe(1);
      expect(getPrevViewerIndex(1, 3)).toBe(0);
      expect(getPrevViewerIndex(0, 3)).toBe(2); // wraps to last
      expect(getPrevViewerIndex(0, 1)).toBe(0); // single item
      expect(getPrevViewerIndex(0, 0)).toBe(0);
    });
  });

  describe('Swipe-down to dismiss calculations', () => {
    it('handles upward or neutral drag without dismissing or fading', () => {
      const upward = calculateSwipeDismiss(-30, 80);
      expect(upward.shouldDismiss).toBe(false);
      expect(upward.opacity).toBe(1);
      expect(upward.translateY).toBe(0);

      const zero = calculateSwipeDismiss(0, 80);
      expect(zero.shouldDismiss).toBe(false);
      expect(zero.opacity).toBe(1);
      expect(zero.translateY).toBe(0);
    });

    it('fades opacity proportionally during downward drag under threshold', () => {
      const partial = calculateSwipeDismiss(40, 80);
      expect(partial.shouldDismiss).toBe(false);
      expect(partial.translateY).toBe(40);
      expect(partial.opacity).toBeLessThan(1);
      expect(partial.opacity).toBeGreaterThan(0.5);
    });

    it('flags dismissal when drag delta exceeds threshold', () => {
      const dismissed = calculateSwipeDismiss(85, 80);
      expect(dismissed.shouldDismiss).toBe(true);
      expect(dismissed.translateY).toBe(85);
      expect(dismissed.opacity).toBeLessThan(0.7);

      // Deep drag clamped to floor opacity
      const deep = calculateSwipeDismiss(400, 80);
      expect(deep.shouldDismiss).toBe(true);
      expect(deep.translateY).toBe(400);
      expect(deep.opacity).toBe(0.2);
    });
  });

  describe('normalizeViewerMedia', () => {
    it('normalizes string URLs into ViewerMediaItem objects with auto-detected types', () => {
      const raw = [
        'https://example.com/photo.jpg',
        'https://example.com/sunset.mp4',
        'https://example.com/video-feed/123',
      ];
      const normalized = normalizeViewerMedia(raw);

      expect(normalized).toHaveLength(3);
      expect(normalized[0]).toEqual({
        url: 'https://example.com/photo.jpg',
        type: 'image',
      });
      expect(normalized[1]).toEqual({
        url: 'https://example.com/sunset.mp4',
        type: 'video',
      });
      expect(normalized[2]).toEqual({
        url: 'https://example.com/video-feed/123',
        type: 'video',
      });
    });

    it('preserves existing ViewerMediaItem objects and metadata', () => {
      const raw = [
        {
          url: 'https://example.com/art.png',
          type: 'image' as const,
          alt: 'Caribbean Art',
          caption: 'Sunset in Bridgetown',
          width: 1920,
          height: 1080,
        },
        'https://example.com/clip.webm',
      ];
      const normalized = normalizeViewerMedia(raw);

      expect(normalized).toHaveLength(2);
      expect(normalized[0].caption).toBe('Sunset in Bridgetown');
      expect(normalized[0].alt).toBe('Caribbean Art');
      expect(normalized[0].width).toBe(1920);
      expect(normalized[1].type).toBe('video');
    });

    it('handles empty media lists safely', () => {
      expect(normalizeViewerMedia([])).toEqual([]);
    });
  });

  describe('toggleDoubleTapZoom and index persistence', () => {
    it('toggles between 1x and 2x zoom', () => {
      expect(toggleDoubleTapZoom(1)).toBe(2);
      expect(toggleDoubleTapZoom(2)).toBe(1);
      expect(toggleDoubleTapZoom(3.5)).toBe(1);
      expect(toggleDoubleTapZoom(4)).toBe(1);
    });

    it('preserves current index independently when zoom level toggles', () => {
      let activeIndex = 3;
      let currentZoom = 1;

      // User double-taps to zoom in
      currentZoom = toggleDoubleTapZoom(currentZoom);
      expect(currentZoom).toBe(2);
      expect(activeIndex).toBe(3); // index is completely unaffected

      // User zooms out or resets
      currentZoom = toggleDoubleTapZoom(currentZoom);
      expect(currentZoom).toBe(1);
      expect(activeIndex).toBe(3); // index remains intact
    });
  });
});
