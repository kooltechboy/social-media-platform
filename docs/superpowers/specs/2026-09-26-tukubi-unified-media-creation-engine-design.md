# TUKUBI Unified Media Creation Engine & Camera Specification

## 1. Overview & Objective
This specification establishes the **TUKUBI Unified Media Creation Engine** (Sub-Project 1 of the 100% Production Maturity Master Plan). 

It consolidates and replaces fragmented camera and media capture implementations across TUKUBI into a single, high-performance, NASA-grade creation engine. It powers **Photo Capture**, **Video Recording**, and **Reels Short-Form Creation** with client-side canvas composition, multi-clip timeline editing, Web Audio dual-track sound mixing, resilient device/permission handling, and direct-to-storage upload pipelines.

---

## 2. Architectural Structure

```
packages/media/src/creation/
├── types.ts                    # Creation modes, permission states, clip and edit interfaces
├── camera-manager.ts           # Hardware enumeration, stream negotiation, torch, track lifecycle
├── clip-recorder.ts            # Multi-segment MediaRecorder coordinator with duration budgets
├── audio-mixer.ts              # Web Audio API dual-gain graph (mic vs Caribbean rhythm stem)
├── canvas-compositor.ts        # Client-side 2D canvas compositor (filters, crop, text overlays)
└── index.ts                    # Public export barrel

apps/web/src/components/media/creation/
├── tukubi-creation-studio.tsx  # Unified full-screen creation studio (Capture -> Edit -> Publish)
├── studio-viewfinder.tsx       # Live camera viewport, segmented progress bar, camera flip, torch
├── photo-editor.tsx            # Non-destructive crop, rotate, Caribbean filters, granular sliders
├── video-timeline-editor.tsx   # Multi-clip timeline trimmer, speed, text overlays, cover scrubber
├── audio-mixer-panel.tsx       # Dual-track volume mixer, Caribbean stem selector
└── index.ts                    # Re-exports
```

---

## 3. Detailed Component Specifications

### 3.1 Headless Core (`packages/media/src/creation/`)

#### 3.1.1 State & Types (`types.ts`)
```typescript
export type CreationMode = 'photo' | 'video' | 'reel';

export type CameraPermissionState =
  | 'UNKNOWN'
  | 'REQUESTING'
  | 'GRANTED'
  | 'DENIED'
  | 'BLOCKED'
  | 'UNAVAILABLE'
  | 'NO_DEVICE'
  | 'DEVICE_IN_USE';

export interface RecordedClip {
  id: string;
  blob: Blob;
  previewUrl: string;
  durationMs: number;
  trimStartMs: number;
  trimEndMs: number;
  speed: 0.5 | 1.0 | 1.5 | 2.0;
  order: number;
}

export interface PhotoEditState {
  crop: { x: number; y: number; width: number; height: number };
  aspectRatio: 'free' | '1:1' | '4:5' | '9:16' | '16:9';
  rotationDeg: 0 | 90 | 180 | 270;
  flipHorizontal: boolean;
  filter: 'none' | 'caribbean_warmth' | 'golden_hour' | 'twilight_purple' | 'sea_clarity' | 'monochrome';
  brightness: number; // -50 to +50
  contrast: number;   // -50 to +50
  saturation: number; // -50 to +50
  altText: string;
}

export interface VideoEditState {
  clips: RecordedClip[];
  selectedSoundId?: string;
  selectedSoundTitle?: string;
  selectedSoundUrl?: string;
  soundVolume: number; // 0 to 100
  micVolume: number;   // 0 to 100
  activeFilter: string;
  textOverlays: Array<{
    id: string;
    text: string;
    startMs: number;
    endMs: number;
    position: { x: number; y: number };
    fontSize: number;
    color: string;
    backgroundColor?: string;
  }>;
  coverTimestampMs: number;
}
```

#### 3.1.2 Camera Hardware Manager (`camera-manager.ts`)
* **Device Enumeration**: Queries `navigator.mediaDevices.enumerateDevices()` to separate video input devices from audio input devices.
* **Resolution Negotiation**: Attempts 1080p (`1080x1920` vertical for reels, `1920x1080` landscape), falls back to 720p, then 640x480.
* **Track Lifecycle**: When switching between front and rear cameras (`facingMode: 'user' | 'environment'`), all existing video tracks are stopped immediately to release hardware locks.
* **Torch Control**: Queries `track.getCapabilities().torch` and applies `track.applyConstraints({ advanced: [{ torch: boolean }] })`.

