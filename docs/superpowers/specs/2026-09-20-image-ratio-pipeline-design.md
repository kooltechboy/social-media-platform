# Specification: TUKUBI Intelligent Multi-Ratio Media & Video Architecture

- **Date:** 2026-09-20
- **Status:** Approved / In Progress
- **Authors:** Caribbean Engineering Principal & Product Architecture
- **System:** TUKUBI Caribbean Digital Ecosystem (`apps/web`, `apps/mobile`, `packages/media`, `packages/design-system`)

---

## 1. Executive Summary & Core Philosophy

TUKUBI establishes a first-in-class media presentation system built around a core design axiom:

> **"TUKUBI should never sacrifice the user's photograph merely to make every feed card the same shape. The container can be consistent; the photograph doesn't have to be."**

Rather than coercing every uploaded image into a rigid box—cropping faces, truncating panoramic scenery, or applying harsh black letterboxing—TUKUBI follows an **intelligent preservation pipeline**:
```
Upload → Preserve Original Composition → Generate Optimized Variants → Intelligent Surface Display
```

---

## 2. Canonical Aspect Ratio & Pixel Hierarchy

TUKUBI standardizes on **4:5 as the primary recommendation for main feed photography and videos** (maximizing mobile screen estate and visual impact), while providing first-class native support for all major camera aspect ratios.

| Surface / Use Case | Aspect Ratio | Recommended Resolution | Behavior |
| :--- | :--- | :--- | :--- |
| **Feed Photo — Default Recommendation** | **4:5** | **1080 × 1350 px** | Occupies optimal vertical screen space on mobile; crisp on desktop. |
| **Square Photo** | **1:1** | **1080 × 1080 px** | Classic social square; rendered edge-to-edge in container. |
| **Landscape Photo** | **16:9** | **1920 × 1080 px** | Panoramic/landscape; fluid container clamps vertically. |
| **Standard Camera Photo** | **4:3** | **1440 × 1080 px** | iPhone & digital camera default; uncropped framing preserved. |
| **Portrait Camera Photo** | **3:4** | **1080 × 1440 px** | Native vertical smartphone shots; crisp vertical display. |
| **Stories / Reels / Moments** | **9:16** | **1080 × 1920 px** | Immersive full-screen mobile viewport. |
| **Profile / Avatar** | **1:1** | **512 × 512+ px** | Circular/rounded square mask with face-center focal crop. |
| **Page / Profile Cover** | **~16:5** | **1920 × 600 px** | Adaptive responsive banner with ambient gradient fallback. |

### Video Specifications
- **Feed Video:** Native **4:5** (vertical creator clips) or **16:9** (widescreen/cinematic clips).
- **Reels / Moments:** Native **9:16** full-screen.
- **Live Streams:** **16:9** widescreen broadcast with adaptive mobile portrait presentation.

---

## 3. Feed Presentation Engine

### 3.1 Single-Photo Fluid Native Container (Zero CLS)
For single-photo feed posts:
1. **Fluid Clamped Bounding**: The container dynamically adopts the image's intrinsic ratio:
   $$\text{clampedRatio} = \max\left(\frac{16}{9}, \min\left(\text{ratio}, \frac{4}{5}\right)\right)$$
   - Photos between `16:9` (landscape) and `4:5` (portrait) render in their 100% natural shape with zero cropping and zero letterboxing.
   - For photos exceeding these ergonomic bounds (e.g. extreme 21:9 panoramas or tall 9:16 document screenshots), the container clamps to the safe boundary and centers the image (`object-fit: contain`) with an ambient Caribbean twilight blurred backdrop.
2. **Zero Cumulative Layout Shift (0.00 CLS)**:
   - Because dimensions are known and sent with the feed payload, the feed item sets CSS `aspect-ratio: <ratio>` on the container prior to network image fetch. Layout shift is completely eliminated.

### 3.2 Multi-Photo Engine (Instagram-Grade Carousel + Multi-Grid)
When a post contains 2 to 10 photos:
1. **Primary Feed Experience — Smooth Horizontal Carousel**:
   - **Aspect Ratio Anchoring**: The carousel container locks its viewport to the **first photo's aspect ratio** (recommended 4:5 or 1:1, clamped between 16:9 and 4:5).
   - **Slide Alignment**: Matching-ratio images fill the slides edge-to-edge. Dissimilar ratios are centered uncropped with subtle ambient blurred edge fill.
   - **Hardware-Accelerated Controls**:
     - Mobile: Fluid touch swipe with CSS scroll-snapping (`scroll-snap-type: x mandatory`).
     - Desktop: Floating chevron navigation arrows on hover.
     - Indicators: Active pagination pills in Caribbean Sunrise Coral (`#FF7A59`) and top-right frosted glass counter (`1/4`).
     - Tapping any slide opens the lightbox viewer starting at that exact index.
