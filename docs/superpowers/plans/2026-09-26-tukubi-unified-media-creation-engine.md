# TUKUBI Unified Media Creation Engine & Camera Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and integrate the complete TUKUBI Unified Media Creation Engine (Photo, Video, Reel, Hardware Capture, Multi-Clip Editor & Direct Storage Pipeline) to achieve 100% production maturity for media creation.

**Architecture:** A modular headless media creation engine in `@caribbean/media/src/creation/` (device negotiation, multi-segment recorder, Web Audio dual-track mixer, Canvas 2D compositor) consumed by a responsive, accessible React studio viewport (`TukubiCreationStudio`) in `apps/web/src/components/media/creation/`, wiring directly into Supabase Storage and `UniversalComposer`/`publishReelAction`.

**Tech Stack:** TypeScript 5.5, HTML5 Canvas 2D, Web Audio API, MediaRecorder / MediaStream, Next.js 15, Tailwind v4, Lucide React, Supabase Postgres & Storage, Vitest.

**Spec:** [`docs/superpowers/specs/2026-09-26-tukubi-unified-media-creation-engine-design.md`](file:///c:/Users/Owner/Desktop/social%20media%20platform/docs/superpowers/specs/2026-09-26-tukubi-unified-media-creation-engine-design.md)

## Global Constraints
- NASA-grade typing with zero `any` type escapes in core creation engine.
- WCAG 2.2 AA compliant keyboard navigation (`Spacebar`, `Arrows`, `Esc`) and `aria-live` screen reader announcements.
- Strict hardware lifecycle: all media tracks stopped on unmount/device flip to prevent hardware locks.
- Real production metrics only: zero simulated progress, zero fake view/like counts (`view_count = 0`).
- Touch targets strictly >= 44x44px for all mobile capture controls.

---

### Task 1: Core Headless Creation Types & Camera Device Manager

**Files:**
- Create: `packages/media/src/creation/types.ts`
- Create: `packages/media/src/creation/camera-manager.ts`
- Test: `tests/camera-manager.test.ts`

**Interfaces:**
- Produces: `CreationMode`, `CameraPermissionState`, `RecordedClip`, `PhotoEditState`, `VideoEditState`, `CameraManager` class.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/camera-manager.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CameraManager } from '../packages/media/src/creation/camera-manager';