#### 3.1.3 Multi-Segment Clip Recorder (`clip-recorder.ts`)
* **MIME Support**: Checks `MediaRecorder.isTypeSupported` in priority order:
  1. `video/webm;codecs=vp9,opus`
  2. `video/webm;codecs=vp8,opus`
  3. `video/webm`
  4. `video/mp4`
* **Duration Enforcer**: Tracks elapsed milliseconds in real-time. Automatically pauses/stops recording when reaching the allocated budget (e.g. 15s, 30s, 60s, or 90s for Reels).
* **Multi-Take Support**: Emits immutable `RecordedClip` objects with preview URLs, supporting discard, reordering, and re-recording.

#### 3.1.4 Web Audio Dual-Track Mixer (`audio-mixer.ts`)
* **Audio Graph**:
  * Source 1: Microphone stream from camera / external mic -> `micGainNode`.
  * Source 2: Caribbean rhythm stem audio element / buffer -> `stemGainNode`.
  * Output: Combined into a `MediaStreamAudioDestinationNode` for recording export.
* **Zero-Latency Monitoring**: Allows the creator to hear the rhythm stem while recording video without mic feedback.

#### 3.1.5 Client-Side Canvas Compositor (`canvas-compositor.ts`)
* **Photo Processing**: Applies non-destructive affine matrix transformations (rotation, flip, crop) and GL/Canvas color matrix filters (Caribbean Warmth, Golden Hour, Twilight Purple, Sea Clarity, Monochrome).
* **Video Frame Composition**: Renders video frames sequentially into an offscreen canvas with text badges, transitions, and audio sync, capturing final output via `canvas.captureStream(30)`.
* **Poster Extraction**: Extracts frame at `coverTimestampMs` and encodes to high-efficiency WebP.

---

### 3.2 UI Studio Viewport (`apps/web/src/components/media/creation/`)

#### 3.2.1 Unified Studio (`tukubi-creation-studio.tsx`)
* Top-level modal/viewport offering three clear steps:
  1. **Capture Mode**: Live camera viewfinder, device switcher, countdown timer, sound selector, multi-clip progress bar, and "Upload from Device" fallback.
  2. **Edit Mode**:
     * Photo: Interactive crop/rotation controls, filter presets, sliders, and alt-text input.
     * Video/Reel: Segmented timeline scrubber with trim handles, clip reordering, audio volume mixer, text overlays, and cover scrubber.
  3. **Handoff Mode**: Seamless transition to `UniversalComposer` or direct `publishReelAction` with direct-to-storage upload and progress indicators.

---

## 4. Database & Storage Architecture

1. **Storage Buckets**:
   * `post-media`: Images, compressed WebP outputs, and alt-text metadata.
   * `videos`: Exported MP4/WebM video files.
   * `thumbnails`: Video cover frames encoded in WebP.
2. **Database Integration**:
   * Uses existing `public.media_assets` table with `stage = 'ready'`.
   * Inserts into `public.videos` for Reels with real counters initialized to 0 (`view_count = 0`, `likes_count = 0`, `comments_count = 0`).
   * When a Caribbean sound is attached, creates a record in `public.sound_usage`.
3. **RLS & Security**:
   * All mutations restricted to authenticated user (`auth.uid() = creator_id`).
   * Maximum video file size enforced at 500MB; maximum photo size at 25MB.

---

## 5. Accessibility & Error Recovery (WCAG 2.2 AA)
1. **ARIA Live Regions**: Live announcements for recording status, elapsed time, and countdowns.
2. **Keyboard Ergonomics**: Full spacebar control for recording/playback; arrow keys for timeline scrubbing; Escape for cancellation with unsaved changes dialog.
3. **Hardware Recovery**: Friendly step-by-step guidance for blocked camera permissions and automatic fallback to file picker when no camera is present.

---

## 6. Verification & Test Plan
1. **Unit Tests (`tests/media-creation-engine.test.ts`)**:
   * Camera permission transitions and error handling.
   * Clip duration budgeting, trimming calculations, and speed multipliers.
   * Audio mixer dual-gain math.
2. **UI Integration Tests**:
   * Full photo capture -> filter apply -> export loop.
   * Multi-clip recording -> trim -> reorder -> Web Audio mix -> export.
   * Direct-to-storage upload progress and database record verification.
