import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CanvasCompositor } from '../packages/media/src/creation/canvas-compositor';
import type { PhotoEditState } from '../packages/media/src/creation/types';

describe('CanvasCompositor', () => {
  let originalDocument: any;
  let originalVideoElement: any;

  beforeEach(() => {
    vi.restoreAllMocks();
    originalDocument = global.document;
    originalVideoElement = global.HTMLVideoElement;
  });

  afterEach(() => {
    global.document = originalDocument;
    global.HTMLVideoElement = originalVideoElement;
  });

  describe('buildFilterString', () => {
    const baseState: PhotoEditState = {
      crop: { x: 0, y: 0, width: 100, height: 100 },
      aspectRatio: '1:1',
      rotationDeg: 0,
      flipHorizontal: false,
      filter: 'none',
      brightness: 0,
      contrast: 0,
      saturation: 0,
      altText: '',
    };

    it('builds base filter string with default 0 slider values (100%)', () => {
      const compositor = new CanvasCompositor();
      const filter = compositor.buildFilterString(baseState);
      expect(filter).toBe('brightness(100%) contrast(100%) saturate(100%)');
    });

    it('clamps slider values below 0 to 0%', () => {
      const compositor = new CanvasCompositor();
      const filter = compositor.buildFilterString({
        ...baseState,
        brightness: -120,
        contrast: -150,
        saturation: -100,
      });
      expect(filter).toContain('brightness(0%)');
      expect(filter).toContain('contrast(0%)');
      expect(filter).toContain('saturate(0%)');
    });

    it('computes CSS filter strings accurately for golden_hour preset and sliders', () => {
      const compositor = new CanvasCompositor();
      const filter = compositor.buildFilterString({
        ...baseState,
        filter: 'golden_hour',
        brightness: 10,
        contrast: -5,
        saturation: 20,
      });

      expect(filter).toContain('brightness(110%)');
      expect(filter).toContain('contrast(95%)');
      expect(filter).toContain('saturate(120%)');
      expect(filter).toContain('sepia(25%)');
      expect(filter).toContain('contrast(105%)');
    });

    it('applies caribbean_warmth preset', () => {
      const compositor = new CanvasCompositor();
      const filter = compositor.buildFilterString({
        ...baseState,
        filter: 'caribbean_warmth',
      });
      expect(filter).toContain('sepia(18%)');
      expect(filter).toContain('hue-rotate(-5deg)');
    });

    it('applies twilight_purple preset', () => {
      const compositor = new CanvasCompositor();
      const filter = compositor.buildFilterString({
        ...baseState,
        filter: 'twilight_purple',
      });
      expect(filter).toContain('hue-rotate(25deg)');
      expect(filter).toContain('saturate(115%)');
    });

    it('applies sea_clarity preset', () => {
      const compositor = new CanvasCompositor();
      const filter = compositor.buildFilterString({
        ...baseState,
        filter: 'sea_clarity',
      });
      expect(filter).toContain('hue-rotate(15deg)');
      expect(filter).toContain('contrast(110%)');
    });

    it('applies monochrome preset', () => {
      const compositor = new CanvasCompositor();
      const filter = compositor.buildFilterString({
        ...baseState,
        filter: 'monochrome',
      });
      expect(filter).toContain('grayscale(100%)');
    });
  });

  describe('calculateDimensions', () => {
    const compositor = new CanvasCompositor();

    it('returns exact original dimensions for "free" aspect ratio', () => {
      const dims = compositor.calculateDimensions(1920, 1080, 'free');
      expect(dims).toEqual({ width: 1920, height: 1080 });
    });

    it('calculates 1:1 square dimensions for landscape source', () => {
      const dims = compositor.calculateDimensions(1920, 1080, '1:1');
      expect(dims).toEqual({ width: 1080, height: 1080 });
    });

    it('calculates 1:1 square dimensions for portrait source', () => {
      const dims = compositor.calculateDimensions(1080, 1920, '1:1');
      expect(dims).toEqual({ width: 1080, height: 1080 });
    });

    it('calculates 4:5 portrait dimensions', () => {
      const dims = compositor.calculateDimensions(1920, 1080, '4:5');
      // 1080 * 4 / 5 = 864
      expect(dims).toEqual({ width: 864, height: 1080 });
    });

    it('calculates 9:16 vertical story / reel dimensions', () => {
      const dims = compositor.calculateDimensions(1920, 1080, '9:16');
      // 1080 * 9 / 16 = 607.5 -> rounded to 608
      expect(dims).toEqual({ width: 608, height: 1080 });
    });

    it('calculates 16:9 landscape dimensions for portrait source', () => {
      const dims = compositor.calculateDimensions(1080, 1920, '16:9');
      // 1080 / (16 / 9) = 607.5 -> rounded to 608
      expect(dims).toEqual({ width: 1080, height: 608 });
    });

    it('leaves dimensions unchanged when source already matches 16:9 target ratio', () => {
      const dims = compositor.calculateDimensions(1920, 1080, '16:9');
      expect(dims).toEqual({ width: 1920, height: 1080 });
    });
  });

  describe('exportProcessedPhoto', () => {
    it('throws if document is undefined', async () => {
      (global as any).document = undefined;
      const compositor = new CanvasCompositor();
      await expect(
        compositor.exportProcessedPhoto({} as any, {
          crop: { x: 0, y: 0, width: 100, height: 100 },
          aspectRatio: 'free',
          rotationDeg: 0,
          flipHorizontal: false,
          filter: 'none',
          brightness: 0,
          contrast: 0,
          saturation: 0,
          altText: '',
        })
      ).rejects.toThrow('Canvas processing is only available in a browser environment');
    });

    it('draws to canvas with transformations, scale, and exports blob', async () => {
      const mockBlob = new Blob(['mock-photo'], { type: 'image/webp' });
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
        toBlob: vi.fn((cb: (b: Blob | null) => void) => cb(mockBlob)),
      };
      (global as any).document = {
        createElement: vi.fn().mockReturnValue(mockCanvas),
      };

      const mockImage = {
        naturalWidth: 2000,
        naturalHeight: 1000,
        width: 2000,
        height: 1000,
      } as unknown as HTMLImageElement;

      const compositor = new CanvasCompositor();
      const result = await compositor.exportProcessedPhoto(
        mockImage,
        {
          crop: { x: 0, y: 0, width: 1000, height: 1000 },
          aspectRatio: '1:1',
          rotationDeg: 90,
          flipHorizontal: true,
          filter: 'sea_clarity',
          brightness: 10,
          contrast: 5,
          saturation: 0,
          altText: 'Sample photo',
        },
        1000
      );

      expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.translate).toHaveBeenCalledWith(mockCanvas.width / 2, mockCanvas.height / 2);
      expect(mockCtx.rotate).toHaveBeenCalledWith((90 * Math.PI) / 180);
      expect(mockCtx.scale).toHaveBeenCalledWith(-1, 1);
      expect(mockCtx.drawImage).toHaveBeenCalled();
      expect(mockCtx.restore).toHaveBeenCalled();
      expect(result.blob).toBe(mockBlob);
      expect(result.width).toBe(1000);
      expect(result.height).toBe(1000);
    });

    it('rejects if toBlob returns null', async () => {
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
        toBlob: vi.fn((cb: (b: Blob | null) => void) => cb(null)),
      };
      (global as any).document = {
        createElement: vi.fn().mockReturnValue(mockCanvas),
      };

      const mockImage = {
        naturalWidth: 1000,
        naturalHeight: 1000,
      } as unknown as HTMLImageElement;

      const compositor = new CanvasCompositor();
      await expect(
        compositor.exportProcessedPhoto(mockImage, {
          crop: { x: 0, y: 0, width: 100, height: 100 },
          aspectRatio: 'free',
          rotationDeg: 0,
          flipHorizontal: false,
          filter: 'none',
          brightness: 0,
          contrast: 0,
          saturation: 0,
          altText: '',
        })
      ).rejects.toThrow('Canvas toBlob conversion failed');
    });
  });

  describe('extractVideoPoster', () => {
    it('throws if document is undefined', async () => {
      (global as any).document = undefined;
      const compositor = new CanvasCompositor();
      await expect(
        compositor.extractVideoPoster({} as any, 0)
      ).rejects.toThrow('Canvas processing is only available in a browser environment');
    });

    it('extracts poster frame at timestamp', async () => {
      const mockBlob = new Blob(['mock-poster'], { type: 'image/webp' });
      const mockCtx = {
        drawImage: vi.fn(),
      };
      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn().mockReturnValue(mockCtx),
        toBlob: vi.fn((cb: (b: Blob | null) => void) => cb(mockBlob)),
      };
      (global as any).document = {
        createElement: vi.fn().mockReturnValue(mockCanvas),
      };

      const mockVideo = {
        videoWidth: 1280,
        videoHeight: 720,
        currentTime: 0,
      } as unknown as HTMLVideoElement;

      const compositor = new CanvasCompositor();
      const result = await compositor.extractVideoPoster(mockVideo, 2500);

      expect(mockVideo.currentTime).toBe(2.5);
      expect(mockCanvas.width).toBe(1280);
      expect(mockCanvas.height).toBe(720);
      expect(mockCtx.drawImage).toHaveBeenCalledWith(mockVideo, 0, 0, 1280, 720);
      expect(result.posterBlob).toBe(mockBlob);
      expect(result.width).toBe(1280);
      expect(result.height).toBe(720);
    });

    it('rejects if poster toBlob returns null', async () => {
      const mockCtx = {
        drawImage: vi.fn(),
      };
      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn().mockReturnValue(mockCtx),
        toBlob: vi.fn((cb: (b: Blob | null) => void) => cb(null)),
      };
      (global as any).document = {
        createElement: vi.fn().mockReturnValue(mockCanvas),
      };

      const mockVideo = {
        videoWidth: 1080,
        videoHeight: 1920,
        currentTime: 0,
      } as unknown as HTMLVideoElement;

      const compositor = new CanvasCompositor();
      await expect(
        compositor.extractVideoPoster(mockVideo, 0)
      ).rejects.toThrow('Failed to extract poster blob');
    });
  });
});
