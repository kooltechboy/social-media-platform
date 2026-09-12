import { describe, it, expect } from 'vitest';
import {
  MediaPipeline,
  MuxStreamingAdapter,
  CloudflareStreamAdapter,
  resolveStreamingProvider,
  generateOptimizedImageUrl,
  generateSrcSet,
  getCaribbeanPlaceholderGradient,
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

    it('rejects spoofed or unlisted headers', () => {
      const fakeExeHeader = [0x4d, 0x5a, 0x90, 0x00];
      const result = pipeline.validateMagicBytes(fakeExeHeader);
      expect(result.valid).toBe(false);
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
    it('generates Supabase render transformation URLs', () => {
      const supabaseUrl = 'https://xyz.supabase.co/storage/v1/object/public/post-media/user1/pic.jpg';
      const optimized = generateOptimizedImageUrl(supabaseUrl, {
        width: 800,
        height: 600,
        quality: 85,
        format: 'webp',
      });

      expect(optimized).toContain('/storage/v1/render/image/public/');
      expect(optimized).toContain('width=800');
      expect(optimized).toContain('quality=85');
      expect(optimized).toContain('format=webp');
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