2. **Secondary Multi-Photo Presentation — Collage Mode**:
   - 2 photos: Side-by-side balanced 4:3 split.
   - 3 photos: 1 prominent hero + 2 stacked companion tiles.
   - 4 photos: Balanced 2×2 grid.
   - 5+ photos: Hero tile + 3 bottom tiles with `+N More` overlay badge.

---

## 4. High-Performance Video Rendering (Surpassing Industry Standards)

TUKUBI addresses the key deficiencies in competitor video players (clashing sound, forced cropping, blank start screens):

1. **Sub-200ms Playback & Zero Black Frames**:
   - Client captures and uploads a first-frame JPEG poster during ingestion.
   - The player displays this poster immediately beneath a Caribbean twilight pulse shimmer while the video stream prepares.
   - Video buffers via HTTP byte-range requests and HLS (`.m3u8`) streaming without downloading entire multi-megabyte payloads before playing.
2. **Feed Audio & Viewport Orchestration**:
   - **IntersectionObserver Autoplay**: Videos autoplay muted when $\ge 50\%$ visible in viewport; auto-pauses instantly when scrolled off-screen.
   - **Single Audio Master**: Unmuting any post immediately mutes or pauses any other playing audio on the page.
   - **Global Audio Persistence**: When a user unmutes a video, the sound preference persists as they scroll to subsequent videos in that session.
3. **Tactile Controls & Gestures**:
   - **Hairline Micro-Scrubber**: Clean progress line along the bottom border. Hover/touch reveals a precision timestamp and seek bar without covering video content.
   - **Double-Tap Interaction**: Double-tapping the video bursts an animated Caribbean Coral heart.
   - **Picture-in-Picture (PiP)**: One-tap transition to native floating PiP.

---

## 5. Fullscreen Viewer (`TukubiMediaViewer`)

When a user taps any photo or video in the feed:
- **100% Original Preservation**: Displays the uncompressed, uncropped source asset in `100vw / 100vh` (`object-fit: contain`).
- **Pinch-to-Zoom & Pan**: Up to 4× optical-quality zoom on mobile and desktop mouse-wheel zoom. Drag-and-pan navigation allows inspecting fine details.
- **Carousel Continuity**: Maintains position from the feed carousel. Swiping left/right navigates adjacent photos.
- **Desktop Filmstrip**: Bottom thumbnail strip for multi-photo albums for instant thumbnail jumping.
- **Swipe-Down Dismissal**: Mobile swipe-down gesture smoothly dismisses the lightbox with spring physics.

---

## 6. Data Model & Zero-CLS Ingestion Pipeline

### 6.1 Database Schema (`public.post_media`)
Validated against Supabase migration `00088_media_storage_and_aspect_ratio.sql`:
```sql
CREATE TABLE IF NOT EXISTS public.post_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    media_type VARCHAR(20) DEFAULT 'image', -- 'image' | 'video'
    aspect_ratio VARCHAR(10),              -- e.g. '4:5', '16:9', '4:3', '1:1'
    width INTEGER,                         -- e.g. 1080
    height INTEGER,                        -- e.g. 1350
    thumbnail_url TEXT,                    -- Poster or preview thumbnail
    blurhash TEXT,                         -- Blurred placeholder hash
    position INTEGER DEFAULT 0,            -- Carousel slide order
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_post_media_post_pos 
ON public.post_media(post_id, position);
```

### 6.2 Ingestion Flow
1. User selects media in `UniversalComposer`.
2. `normalizeExifAndCompressImage` normalizes EXIF rotation, compresses oversized inputs (preserving up to 2560px), and computes `width`, `height`, and `aspectRatio`.
3. For video, client generates first-frame poster Blob and extracts duration & dimensions.
4. Assets are uploaded to Supabase `post-media` bucket.
5. Server action `createPostAction` inserts post record and associates structured `post_media` rows, enabling zero-CLS rendering in feed queries.

---

## 7. Verification & Testing Strategy

1. **Unit Tests**:
   - Test aspect ratio classification and clamping (`16:9` to `4:5`) in `packages/media`.
   - Test carousel index state and boundary clamping in `TukubiGallery`.
   - Test sound orchestration singleton (single audio source).
2. **Visual & Layout Verification**:
   - Verify single-photo posts in 4:5, 1:1, 4:3, and 16:9 render with zero clipping and zero layout shift.
   - Verify multi-photo posts render smooth horizontal swiping carousel with indicator dots.
   - Verify video autoplay on $\ge 50\%$ viewport visibility and pause on scroll away.
   - Verify lightbox viewer pinch-to-zoom and uncropped view.
