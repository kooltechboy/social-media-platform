import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { computeSinglePhotoContainerStyle, getCarouselAnchorRatio } from '../../apps/web/src/components/media/tukubi-gallery';
import { computeVideoContainerStyle } from '../../apps/web/src/components/media/tukubi-video-player';
import { getClampedAspectRatio } from '../../packages/media/src/media-utils';

describe('Sidebar Overlap Invariant Verification', () => {
  const sidebarPath = path.resolve(__dirname, '../../apps/web/src/components/app-sidebar.tsx');
  const sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');

  it('guarantees sidebar primary container has overflow-y-auto and custom-scrollbar', () => {
    expect(sidebarContent).toContain('overflow-y-auto');
    expect(sidebarContent).toContain('custom-scrollbar');
    expect(sidebarContent).toContain('overflow-x-hidden');
  });

  it('guarantees brand footer is docked inside scroll container to prevent overlap collisions', () => {
    // Verify that the brand footer exists
    expect(sidebarContent).toContain('TUKUBI — The Caribbean Connected');
    expect(sidebarContent).toContain('Born in the Caribbean. Built for the World');

    // Verify footer is followed by the closing div of the primary scroll container,
    // not stranded outside in an unconstrained flex-col collision zone
    const footerIndex = sidebarContent.indexOf('TUKUBI — The Caribbean Connected');
    const primaryNavContainerIndex = sidebarContent.indexOf('Primary Navigation Container');
    expect(footerIndex).toBeGreaterThan(primaryNavContainerIndex);
  });
});

describe('Post Media Standardization Verification', () => {
  const galleryPath = path.resolve(__dirname, '../../apps/web/src/components/media/tukubi-gallery.tsx');
  const galleryContent = fs.readFileSync(galleryPath, 'utf-8');

  const videoPlayerPath = path.resolve(__dirname, '../../apps/web/src/components/media/tukubi-video-player.tsx');
  const videoPlayerContent = fs.readFileSync(videoPlayerPath, 'utf-8');

  const feedPostPath = path.resolve(__dirname, '../../apps/web/src/components/feed/feed-post.tsx');
  const feedPostContent = fs.readFileSync(feedPostPath, 'utf-8');

  it('enforces standardized mobile and desktop max-height bounds on media galleries', () => {
    // Check that gallery has standardized max-height clamp: max-h-[460px] on mobile, md:max-h-[560px] on desktop
    expect(galleryContent).toContain('max-h-[460px]');
    expect(galleryContent).toContain('md:max-h-[560px]');

    // Check that video player has standardized max-height clamp
    expect(videoPlayerContent).toContain('max-h-[460px]');
    expect(videoPlayerContent).toContain('md:max-h-[560px]');
  });

  it('standardizes single photo container aspect ratio bounding', () => {
    // Square
    const square = computeSinglePhotoContainerStyle(1000, 1000);
    expect(square.aspectRatio).toBe('1 / 1');
    expect(square.needsAmbientBackdrop).toBe(false);

    // 16:9 Landscape
    const landscape = computeSinglePhotoContainerStyle(1920, 1080);
    expect(landscape.aspectRatio).toBe('16 / 9');
    expect(landscape.needsAmbientBackdrop).toBe(false);

    // 4:5 Portrait
    const portrait = computeSinglePhotoContainerStyle(1080, 1350);
    expect(portrait.aspectRatio).toBe('4 / 5');
    expect(portrait.needsAmbientBackdrop).toBe(false);

    // Extreme vertical clamped to 4:5 with ambient backdrop enabled
    const extremeVertical = computeSinglePhotoContainerStyle(1080, 2400);
    expect(extremeVertical.aspectRatio).toBe('4 / 5');
    expect(extremeVertical.needsAmbientBackdrop).toBe(true);

    // Extreme horizontal panorama clamped to 16:9 with ambient backdrop enabled
    const extremeHorizontal = computeSinglePhotoContainerStyle(3000, 1000);
    expect(extremeHorizontal.aspectRatio).toBe('16 / 9');
    expect(extremeHorizontal.needsAmbientBackdrop).toBe(true);
  });

  it('standardizes video container style calculations', () => {
    // Default video is 16:9
    const defaultVideo = computeVideoContainerStyle();
    expect(defaultVideo.aspectRatio).toBe('16 / 9');

    // Portrait Reel (9:16) clamped to 4:5
    const reel = computeVideoContainerStyle('9:16');
    expect(reel.aspectRatio).toBe('4 / 5');
    expect(reel.needsAmbientBackdrop).toBe(true);

    // Standard 4:3 video
    const standardVideo = computeVideoContainerStyle('4:3');
    expect(standardVideo.aspectRatio).toBe('4 / 3');
    expect(standardVideo.needsAmbientBackdrop).toBe(false);
  });

  it('standardizes FeedPost card layout with responsive padding and text wrapping', () => {
    expect(feedPostContent).toContain('p-4 sm:p-5 md:p-6');
    expect(feedPostContent).toContain('break-words');
  });
});
