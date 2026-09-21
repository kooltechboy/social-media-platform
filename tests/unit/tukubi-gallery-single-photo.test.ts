import { describe, it, expect } from 'vitest';
import { computeSinglePhotoContainerStyle } from '../../apps/web/src/components/media/tukubi-gallery';

describe('TukubiGallery - computeSinglePhotoContainerStyle', () => {
  it('handles 4:5 portrait (1080x1350) without ambient backdrop', () => {
    const res = computeSinglePhotoContainerStyle(1080, 1350);
    expect(res.aspectRatio).toBe('4 / 5');
    expect(res.needsAmbientBackdrop).toBe(false);
    expect(res.clampedRatio).toBeCloseTo(0.8, 2);
  });

  it('handles 4:3 camera landscape (1440x1080) without ambient backdrop', () => {
    const res = computeSinglePhotoContainerStyle(1440, 1080);
    expect(res.aspectRatio).toBe('4 / 3');
    expect(res.needsAmbientBackdrop).toBe(false);
    expect(res.clampedRatio).toBeCloseTo(4 / 3, 2);
  });

  it('handles 16:9 landscape (1920x1080) without ambient backdrop', () => {
    const res = computeSinglePhotoContainerStyle(1920, 1080);
    expect(res.aspectRatio).toBe('16 / 9');
    expect(res.needsAmbientBackdrop).toBe(false);
    expect(res.clampedRatio).toBeCloseTo(16 / 9, 2);
  });

  it('handles 1:1 square (1080x1080) without ambient backdrop', () => {
    const res = computeSinglePhotoContainerStyle(1080, 1080);
    expect(res.aspectRatio).toBe('1 / 1');
    expect(res.needsAmbientBackdrop).toBe(false);
    expect(res.clampedRatio).toBeCloseTo(1.0, 2);
  });

  it('clamps 9:16 vertical screenshot (1080x1920) to 4:5 and enables ambient backdrop', () => {
    const res = computeSinglePhotoContainerStyle(1080, 1920);
    expect(res.aspectRatio).toBe('4 / 5');
    expect(res.needsAmbientBackdrop).toBe(true);
    expect(res.clampedRatio).toBeCloseTo(0.8, 2);
  });

  it('clamps 21:9 panorama (2560x1080) to 16:9 and enables ambient backdrop', () => {
    const res = computeSinglePhotoContainerStyle(2560, 1080);
    expect(res.aspectRatio).toBe('16 / 9');
    expect(res.needsAmbientBackdrop).toBe(true);
    expect(res.clampedRatio).toBeCloseTo(16 / 9, 2);
  });

  it('defaults to 4:5 when dimensions/aspectRatio are missing or invalid', () => {
    const resEmpty = computeSinglePhotoContainerStyle();
    expect(resEmpty.aspectRatio).toBe('4 / 5');
    expect(resEmpty.needsAmbientBackdrop).toBe(false);
    expect(resEmpty.clampedRatio).toBe(0.8);

    const resZero = computeSinglePhotoContainerStyle(0, 0);
    expect(resZero.aspectRatio).toBe('4 / 5');
    expect(resZero.needsAmbientBackdrop).toBe(false);
    expect(resZero.clampedRatio).toBe(0.8);
  });

  it('parses string aspect ratio values correctly', () => {
    // Colon format
    const resColon = computeSinglePhotoContainerStyle(undefined, undefined, '16:9');
    expect(resColon.aspectRatio).toBe('16 / 9');
    expect(resColon.needsAmbientBackdrop).toBe(false);

    // Slash format
    const resSlash = computeSinglePhotoContainerStyle(undefined, undefined, '4/5');
    expect(resSlash.aspectRatio).toBe('4 / 5');
    expect(resSlash.needsAmbientBackdrop).toBe(false);

    // Extreme portrait string
    const resExtreme = computeSinglePhotoContainerStyle(undefined, undefined, '9:16');
    expect(resExtreme.aspectRatio).toBe('4 / 5');
    expect(resExtreme.needsAmbientBackdrop).toBe(true);

    // Float string
    const resFloat = computeSinglePhotoContainerStyle(undefined, undefined, '1.333');
    expect(resFloat.aspectRatio).toBe('4 / 3');
    expect(resFloat.needsAmbientBackdrop).toBe(false);
  });

  it('parses numeric aspect ratio values directly', () => {
    const resNum = computeSinglePhotoContainerStyle(undefined, undefined, 1.777777);
    expect(resNum.aspectRatio).toBe('16 / 9');
    expect(resNum.needsAmbientBackdrop).toBe(false);

    const resClamped = computeSinglePhotoContainerStyle(undefined, undefined, 0.5);
    expect(resClamped.aspectRatio).toBe('4 / 5');
    expect(resClamped.needsAmbientBackdrop).toBe(true);
  });
});
