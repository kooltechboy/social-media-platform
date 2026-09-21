# TUKUBI Intelligent Multi-Ratio Media & Video Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement TUKUBI's intelligent multi-ratio media pipeline and superior video rendering engine, standardizing on 4:5 for feed posts while natively preserving 1:1, 4:3, 3:4, 16:9, and 9:16 across feeds, carousels, and fullscreen viewers with zero layout shift.

**Architecture:** We standardize design tokens in `@caribbean/design-system` and media utility calculations in `@caribbean/media`. At ingestion, `UniversalComposer` extracts intrinsic dimensions and video posters, persisting them to `public.post_media`. The feed renders single photos in fluid clamped containers, multi-photos in an Instagram-grade swipeable carousel, and videos with single-audio orchestration, instant poster frames, and fluid aspect ratios.

**Tech Stack:** Next.js 15 App Router, React 19, Tailwind CSS v4, `@caribbean/design-system`, `@caribbean/media`, Lucide React, Vitest.

**Spec:** [`docs/superpowers/specs/2026-09-20-image-ratio-pipeline-design.md`](file:///c:/Users/Owner/Desktop/social%20media%20platform/docs/superpowers/specs/2026-09-20-image-ratio-pipeline-design.md)

## Global Constraints
- Core Axiom: TUKUBI should never sacrifice the user's photograph merely to make every feed card the same shape. The container can be consistent; the photograph doesn't have to be.
- Single photo feed clamp: min `16:9` (landscape), max `4:5` (portrait default recommendation).
- Multi-photo carousel: anchor container to first slide's ratio; support swipe gesture (`scroll-snap-type: x mandatory`), active pill pagination (`#FF7A59`), and `1/N` counter.
- Video: single-audio master singleton (only one audio track playing at once), sub-200ms poster frame start, no forced square cropping, IntersectionObserver auto-play/pause.
- Zero Cumulative Layout Shift (0.00 CLS) using known container aspect ratios.
- Fullscreen viewer: uncompressed 100vw/100vh display, pinch-to-zoom (up to 4×), carousel continuity.

---

### Task 1: Canonical Aspect Ratio Tokens & Media Clamp Utilities

**Files:**
- Modify: `packages/design-system/src/index.ts`
- Modify: `packages/media/src/media-utils.ts`
- Test: `tests/unit/media-aspect-ratios.test.ts`

**Interfaces:**
- Consumes: None
- Produces:
  - `ASPECT_RATIOS` and `RECOMMENDED_MEDIA_DIMENSIONS` in `@caribbean/design-system`
  - `classifyAspectRatio(width: number, height: number): ImageDimensions`
  - `getClampedAspectRatio(aspectRatio: number, minRatio?: number, maxRatio?: number): { clampedRatio: number; isClamped: boolean; cssAspectRatio: string }`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/media-aspect-ratios.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:unit tests/unit/media-aspect-ratios.test.ts`
Expected: FAIL due to missing tokens or signature mismatch.

- [ ] **Step 3: Implement tokens in `@caribbean/design-system` and update `packages/media/src/media-utils.ts`**

Update `packages/design-system/src/index.ts`:
```typescript
export const ASPECT_RATIOS = {
  feedDefault: '4 / 5',
  square: '1 / 1',
  landscape: '16 / 9',
  camera: '4 / 3',
  cameraPortrait: '3 / 4',
  reels: '9 / 16',
  cover: '16 / 5',
} as const;

export const RECOMMENDED_MEDIA_DIMENSIONS = {
  feedDefault: { width: 1080, height: 1350 },
  square: { width: 1080, height: 1080 },
  landscape: { width: 1920, height: 1080 },
  camera: { width: 1440, height: 1080 },
  cameraPortrait: { width: 1080, height: 1440 },
  reels: { width: 1080, height: 1920 },
  avatar: { width: 512, height: 512 },
  cover: { width: 1920, height: 600 },
} as const;
```

Update `packages/media/src/media-utils.ts`:
Enhance `getClampedAspectRatio` to default `minRatio = 0.8` (4:5) and `maxRatio = 16 / 9` (approx 1.777), returning structured clamp details:
```typescript
export function getClampedAspectRatio(
  aspectRatio: number,
  minRatio: number = 0.8, // 4:5
  maxRatio: number = 16 / 9 // 16:9
): { clampedRatio: number; isClamped: boolean; cssAspectRatio: string } {
  if (isNaN(aspectRatio) || aspectRatio <= 0) {
    return { clampedRatio: 1.0, isClamped: false, cssAspectRatio: '1 / 1' };
  }
  const isClamped = aspectRatio < minRatio || aspectRatio > maxRatio;
  const clampedRatio = Math.min(Math.max(aspectRatio, minRatio), maxRatio);

  let cssAspectRatio = `${Math.round(clampedRatio * 100) / 100}`;
  if (Math.abs(clampedRatio - 0.8) < 0.02) cssAspectRatio = '4 / 5';
  else if (Math.abs(clampedRatio - 1) < 0.02) cssAspectRatio = '1 / 1';
  else if (Math.abs(clampedRatio - 16 / 9) < 0.02) cssAspectRatio = '16 / 9';
  else if (Math.abs(clampedRatio - 4 / 3) < 0.02) cssAspectRatio = '4 / 3';
  else if (Math.abs(clampedRatio - 3 / 4) < 0.02) cssAspectRatio = '3 / 4';

  return { clampedRatio, isClamped, cssAspectRatio };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test:unit tests/unit/media-aspect-ratios.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/design-system/src/index.ts packages/media/src/media-utils.ts tests/unit/media-aspect-ratios.test.ts
git commit -m "feat(media): canonical aspect ratio tokens and fluid clamping utility"
```

---

### Task 2: Upload Ingestion & Video Poster Generation in Composer

**Files:**
- Modify: `apps/web/src/components/universal-composer.tsx`
- Modify: `apps/web/src/lib/social/actions.ts`
- Test: `tests/unit/composer-media-ingestion.test.ts`

**Interfaces:**
- Consumes: `normalizeExifAndCompressImage` from `@caribbean/media`
- Produces:
  - Video poster extraction Blob utility: `extractVideoPosterFrame(file: File): Promise<{ posterBlob: Blob; width: number; height: number; duration: number }>`
  - Pass structured `media_items` JSON array with `{ url, width, height, aspectRatio, type, posterUrl }` in `createPostAction` form data and insert into `public.post_media`.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/composer-media-ingestion.test.ts
import { describe, it, expect } from 'vitest';
import { parseMediaPayload } from '../../apps/web/src/lib/social/actions';

describe('Media Payload Parsing & Ingestion', () => {
  it('parses both legacy string URLs and structured media metadata objects', () => {
    const rawLegacy = JSON.stringify(['https://cdn.tukubi.com/photo1.jpg']);
    const legacyParsed = parseMediaPayload(rawLegacy);
    expect(legacyParsed).toHaveLength(1);
    expect(legacyParsed[0].url).toBe('https://cdn.tukubi.com/photo1.jpg');

    const rawStructured = JSON.stringify([
      {
        url: 'https://cdn.tukubi.com/photo2.jpg',
        width: 1080,
        height: 1350,
        aspectRatio: '4:5',
        type: 'image',
      },
    ]);
    const structuredParsed = parseMediaPayload(rawStructured);
    expect(structuredParsed).toHaveLength(1);
    expect(structuredParsed[0].width).toBe(1080);
    expect(structuredParsed[0].height).toBe(1350);
    expect(structuredParsed[0].aspectRatio).toBe('4:5');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:unit tests/unit/composer-media-ingestion.test.ts`
Expected: FAIL (missing `parseMediaPayload`)

- [ ] **Step 3: Implement `parseMediaPayload` in `apps/web/src/lib/social/actions.ts` and update `UniversalComposer`**

In `apps/web/src/lib/social/actions.ts`:
Export `parseMediaPayload(raw: unknown)` that handles string arrays and structured metadata arrays.
In `createPostAction`:
Persist rows into `public.post_media` if available, and embed structured media details into returned post data.

In `apps/web/src/components/universal-composer.tsx`:
Add client helper `extractVideoPosterFrame(videoFile: File)`:
Creates an offscreen video element, seeks to 0.1s, paints to canvas, and generates a WebP/JPEG thumbnail Blob. Upload this poster to `post-media` bucket alongside the video, recording `posterUrl` and dimensions.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test:unit tests/unit/composer-media-ingestion.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/social/actions.ts apps/web/src/components/universal-composer.tsx tests/unit/composer-media-ingestion.test.ts
git commit -m "feat(composer): capture video poster frames and structured media metadata"
```

---

### Task 3: Fluid Clamped Single-Photo Container with Zero-CLS in `TukubiImage` & `TukubiGallery`

**Files:**
- Modify: `apps/web/src/components/ui/tukubi-image.tsx`
- Modify: `apps/web/src/components/media/tukubi-gallery.tsx`
- Test: `tests/unit/tukubi-gallery-single-photo.test.ts`

**Interfaces:**
- Consumes: `getClampedAspectRatio` from `@caribbean/media`
- Produces:
  - `TukubiImage` with ambient blurred letterbox backdrop when `isClamped`
  - `TukubiGallery` single photo rendering with fluid aspect ratio container clamped between 16:9 and 4:5

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/tukubi-gallery-single-photo.test.ts
import { describe, it, expect } from 'vitest';
import { computeSinglePhotoContainerStyle } from '../../apps/web/src/components/media/tukubi-gallery';

describe('Single Photo Gallery Rendering', () => {
  it('computes correct CSS aspect ratio for 4:5 portrait photo', () => {
    const style = computeSinglePhotoContainerStyle(1080, 1350);
    expect(style.aspectRatio).toBe('4 / 5');
    expect(style.needsAmbientBackdrop).toBe(false);
  });

  it('computes correct CSS aspect ratio for 4:3 iPhone landscape photo', () => {
    const style = computeSinglePhotoContainerStyle(1440, 1080);
    expect(style.aspectRatio).toBe('4 / 3');
    expect(style.needsAmbientBackdrop).toBe(false);
  });

  it('clamps extreme 9:16 vertical image to 4:5 with ambient backdrop flag', () => {
    const style = computeSinglePhotoContainerStyle(1080, 1920);
    expect(style.aspectRatio).toBe('4 / 5');
    expect(style.needsAmbientBackdrop).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:unit tests/unit/tukubi-gallery-single-photo.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement fluid container logic and ambient backdrop in `TukubiGallery` and `TukubiImage`**

In `apps/web/src/components/media/tukubi-gallery.tsx`:
Export `computeSinglePhotoContainerStyle(width?: number, height?: number, aspectRatio?: number | string)`.
Update single photo rendering:
```tsx
const containerStyle = computeSinglePhotoContainerStyle(mediaItem.width, mediaItem.height);
<div
  className="relative w-full rounded-2xl overflow-hidden border border-white/10 shadow-lg group cursor-pointer"
  style={{ aspectRatio: containerStyle.aspectRatio }}
  onClick={() => openViewer(0)}
>
  {/* Ambient blurred backdrop if image exceeds ergonomic clamp */}
  {containerStyle.needsAmbientBackdrop && (
    <div
      className="absolute inset-0 bg-cover bg-center filter blur-xl opacity-40 scale-110 pointer-events-none"
      style={{ backgroundImage: `url(${url})` }}
      aria-hidden="true"
    />
  )}
  <TukubiImage
    src={url}
    alt={altText}
    fill
    objectFit="contain"
    className="w-full h-full relative z-10"
    imageClassName="object-contain w-full h-full"
  />
</div>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test:unit tests/unit/tukubi-gallery-single-photo.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/ui/tukubi-image.tsx apps/web/src/components/media/tukubi-gallery.tsx tests/unit/tukubi-gallery-single-photo.test.ts
git commit -m "feat(gallery): fluid clamped container and ambient backdrop for single photos"
```

---

### Task 4: Instagram-Grade Multi-Photo Carousel Engine

**Files:**
- Modify: `apps/web/src/components/media/tukubi-gallery.tsx`
- Test: `tests/unit/tukubi-gallery-carousel.test.ts`

**Interfaces:**
- Consumes: `TukubiImage`, `TukubiMediaViewer`
- Produces:
  - Swipeable multi-photo carousel with active coral pill pagination and slide counter (`1/N`)
  - Optional toggle to grid view

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/tukubi-gallery-carousel.test.ts
import { describe, it, expect } from 'vitest';
import { getCarouselAnchorRatio } from '../../apps/web/src/components/media/tukubi-gallery';

describe('Multi-Photo Carousel Logic', () => {
  it('locks carousel ratio to the first photo aspect ratio clamped between 16:9 and 4:5', () => {
    // First photo is 4:5
    expect(getCarouselAnchorRatio([1080], [1350])).toBe('4 / 5');
    // First photo is 1:1
    expect(getCarouselAnchorRatio([1080], [1080])).toBe('1 / 1');
    // First photo is 16:9
    expect(getCarouselAnchorRatio([1920], [1080])).toBe('16 / 9');
    // Default fallback when no dimensions available
    expect(getCarouselAnchorRatio([], [])).toBe('4 / 5');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:unit tests/unit/tukubi-gallery-carousel.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement Carousel Component in `TukubiGallery`**

In `apps/web/src/components/media/tukubi-gallery.tsx`:
Export `getCarouselAnchorRatio`.
Implement horizontal swipe carousel when `mediaUrls.length > 1`:
- Container uses `aspectRatio: getCarouselAnchorRatio(...)`.
- Scroll track with `flex overflow-x-auto snap-x snap-mandatory scrollbar-none`.
- Each slide has `min-w-full w-full h-full snap-center relative`.
- Floating left/right navigation arrows with frosted backdrop.
- Pagination indicator dots at bottom center: active slide renders as an expanded pill with Caribbean Sunrise Coral (`bg-brand-sunriseCoral w-4 h-1.5 rounded-full transition-all`).
- Top-right frosted pill with slide counter: `activeSlide + 1 / totalSlides`.
- Clicking slide triggers `openViewer(activeSlide)`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test:unit tests/unit/tukubi-gallery-carousel.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/media/tukubi-gallery.tsx tests/unit/tukubi-gallery-carousel.test.ts
git commit -m "feat(gallery): instagram-grade swipeable multi-photo carousel with pagination pills"
```

---

### Task 5: Superior Video Player with Single-Audio Master & Sub-200ms Startup

**Files:**
- Modify: `apps/web/src/components/media/tukubi-video-player.tsx`
- Create: `apps/web/src/lib/media/audio-manager.ts`
- Test: `tests/unit/tukubi-video-player.test.ts`

**Interfaces:**
- Consumes: `AudioManager`
- Produces:
  - `AudioManager`: Global singleton orchestrating single active audio playback across feed
  - `TukubiVideoPlayer`: Viewport auto-play/pause, sub-200ms poster transition, fluid aspect ratio, hairline micro-scrubber, double-tap heart gesture

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/tukubi-video-player.test.ts
import { describe, it, expect, vi } from 'vitest';
import { AudioManager } from '../../apps/web/src/lib/media/audio-manager';

describe('AudioManager Singleton', () => {
  it('ensures only one video plays audio at any time', () => {
    const manager = AudioManager.getInstance();
    const mute1 = vi.fn();
    const mute2 = vi.fn();

    manager.register('video-1', mute1);
    manager.register('video-2', mute2);

    manager.claimAudio('video-1');
    expect(manager.getActiveSource()).toBe('video-1');

    // Video 2 claims audio -> video 1 must be muted
    manager.claimAudio('video-2');
    expect(mute1).toHaveBeenCalled();
    expect(manager.getActiveSource()).toBe('video-2');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:unit tests/unit/tukubi-video-player.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `AudioManager` and elevate `TukubiVideoPlayer`**

Create `apps/web/src/lib/media/audio-manager.ts`:
Singleton managing active audio source and global session sound preference.

In `apps/web/src/components/media/tukubi-video-player.tsx`:
1. Use `aspectRatio` property or intrinsic detection to prevent unwanted cropping (`object-contain` or fluid ratio).
2. Wire `AudioManager` so unmuting one video immediately mutes any previously playing media.
3. Add IntersectionObserver auto-play when $\ge 50\%$ in view (muted).
4. Instant poster frame display with twilight gradient shimmer until `onLoadedData`.
5. Hairline micro-scrubber at bottom edge with seek preview.
6. Double-tap gesture handler showing animated heart burst.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test:unit tests/unit/tukubi-video-player.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/media/audio-manager.ts apps/web/src/components/media/tukubi-video-player.tsx tests/unit/tukubi-video-player.test.ts
git commit -m "feat(video): audio manager singleton, fluid ratio playback, and micro-scrubber"
```

---

### Task 6: Uncompromised Fullscreen Lightbox in `TukubiMediaViewer`

**Files:**
- Modify: `apps/web/src/components/media/tukubi-media-viewer.tsx`
- Test: `tests/unit/tukubi-media-viewer.test.ts`

**Interfaces:**
- Consumes: `TukubiImage`, `TukubiVideoPlayer`
- Produces:
  - Full-resolution uncropped lightbox with multi-touch pinch/zoom (up to 4×), carousel continuity, desktop filmstrip, and swipe-down dismiss

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/tukubi-media-viewer.test.ts
import { describe, it, expect } from 'vitest';
import { clampZoomLevel } from '../../apps/web/src/components/media/tukubi-media-viewer';

describe('Fullscreen Lightbox Zoom & Bounds', () => {
  it('clamps zoom level between 1x and 4x', () => {
    expect(clampZoomLevel(0.5)).toBe(1);
    expect(clampZoomLevel(2.5)).toBe(2.5);
    expect(clampZoomLevel(6)).toBe(4);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:unit tests/unit/tukubi-media-viewer.test.ts`
Expected: FAIL

- [ ] **Step 3: Elevate `TukubiMediaViewer`**

In `apps/web/src/components/media/tukubi-media-viewer.tsx`:
Export `clampZoomLevel(zoom: number)`.
Enhance viewer:
- Display source file uncropped in `100vw / 100vh` (`object-contain`).
- Double-tap toggle between 1× and 2× zoom.
- Swipe down on mobile to dismiss.
- Add bottom filmstrip preview for multi-photo posts on desktop.
- Keyboard navigation (ArrowLeft, ArrowRight, Esc).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test:unit tests/unit/tukubi-media-viewer.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/media/tukubi-media-viewer.tsx tests/unit/tukubi-media-viewer.test.ts
git commit -m "feat(viewer): uncropped full-resolution lightbox with filmstrip and gestural zoom"
```

---

### Task 7: Full Monorepo Typecheck & Feed Verification

**Files:**
- Test all unit tests
- Run monorepo typecheck

- [ ] **Step 1: Run all unit tests**

Run: `pnpm test:unit`
Expected: All tests pass.

- [ ] **Step 2: Run typecheck**

Run: `pnpm turbo run typecheck`
Expected: Zero TypeScript errors across `@caribbean/design-system`, `@caribbean/media`, and `apps/web`.

- [ ] **Step 3: Commit and push**

```bash
git commit --allow-empty -m "chore: verify multi-ratio media pipeline and test coverage"
```
