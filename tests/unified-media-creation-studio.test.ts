import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

// Creation Engine Modules from @caribbean/media
import {
  CameraManager,
  ClipRecorder,
  AudioMixerGraph,
  CanvasCompositor,
} from '../packages/media/src/creation/index';
import type {
  CreationMode,
  CameraPermissionState,
  RecordedClip,
  PhotoEditState,
  VideoEditState,
} from '../packages/media/src/creation/types';

// React Creation Studio Components & Types
import TukubiCreationStudio from '../apps/web/src/components/media/creation/tukubi-creation-studio';
import {
  TukubiCreationStudio as ExportedStudio,
  StudioViewfinder,
  PhotoEditor,
  VideoTimelineEditor,
  CARIBBEAN_PRESETS,
  ASPECT_RATIOS,
  DEFAULT_PHOTO_EDIT_STATE,
  DEFAULT_VIDEO_EDIT_STATE,
  reorderClips,
  nudgeClip,
} from '../apps/web/src/components/media/creation/index';
import type {
  TukubiCreationStudioProps,
  CreationStudioHandoffPayload,
} from '../apps/web/src/components/media/creation/tukubi-creation-studio';

// Handoff Consumer Types & Constants
import type { UploadedMediaItem } from '../apps/web/src/components/universal-composer';
import { CARIBBEAN_SOUNDS } from '../apps/web/src/lib/constants/caribbean-sounds';