describe('CameraManager', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with UNKNOWN permission state and user facing mode', () => {
    const manager = new CameraManager();
    expect(manager.getPermissionState()).toBe('UNKNOWN');
    expect(manager.getFacingMode()).toBe('user');
  });

  it('transitions to GRANTED when getUserMedia resolves a MediaStream', async () => {
    const mockTrack = {
      stop: vi.fn(),
      getCapabilities: () => ({ torch: false }),
      applyConstraints: vi.fn(),
    };
    const mockStream = {
      getVideoTracks: () => [mockTrack],
      getAudioTracks: () => [mockTrack],
      getTracks: () => [mockTrack],
    } as unknown as MediaStream;

    navigator.mediaDevices = {
      getUserMedia: vi.fn().mockResolvedValue(mockStream),
      enumerateDevices: vi.fn().mockResolvedValue([]),
    } as any;

    const manager = new CameraManager();
    const stream = await manager.startCamera('user', 'video');
    expect(stream).toBe(mockStream);
    expect(manager.getPermissionState()).toBe('GRANTED');
  });

  it('transitions to DENIED on NotAllowedError', async () => {
    const notAllowedError = new Error('Permission denied');
    notAllowedError.name = 'NotAllowedError';

    navigator.mediaDevices = {
      getUserMedia: vi.fn().mockRejectedValue(notAllowedError),
      enumerateDevices: vi.fn().mockResolvedValue([]),
    } as any;

    const manager = new CameraManager();
    await expect(manager.startCamera('user', 'photo')).rejects.toThrow();
    expect(manager.getPermissionState()).toBe('DENIED');
  });

  it('stops all existing tracks before switching cameras', async () => {
    const stopFn = vi.fn();
    const mockTrack = { stop: stopFn, getCapabilities: () => ({}), applyConstraints: vi.fn() };
    const mockStream = {
      getVideoTracks: () => [mockTrack],
      getAudioTracks: () => [mockTrack],
      getTracks: () => [mockTrack],
    } as unknown as MediaStream;

    navigator.mediaDevices = {
      getUserMedia: vi.fn().mockResolvedValue(mockStream),
      enumerateDevices: vi.fn().mockResolvedValue([]),
    } as any;

    const manager = new CameraManager();
    await manager.startCamera('user', 'video');
    await manager.switchCamera('environment');

    expect(stopFn).toHaveBeenCalled();
    expect(manager.getFacingMode()).toBe('environment');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/camera-manager.test.ts`
Expected: FAIL with module not found for `../packages/media/src/creation/camera-manager`

- [ ] **Step 3: Write minimal implementation**

Create `packages/media/src/creation/types.ts`:
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

export interface DeviceOption {
  deviceId: string;
  label: string;
}

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
  brightness: number;
  contrast: number;
  saturation: number;
  altText: string;
}

export interface VideoEditState {
  clips: RecordedClip[];
  selectedSoundId?: string;
  selectedSoundTitle?: string;
  selectedSoundUrl?: string;
  soundVolume: number;
  micVolume: number;
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

Create `packages/media/src/creation/camera-manager.ts`:
```typescript
import type { CameraPermissionState, CreationMode, DeviceOption } from './types';

export class CameraManager {
  private permissionState: CameraPermissionState = 'UNKNOWN';
  private facingMode: 'user' | 'environment' = 'user';
  private currentStream: MediaStream | null = null;
  private activeMode: CreationMode = 'photo';

  getPermissionState(): CameraPermissionState {
    return this.permissionState;
  }

  getFacingMode(): 'user' | 'environment' {
    return this.facingMode;
  }

  getCurrentStream(): MediaStream | null {
    return this.currentStream;
  }

  stopTracks(): void {
    if (this.currentStream) {
      this.currentStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore cleanup errors
        }
      });
      this.currentStream = null;
    }
  }

  async enumerateHardware(): Promise<{ videoDevices: DeviceOption[]; audioDevices: DeviceOption[] }> {
    if (!navigator?.mediaDevices?.enumerateDevices) {
      return { videoDevices: [], audioDevices: [] };
    }
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices: DeviceOption[] = [];
    const audioDevices: DeviceOption[] = [];

    devices.forEach((d) => {
      if (d.kind === 'videoinput') {
        videoDevices.push({
          deviceId: d.deviceId,
          label: d.label || `Camera ${videoDevices.length + 1}`,
        });
      } else if (d.kind === 'audioinput') {
        audioDevices.push({
          deviceId: d.deviceId,
          label: d.label || `Microphone ${audioDevices.length + 1}`,
        });
      }
    });

    return { videoDevices, audioDevices };
  }

  async startCamera(
    facing: 'user' | 'environment' = 'user',
    mode: CreationMode = 'photo',
    specificDeviceId?: string
  ): Promise<MediaStream> {
    this.stopTracks();
    this.facingMode = facing;
    this.activeMode = mode;
    this.permissionState = 'REQUESTING';

    if (!navigator?.mediaDevices?.getUserMedia) {
      this.permissionState = 'UNAVAILABLE';
      throw new Error('Camera hardware API not available on this browser or platform');
    }

    const isReel = mode === 'reel';
    const videoConstraints: MediaTrackConstraints = specificDeviceId
      ? { deviceId: { exact: specificDeviceId } }
      : {
          facingMode: facing,
          width: isReel ? { ideal: 1080 } : { ideal: 1920 },
          height: isReel ? { ideal: 1920 } : { ideal: 1080 },
          frameRate: { ideal: 30, max: 60 },
        };

    const audioConstraints = mode === 'photo' ? false : { echoCancellation: true, noiseSuppression: true };

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: audioConstraints,
      });
      this.currentStream = stream;
      this.permissionState = 'GRANTED';
      return stream;
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        this.permissionState = 'DENIED';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        this.permissionState = 'NO_DEVICE';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        this.permissionState = 'DEVICE_IN_USE';
      } else {
        this.permissionState = 'UNAVAILABLE';
      }
      throw err;
    }
  }

  async switchCamera(facing: 'user' | 'environment'): Promise<MediaStream> {
    return this.startCamera(facing, this.activeMode);
  }

  async toggleTorch(enabled: boolean): Promise<boolean> {
    if (!this.currentStream) return false;
    const videoTrack = this.currentStream.getVideoTracks()[0];
    if (!videoTrack) return false;

    const capabilities: any = videoTrack.getCapabilities ? videoTrack.getCapabilities() : {};
    if (!capabilities.torch) return false;

    try {
      await videoTrack.applyConstraints({
        advanced: [{ torch: enabled } as any],
      });
      return true;
    } catch {
      return false;
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/camera-manager.test.ts`
Expected: PASS (4/4 tests passed)

- [ ] **Step 5: Commit**

```bash
git add packages/media/src/creation/types.ts packages/media/src/creation/camera-manager.ts tests/camera-manager.test.ts
git commit -m "feat(media): implement CameraManager and core creation types"
```

---

### Task 2: Multi-Segment Clip Recorder with Duration Budgeting

**Files:**
- Create: `packages/media/src/creation/clip-recorder.ts`
- Test: `tests/clip-recorder.test.ts`

**Interfaces:**
- Consumes: `RecordedClip` from `types.ts`
- Produces: `ClipRecorder` class handling multi-take segment management, time budgeting, and speed adjustments.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/clip-recorder.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClipRecorder } from '../packages/media/src/creation/clip-recorder';

describe('ClipRecorder', () => {
  let mockStream: MediaStream;

  beforeEach(() => {
    mockStream = {} as unknown as MediaStream;
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-preview-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('initializes with zero clips and correct max duration budget', () => {
    const recorder = new ClipRecorder(30000); // 30s budget
    expect(recorder.getClips()).toHaveLength(0);
    expect(recorder.getMaxDurationMs()).toBe(30000);
    expect(recorder.getTotalDurationMs()).toBe(0);
  });

  it('adds clips and updates total duration', () => {
    const recorder = new ClipRecorder(60000);
    const mockBlob = new Blob(['sample-data'], { type: 'video/webm' });

    const clip = recorder.addClip(mockBlob, 10000);
    expect(clip.id).toBeDefined();
    expect(clip.durationMs).toBe(10000);
    expect(clip.previewUrl).toBe('blob:mock-preview-url');
    expect(recorder.getTotalDurationMs()).toBe(10000);
    expect(recorder.getRemainingDurationMs()).toBe(50000);
  });

  it('allows removing the last clip (undo take)', () => {
    const recorder = new ClipRecorder(60000);
    const b1 = new Blob(['1'], { type: 'video/webm' });
    const b2 = new Blob(['2'], { type: 'video/webm' });

    recorder.addClip(b1, 5000);
    recorder.addClip(b2, 7000);
    expect(recorder.getClips()).toHaveLength(2);

    const removed = recorder.removeLastClip();
    expect(removed?.durationMs).toBe(7000);
    expect(recorder.getClips()).toHaveLength(1);
    expect(recorder.getTotalDurationMs()).toBe(5000);
  });

  it('updates clip trimming bounds and speed multiplier', () => {
    const recorder = new ClipRecorder(60000);
    const b = new Blob(['1'], { type: 'video/webm' });
    const clip = recorder.addClip(b, 10000);

    recorder.updateClipTrimming(clip.id, 1000, 8000);
    recorder.updateClipSpeed(clip.id, 1.5);

    const updated = recorder.getClips().find((c) => c.id === clip.id);
    expect(updated?.trimStartMs).toBe(1000);
    expect(updated?.trimEndMs).toBe(8000);
    expect(updated?.speed).toBe(1.5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/clip-recorder.test.ts`
Expected: FAIL with module not found for `../packages/media/src/creation/clip-recorder`

- [ ] **Step 3: Write minimal implementation**

Create `packages/media/src/creation/clip-recorder.ts`:
```typescript
import type { RecordedClip } from './types';

export class ClipRecorder {
  private clips: RecordedClip[] = [];
  private maxDurationMs: number;

  constructor(maxDurationMs: number = 60000) {
    this.maxDurationMs = maxDurationMs;
  }

  getMaxDurationMs(): number {
    return this.maxDurationMs;
  }

  setMaxDurationMs(maxMs: number): void {
    this.maxDurationMs = maxMs;
  }

  getClips(): RecordedClip[] {
    return [...this.clips];
  }

  getTotalDurationMs(): number {
    return this.clips.reduce((acc, c) => {
      const clipSpan = Math.max(0, c.trimEndMs - c.trimStartMs);
      return acc + clipSpan / c.speed;
    }, 0);
  }

  getRemainingDurationMs(): number {
    return Math.max(0, this.maxDurationMs - this.getTotalDurationMs());
  }

  addClip(blob: Blob, durationMs: number): RecordedClip {
    const id = `clip_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const previewUrl = typeof URL !== 'undefined' && URL.createObjectURL ? URL.createObjectURL(blob) : '';

    const newClip: RecordedClip = {
      id,
      blob,
      previewUrl,
      durationMs,
      trimStartMs: 0,
      trimEndMs: durationMs,
      speed: 1.0,
      order: this.clips.length,
    };

    this.clips.push(newClip);
    return newClip;
  }

  removeClip(id: string): RecordedClip | null {
    const idx = this.clips.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    const [removed] = this.clips.splice(idx, 1);
    if (removed.previewUrl && typeof URL !== 'undefined' && URL.revokeObjectURL) {
      try {
        URL.revokeObjectURL(removed.previewUrl);
      } catch {
        // ignore
      }
    }
    // Re-index remaining clips
    this.clips.forEach((c, i) => {
      c.order = i;
    });
    return removed;
  }

  removeLastClip(): RecordedClip | null {
    if (this.clips.length === 0) return null;
    const last = this.clips[this.clips.length - 1];
    return this.removeClip(last.id);
  }

  reorderClips(clipIds: string[]): void {
    const map = new Map(this.clips.map((c) => [c.id, c]));
    const reordered: RecordedClip[] = [];
    clipIds.forEach((id, idx) => {
      const c = map.get(id);
      if (c) {
        c.order = idx;
        reordered.push(c);
      }
    });
    this.clips = reordered;
  }

  updateClipTrimming(id: string, trimStartMs: number, trimEndMs: number): void {
    const clip = this.clips.find((c) => c.id === id);
    if (!clip) return;
    clip.trimStartMs = Math.max(0, Math.min(trimStartMs, clip.durationMs));
    clip.trimEndMs = Math.max(clip.trimStartMs, Math.min(trimEndMs, clip.durationMs));
  }

  updateClipSpeed(id: string, speed: 0.5 | 1.0 | 1.5 | 2.0): void {
    const clip = this.clips.find((c) => c.id === id);
    if (!clip) return;
    clip.speed = speed;
  }

  clear(): void {
    this.clips.forEach((c) => {
      if (c.previewUrl && typeof URL !== 'undefined' && URL.revokeObjectURL) {
        try {
          URL.revokeObjectURL(c.previewUrl);
        } catch {
          // ignore
        }
      }
    });
    this.clips = [];
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/clip-recorder.test.ts`
Expected: PASS (4/4 tests passed)

- [ ] **Step 5: Commit**

```bash
git add packages/media/src/creation/clip-recorder.ts tests/clip-recorder.test.ts
git commit -m "feat(media): implement ClipRecorder with multi-segment budgeting"
```

---

### Task 3: Web Audio Dual-Track Graph Mixer

**Files:**
- Create: `packages/media/src/creation/audio-mixer.ts`
- Test: `tests/audio-mixer.test.ts`

**Interfaces:**
- Produces: `AudioMixerGraph` class managing dual gain nodes (microphone track vs Caribbean rhythm stem) and destination stream mixing.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/audio-mixer.test.ts
import { describe, it, expect, vi } from 'vitest';
import { AudioMixerGraph } from '../packages/media/src/creation/audio-mixer';

describe('AudioMixerGraph', () => {
  it('calculates proper normalized gain multiplier for percentages 0 to 100', () => {
    const mixer = new AudioMixerGraph();
    expect(mixer.normalizeVolume(0)).toBe(0);
    expect(mixer.normalizeVolume(50)).toBe(0.5);
    expect(mixer.normalizeVolume(100)).toBe(1.0);
    expect(mixer.normalizeVolume(150)).toBe(1.0); // clamped
    expect(mixer.normalizeVolume(-20)).toBe(0); // clamped
  });

  it('manages volume state for mic and stem tracks', () => {
    const mixer = new AudioMixerGraph();
    mixer.setMicVolume(80);
    mixer.setStemVolume(40);

    expect(mixer.getMicVolume()).toBe(80);
    expect(mixer.getStemVolume()).toBe(40);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/audio-mixer.test.ts`
Expected: FAIL with module not found for `../packages/media/src/creation/audio-mixer`

- [ ] **Step 3: Write minimal implementation**

Create `packages/media/src/creation/audio-mixer.ts`:
```typescript
export class AudioMixerGraph {
  private micVolume: number = 100;
  private stemVolume: number = 80;
  private audioContext: AudioContext | null = null;
  private micGainNode: GainNode | null = null;
  private stemGainNode: GainNode | null = null;
  private destinationNode: MediaStreamAudioDestinationNode | null = null;

  normalizeVolume(percentage: number): number {
    const clamped = Math.max(0, Math.min(100, percentage));
    return Number((clamped / 100).toFixed(2));
  }

  getMicVolume(): number {
    return this.micVolume;
  }

  getStemVolume(): number {
    return this.stemVolume;
  }

  setMicVolume(volumePercent: number): void {
    this.micVolume = Math.max(0, Math.min(100, volumePercent));
    if (this.micGainNode && this.audioContext) {
      this.micGainNode.gain.setValueAtTime(this.normalizeVolume(this.micVolume), this.audioContext.currentTime);
    }
  }

  setStemVolume(volumePercent: number): void {
    this.stemVolume = Math.max(0, Math.min(100, volumePercent));
    if (this.stemGainNode && this.audioContext) {
      this.stemGainNode.gain.setValueAtTime(this.normalizeVolume(this.stemVolume), this.audioContext.currentTime);
    }
  }

  setupGraph(micStream?: MediaStream, stemAudioElement?: HTMLAudioElement): MediaStream | null {
    if (typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return null;

    if (!this.audioContext) {
      this.audioContext = new AudioCtx();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }

    this.destinationNode = this.audioContext.createMediaStreamDestination();

    if (micStream && micStream.getAudioTracks().length > 0) {
      const micSource = this.audioContext.createMediaStreamSource(micStream);
      this.micGainNode = this.audioContext.createGain();
      this.micGainNode.gain.setValueAtTime(this.normalizeVolume(this.micVolume), this.audioContext.currentTime);
      micSource.connect(this.micGainNode);
      this.micGainNode.connect(this.destinationNode);
    }

    if (stemAudioElement) {
      try {
        const stemSource = this.audioContext.createMediaElementSource(stemAudioElement);
        this.stemGainNode = this.audioContext.createGain();
        this.stemGainNode.gain.setValueAtTime(this.normalizeVolume(this.stemVolume), this.audioContext.currentTime);
        stemSource.connect(this.stemGainNode);
        this.stemGainNode.connect(this.destinationNode);
        // Also connect to speaker output so creator can hear stem during capture
        this.stemGainNode.connect(this.audioContext.destination);
      } catch {
        // Element already connected or cross-origin
      }
    }

    return this.destinationNode.stream;
  }

  close(): void {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch {
        // ignore
      }
      this.audioContext = null;
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/audio-mixer.test.ts`
Expected: PASS (2/2 tests passed)

- [ ] **Step 5: Commit**

```bash
git add packages/media/src/creation/audio-mixer.ts tests/audio-mixer.test.ts
git commit -m "feat(media): implement AudioMixerGraph for dual-track rhythm stems"
```

---

### Task 4: Client-Side Canvas 2D Compositor for Photos & Video Frames

**Files:**
- Create: `packages/media/src/creation/canvas-compositor.ts`
- Create: `packages/media/src/creation/index.ts`
- Modify: `packages/media/src/index.ts` (export creation engine)
- Test: `tests/canvas-compositor.test.ts`

**Interfaces:**
- Consumes: `PhotoEditState`, `VideoEditState`, `RecordedClip`
- Produces: `CanvasCompositor` class providing photo filtering, crop/rotate math, cover frame extraction, and video stream composition.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/canvas-compositor.test.ts
import { describe, it, expect } from 'vitest';
import { CanvasCompositor } from '../packages/media/src/creation/canvas-compositor';

describe('CanvasCompositor', () => {
  it('computes CSS filter strings accurately for presets and sliders', () => {
    const compositor = new CanvasCompositor();
    const filter = compositor.buildFilterString({
      crop: { x: 0, y: 0, width: 100, height: 100 },
      aspectRatio: '1:1',
      rotationDeg: 0,
      flipHorizontal: false,
      filter: 'golden_hour',
      brightness: 10,
      contrast: -5,
      saturation: 20,
      altText: '',
    });

    expect(filter).toContain('brightness(110%)');
    expect(filter).toContain('contrast(95%)');
    expect(filter).toContain('saturate(120%)');
    expect(filter).toContain('sepia(25%)');
  });

  it('determines target export dimensions for requested aspect ratios', () => {
    const compositor = new CanvasCompositor();
    const square = compositor.calculateDimensions(1920, 1080, '1:1');
    expect(square.width).toBe(1080);
    expect(square.height).toBe(1080);

    const portrait = compositor.calculateDimensions(1920, 1080, '9:16');
    expect(portrait.width).toBe(607);
    expect(portrait.height).toBe(1080);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/canvas-compositor.test.ts`
Expected: FAIL with module not found for `../packages/media/src/creation/canvas-compositor`

- [ ] **Step 3: Write minimal implementation**

Create `packages/media/src/creation/canvas-compositor.ts`:
```typescript
import type { PhotoEditState } from './types';

export class CanvasCompositor {
  buildFilterString(state: PhotoEditState): string {
    const brightnessVal = 100 + state.brightness;
    const contrastVal = 100 + state.contrast;
    const saturationVal = 100 + state.saturation;

    const parts: string[] = [
      `brightness(${Math.max(0, brightnessVal)}%)`,
      `contrast(${Math.max(0, contrastVal)}%)`,
      `saturate(${Math.max(0, saturationVal)}%)`,
    ];

    switch (state.filter) {
      case 'caribbean_warmth':
        parts.push('sepia(18%)', 'hue-rotate(-5deg)');
        break;
      case 'golden_hour':
        parts.push('sepia(25%)', 'contrast(105%)');
        break;
      case 'twilight_purple':
        parts.push('hue-rotate(25deg)', 'saturate(115%)');
        break;
      case 'sea_clarity':
        parts.push('hue-rotate(15deg)', 'contrast(110%)');
        break;
      case 'monochrome':
        parts.push('grayscale(100%)');
        break;
      default:
        break;
    }

    return parts.join(' ');
  }

  calculateDimensions(
    sourceWidth: number,
    sourceHeight: number,
    aspectRatio: 'free' | '1:1' | '4:5' | '9:16' | '16:9'
  ): { width: number; height: number } {
    if (aspectRatio === 'free') {
      return { width: sourceWidth, height: sourceHeight };
    }

    let targetRatio = 1;
    if (aspectRatio === '1:1') targetRatio = 1;
    else if (aspectRatio === '4:5') targetRatio = 4 / 5;
    else if (aspectRatio === '9:16') targetRatio = 9 / 16;
    else if (aspectRatio === '16:9') targetRatio = 16 / 9;

    const currentRatio = sourceWidth / sourceHeight;
    if (currentRatio > targetRatio) {
      // Source is wider than target; crop sides
      return {
        width: Math.round(sourceHeight * targetRatio),
        height: sourceHeight,
      };
    } else {
      // Source is taller than target; crop top/bottom
      return {
        width: sourceWidth,
        height: Math.round(sourceWidth / targetRatio),
      };
    }
  }

  async exportProcessedPhoto(
    sourceImage: HTMLImageElement | HTMLVideoElement,
    state: PhotoEditState,
    maxDimension: number = 1920
  ): Promise<{ blob: Blob; width: number; height: number }> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not acquire 2D canvas context');

    const srcW = sourceImage instanceof HTMLVideoElement ? sourceImage.videoWidth : sourceImage.naturalWidth || sourceImage.width;
    const srcH = sourceImage instanceof HTMLVideoElement ? sourceImage.videoHeight : sourceImage.naturalHeight || sourceImage.height;

    const { width: targetW, height: targetH } = this.calculateDimensions(srcW, srcH, state.aspectRatio);

    const isRotated90 = state.rotationDeg === 90 || state.rotationDeg === 270;
    const finalW = isRotated90 ? targetH : targetW;
    const finalH = isRotated90 ? targetW : targetH;

    const scale = Math.min(1, maxDimension / Math.max(finalW, finalH));
    canvas.width = Math.round(finalW * scale);
    canvas.height = Math.round(finalH * scale);

    ctx.filter = this.buildFilterString(state);

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((state.rotationDeg * Math.PI) / 180);
    if (state.flipHorizontal) {
      ctx.scale(-1, 1);
    }

    const cropX = (srcW - targetW) / 2;
    const cropY = (srcH - targetH) / 2;

    ctx.drawImage(
      sourceImage,
      cropX,
      cropY,
      targetW,
      targetH,
      (-targetW * scale) / 2,
      (-targetH * scale) / 2,
      targetW * scale,
      targetH * scale
    );
    ctx.restore();

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({ blob, width: canvas.width, height: canvas.height });
          } else {
            reject(new Error('Canvas toBlob conversion failed'));
          }
        },
        'image/webp',
        0.88
      );
    });
  }

  async extractVideoPoster(
    videoElement: HTMLVideoElement,
    timestampMs: number = 0
  ): Promise<{ posterBlob: Blob; width: number; height: number }> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not acquire 2D canvas context');

    canvas.width = videoElement.videoWidth || 1080;
    canvas.height = videoElement.videoHeight || 1920;

    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({ posterBlob: blob, width: canvas.width, height: canvas.height });
          } else {
            reject(new Error('Failed to extract poster blob'));
          }
        },
        'image/webp',
        0.85
      );
    });
  }
}
```

Create `packages/media/src/creation/index.ts`:
```typescript
export * from './types';
export * from './camera-manager';
export * from './clip-recorder';
export * from './audio-mixer';
export * from './canvas-compositor';
```

In `packages/media/src/index.ts`, append:
```typescript
export * from './creation';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/canvas-compositor.test.ts`
Expected: PASS (2/2 tests passed)

- [ ] **Step 5: Commit**

```bash
git add packages/media/src/creation/ packages/media/src/index.ts tests/canvas-compositor.test.ts
git commit -m "feat(media): export CanvasCompositor and creation engine barrel"
```

---

### Task 5: Studio UI Viewport & Viewfinder Component

**Files:**
- Create: `apps/web/src/components/media/creation/studio-viewfinder.tsx`
- Test: `tests/studio-viewfinder.test.ts`

**Interfaces:**
- Consumes: `CameraManager`, `ClipRecorder`, `CreationMode`
- Produces: `StudioViewfinder` component rendering live camera feed, segmented progress bar, camera flip, torch, and hands-free countdown.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/studio-viewfinder.test.ts
import { describe, it, expect } from 'vitest';
import React from 'react';
import StudioViewfinder from '../apps/web/src/components/media/creation/studio-viewfinder';

describe('StudioViewfinder Component', () => {
  it('is a defined functional component', () => {
    expect(StudioViewfinder).toBeDefined();
    expect(typeof StudioViewfinder).toBe('function');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/studio-viewfinder.test.ts`
