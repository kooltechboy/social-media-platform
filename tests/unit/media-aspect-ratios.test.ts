import { describe, it, expect } from 'vitest';
import { classifyAspectRatio, getClampedAspectRatio } from '../../packages/media/src/media-utils';
import { ASPECT_RATIOS, RECOMMENDED_MEDIA_DIMENSIONS } from '../../packages/design-system/src/index';

describe('Media Aspect Ratios & Design Tokens', () => {
  it('exports canonical TUKUBI aspect ratios and recommended pixel dimensions', () => {
    expect(ASPECT_RATIOS.feedDefault).toBe('4 / 5');
    expect(ASPECT_RATIOS.square).toBe('1 / 1');
    expect(ASPECT_RATIOS.landscape).toBe('16 / 9');
    expect(ASPECT_RATIOS.camera).toBe('4 / 3');
    expect(ASPECT_RATIOS.cameraPortrait).toBe('3 / 4');
    expect(ASPECT_RATIOS.reels).toBe('9 / 16');

    expect(RECOMMENDED_MEDIA_DIMENSIONS.feedDefault).toEqual({ width: 1080, height: 1350 });
    expect(RECOMMENDED_MEDIA_DIMENSIONS.square).toEqual({ width: 1080, height: 1080 });
    expect(RECOMMENDED_MEDIA_DIMENSIONS.landscape).toEqual({ width: 1920, height: 1080 });
  });

  it('correctly clamps aspect ratio between 16:9 and 4:5', () => {
    // 4:3 (1.33) is within bounds (0.8 to 1.777)
    const standardPhoto = getClampedAspectRatio(4 / 3);
    expect(standardPhoto.isClamped).toBe(false);
    expect(standardPhoto.clampedRatio).toBeCloseTo(1.33, 2);

    // 9:16 (0.5625) is taller than 4:5 (0.8), so it clamps to 0.8
    const tallStory = getClampedAspectRatio(9 / 16);
    expect(tallStory.isClamped).toBe(true);
    expect(tallStory.clampedRatio).toBeCloseTo(0.8, 2);
    expect(tallStory.cssAspectRatio).toBe('4 / 5');

    // 21:9 (2.33) is wider than 16:9 (1.777), so it clamps to 16:9
    const ultraWide = getClampedAspectRatio(21 / 9);
    expect(ultraWide.isClamped).toBe(true);
    expect(ultraWide.clampedRatio).toBeCloseTo(16 / 9, 2);
    expect(ultraWide.cssAspectRatio).toBe('16 / 9');
  });
});