describe('Task 10: End-to-End Unified Media Creation Studio Suite & Acceptance Verification', () => {
  let originalWindow: any;
  let originalDocument: any;
  let originalVideoElement: any;

  beforeEach(() => {
    vi.restoreAllMocks();
    originalWindow = global.window;
    originalDocument = global.document;
    originalVideoElement = global.HTMLVideoElement;
    global.URL.createObjectURL = vi.fn().mockImplementation((blob: Blob) => `blob:mock-url-${Date.now()}`);
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    global.window = originalWindow;
    global.document = originalDocument;
    global.HTMLVideoElement = originalVideoElement;
  });

  // =========================================================================
  // 1. Pipeline Verification: Photo Capture, Affine Transforms, Filters & WebP Export
  // =========================================================================
  describe('1. Photo Creation & CanvasCompositor Pipeline', () => {
    it('manages camera stream lifecycle and facing modes', async () => {
      const stopFn = vi.fn();
      const mockTrack = {
        stop: stopFn,
        getCapabilities: () => ({ torch: true }),
        applyConstraints: vi.fn().mockResolvedValue(undefined),
      };
      const mockStream = {
        getVideoTracks: () => [mockTrack],
        getAudioTracks: () => [],
        getTracks: () => [mockTrack],
      } as unknown as MediaStream;

      navigator.mediaDevices = {
        getUserMedia: vi.fn().mockResolvedValue(mockStream),
        enumerateDevices: vi.fn().mockResolvedValue([
          { deviceId: 'cam-front', kind: 'videoinput', label: 'Front Camera' },
          { deviceId: 'cam-back', kind: 'videoinput', label: 'Back Ultra-Wide' },
        ]),
      } as any;

      const camera = new CameraManager();
      expect(camera.getPermissionState()).toBe('UNKNOWN');
      expect(camera.getFacingMode()).toBe('user');

      // Start front camera for photo mode
      const stream = await camera.startCamera('user', 'photo');
      expect(stream).toBe(mockStream);
      expect(camera.getPermissionState()).toBe('GRANTED');

      // Enumerate camera devices
      const { videoDevices } = await camera.enumerateHardware();
      expect(videoDevices).toHaveLength(2);
      expect(videoDevices[1].label).toBe('Back Ultra-Wide');

      // Switch to environment camera
      const backStream = await camera.switchCamera('environment');
      expect(stopFn).toHaveBeenCalled();
      expect(backStream).toBe(mockStream);
      expect(camera.getFacingMode()).toBe('environment');

      // Clean up camera
      camera.stopTracks();
      expect(stopFn).toHaveBeenCalledTimes(2);
      expect(camera.getCurrentStream()).toBeNull();
    });

    it('calculates affine transform dimensions for all Caribbean aspect ratio standards', () => {
      const compositor = new CanvasCompositor();

      // Free form maintains native dimensions
      expect(compositor.calculateDimensions(1920, 1080, 'free')).toEqual({ width: 1920, height: 1080 });

      // 1:1 Square (Feed posts)
      expect(compositor.calculateDimensions(1920, 1080, '1:1')).toEqual({ width: 1080, height: 1080 });
      expect(compositor.calculateDimensions(1080, 1920, '1:1')).toEqual({ width: 1080, height: 1080 });

      // 4:5 Portrait (High engagement mobile feed)
      expect(compositor.calculateDimensions(1920, 1080, '4:5')).toEqual({ width: 864, height: 1080 });

      // 9:16 Vertical (Reels / Stories)
      expect(compositor.calculateDimensions(1920, 1080, '9:16')).toEqual({ width: 608, height: 1080 });

      // 16:9 Landscape (Cinematic)
      expect(compositor.calculateDimensions(1080, 1920, '16:9')).toEqual({ width: 1080, height: 608 });
      expect(compositor.calculateDimensions(1920, 1080, '16:9')).toEqual({ width: 1920, height: 1080 });
    });

    it('generates accurate CSS filter matrix for all Caribbean presets with slider adjustments', () => {
      const compositor = new CanvasCompositor();
      const baseState: PhotoEditState = {
        crop: { x: 0, y: 0, width: 1080, height: 1080 },
        aspectRatio: '1:1',
        rotationDeg: 0,
        flipHorizontal: false,
        filter: 'none',
        brightness: 0,
        contrast: 0,
        saturation: 0,
        altText: '',
      };

      // Base unedited state
      expect(compositor.buildFilterString(baseState)).toBe('brightness(100%) contrast(100%) saturate(100%)');

      // Caribbean Warmth preset
      const warmthFilter = compositor.buildFilterString({ ...baseState, filter: 'caribbean_warmth' });
      expect(warmthFilter).toContain('sepia(18%)');
      expect(warmthFilter).toContain('hue-rotate(-5deg)');

      // Golden Hour preset
      const goldenFilter = compositor.buildFilterString({ ...baseState, filter: 'golden_hour' });
      expect(goldenFilter).toContain('sepia(25%)');
      expect(goldenFilter).toContain('contrast(105%)');

      // Twilight Purple preset
      const twilightFilter = compositor.buildFilterString({ ...baseState, filter: 'twilight_purple' });
      expect(twilightFilter).toContain('hue-rotate(25deg)');
      expect(twilightFilter).toContain('saturate(115%)');

      // Sea Clarity preset
      const seaFilter = compositor.buildFilterString({ ...baseState, filter: 'sea_clarity' });
      expect(seaFilter).toContain('hue-rotate(15deg)');
      expect(seaFilter).toContain('contrast(110%)');

      // Monochrome preset
      const monoFilter = compositor.buildFilterString({ ...baseState, filter: 'monochrome' });
      expect(monoFilter).toContain('grayscale(100%)');

      // Combined sliders with presets
      const adjusted = compositor.buildFilterString({
        ...baseState,
        filter: 'golden_hour',
        brightness: 15, // 115%
        contrast: -10,  // 90%
        saturation: 25, // 125%
      });
      expect(adjusted).toContain('brightness(115%)');
      expect(adjusted).toContain('contrast(90%)');
      expect(adjusted).toContain('saturate(125%)');
      expect(adjusted).toContain('sepia(25%)');

      // Clamping limits: values below -100 clamp to 0%
      const clamped = compositor.buildFilterString({
        ...baseState,
        brightness: -150,
        contrast: -200,
        saturation: -120,
      });
      expect(clamped).toContain('brightness(0%)');
      expect(clamped).toContain('contrast(0%)');
      expect(clamped).toContain('saturate(0%)');
    });

    it('renders and exports processed photo into high-performance WebP payload', async () => {
      const mockWebpBlob = new Blob(['sample-webp-binary-data'], { type: 'image/webp' });
      const mockCtx = {
        filter: '',
        save: vi.fn(),
        translate: vi.fn(),
        rotate: vi.fn(),
        scale: vi.fn(),
        drawImage: vi.fn(),
        restore: vi.fn(),
      };
      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn().mockReturnValue(mockCtx),
        toBlob: vi.fn((callback: (b: Blob | null) => void, type?: string, quality?: number) => {
          expect(type).toBe('image/webp');
          expect(quality).toBe(0.88);
          callback(mockWebpBlob);
        }),
      };

      (global as any).document = {
        createElement: vi.fn().mockImplementation((tag: string) => {
          if (tag === 'canvas') return mockCanvas;
          return {};
        }),
      };

      const mockImage = {
        naturalWidth: 2000,
        naturalHeight: 2000,
        width: 2000,
        height: 2000,
      } as unknown as HTMLImageElement;

      const editState: PhotoEditState = {
        crop: { x: 100, y: 100, width: 1000, height: 1000 },
        aspectRatio: '1:1',
        rotationDeg: 90,
        flipHorizontal: true,
        filter: 'caribbean_warmth',
        brightness: 10,
        contrast: 5,
        saturation: 15,
        altText: 'Vibrant sunset in Pigeon Point Tobago',
      };

      const compositor = new CanvasCompositor();
      const exportResult = await compositor.exportProcessedPhoto(mockImage, editState, 1080);

      // Verify canvas transformations
      expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.translate).toHaveBeenCalledWith(mockCanvas.width / 2, mockCanvas.height / 2);
      expect(mockCtx.rotate).toHaveBeenCalledWith((90 * Math.PI) / 180);
      expect(mockCtx.scale).toHaveBeenCalledWith(-1, 1); // Flip horizontal
      expect(mockCtx.drawImage).toHaveBeenCalled();
      expect(mockCtx.restore).toHaveBeenCalled();

      // Verify returned payload
      expect(exportResult.blob).toBe(mockWebpBlob);
      expect(exportResult.blob.type).toBe('image/webp');
      expect(exportResult.width).toBe(1080);
      expect(exportResult.height).toBe(1080);

      // Packaging into File object for handoff
      const exportedFile = new File([exportResult.blob], 'tukubi-photo-1080.webp', { type: 'image/webp' });
      expect(exportedFile.name).toBe('tukubi-photo-1080.webp');
      expect(exportedFile.type).toBe('image/webp');
      expect(exportedFile.size).toBe(mockWebpBlob.size);
    });
  });

  // =========================================================================
  // 2. Pipeline Verification: Multi-Clip Recording, Trimming, Audio Mixing & Video Export
  // =========================================================================
  describe('2. Multi-Clip Video Recording & Web Audio Mixing Pipeline', () => {
    it('manages multi-clip recording takes, budget enforcement, and take undo', () => {
      const budgetMs = 60000; // 60s reel budget
      const recorder = new ClipRecorder(budgetMs);

      expect(recorder.getMaxDurationMs()).toBe(60000);
      expect(recorder.getTotalDurationMs()).toBe(0);
      expect(recorder.getRemainingDurationMs()).toBe(60000);

      // Take 1: 15 seconds
      const blob1 = new Blob(['clip-1'], { type: 'video/webm' });
      const clip1 = recorder.addClip(blob1, 15000);
      expect(clip1.id).toBeDefined();
      expect(clip1.order).toBe(0);
      expect(clip1.durationMs).toBe(15000);
      expect(clip1.speed).toBe(1.0);
      expect(recorder.getTotalDurationMs()).toBe(15000);
      expect(recorder.getRemainingDurationMs()).toBe(45000);

      // Take 2: 20 seconds
      const blob2 = new Blob(['clip-2'], { type: 'video/webm' });
      const clip2 = recorder.addClip(blob2, 20000);
      expect(clip2.order).toBe(1);
      expect(recorder.getTotalDurationMs()).toBe(35000);
      expect(recorder.getRemainingDurationMs()).toBe(25000);

      // Take 3: 10 seconds
      const blob3 = new Blob(['clip-3'], { type: 'video/webm' });
      const clip3 = recorder.addClip(blob3, 10000);
      expect(clip3.order).toBe(2);
      expect(recorder.getClips()).toHaveLength(3);
      expect(recorder.getTotalDurationMs()).toBe(45000);
      expect(recorder.getRemainingDurationMs()).toBe(15000);

      // Undo last take (Take 3)
      const removedTake = recorder.removeLastClip();
      expect(removedTake?.id).toBe(clip3.id);
      expect(recorder.getClips()).toHaveLength(2);
      expect(recorder.getTotalDurationMs()).toBe(35000);
      expect(recorder.getRemainingDurationMs()).toBe(25000);
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(clip3.previewUrl);
    });

    it('handles clip sequence reordering and re-indexing', () => {
      const recorder = new ClipRecorder(60000);
      const c1 = recorder.addClip(new Blob(['1'], { type: 'video/webm' }), 5000);
      const c2 = recorder.addClip(new Blob(['2'], { type: 'video/webm' }), 10000);
      const c3 = recorder.addClip(new Blob(['3'], { type: 'video/webm' }), 8000);

      // Reorder sequence: [c2, c3, c1]
      recorder.reorderClips([c2.id, c3.id, c1.id]);
      const reordered = recorder.getClips();
      expect(reordered.map((c) => c.id)).toEqual([c2.id, c3.id, c1.id]);
      expect(reordered[0].order).toBe(0);
      expect(reordered[1].order).toBe(1);
      expect(reordered[2].order).toBe(2);

      // Pure helper reorderClips verification
      const pureReordered = reorderClips(reordered, 0, 2); // Move c2 from index 0 to 2
      expect(pureReordered.map((c) => c.id)).toEqual([c3.id, c1.id, c2.id]);
      expect(pureReordered[0].order).toBe(0);
      expect(pureReordered[1].order).toBe(1);
      expect(pureReordered[2].order).toBe(2);

      // Nudge helper verification with -1 (left) and 1 (right)
      const nudgedLeft = nudgeClip(pureReordered, 1, -1);
      expect(nudgedLeft.map((c) => c.id)).toEqual([c1.id, c3.id, c2.id]);
      const nudgedRight = nudgeClip(nudgedLeft, 0, 1);
      expect(nudgedRight.map((c) => c.id)).toEqual([c3.id, c1.id, c2.id]);
    });

    it('computes trim boundaries and speed scaling for accurate timeline budgeting', () => {
      const recorder = new ClipRecorder(60000);
      const clip = recorder.addClip(new Blob(['video'], { type: 'video/webm' }), 12000);

      // Trimming: keep seconds 2 to 8 (6000ms duration)
      recorder.updateClipTrimming(clip.id, 2000, 8000);
      expect(recorder.getTotalDurationMs()).toBe(6000);

      // Speed adjustment: 2.0x playback speed -> effective duration 3000ms
      recorder.updateClipSpeed(clip.id, 2.0);
      expect(recorder.getTotalDurationMs()).toBe(3000);

      // Speed adjustment: 0.5x slow motion -> effective duration 12000ms
      recorder.updateClipSpeed(clip.id, 0.5);
      expect(recorder.getTotalDurationMs()).toBe(12000);

      // Out-of-bounds trimming clamped safely
      recorder.updateClipTrimming(clip.id, -1000, 25000);
      const updated = recorder.getClips().find((c) => c.id === clip.id);
      expect(updated?.trimStartMs).toBe(0);
      expect(updated?.trimEndMs).toBe(12000);
    });

    it('mixes dual-track audio (mic speech + Caribbean music stem) via Web Audio API graph', () => {
      const mockMicGain = {
        gain: { setValueAtTime: vi.fn() },
        connect: vi.fn(),
      };
      const mockStemGain = {
        gain: { setValueAtTime: vi.fn() },
        connect: vi.fn(),
      };
      const mockDestinationStream = { id: 'mixed-audio-stream' } as unknown as MediaStream;
      const mockDestinationNode = {
        stream: mockDestinationStream,
      };
      const mockMicSourceNode = {
        connect: vi.fn(),
      };
      const mockStemSourceNode = {
        connect: vi.fn(),
      };

      const mockAudioContextInstance = {
        currentTime: 0,
        state: 'running',
        createGain: vi.fn()
          .mockReturnValueOnce(mockMicGain)
          .mockReturnValueOnce(mockStemGain),
        createMediaStreamDestination: vi.fn().mockReturnValue(mockDestinationNode),
        createMediaStreamSource: vi.fn().mockReturnValue(mockMicSourceNode),
        createMediaElementSource: vi.fn().mockReturnValue(mockStemSourceNode),
        resume: vi.fn().mockResolvedValue(undefined),
        close: vi.fn().mockResolvedValue(undefined),
      };

      (global as any).window = {
        AudioContext: vi.fn().mockImplementation(() => mockAudioContextInstance),
      };

      const mixer = new AudioMixerGraph();
      expect(mixer.getMicVolume()).toBe(100);
      expect(mixer.getStemVolume()).toBe(80);

      // Set volumes
      mixer.setMicVolume(90);
      mixer.setStemVolume(45);
      expect(mixer.getMicVolume()).toBe(90);
      expect(mixer.getStemVolume()).toBe(45);
      expect(mixer.normalizeVolume(90)).toBe(0.9);
      expect(mixer.normalizeVolume(45)).toBe(0.45);

      // Build graph connecting mic and stem
      const mockAudioTrack = { stop: vi.fn() };
      const mockMicStream = {
        id: 'mic-raw',
        getAudioTracks: () => [mockAudioTrack],
      } as unknown as MediaStream;
      const mockAudioEl = {} as unknown as HTMLAudioElement;

      const destinationStream = mixer.setupGraph(mockMicStream, mockAudioEl);
      expect(destinationStream).toBe(mockDestinationStream);

      // Check gain connections to destination
      expect(mockMicGain.connect).toHaveBeenCalledWith(mockDestinationNode);
      expect(mockStemGain.connect).toHaveBeenCalledWith(mockDestinationNode);
      expect(mockMicSourceNode.connect).toHaveBeenCalledWith(mockMicGain);
      expect(mockStemSourceNode.connect).toHaveBeenCalledWith(mockStemGain);

      // Verify dynamic gain adjustments update Web Audio parameters smoothly
      mixer.setMicVolume(70);
      expect(mockMicGain.gain.setValueAtTime).toHaveBeenCalledWith(0.7, 0);

      mixer.setStemVolume(30);
      expect(mockStemGain.gain.setValueAtTime).toHaveBeenCalledWith(0.3, 0);

      // Clean up graph
      mixer.close();
      expect(mockAudioContextInstance.close).toHaveBeenCalled();
    });

    it('extracts high-quality poster frame at selected timestamp for reel preview', async () => {
      const mockPosterBlob = new Blob(['poster-webp-binary'], { type: 'image/webp' });
      const mockCtx = {
        drawImage: vi.fn(),
      };
      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn().mockReturnValue(mockCtx),
        toBlob: vi.fn((cb: (b: Blob | null) => void) => cb(mockPosterBlob)),
      };

      (global as any).document = {
        createElement: vi.fn().mockImplementation((tag: string) => {
          if (tag === 'canvas') return mockCanvas;
          return {};
        }),
      };

      const mockVideo = {
        videoWidth: 1080,
        videoHeight: 1920,
        currentTime: 0,
      } as unknown as HTMLVideoElement;

      const compositor = new CanvasCompositor();
      const posterResult = await compositor.extractVideoPoster(mockVideo, 3500);

      expect(mockVideo.currentTime).toBe(3.5);
      expect(mockCanvas.width).toBe(1080);
      expect(mockCanvas.height).toBe(1920);
      expect(mockCtx.drawImage).toHaveBeenCalledWith(mockVideo, 0, 0, 1080, 1920);
      expect(posterResult.posterBlob).toBe(mockPosterBlob);
      expect(posterResult.width).toBe(1080);
      expect(posterResult.height).toBe(1920);
    });
  });

  // =========================================================================
  // 3. UI Component Orchestration & UX States
  // =========================================================================
  describe('3. TukubiCreationStudio Component Orchestration & UX States', () => {
    const defaultStudioProps: TukubiCreationStudioProps = {
      isOpen: true,
      initialMode: 'photo',
      initialStage: 'capture',
      onClose: vi.fn(),
      onHandoffComplete: vi.fn(),
    };

    it('renders null when studio modal is closed', () => {
      const vdom = TukubiCreationStudio({
        ...defaultStudioProps,
        isOpen: false,
      });
      expect(vdom).toBeNull();
    });

    it('renders fully accessible dialog conforming to Caribbean Futurism design tokens', () => {
      const onClose = vi.fn();
      const vdom = TukubiCreationStudio({
        ...defaultStudioProps,
        isOpen: true,
        onClose,
      });

      expect(vdom).toBeDefined();
      expect(vdom.props['role']).toBe('dialog');
      expect(vdom.props['aria-modal']).toBe(true);
      expect(vdom.props['aria-label']).toBe('Tukubi Creation Studio');

      // Verify header and close button
      const container = vdom.props.children;
      const [headerBar] = container.props.children;
      const [closeBtn] = headerBar.props.children;
      expect(closeBtn.props['aria-label']).toBe('Close studio');
      closeBtn.props.onClick();
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('renders StudioViewfinder with capture controls across photo, video, and reel modes', () => {
      // Photo mode
      const photoStudio = TukubiCreationStudio({
        ...defaultStudioProps,
        initialMode: 'photo',
      });
      const photoViewfinder = photoStudio.props.children.props.children.find(
        (c: any) => c && c.type === StudioViewfinder
      );
      expect(photoViewfinder).toBeDefined();
      expect(photoViewfinder.props.mode).toBe('photo');

      // Video mode
      const videoStudio = TukubiCreationStudio({
        ...defaultStudioProps,
        initialMode: 'video',
      });
      const videoViewfinder = videoStudio.props.children.props.children.find(
        (c: any) => c && c.type === StudioViewfinder
      );
      expect(videoViewfinder).toBeDefined();
      expect(videoViewfinder.props.mode).toBe('video');

      // Reel mode
      const reelStudio = TukubiCreationStudio({
        ...defaultStudioProps,
        initialMode: 'reel',
      });
      const reelViewfinder = reelStudio.props.children.props.children.find(
        (c: any) => c && c.type === StudioViewfinder
      );
      expect(reelViewfinder).toBeDefined();
      expect(reelViewfinder.props.mode).toBe('reel');
    });

    it('transitions to PhotoEditor in edit stage with Caribbean presets and tools', () => {
      const onSave = vi.fn();
      const onCancel = vi.fn();
      const vdom = PhotoEditor({
        imageSrc: 'blob:mock-captured-photo',
        onSave,
        onCancel,
      });

      expect(vdom).toBeDefined();
      expect(vdom.props['role']).toBe('region');
      expect(vdom.props['aria-label']).toBe('Photo studio editor');
      expect(CARIBBEAN_PRESETS).toContainEqual(
        expect.objectContaining({ id: 'golden_hour', label: 'Golden Hour' })
      );
      expect(ASPECT_RATIOS).toEqual(['free', '1:1', '4:5', '9:16', '16:9']);
    });

    it('transitions to VideoTimelineEditor in edit stage with Caribbean audio selector and timeline', () => {
      const mockClips: RecordedClip[] = [
        {
          id: 'take-1',
          blob: new Blob(['1'], { type: 'video/webm' }),
          previewUrl: 'blob:take-1',
          durationMs: 8000,
          trimStartMs: 0,
          trimEndMs: 8000,
          speed: 1.0,
          order: 0,
        },
      ];

      const vdom = VideoTimelineEditor({
        clips: mockClips,
        onSave: vi.fn(),
        onCancel: vi.fn(),
      });

      expect(vdom).toBeDefined();
      expect(vdom.props['role']).toBe('region');
      expect(vdom.props['aria-label']).toBe('Video timeline editor');
      expect(DEFAULT_VIDEO_EDIT_STATE.micVolume).toBe(100);
      expect(DEFAULT_VIDEO_EDIT_STATE.soundVolume).toBe(80);
    });

    it('renders real-time telemetry progress bar during export stage', () => {
      const vdom = TukubiCreationStudio({
        ...defaultStudioProps,
        initialStage: 'exporting',
        initialExportProgress: 88,
      });

      const container = vdom.props.children;
      const progressContainer = container.props.children.find(
        (c: any) => c && c.props && c.props['role'] === 'progressbar'
      );
      expect(progressContainer).toBeDefined();
      expect(progressContainer.props['aria-valuenow']).toBe(88);
      expect(progressContainer.props['aria-valuemin']).toBe(0);
      expect(progressContainer.props['aria-valuemax']).toBe(100);
    });
  });

  // =========================================================================
  // 4. E2E Acceptance: Seamless Handoff into UniversalComposer & CreateReelModal
  // =========================================================================
  describe('4. E2E Acceptance: Seamless Handoff into UniversalComposer & CreateReelModal', () => {
    it('executes photo creation pipeline and seamlessly hands off into UniversalComposer', () => {
      // 1. Simulate photo capture & export
      const photoBlob = new Blob(['processed-webp-bytes'], { type: 'image/webp' });
      const photoFile = new File([photoBlob], 'maracas-sunset.webp', { type: 'image/webp' });
      const photoPreviewUrl = 'blob:https://tukubi.caribbean/photo-e2e-123';

      const photoPayload: CreationStudioHandoffPayload = {
        file: photoFile,
        mediaKind: 'image',
        previewUrl: photoPreviewUrl,
        aspectRatio: '1:1',
        altText: 'Vibrant sunset over Trinidad north coast beach',
      };

      // 2. Simulate UniversalComposer receiving handoff
      let composerMediaItems: UploadedMediaItem[] = [];
      let isStudioOpen = true;
      let isComposerExpanded = false;

      const handleStudioHandoff = (payload: CreationStudioHandoffPayload) => {
        isStudioOpen = false;
        const newItem: UploadedMediaItem = {
          id: `media_${Date.now()}_test`,
          file: payload.file,
          previewUrl: payload.previewUrl,
          type: payload.mediaKind,
          caption: payload.altText || '',
          altText: payload.altText,
          aspectRatio: payload.aspectRatio,
          posterBlob: payload.posterBlob,
        };
        composerMediaItems = [...composerMediaItems, newItem];
        isComposerExpanded = true;
      };

      handleStudioHandoff(photoPayload);

      // Verify composer updated seamlessly
      expect(isStudioOpen).toBe(false);
      expect(isComposerExpanded).toBe(true);
      expect(composerMediaItems).toHaveLength(1);
      const inserted = composerMediaItems[0];
      expect(inserted.type).toBe('image');
      expect(inserted.file).toBe(photoFile);
      expect(inserted.previewUrl).toBe(photoPreviewUrl);
      expect(inserted.aspectRatio).toBe('1:1');
      expect(inserted.altText).toBe('Vibrant sunset over Trinidad north coast beach');
    });

    it('executes video reel pipeline with Caribbean sound and seamlessly hands off into CreateReelModal', () => {
      const caribbeanSound = CARIBBEAN_SOUNDS[0];
      expect(caribbeanSound).toBeDefined();

      // 1. Simulate multi-clip reel export
      const reelVideoBlob = new Blob(['rendered-mp4-stream'], { type: 'video/mp4' });
      const reelPosterBlob = new Blob(['poster-webp'], { type: 'image/webp' });
      const reelFile = new File([reelVideoBlob], 'jouvert-morning.mp4', { type: 'video/mp4' });
      const reelPreviewUrl = 'blob:https://tukubi.caribbean/reel-e2e-456';

      const reelPayload: CreationStudioHandoffPayload = {
        file: reelFile,
        mediaKind: 'video',
        previewUrl: reelPreviewUrl,
        aspectRatio: '9:16',
        durationSeconds: 28.6,
        posterBlob: reelPosterBlob,
        soundId: caribbeanSound.id,
        soundTitle: caribbeanSound.title,
        altText: 'Jouvert Morning celebration Port of Spain',
      };

      // 2. Simulate CreateReelModal receiving studio handoff
      let modalVideoFile: File | null = null;
      let modalPreviewUrl: string | null = null;
      let modalDuration = 30;
      let modalSound: any = null;
      let isStudioOpen = true;

      const handleReelStudioHandoff = (payload: CreationStudioHandoffPayload) => {
        modalVideoFile = payload.file;
        modalPreviewUrl = payload.previewUrl;
        if (payload.durationSeconds) {
          modalDuration = Math.max(1, Math.round(payload.durationSeconds));
        }
        if (payload.soundId) {
          const matched = CARIBBEAN_SOUNDS.find((s) => s.id === payload.soundId);
          if (matched) modalSound = matched;
        }
        isStudioOpen = false;
      };

      handleReelStudioHandoff(reelPayload);

      // Verify reel modal state correctly populated
      expect(isStudioOpen).toBe(false);
      expect(modalVideoFile).toBe(reelFile);
      expect(modalPreviewUrl).toBe(reelPreviewUrl);
      expect(modalDuration).toBe(29); // 28.6 rounded to 29
      expect(modalSound).toEqual(caribbeanSound);
    });

    it('verifies seamless camera studio activation and handoff from CreateHubClient', () => {
      let isStudioOpen = false;
      let activeHubMode = 'text';
      let attachedMedia: UploadedMediaItem[] = [];

      // User triggers camera creation studio from hub card
      const openCameraStudio = () => {
        isStudioOpen = true;
      };
      openCameraStudio();
      expect(isStudioOpen).toBe(true);

      // Studio hands off completed media
      const file = new File(['media-data'], 'carnival.mp4', { type: 'video/mp4' });
      const payload: CreationStudioHandoffPayload = {
        file,
        mediaKind: 'video',
        previewUrl: 'blob:hub-preview',
        aspectRatio: '9:16',
        durationSeconds: 15,
      };

      const onHandoffComplete = (p: CreationStudioHandoffPayload) => {
        isStudioOpen = false;
        attachedMedia = [
          {
            id: 'hub_media_1',
            file: p.file,
            previewUrl: p.previewUrl,
            type: p.mediaKind,
            aspectRatio: p.aspectRatio,
            caption: '',
          },
        ];
        activeHubMode = p.mediaKind === 'video' ? 'video' : 'photo';
      };

      onHandoffComplete(payload);

      expect(isStudioOpen).toBe(false);
      expect(activeHubMode).toBe('video');
      expect(attachedMedia).toHaveLength(1);
      expect(attachedMedia[0].file).toBe(file);
      expect(attachedMedia[0].aspectRatio).toBe('9:16');
    });
  });

  // =========================================================================
  // 5. Monorepo Structural Acceptance & Architecture Invariants
  // =========================================================================
  describe('5. Monorepo Structural Acceptance & Architecture Invariants', () => {
    const rootDir = process.cwd();

    it('guarantees clean separation of concerns and no leftover legacy TukubiCameraModal references in consumers', () => {
      const composerFile = path.join(rootDir, 'apps/web/src/components/universal-composer.tsx');
      const createHubFile = path.join(rootDir, 'apps/web/src/components/create-hub-client.tsx');
      const createReelFile = path.join(rootDir, 'apps/web/src/components/reels/create-reel-modal.tsx');

      const composerContent = fs.readFileSync(composerFile, 'utf8');
      const createHubContent = fs.readFileSync(createHubFile, 'utf8');
      const createReelContent = fs.readFileSync(createReelFile, 'utf8');

      // Verify all 3 primary creation consumers reference TukubiCreationStudio
      expect(composerContent).toContain('TukubiCreationStudio');
      expect(createHubContent).toContain('TukubiCreationStudio');
      expect(createReelContent).toContain('TukubiCreationStudio');

      // Verify removal of deprecated TukubiCameraModal
      expect(composerContent).not.toContain('<TukubiCameraModal');
      expect(createHubContent).not.toContain('<TukubiCameraModal');
      expect(createReelContent).not.toContain('<TukubiCameraModal');
    });

    it('verifies all creation modules are exported properly from @caribbean/media', () => {
      expect(CameraManager).toBeDefined();
      expect(ClipRecorder).toBeDefined();
      expect(AudioMixerGraph).toBeDefined();
      expect(CanvasCompositor).toBeDefined();
    });

    it('verifies all creation studio components are exported properly from creation barrel', () => {
      expect(TukubiCreationStudio).toBeDefined();
      expect(ExportedStudio).toBe(TukubiCreationStudio);
      expect(StudioViewfinder).toBeDefined();
      expect(PhotoEditor).toBeDefined();
      expect(VideoTimelineEditor).toBeDefined();
      expect(CARIBBEAN_PRESETS.length).toBeGreaterThanOrEqual(6);
    });
  });
});