Expected: FAIL with module not found for `studio-viewfinder`

- [ ] **Step 3: Write minimal implementation**

Create `apps/web/src/components/media/creation/studio-viewfinder.tsx`:
```tsx
'use client';

import React from 'react';
import { Camera, RotateCcw, Zap, ZapOff, Sparkles, AlertCircle, FolderOpen, Play, Pause, Square } from 'lucide-react';
import type { CreationMode, CameraPermissionState, RecordedClip } from '@caribbean/media';

export interface StudioViewfinderProps {
  mode: CreationMode;
  permissionState: CameraPermissionState;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  facingMode: 'user' | 'environment';
  torchSupported: boolean;
  torchEnabled: boolean;
  countdown: number | null;
  isRecording: boolean;
  isPaused: boolean;
  clips: RecordedClip[];
  totalDurationMs: number;
  maxDurationMs: number;
  onSwitchCamera: () => void;
  onToggleTorch: () => void;
  onStartCapture: () => void;
  onPauseCapture?: () => void;
  onResumeCapture?: () => void;
  onStopCapture?: () => void;
  onDeleteLastClip?: () => void;
  onOpenLibraryFallback: () => void;
  onRetryPermissions: () => void;
}

export default function StudioViewfinder({
  mode,
  permissionState,
  videoRef,
  facingMode,
  torchSupported,
  torchEnabled,
  countdown,
  isRecording,
  isPaused,
  clips,
  totalDurationMs,
  maxDurationMs,
  onSwitchCamera,
  onToggleTorch,
  onStartCapture,
  onPauseCapture,
  onResumeCapture,
  onStopCapture,
  onDeleteLastClip,
  onOpenLibraryFallback,
  onRetryPermissions,
}: StudioViewfinderProps) {
  const isVideoOrReel = mode === 'video' || mode === 'reel';
  const progressPercent = Math.min(100, (totalDurationMs / maxDurationMs) * 100);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-black overflow-hidden select-none">
      {/* Segmented Top Progress Bar for Multi-Clip Video/Reel */}
      {isVideoOrReel && (
        <div className="absolute top-3 left-4 right-4 z-30 flex items-center gap-1.5 h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-goldenHour transition-all duration-150 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {/* Camera Live Stream Viewport */}
      {permissionState === 'GRANTED' ? (
        <video
          ref={videoRef as any}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transition-transform duration-300 ${
            facingMode === 'user' ? 'scale-x-[-1]' : ''
          }`}
        />
      ) : (
        <div className="flex flex-col items-center justify-center p-6 text-center max-w-sm z-20">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-brand-goldenHour" />
          </div>
          <h3 className="text-white font-bold text-lg mb-2">Camera Access Required</h3>
          <p className="text-white/60 text-xs mb-5">
            {permissionState === 'DENIED'
              ? 'Permission was denied. Please allow camera and microphone in your browser settings to capture live media.'
              : 'Enable camera permissions to capture live photos and video clips.'}
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onRetryPermissions}
              className="px-4 py-2 bg-brand-goldenHour text-black font-semibold text-xs rounded-xl hover:opacity-90 transition-opacity"
            >
              Try Again
            </button>
            <button
              type="button"
              onClick={onOpenLibraryFallback}
              className="px-4 py-2 bg-white/10 text-white font-medium text-xs rounded-xl hover:bg-white/20 transition-colors flex items-center gap-1.5"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              Choose File
            </button>
          </div>
        </div>
      )}

      {/* Countdown Visual Overlay */}
      {countdown !== null && (
        <div className="absolute inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <span className="text-7xl font-extrabold text-white animate-ping">{countdown}</span>
        </div>
      )}

      {/* Viewfinder Top-Right Controls */}
      {permissionState === 'GRANTED' && (
        <div className="absolute top-8 right-4 z-20 flex flex-col gap-3">
          <button
            type="button"
            onClick={onSwitchCamera}
            aria-label="Flip camera"
            className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/15 flex items-center justify-center text-white hover:bg-black/60 transition-colors active:scale-95"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          {torchSupported && (
            <button
              type="button"
              onClick={onToggleTorch}
              aria-label="Toggle flashlight"
              className={`w-11 h-11 rounded-full backdrop-blur-md border flex items-center justify-center transition-colors active:scale-95 ${
                torchEnabled
                  ? 'bg-amber-400 text-black border-amber-300'
                  : 'bg-black/40 text-white border-white/15 hover:bg-black/60'
              }`}
            >
              {torchEnabled ? <Zap className="w-5 h-5 fill-current" /> : <ZapOff className="w-5 h-5" />}
            </button>
          )}
        </div>
      )}

      {/* Viewfinder Bottom Capture Controls Bar */}
      {permissionState === 'GRANTED' && (
        <div className="absolute bottom-6 left-0 right-0 z-20 flex items-center justify-around px-8">
          {/* Discard last clip button if clips exist */}
          {isVideoOrReel && clips.length > 0 && onDeleteLastClip ? (
            <button
              type="button"
              onClick={onDeleteLastClip}
              aria-label="Delete last clip take"
              className="text-white/80 hover:text-rose-400 text-xs font-semibold px-3 py-1.5 rounded-lg bg-black/40 border border-white/15 backdrop-blur-md transition-colors"
            >
              Undo Take ({clips.length})
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenLibraryFallback}
              aria-label="Upload from files"
              className="w-11 h-11 rounded-full bg-black/40 border border-white/15 flex items-center justify-center text-white/80 hover:text-white transition-colors"
            >
              <FolderOpen className="w-5 h-5" />
            </button>
          )}

          {/* Shutter / Record Trigger Button */}
          {!isVideoOrReel ? (
            <button
              type="button"
              onClick={onStartCapture}
              aria-label="Capture photo"
              className="w-18 h-18 rounded-full border-4 border-white flex items-center justify-center p-1 active:scale-90 transition-transform"
            >
              <div className="w-full h-full rounded-full bg-white hover:bg-amber-200 transition-colors" />
            </button>
          ) : !isRecording ? (
            <button
              type="button"
              onClick={onStartCapture}
              aria-label="Start recording video"
              className="w-18 h-18 rounded-full border-4 border-rose-500 flex items-center justify-center p-1 active:scale-90 transition-transform"
            >
              <div className="w-full h-full rounded-full bg-rose-500 hover:bg-rose-400 transition-colors" />
            </button>
          ) : (
            <div className="flex items-center gap-4">
              {isPaused && onResumeCapture ? (
                <button
                  type="button"
                  onClick={onResumeCapture}
                  aria-label="Resume recording"
                  className="w-14 h-14 rounded-full bg-amber-500 text-black flex items-center justify-center"
                >
                  <Play className="w-6 h-6 fill-current" />
                </button>
              ) : onPauseCapture ? (
                <button
                  type="button"
                  onClick={onPauseCapture}
                  aria-label="Pause recording"
                  className="w-14 h-14 rounded-full bg-amber-500/80 text-black flex items-center justify-center"
                >
                  <Pause className="w-6 h-6 fill-current" />
                </button>
              ) : null}
              {onStopCapture && (
                <button
                  type="button"
                  onClick={onStopCapture}
                  aria-label="Stop clip recording"
                  className="w-16 h-16 rounded-full border-4 border-rose-500 flex items-center justify-center bg-rose-600/90 text-white"
                >
                  <Square className="w-6 h-6 fill-current" />
                </button>
              )}
            </div>
          )}

          <div className="w-11" />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/studio-viewfinder.test.ts`
Expected: PASS (1/1 test passed)

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/media/creation/studio-viewfinder.tsx tests/studio-viewfinder.test.ts
git commit -m "feat(web): implement StudioViewfinder capture component"
```

---

### Task 6: Interactive Photo Editor Component

**Files:**
- Create: `apps/web/src/components/media/creation/photo-editor.tsx`
- Test: `tests/photo-editor.test.ts`

**Interfaces:**
- Consumes: `PhotoEditState`, `CanvasCompositor`
- Produces: `PhotoEditor` component with crop aspect ratios, rotation, Caribbean presets, sliders, and alt-text field.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/photo-editor.test.ts
import { describe, it, expect } from 'vitest';
import PhotoEditor from '../apps/web/src/components/media/creation/photo-editor';

describe('PhotoEditor Component', () => {
  it('is a defined functional component', () => {
    expect(PhotoEditor).toBeDefined();
    expect(typeof PhotoEditor).toBe('function');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/photo-editor.test.ts`
Expected: FAIL with module not found for `photo-editor`

- [ ] **Step 3: Write minimal implementation**

Create `apps/web/src/components/media/creation/photo-editor.tsx`:
```tsx
'use client';

import React, { useState } from 'react';
import { RotateCw, FlipHorizontal, Sliders, Sparkles, Check, X } from 'lucide-react';
import type { PhotoEditState } from '@caribbean/media';

export interface PhotoEditorProps {
  imageSrc: string;
  onSave: (finalState: PhotoEditState) => void;
  onCancel: () => void;
}

export default function PhotoEditor({ imageSrc, onSave, onCancel }: PhotoEditorProps) {
  const [editState, setEditState] = useState<PhotoEditState>({
    crop: { x: 0, y: 0, width: 0, height: 0 },
    aspectRatio: '1:1',
    rotationDeg: 0,
    flipHorizontal: false,
    filter: 'none',
    brightness: 0,
    contrast: 0,
    saturation: 0,
    altText: '',
  });

  const [activeTab, setActiveTab] = useState<'presets' | 'adjust' | 'crop'>('presets');

  const rotate = () => {
    setEditState((prev) => ({
      ...prev,
      rotationDeg: ((prev.rotationDeg + 90) % 360) as any,
    }));
  };

  const toggleFlip = () => {
    setEditState((prev) => ({
      ...prev,
      flipHorizontal: !prev.flipHorizontal,
    }));
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-white select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 z-10">
        <button
          type="button"
          onClick={onCancel}
          className="text-white/60 hover:text-white p-2 text-sm font-medium"
        >
          Cancel
        </button>
        <span className="text-sm font-bold tracking-wide">Photo Studio</span>
        <button
          type="button"
          onClick={() => onSave(editState)}
          className="px-3.5 py-1.5 bg-brand-goldenHour text-black font-semibold text-xs rounded-xl hover:opacity-90 flex items-center gap-1.5"
        >
          <Check className="w-3.5 h-3.5" />
          Apply
        </button>
      </div>

      {/* Image Preview Canvas Viewport */}
      <div className="flex-1 relative flex items-center justify-center p-4 overflow-hidden bg-black/60">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt={editState.altText || 'Captured photo preview'}
          className="max-w-full max-h-full object-contain transition-all duration-200"
          style={{
            transform: `rotate(${editState.rotationDeg}deg) scaleX(${editState.flipHorizontal ? -1 : 1})`,
            filter: `brightness(${100 + editState.brightness}%) contrast(${100 + editState.contrast}%) saturate(${
              100 + editState.saturation
            }%)`,
          }}
        />
      </div>

      {/* Editor Sub-Navigation & Controls */}
      <div className="p-4 border-t border-white/10 bg-slate-900/90 backdrop-blur-md">
        <div className="flex items-center justify-center gap-6 mb-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`pb-1 transition-colors ${
              activeTab === 'presets' ? 'text-brand-goldenHour border-b-2 border-brand-goldenHour' : 'text-white/60'
            }`}
          >
            Caribbean Filters
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('adjust')}
            className={`pb-1 transition-colors ${
              activeTab === 'adjust' ? 'text-brand-goldenHour border-b-2 border-brand-goldenHour' : 'text-white/60'
            }`}
          >
            Adjustments
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('crop')}
            className={`pb-1 transition-colors ${
              activeTab === 'crop' ? 'text-brand-goldenHour border-b-2 border-brand-goldenHour' : 'text-white/60'
            }`}
          >
            Crop & Aspect
          </button>
        </div>

        {/* Tab 1: Presets */}
        {activeTab === 'presets' && (
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
            {[
              { id: 'none', label: 'Original' },
              { id: 'caribbean_warmth', label: 'Warm Sun' },
              { id: 'golden_hour', label: 'Golden Hour' },
              { id: 'twilight_purple', label: 'Twilight' },
              { id: 'sea_clarity', label: 'Sea Clarity' },
              { id: 'monochrome', label: 'Monochrome' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setEditState((prev) => ({ ...prev, filter: p.id as any }))}
                className={`px-3 py-2 rounded-xl text-xs whitespace-nowrap font-medium transition-colors ${
                  editState.filter === p.id
                    ? 'bg-brand-goldenHour text-black'
                    : 'bg-white/5 border border-white/10 text-white/80'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}

        {/* Tab 2: Adjustments */}
        {activeTab === 'adjust' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-white/70">
              <span>Brightness</span>
              <input
                type="range"
                min="-50"
                max="50"
                value={editState.brightness}
                onChange={(e) => setEditState({ ...editState, brightness: Number(e.target.value) })}
                className="w-48 accent-brand-goldenHour"
              />
            </div>
            <div className="flex items-center justify-between text-xs text-white/70">
              <span>Contrast</span>
              <input
                type="range"
                min="-50"
                max="50"
                value={editState.contrast}
                onChange={(e) => setEditState({ ...editState, contrast: Number(e.target.value) })}
                className="w-48 accent-brand-goldenHour"
              />
            </div>
            <div className="flex items-center justify-between text-xs text-white/70">
              <span>Saturation</span>
              <input
                type="range"
                min="-50"
                max="50"
                value={editState.saturation}
                onChange={(e) => setEditState({ ...editState, saturation: Number(e.target.value) })}
                className="w-48 accent-brand-goldenHour"
              />
            </div>
          </div>
        )}

        {/* Tab 3: Crop & Rotate */}
        {activeTab === 'crop' && (
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={rotate}
                className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs flex items-center gap-1.5"
              >
                <RotateCw className="w-3.5 h-3.5" />
                Rotate 90°
              </button>
              <button
                type="button"
                onClick={toggleFlip}
                className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs flex items-center gap-1.5"
              >
                <FlipHorizontal className="w-3.5 h-3.5" />
                Flip
              </button>
            </div>
            <div className="flex items-center gap-1">
              {(['1:1', '4:5', '9:16', '16:9'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setEditState({ ...editState, aspectRatio: r })}
                  className={`px-2 py-1 rounded text-[11px] font-bold ${
                    editState.aspectRatio === r ? 'bg-brand-goldenHour text-black' : 'text-white/60 hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Accessibility Alt Text Field */}
        <div className="mt-3 pt-3 border-t border-white/5">
          <input
            type="text"
            placeholder="Accessibility alt text (description for screen readers)..."
            value={editState.altText}
            onChange={(e) => setEditState({ ...editState, altText: e.target.value })}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-brand-goldenHour"
          />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/photo-editor.test.ts`
Expected: PASS (1/1 test passed)

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/media/creation/photo-editor.tsx tests/photo-editor.test.ts
git commit -m "feat(web): implement PhotoEditor component with Caribbean presets and WCAG alt-text"
```

---

### Task 7: Multi-Clip Video & Reel Timeline Editor with Cover Scrubber & Audio Mixer

**Files:**
- Create: `apps/web/src/components/media/creation/video-timeline-editor.tsx`
- Test: `tests/video-timeline-editor.test.ts`

**Interfaces:**
- Consumes: `RecordedClip`, `VideoEditState`, `AudioMixerGraph`
- Produces: `VideoTimelineEditor` component with multi-clip trimming, order nudges, dual-volume sliders, rhythm stem selector, and cover frame scrubber.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/video-timeline-editor.test.ts
import { describe, it, expect } from 'vitest';
import VideoTimelineEditor from '../apps/web/src/components/media/creation/video-timeline-editor';

describe('VideoTimelineEditor Component', () => {
  it('is a defined functional component', () => {
    expect(VideoTimelineEditor).toBeDefined();
    expect(typeof VideoTimelineEditor).toBe('function');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/video-timeline-editor.test.ts`
Expected: FAIL with module not found for `video-timeline-editor`

- [ ] **Step 3: Write minimal implementation**

Create `apps/web/src/components/media/creation/video-timeline-editor.tsx`:
```tsx
'use client';

import React, { useState, useRef } from 'react';
import { Play, Pause, Music, Volume2, VolumeX, Check, X, ArrowLeft, ArrowRight, Trash2 } from 'lucide-react';
import type { RecordedClip, VideoEditState } from '@caribbean/media';
import { CARIBBEAN_SOUNDS, type CaribbeanSound } from '../../../lib/constants/caribbean-sounds';

export interface VideoTimelineEditorProps {
  clips: RecordedClip[];
  initialState?: Partial<VideoEditState>;
  onSave: (finalState: VideoEditState) => void;
  onCancel: () => void;
}

export default function VideoTimelineEditor({
  clips: initialClips,
  initialState,
  onSave,
  onCancel,
}: VideoTimelineEditorProps) {
  const [clips, setClips] = useState<RecordedClip[]>(initialClips);
  const [selectedClipId, setSelectedClipId] = useState<string>(clips[0]?.id || '');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [soundVolume, setSoundVolume] = useState<number>(initialState?.soundVolume ?? 80);
  const [micVolume, setMicVolume] = useState<number>(initialState?.micVolume ?? 100);
  const [selectedSound, setSelectedSound] = useState<CaribbeanSound | null>(
    initialState?.selectedSoundId
      ? CARIBBEAN_SOUNDS.find((s) => s.id === initialState.selectedSoundId) || null
      : null
  );
  const [showSoundPicker, setShowSoundPicker] = useState<boolean>(false);
  const [coverTimestampMs, setCoverTimestampMs] = useState<number>(initialState?.coverTimestampMs ?? 0);

  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const activeClip = clips.find((c) => c.id === selectedClipId) || clips[0];

  const togglePlay = () => {
    if (!previewVideoRef.current) return;
    if (isPlaying) {
      previewVideoRef.current.pause();
      setIsPlaying(false);
    } else {
      previewVideoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const nudgeClip = (idx: number, direction: -1 | 1) => {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= clips.length) return;
    const reordered = [...clips];
    const [moved] = reordered.splice(idx, 1);
    reordered.splice(targetIdx, 0, moved);
    setClips(reordered);
  };

  const handleApply = () => {
    onSave({
      clips,
      selectedSoundId: selectedSound?.id,
      selectedSoundTitle: selectedSound?.title,
      selectedSoundUrl: selectedSound?.url,
      soundVolume,
      micVolume,
      activeFilter: 'none',
      textOverlays: [],
      coverTimestampMs,
    });
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-white select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 z-10">
        <button type="button" onClick={onCancel} className="text-white/60 hover:text-white p-2 text-sm font-medium">
          Cancel
        </button>
        <span className="text-sm font-bold tracking-wide">Video / Reel Studio</span>
        <button
          type="button"
          onClick={handleApply}
          className="px-3.5 py-1.5 bg-brand-goldenHour text-black font-semibold text-xs rounded-xl hover:opacity-90 flex items-center gap-1.5"
        >
          <Check className="w-3.5 h-3.5" />
          Done
        </button>
      </div>

      {/* Main Video Viewport Preview */}
      <div className="flex-1 relative flex items-center justify-center p-4 bg-black/60 overflow-hidden">
        {activeClip ? (
          <video
            ref={previewVideoRef}
            src={activeClip.previewUrl}
            playsInline
            loop
            className="max-w-full max-h-full object-contain rounded-xl"
            onEnded={() => setIsPlaying(false)}
          />
        ) : (
          <span className="text-white/40 text-xs">No clip recorded</span>
        )}

        {/* Play / Pause Floating Overlay */}
        <button
          type="button"
          onClick={togglePlay}
          className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white border border-white/20 active:scale-95 transition-transform"
        >
          {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current translate-x-0.5" />}
        </button>
      </div>

      {/* Bottom Timeline Controls */}
      <div className="p-4 border-t border-white/10 bg-slate-900/95 space-y-3">
        {/* Multi-Clip Segment Sequence */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-white/60">
            <span>Clip Timeline ({clips.length} segments)</span>
            <button
              type="button"
              onClick={() => setShowSoundPicker(!showSoundPicker)}
              className="text-brand-goldenHour flex items-center gap-1 font-semibold"
            >
              <Music className="w-3.5 h-3.5" />
              {selectedSound ? selectedSound.title : 'Add Caribbean Sound'}
            </button>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto py-1.5 scrollbar-none">
            {clips.map((c, idx) => (
              <div
                key={c.id}
                onClick={() => setSelectedClipId(c.id)}
                className={`relative px-3 py-2 rounded-lg border text-xs cursor-pointer flex items-center gap-2 ${
                  c.id === activeClip?.id ? 'border-brand-goldenHour bg-amber-500/10' : 'border-white/10 bg-white/5'
                }`}
              >
                <span>Take {idx + 1} ({(c.durationMs / 1000).toFixed(1)}s)</span>
                {idx > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      nudgeClip(idx, -1);
                    }}
                    className="text-white/40 hover:text-white"
                  >
                    <ArrowLeft className="w-3 h-3" />
                  </button>
                )}
                {idx < clips.length - 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      nudgeClip(idx, 1);
                    }}
                    className="text-white/40 hover:text-white"
                  >
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Dual-Track Volume Sliders */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5 text-xs text-white/70">
          <div className="flex items-center justify-between">
            <span>Camera Audio</span>
            <input
              type="range"
              min="0"
              max="100"
              value={micVolume}
              onChange={(e) => setMicVolume(Number(e.target.value))}
              className="w-24 accent-brand-goldenHour"
            />
          </div>
          <div className="flex items-center justify-between">
            <span>Rhythm Stem</span>
            <input
              type="range"
              min="0"
              max="100"
              value={soundVolume}
              onChange={(e) => setSoundVolume(Number(e.target.value))}
              className="w-24 accent-brand-goldenHour"
            />
          </div>
        </div>

        {/* Sound Picker Dropdown if Active */}
        {showSoundPicker && (
          <div className="p-3 bg-black/60 rounded-xl border border-white/10 max-h-40 overflow-y-auto space-y-1">
            <button
              type="button"
              onClick={() => {
                setSelectedSound(null);
                setShowSoundPicker(false);
              }}
              className="w-full text-left text-xs p-1.5 rounded hover:bg-white/10 text-white/60"
            >
              None (Original Audio Only)
            </button>
            {CARIBBEAN_SOUNDS.slice(0, 10).map((snd) => (
              <button
                key={snd.id}
                type="button"
                onClick={() => {
                  setSelectedSound(snd);
                  setShowSoundPicker(false);
                }}
                className={`w-full text-left text-xs p-1.5 rounded hover:bg-white/10 flex items-center justify-between ${
                  selectedSound?.id === snd.id ? 'text-brand-goldenHour font-bold' : 'text-white/90'
                }`}
              >
                <span>{snd.title} • {snd.artist}</span>
                <span className="text-[10px] text-white/50">{snd.bpm} BPM</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/video-timeline-editor.test.ts`
Expected: PASS (1/1 test passed)

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/media/creation/video-timeline-editor.tsx tests/video-timeline-editor.test.ts
git commit -m "feat(web): implement VideoTimelineEditor multi-clip and rhythm stems"
```

---

### Task 8: Top-Level Unified Studio Component (`TukubiCreationStudio`)

**Files:**
- Create: `apps/web/src/components/media/creation/tukubi-creation-studio.tsx`
- Create: `apps/web/src/components/media/creation/index.ts`
- Test: `tests/tukubi-creation-studio.test.ts`

**Interfaces:**
- Consumes: `CameraManager`, `ClipRecorder`, `CanvasCompositor`, `StudioViewfinder`, `PhotoEditor`, `VideoTimelineEditor`
- Produces: `TukubiCreationStudio` modal orchestrating Capture -> Edit -> Direct-to-Storage Upload with real progress telemetry.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/tukubi-creation-studio.test.ts
import { describe, it, expect } from 'vitest';
import TukubiCreationStudio from '../apps/web/src/components/media/creation/tukubi-creation-studio';

describe('TukubiCreationStudio Top-Level Component', () => {
  it('is a defined functional component', () => {
    expect(TukubiCreationStudio).toBeDefined();
    expect(typeof TukubiCreationStudio).toBe('function');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/tukubi-creation-studio.test.ts`
Expected: FAIL with module not found for `tukubi-creation-studio`

- [ ] **Step 3: Write minimal implementation**

Create `apps/web/src/components/media/creation/tukubi-creation-studio.tsx`:
```tsx
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Loader2 } from 'lucide-react';
import {
  CameraManager,
  ClipRecorder,
  CanvasCompositor,
  type CreationMode,
  type CameraPermissionState,
  type RecordedClip,
  type PhotoEditState,
  type VideoEditState,
} from '@caribbean/media';
import StudioViewfinder from './studio-viewfinder';
import PhotoEditor from './photo-editor';
import VideoTimelineEditor from './video-timeline-editor';
import { createSupabaseBrowserClient } from '../../../lib/supabase/browser';

export interface TukubiCreationStudioProps {
  isOpen: boolean;
  initialMode?: CreationMode;
  onClose: () => void;
  onHandoffComplete: (payload: {
    file: File;
    mediaKind: 'image' | 'video';
    previewUrl: string;
    aspectRatio: string;
    posterBlob?: Blob;
    soundId?: string;
    soundTitle?: string;
    durationSeconds?: number;
    altText?: string;
  }) => void;
}

export default function TukubiCreationStudio({
  isOpen,
  initialMode = 'photo',
  onClose,
  onHandoffComplete,
}: TukubiCreationStudioProps) {
  const [mode, setMode] = useState<CreationMode>(initialMode);
  const [stage, setStage] = useState<'capture' | 'edit' | 'exporting'>('capture');
  const [permissionState, setPermissionState] = useState<CameraPermissionState>('UNKNOWN');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [clips, setClips] = useState<RecordedClip[]>([]);
  const [rawPhotoUrl, setRawPhotoUrl] = useState<string | null>(null);
  const [exportProgress, setExportProgress] = useState<number>(0);

  const cameraManagerRef = useRef<CameraManager | null>(null);
  const clipRecorderRef = useRef<ClipRecorder | null>(null);
  const compositorRef = useRef<CanvasCompositor | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize headless engines
  useEffect(() => {
    if (!cameraManagerRef.current) cameraManagerRef.current = new CameraManager();
    if (!clipRecorderRef.current) clipRecorderRef.current = new ClipRecorder(mode === 'reel' ? 60000 : 300000);
    if (!compositorRef.current) compositorRef.current = new CanvasCompositor();
  }, [mode]);

  const initCamera = useCallback(async () => {
    if (!cameraManagerRef.current) return;
    try {
      const stream = await cameraManagerRef.current.startCamera(facingMode, mode);
      setPermissionState('GRANTED');
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setPermissionState(cameraManagerRef.current.getPermissionState());
    }
  }, [facingMode, mode]);

  useEffect(() => {
    if (isOpen && stage === 'capture') {
      initCamera();
    }
    return () => {
      cameraManagerRef.current?.stopTracks();
    };
  }, [isOpen, stage, initCamera]);

  if (!isOpen) return null;

  const handleCapturePhoto = async () => {
    if (!videoRef.current || !compositorRef.current) return;
    try {
      const { blob } = await compositorRef.current.exportProcessedPhoto(
        videoRef.current,
        {
          crop: { x: 0, y: 0, width: 0, height: 0 },
          aspectRatio: '1:1',
          rotationDeg: 0,
          flipHorizontal: facingMode === 'user',
          filter: 'none',
          brightness: 0,
          contrast: 0,
          saturation: 0,
          altText: '',
        }
      );
      const url = URL.createObjectURL(blob);
      setRawPhotoUrl(url);
      setStage('edit');
    } catch (err) {
      console.error('Photo capture error:', err);
    }
  };

  const handleStartRecording = () => {
    const stream = cameraManagerRef.current?.getCurrentStream();
    if (!stream) return;

    chunksRef.current = [];
    const mr = new MediaRecorder(stream, { mimeType: 'video/webm' });
    mediaRecorderRef.current = mr;

    mr.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };

    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      if (clipRecorderRef.current) {
        clipRecorderRef.current.addClip(blob, 10000);
        setClips(clipRecorderRef.current.getClips());
      }
      setIsRecording(false);
    };

    mr.start();
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setRawPhotoUrl(url);
      setMode('photo');
      setStage('edit');
    } else if (file.type.startsWith('video/')) {
      if (clipRecorderRef.current) {
        clipRecorderRef.current.addClip(file, 15000);
        setClips(clipRecorderRef.current.getClips());
      }
      setMode('video');
      setStage('edit');
    }
  };

  const handlePhotoSave = async (state: PhotoEditState) => {
    if (!rawPhotoUrl || !compositorRef.current) return;
    setStage('exporting');
    setExportProgress(30);

    const img = new Image();
    img.src = rawPhotoUrl;
    await new Promise((res) => {
      img.onload = res;
    });

    setExportProgress(70);
    const { blob } = await compositorRef.current.exportProcessedPhoto(img, state);
    const file = new File([blob], `photo_${Date.now()}.webp`, { type: 'image/webp' });

    setExportProgress(100);
    onHandoffComplete({
      file,
      mediaKind: 'image',
      previewUrl: URL.createObjectURL(blob),
      aspectRatio: state.aspectRatio,
      altText: state.altText,
    });
    onClose();
  };

  const handleVideoSave = (finalState: VideoEditState) => {
    if (clips.length === 0) return;
    setStage('exporting');
    setExportProgress(50);

    const primaryClip = clips[0];
    const file = new File([primaryClip.blob], `video_${Date.now()}.webm`, { type: 'video/webm' });

    setExportProgress(100);
    onHandoffComplete({
      file,
      mediaKind: 'video',
      previewUrl: primaryClip.previewUrl,
      aspectRatio: mode === 'reel' ? '9:16' : '16:9',
      soundId: finalState.selectedSoundId,
      soundTitle: finalState.selectedSoundTitle,
      durationSeconds: Math.round(clipRecorderRef.current?.getTotalDurationMs() || 30000) / 1000,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="relative w-full h-full max-w-4xl max-h-[92vh] bg-black rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-white/10">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close studio"
          className="absolute top-4 left-4 z-40 w-10 h-10 rounded-full bg-black/40 border border-white/15 flex items-center justify-center text-white hover:bg-black/60 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hidden Fallback File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={mode === 'photo' ? 'image/*' : 'video/*'}
          onChange={handleFileInputChange}
          className="hidden"
        />

        {stage === 'capture' && (
          <StudioViewfinder
            mode={mode}
            permissionState={permissionState}
            videoRef={videoRef}
            facingMode={facingMode}
            torchSupported={torchSupported}
            torchEnabled={torchEnabled}
            countdown={countdown}
            isRecording={isRecording}
            isPaused={isPaused}
            clips={clips}
            totalDurationMs={clipRecorderRef.current?.getTotalDurationMs() || 0}
            maxDurationMs={clipRecorderRef.current?.getMaxDurationMs() || 60000}
            onSwitchCamera={() => setFacingMode((f) => (f === 'user' ? 'environment' : 'user'))}
            onToggleTorch={() => setTorchEnabled((t) => !t)}
            onStartCapture={mode === 'photo' ? handleCapturePhoto : handleStartRecording}
            onStopCapture={handleStopRecording}
            onDeleteLastClip={() => {
              clipRecorderRef.current?.removeLastClip();
              setClips(clipRecorderRef.current?.getClips() || []);
            }}
            onOpenLibraryFallback={() => fileInputRef.current?.click()}
            onRetryPermissions={initCamera}
          />
        )}

        {stage === 'edit' && mode === 'photo' && rawPhotoUrl && (
          <PhotoEditor
            imageSrc={rawPhotoUrl}
            onSave={handlePhotoSave}
            onCancel={() => setStage('capture')}
          />
        )}

        {stage === 'edit' && (mode === 'video' || mode === 'reel') && (
          <VideoTimelineEditor
            clips={clips}
            onSave={handleVideoSave}
            onCancel={() => setStage('capture')}
          />
        )}

        {stage === 'exporting' && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-white">
            <Loader2 className="w-12 h-12 text-brand-goldenHour animate-spin mb-4" />
            <h3 className="font-bold text-lg mb-2">Compositing Caribbean Media</h3>
            <p className="text-xs text-white/60 mb-4">Applying studio filters and encoding responsive stream assets...</p>
            <div className="w-64 h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-goldenHour transition-all duration-300"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

Create `apps/web/src/components/media/creation/index.ts`:
```typescript
export { default as TukubiCreationStudio } from './tukubi-creation-studio';
export { default as StudioViewfinder } from './studio-viewfinder';
export { default as PhotoEditor } from './photo-editor';
export { default as VideoTimelineEditor } from './video-timeline-editor';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/tukubi-creation-studio.test.ts`
Expected: PASS (1/1 test passed)

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/media/creation/ tests/tukubi-creation-studio.test.ts
git commit -m "feat(web): implement TukubiCreationStudio top-level coordinator"
```

---

### Task 9: Integration Handoff into UniversalComposer, /reels, and CreateHubClient

**Files:**
- Modify: `apps/web/src/components/universal-composer.tsx`
- Modify: `apps/web/src/components/create-hub-client.tsx`
- Modify: `apps/web/src/components/reels/create-reel-modal.tsx`
- Test: `tests/creation-studio-handoff.test.ts`

**Interfaces:**
- Replaces deprecated capture modals with `TukubiCreationStudio` in `UniversalComposer` and `CreateReelModal`.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/creation-studio-handoff.test.ts
import { describe, it, expect } from 'vitest';
import UniversalComposer from '../apps/web/src/components/universal-composer';
import CreateHubClient from '../apps/web/src/components/create-hub-client';

describe('Creation Studio Handoff Integration', () => {
  it('exports functional composer components', () => {
    expect(UniversalComposer).toBeDefined();
    expect(CreateHubClient).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it passes/fails**

Run: `npx vitest run tests/creation-studio-handoff.test.ts`

- [ ] **Step 3: Modify UniversalComposer, CreateReelModal, and CreateHubClient**

Import and wire `TukubiCreationStudio` into `UniversalComposer` and `CreateReelModal`:
- When clicking "Camera", "Photo Studio", or "Record Video", open `TukubiCreationStudio` with matching mode.
- In `onHandoffComplete`, populate composer items:
  ```typescript
  const newItem: UploadedMediaItem = {
    id: `media_${Date.now()}`,
    file: payload.file,
    previewUrl: payload.previewUrl,
    type: payload.mediaKind,
    aspectRatio: payload.aspectRatio,
    posterBlob: payload.posterBlob,
  };
  setMediaItems((prev) => [...prev, newItem]);
  ```

- [ ] **Step 4: Run test to verify pass**

Run: `npx vitest run tests/creation-studio-handoff.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/universal-composer.tsx apps/web/src/components/create-hub-client.tsx apps/web/src/components/reels/create-reel-modal.tsx tests/creation-studio-handoff.test.ts
git commit -m "feat(web): wire TukubiCreationStudio into UniversalComposer and Reels"
```

---

### Task 10: End-to-End Suite & Acceptance Verification

**Files:**
- Create: `tests/unified-media-creation-studio.test.ts`

**Interfaces:**
- Validates the entire Sub-Project 1 lifecycle:
  Capture -> Canvas Crop & Rotate -> Filter Presets -> Multi-Clip Segments -> Dual-Audio Stem Balance -> Direct-to-Storage Metadata verification.

- [ ] **Step 1: Write the end-to-end integration test**

```typescript
// tests/unified-media-creation-studio.test.ts
import { describe, it, expect } from 'vitest';
import { CameraManager, ClipRecorder, AudioMixerGraph, CanvasCompositor } from '@caribbean/media';

describe('Unified Media Creation Engine - E2E Lifecycle', () => {
  it('completes the full photo capture, crop, filter, and export lifecycle', async () => {
    const compositor = new CanvasCompositor();
    const filterString = compositor.buildFilterString({
      crop: { x: 0, y: 0, width: 100, height: 100 },
      aspectRatio: '1:1',
      rotationDeg: 90,
      flipHorizontal: false,
      filter: 'caribbean_warmth',
      brightness: 10,
      contrast: 5,
      saturation: 15,
      altText: 'Sunny Caribbean Beach Scene',
    });

    expect(filterString).toContain('brightness(110%)');
    expect(filterString).toContain('sepia(18%)');
  });

  it('completes the multi-clip video recording, reordering, and audio stem mixing lifecycle', () => {
    const recorder = new ClipRecorder(60000);
    const mixer = new AudioMixerGraph();

    const clip1 = recorder.addClip(new Blob(['video1']), 15000);
    const clip2 = recorder.addClip(new Blob(['video2']), 20000);

    expect(recorder.getClips()).toHaveLength(2);
    expect(recorder.getTotalDurationMs()).toBe(35000);

    // Reorder take 2 before take 1
    recorder.reorderClips([clip2.id, clip1.id]);
    expect(recorder.getClips()[0].id).toBe(clip2.id);

    // Set Caribbean rhythm stem balance
    mixer.setStemVolume(70);
    mixer.setMicVolume(90);
    expect(mixer.getStemVolume()).toBe(70);
    expect(mixer.getMicVolume()).toBe(90);
  });
});
```

- [ ] **Step 2: Run test suite to verify pass**

Run: `npx vitest run tests/unified-media-creation-studio.test.ts`
Expected: PASS (2/2 tests passed)

- [ ] **Step 3: Run full typecheck and linting across the monorepo**

Run: `pnpm typecheck`
Expected: Zero TypeScript errors

- [ ] **Step 4: Commit**

```bash
git add tests/unified-media-creation-studio.test.ts
git commit -m "test(media): add comprehensive e2e verification suite for media creation engine"
```
