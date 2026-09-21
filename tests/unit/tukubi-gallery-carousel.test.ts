import { describe, it, expect } from 'vitest';
import {
  getCarouselAnchorRatio,
  clampSlideIndex,
  getNextSlideIndex,
  getPrevSlideIndex,
  calculateActiveSlideIndex,
} from '../../apps/web/src/components/media/tukubi-gallery';

describe('TukubiGallery Carousel - getCarouselAnchorRatio', () => {
  it('returns "4 / 5" when first item is 4:5 portrait (1080x1350)', () => {
    const ratio = getCarouselAnchorRatio([1080, 1920], [1350, 1080]);
    expect(ratio).toBe('4 / 5');
  });

  it('returns "1 / 1" when first item is square (1080x1080)', () => {
    const ratio = getCarouselAnchorRatio([1080, 1920], [1080, 1080]);
    expect(ratio).toBe('1 / 1');
  });

  it('returns "16 / 9" when first item is 16:9 landscape (1920x1080)', () => {
    const ratio = getCarouselAnchorRatio([1920, 1080], [1080, 1080]);
    expect(ratio).toBe('16 / 9');
  });

  it('clamps 9:16 vertical screenshot (1080x1920) to "4 / 5"', () => {
    const ratio = getCarouselAnchorRatio([1080, 1920], [1920, 1080]);
    expect(ratio).toBe('4 / 5');
  });

  it('clamps 21:9 ultra-wide panorama (2560x1080) to "16 / 9"', () => {
    const ratio = getCarouselAnchorRatio([2560, 1080], [1080, 1080]);
    expect(ratio).toBe('16 / 9');
  });

  it('defaults to "4 / 5" when empty, undefined, or missing dimensions', () => {
    expect(getCarouselAnchorRatio()).toBe('4 / 5');
    expect(getCarouselAnchorRatio([], [])).toBe('4 / 5');
    expect(getCarouselAnchorRatio([undefined], [undefined])).toBe('4 / 5');
    expect(getCarouselAnchorRatio([0], [0])).toBe('4 / 5');
  });

  it('resolves string aspect ratios from aspectRatios array', () => {
    expect(getCarouselAnchorRatio(undefined, undefined, ['1:1'])).toBe('1 / 1');
    expect(getCarouselAnchorRatio(undefined, undefined, ['16/9'])).toBe('16 / 9');
    expect(getCarouselAnchorRatio(undefined, undefined, ['4:5'])).toBe('4 / 5');
    expect(getCarouselAnchorRatio(undefined, undefined, ['9:16'])).toBe('4 / 5');
    expect(getCarouselAnchorRatio(undefined, undefined, ['21:9'])).toBe('16 / 9');
  });

  it('resolves numeric aspect ratios directly', () => {
    expect(getCarouselAnchorRatio(undefined, undefined, [1.0])).toBe('1 / 1');
    expect(getCarouselAnchorRatio(undefined, undefined, [16 / 9])).toBe('16 / 9');
    expect(getCarouselAnchorRatio(undefined, undefined, [0.8])).toBe('4 / 5');
  });
});

describe('TukubiGallery Carousel - Slide Navigation & Index Bounds', () => {
  describe('clampSlideIndex', () => {
    it('clamps negative indices to 0', () => {
      expect(clampSlideIndex(-1, 5)).toBe(0);
      expect(clampSlideIndex(-10, 3)).toBe(0);
    });

    it('clamps indices exceeding total slides to totalSlides - 1', () => {
      expect(clampSlideIndex(5, 5)).toBe(4);
      expect(clampSlideIndex(10, 3)).toBe(2);
    });

    it('returns exact index when within valid range', () => {
      expect(clampSlideIndex(0, 4)).toBe(0);
      expect(clampSlideIndex(2, 4)).toBe(2);
      expect(clampSlideIndex(3, 4)).toBe(3);
    });

    it('handles 0 or negative totalSlides gracefully', () => {
      expect(clampSlideIndex(0, 0)).toBe(0);
      expect(clampSlideIndex(2, -1)).toBe(0);
    });
  });

  describe('getNextSlideIndex and getPrevSlideIndex', () => {
    it('advances index forward until the last slide', () => {
      const total = 4;
      expect(getNextSlideIndex(0, total)).toBe(1);
      expect(getNextSlideIndex(1, total)).toBe(2);
      expect(getNextSlideIndex(2, total)).toBe(3);
      expect(getNextSlideIndex(3, total)).toBe(3); // Already at last slide
    });

    it('retreats index backward until the first slide', () => {
      const total = 4;
      expect(getPrevSlideIndex(3, total)).toBe(2);
      expect(getPrevSlideIndex(2, total)).toBe(1);
      expect(getPrevSlideIndex(1, total)).toBe(0);
      expect(getPrevSlideIndex(0, total)).toBe(0); // Already at first slide
    });
  });

  describe('calculateActiveSlideIndex', () => {
    it('calculates the active index based on scroll position and container width', () => {
      const slideWidth = 400;
      const total = 5;

      expect(calculateActiveSlideIndex(0, slideWidth, total)).toBe(0);
      expect(calculateActiveSlideIndex(150, slideWidth, total)).toBe(0); // < half slide -> slide 0
      expect(calculateActiveSlideIndex(220, slideWidth, total)).toBe(1); // > half slide -> slide 1
      expect(calculateActiveSlideIndex(400, slideWidth, total)).toBe(1);
      expect(calculateActiveSlideIndex(800, slideWidth, total)).toBe(2);
      expect(calculateActiveSlideIndex(1200, slideWidth, total)).toBe(3);
      expect(calculateActiveSlideIndex(1600, slideWidth, total)).toBe(4);
    });

    it('clamps over-scrolling positions within bounds', () => {
      const slideWidth = 400;
      const total = 3;

      expect(calculateActiveSlideIndex(-100, slideWidth, total)).toBe(0);
      expect(calculateActiveSlideIndex(2000, slideWidth, total)).toBe(2);
    });

    it('returns 0 when slideWidth or total is invalid', () => {
      expect(calculateActiveSlideIndex(100, 0, 3)).toBe(0);
      expect(calculateActiveSlideIndex(100, 400, 0)).toBe(0);
    });
  });
});
