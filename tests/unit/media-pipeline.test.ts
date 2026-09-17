import { describe, it, expect } from 'vitest';
import {
  MediaPipeline,
  MuxStreamingAdapter,
  CloudflareStreamAdapter,
  resolveStreamingProvider,
  generateOptimizedImageUrl,
  generateSrcSet,
  getCaribbeanPlaceholderGradient,
  classifyAspectRatio,
  getClampedAspectRatio,
  formatBytes,
} from '../../packages/media/src';

describe('TUKUBI Enterprise Media Pipeline', () => {
  const pipeline = new MediaPipeline();

  describe('Magic Byte Binary Sniffing', () => {
    it('accurately identifies JPEG magic bytes', () => {
      const jpegHeader = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10];
      const result = pipeline.validateMagicBytes(jpegHeader);
      expect(result.valid).toBe(true);
      expect(result.detectedMime).toBe('image/jpeg');
    });

    it('accurately identifies PNG magic bytes', () => {
      const pngHeader = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
      const result = pipeline.validateMagicBytes(pngHeader);
      expect(result.valid).toBe(true);
      expect(result.detectedMime).toBe('image/png');
    });

    it('accurately identifies MP4 video magic bytes at offset 4', () => {
      // 4 bytes arbitrary + 'ftyp' (0x66, 0x74, 0x79, 0x70)
      const mp4Header = [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70];
      const result = pipeline.validateMagicBytes(mp4Header);
      expect(result.valid).toBe(true);
      expect(result.detectedMime).toBe('video/mp4');
    });

    it('accurately identifies modern AVIF image magic bytes', () => {
      // offset 4: 'ftypavif' (0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66)
      const avifHeader = [0x00, 0x00, 0x00, 0x1c, 0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66];
      const result = pipeline.validateMagicBytes(avifHeader);
      expect(result.valid).toBe(true);
      expect(result.detectedMime).toBe('image/avif');
    });

    it('accurately identifies camera HEIC image magic bytes', () => {
      // offset 4: 'ftypheic' (0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63)
      const heicHeader = [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63];
      const result = pipeline.validateMagicBytes(heicHeader);
      expect(result.valid).toBe(true);
      expect(result.detectedMime).toBe('image/heic');
    });

    it('rejects spoofed or unlisted headers', () => {
      const fakeExeHeader = [0x4d, 0x5a, 0x90, 0x00];
      const result = pipeline.validateMagicBytes(fakeExeHeader);
      expect(result.valid).toBe(false);
    });
  });

  describe('Aspect Ratio Classification & Layout Safety Bounds', () => {
    it('accurately classifies square images', () => {
      const dims = classifyAspectRatio(1080, 1080);
      expect(dims.category).toBe('square');
      expect(dims.cssAspectRatio).toBe('1 / 1');
      expect(dims.aspectRatio).toBe(1.0);
    });

    it('accurately classifies standard landscape photos (16:9, 4:3)', () => {
      const landscape16_9 = classifyAspectRatio(1920, 1080);
      expect(landscape16_9.category).toBe('landscape');
      expect(landscape16_9.cssAspectRatio).toBe('16 / 9');

      const landscape4_3 = classifyAspectRatio(1600, 1200);
      expect(landscape4_3.category).toBe('landscape');
      expect(landscape4_3.cssAspectRatio).toBe('4 / 3');
    });

    it('accurately classifies portrait smartphone photos (4:5, 3:4, 9:16)', () => {
      const portrait4_5 = classifyAspectRatio(1080, 1350);
      expect(portrait4_5.category).toBe('portrait');
      expect(portrait4_5.cssAspectRatio).toBe('4 / 5');

      const portraitStory = classifyAspectRatio(1080, 1920);
      expect(portraitStory.category).toBe('tall');
      expect(portraitStory.cssAspectRatio).toBe('9 / 16');
    });

    it('getClampedAspectRatio constrains extreme ratios to prevent feed blowout', () => {
      // Instagram/Tukubi standard: min 4:5 (0.8), max 1.91:1
      const extremeTall = getClampedAspectRatio(0.4);
      expect(extremeTall).toBe(0.8);

      const extremeWide = getClampedAspectRatio(3.0);
      expect(extremeWide).toBe(1.91);

      const standardSquare = getClampedAspectRatio(1.0);
      expect(standardSquare).toBe(1.0);

      const standardLandscape = getClampedAspectRatio(1.778);
      expect(standardLandscape).toBeCloseTo(1.778, 2);
    });
  });

  describe('Formatting & Fallback Utilities', () => {
    it('formats bytes into clean human-readable strings', () => {
      expect(formatBytes(0)).toBe('0 B');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1048576)).toBe('1 MB');
      expect(formatBytes(5242880)).toBe('5 MB');
    });
  });

  describe('Adaptive Bitrate Video Streaming', () => {
    it('Mux adapter generates HLS manifest and poster URLs', () => {
      const mux = new MuxStreamingAdapter();
      const playbackUrl = mux.getPlaybackUrl('asset123xyz');
      expect(playbackUrl).toBe('https://stream.mux.com/asset123xyz.m3u8');

      const thumbUrl = mux.getThumbnailUrl('asset123xyz', { width: 640, height: 360 });
      expect(thumbUrl).toContain('https://image.mux.com/asset123xyz/thumbnail.webp');
      expect(thumbUrl).toContain('width=640');
      expect(thumbUrl).toContain('height=360');
    });

    it('Cloudflare Stream adapter generates HLS manifest and poster URLs', () => {
      const cf = new CloudflareStreamAdapter();
      const playbackUrl = cf.getPlaybackUrl('stream_abc_999');
      expect(playbackUrl).toBe('https://videodelivery.net/stream_abc_999/manifest/video.m3u8');

      const thumbUrl = cf.getThumbnailUrl('stream_abc_999', { width: 480 });
      expect(thumbUrl).toContain('https://videodelivery.net/stream_abc_999/thumbnails/thumbnail.webp');
      expect(thumbUrl).toContain('width=480');
    });

    it('resolveStreamingProvider defaults safely to Supabase Storage', () => {
      const provider = resolveStreamingProvider();
      expect(provider.name).toBe('supabase_storage');
    });
  });

  describe('Image CDN Optimization & Resizing', () => {
    it('generates Supabase render transformation URLs when enabled', () => {
      const supabaseUrl = 'https://xyz.supabase.co/storage/v1/object/public/post-media/user1/pic.jpg';
      const optimized = generateOptimizedImageUrl(supabaseUrl, {
        width: 800,
        height: 600,
        quality: 85,
        format: 'webp',
        useRenderEndpoint: true,
      });

      expect(optimized).toContain('/storage/v1/render/image/public/');
      expect(optimized).toContain('width=800');
      expect(optimized).toContain('quality=85');
      expect(optimized).toContain('format=webp');
    });

    it('preserves direct asset URL when useRenderEndpoint is explicitly false', () => {
      const supabaseUrl = 'https://xyz.supabase.co/storage/v1/object/public/post-media/user1/pic.jpg';
      const direct = generateOptimizedImageUrl(supabaseUrl, {
        width: 800,
        useRenderEndpoint: false,
      });

      expect(direct).toBe(supabaseUrl);
    });

    it('generates responsive srcset strings', () => {
      const supabaseUrl = 'https://xyz.supabase.co/storage/v1/object/public/post-media/user1/pic.jpg';
      const srcset = generateSrcSet(supabaseUrl, [320, 640, 1024]);
      expect(srcset).toContain('320w');
      expect(srcset).toContain('640w');
      expect(srcset).toContain('1024w');
    });

    it('provides Caribbean Futurism placeholder gradient', () => {
      const gradient = getCaribbeanPlaceholderGradient();
      expect(gradient).toContain('#0A0F22');
      expect(gradient).toContain('#17112E');
    });
  });
});
