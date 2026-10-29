import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  detectUrls,
  normalizeUrl,
  hashUrlSync,
  hashUrlAsync,
  extractDomain,
  formatDurationSeconds,
  assertSafeUrl,
  getContentResolver,
  resolveContentUrl,
  YouTubeProvider,
  TikTokProvider,
  FacebookProvider,
  InstagramProvider,
  TwitterProvider,
  DirectMediaProvider,
  GenericWebProvider,
  isPrivateIpv4,
  isPrivateIpv6,
  SsrfSecurityError,
} from '../../packages/media/src/index';

describe('Universal Link Intelligence & Provider Architecture Suite', () => {
  describe('1. URL Detection, Normalization & Security Boundary', () => {
    it('detects multiple links mixed with Caribbean dialect text', () => {
      const text = `
        Wah gwan! Check this heavy dubplate https://youtu.be/dQw4w9WgXcQ
        and catch the live stream on https://www.facebook.com/watch?v=987654321
        Follow the page at www.instagram.com/caribbeanvibes.
        Full details: https://jamaica-gleaner.com/article/carnival-2026.
      `;
      const result = detectUrls(text);
      expect(result.hasUrls).toBe(true);
      expect(result.urls.length).toBe(4);
      expect(result.urls[0]).toBe('https://youtu.be/dQw4w9WgXcQ');
      expect(result.urls[1]).toBe('https://www.facebook.com/watch?v=987654321');
      expect(result.urls[2]).toBe('https://www.instagram.com/caribbeanvibes');
      expect(result.urls[3]).toBe('https://jamaica-gleaner.com/article/carnival-2026');
    });

    it('deduplicates identical and normalized URLs', () => {
      const text = `
        https://youtu.be/dQw4w9WgXcQ?si=123
        https://www.youtube.com/watch?v=dQw4w9WgXcQ&utm_source=twitter
      `;
      const result = detectUrls(text);
      expect(result.urls.length).toBe(1);
      expect(result.normalizedUrls[0]).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    });

    it('strips tracking parameters while preserving media functional params', () => {
      const raw = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&fbclid=12345&utm_medium=feed&t=90';
      const clean = normalizeUrl(raw);
      expect(clean).toContain('v=dQw4w9WgXcQ');
      expect(clean).toContain('t=90');
      expect(clean).not.toContain('fbclid');
      expect(clean).not.toContain('utm_medium');
    });

    it('blocks loopback and cloud metadata SSRF attempts', async () => {
      await expect(assertSafeUrl('http://169.254.169.254/latest/meta-data')).rejects.toThrow(SsrfSecurityError);
      await expect(assertSafeUrl('http://127.0.0.1:8000')).rejects.toThrow(SsrfSecurityError);
      await expect(assertSafeUrl('http://[::1]/')).rejects.toThrow(SsrfSecurityError);
      await expect(assertSafeUrl('http://10.200.1.5/internal')).rejects.toThrow(SsrfSecurityError);
    });
  });

  describe('2. Facebook Provider Adapter', () => {
    const provider = new FacebookProvider();

    it('identifies all Facebook domain variants', () => {
      expect(provider.canHandle('https://www.facebook.com/watch?v=123456')).toBe(true);
      expect(provider.canHandle('https://fb.watch/xyz123/')).toBe(true);
      expect(provider.canHandle('https://m.facebook.com/TrinidadCarnival/posts/101')).toBe(true);
      expect(provider.canHandle('https://web.facebook.com/reel/987654')).toBe(true);
      expect(provider.canHandle('https://instagram.com/p/123')).toBe(false);
    });

    it('extracts Facebook video ID and generates official plugin embed URL', async () => {
      const url = new URL('https://www.facebook.com/watch?v=123456789');
      const res = await provider.resolve(url);
      expect(res).not.toBeNull();
      expect(res!.provider).toBe('facebook');
      expect(res!.contentType).toBe('video');
      expect(res!.isPlayable).toBe(true);
      expect(res!.canEmbed).toBe(true);
      expect(res!.embedUrl).toContain('facebook.com/plugins/video.php');
      expect(res!.embedUrl).toContain(encodeURIComponent('https://www.facebook.com/watch?v=123456789'));
      expect(res!.status).toBe('resolved');
    });

    it('resolves Facebook post URLs with official post embed URL', async () => {
      const url = new URL('https://www.facebook.com/TrinidadCarnival/posts/101589123456');
      const res = await provider.resolve(url);
      expect(res).not.toBeNull();
      expect(res!.provider).toBe('facebook');
      expect(res!.contentType).toBe('article');
      expect(res!.canEmbed).toBe(true);
      expect(res!.embedUrl).toContain('facebook.com/plugins/post.php');
      expect(res!.authorName).toBe('TrinidadCarnival');
    });
  });

  describe('3. Instagram Provider Adapter', () => {
    const provider = new InstagramProvider();

    it('identifies Instagram post, Reel, and TV URLs', () => {
      expect(provider.canHandle('https://www.instagram.com/reel/C4s9-xyz/')).toBe(true);
      expect(provider.canHandle('https://instagram.com/p/C4s9-abc/')).toBe(true);
      expect(provider.canHandle('https://instagr.am/p/12345')).toBe(true);
      expect(provider.canHandle('https://tiktok.com/@user/video/123')).toBe(false);
    });

    it('extracts Instagram Reel ID, sets 9:16 aspect ratio and embed URL', async () => {
      const url = new URL('https://www.instagram.com/reel/C4s9-xyz/');
      const res = await provider.resolve(url);
      expect(res).not.toBeNull();
      expect(res!.provider).toBe('instagram');
      expect(res!.contentType).toBe('video');
      expect(res!.aspectRatio).toBe('9:16');
      expect(res!.canEmbed).toBe(true);
      expect(res!.isPlayable).toBe(true);
      expect(res!.embedUrl).toBe('https://www.instagram.com/reel/C4s9-xyz/embed/');
    });

    it('extracts Instagram post ID and provides official photo embed URL', async () => {
      const url = new URL('https://www.instagram.com/p/C4s9-abc/');
      const res = await provider.resolve(url);
      expect(res).not.toBeNull();
      expect(res!.provider).toBe('instagram');
      expect(res!.contentType).toBe('image');
      expect(res!.aspectRatio).toBe('1:1');
      expect(res!.canEmbed).toBe(true);
      expect(res!.embedUrl).toBe('https://www.instagram.com/p/C4s9-abc/embed/');
    });
  });

  describe('4. TikTok Provider Adapter', () => {
    const provider = new TikTokProvider();

    it('identifies TikTok video, short, and mobile URLs', () => {
      expect(provider.canHandle('https://www.tiktok.com/@caribbeandancer/video/7123456789012345678')).toBe(true);
      expect(provider.canHandle('https://vt.tiktok.com/ZS123456/')).toBe(true);
      expect(provider.canHandle('https://tiktok.com/@user/video/999')).toBe(true);
    });

    it('produces reliable deterministic fallback with official embed when API is blocked', async () => {
      const url = new URL('https://www.tiktok.com/@socaking/video/7234567890123456789');
      const res = await provider.resolve(url);
      expect(res).not.toBeNull();
      expect(res!.provider).toBe('tiktok');
      expect(res!.contentType).toBe('video');
      expect(res!.aspectRatio).toBe('9:16');
      expect(res!.embedUrl).toBe('https://www.tiktok.com/embed/v2/7234567890123456789');
      expect(res!.canEmbed).toBe(true);
      expect(res!.isPlayable).toBe(true);
      expect(res!.authorName).toBe('@socaking');
      expect(res!.title).toContain('TikTok Video');
    });
  });

  describe('5. YouTube Provider Adapter', () => {
    const provider = new YouTubeProvider();

    it('identifies videos, Shorts, live streams, and playlists', () => {
      expect(provider.canHandle('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
      expect(provider.canHandle('https://youtube.com/shorts/abcdefghijk')).toBe(true);
      expect(provider.canHandle('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
      expect(provider.canHandle('https://www.youtube.com/playlist?list=PL1234567890abcdef')).toBe(true);
      expect(provider.canHandle('https://www.youtube.com/@MachelMontanoOfficial')).toBe(true);
    });

    it('extracts YouTube playlist and generates playlist embed URL', async () => {
      const url = new URL('https://www.youtube.com/playlist?list=PL1234567890abcdef');
      const res = await provider.resolve(url);
      expect(res).not.toBeNull();
      expect(res!.provider).toBe('youtube');
      expect(res!.contentType).toBe('video');
      expect(res!.canEmbed).toBe(true);
      expect(res!.isPlayable).toBe(true);
      expect(res!.embedUrl).toBe('https://www.youtube-nocookie.com/embed/videoseries?list=PL1234567890abcdef');
      expect(res!.title).toContain('YouTube Playlist');
    });

    it('resolves YouTube Shorts with 9:16 vertical aspect ratio', async () => {
      const url = new URL('https://www.youtube.com/shorts/abcdefghijk');
      const res = await provider.resolve(url);
      expect(res).not.toBeNull();
      expect(res!.aspectRatio).toBe('9:16');
      expect(res!.embedUrl).toContain('abcdefghijk');
      expect(res!.isPlayable).toBe(true);
    });

    it('resolves YouTube channel handle with clean channel preview card', async () => {
      const url = new URL('https://www.youtube.com/@MachelMontanoOfficial');
      const res = await provider.resolve(url);
      expect(res).not.toBeNull();
      expect(res!.provider).toBe('youtube');
      expect(res!.contentType).toBe('website');
      expect(res!.title).toContain('@MachelMontanoOfficial');
    });
  });

  describe('6. X / Twitter Provider Adapter', () => {
    const provider = new TwitterProvider();

    it('identifies tweet status URLs and profile URLs across x.com and twitter.com', () => {
      expect(provider.canHandle('https://x.com/TukubiApp/status/1234567890')).toBe(true);
      expect(provider.canHandle('https://twitter.com/caribbeannews/status/123456')).toBe(true);
      expect(provider.canHandle('https://x.com/TukubiApp')).toBe(true);
      expect(provider.canHandle('https://twitter.com/caribbeannews')).toBe(true);
    });

    it('resolves X profile URLs with structured preview card', async () => {
      const url = new URL('https://x.com/TukubiApp');
      const res = await provider.resolve(url);
      expect(res).not.toBeNull();
      expect(res!.provider).toBe('twitter');
      expect(res!.contentType).toBe('website');
      expect(res!.authorName).toBe('@TukubiApp');
      expect(res!.title).toContain('@TukubiApp');
      expect(res!.description).toContain('View @TukubiApp on X');
    });

    it('resolves tweet status fallback with username and status ID when oEmbed is unreachable', async () => {
      const url = new URL('https://x.com/CultureMinister/status/0000000000000000000');
      const res = await provider.resolve(url);
      expect(res).not.toBeNull();
      expect(res!.authorName).toBe('@CultureMinister');
      expect(res!.title).toContain('@CultureMinister');
      expect(res!.status).toBe('resolved');
    });
  });

  describe('7. Generic Web Provider & Security Hardening', () => {
    const provider = new GenericWebProvider();

    it('handles arbitrary standard domains', () => {
      expect(provider.canHandle('https://jamaica-gleaner.com/article/lead')).toBe(true);
      expect(provider.canHandle('http://barbadostoday.bb')).toBe(true);
    });

    it('decodes HTML entities in scraped titles and descriptions', async () => {
      const sampleHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta property="og:title" content="Carnival 2026 &amp; Steelpan: Trinidad &quot;Vibes&quot; &amp; Culture" />
          <meta property="og:description" content="Celebrating Caribbean joy&#39;s finest rhythm &lt;Soca&gt;." />
          <meta property="og:site_name" content="Trinidad Express" />
        </head>
        <body></body>
        </html>
      `;

      const resolveWithMock = (provider as any).parseHtmlMetadata(
        sampleHtml,
        new URL('https://trinidadexpress.com/carnival-2026')
      );

      expect(resolveWithMock.title).toBe('Carnival 2026 & Steelpan: Trinidad "Vibes" & Culture');
      expect(resolveWithMock.description).toBe("Celebrating Caribbean joy's finest rhythm <Soca>.");
      expect(resolveWithMock.siteName).toBe('Trinidad Express');
    });

    it('rejects SSRF thumbnail and favicon URLs pointing to internal ranges', () => {
      const isDangerous = (provider as any).isDangerousExtractedMediaUrl(
        'http://169.254.169.254/latest/meta-data/image.png'
      );
      expect(isDangerous).toBe(true);

      const isLoopback = (provider as any).isDangerousExtractedMediaUrl('http://127.0.0.1/test.jpg');
      expect(isLoopback).toBe(true);

      const isSafe = (provider as any).isDangerousExtractedMediaUrl('https://images.unsplash.com/photo-123.jpg');
      expect(isSafe).toBe(false);
    });
  });

  describe('8. Direct Media Provider', () => {
    const provider = new DirectMediaProvider();

    it('resolves direct media files with query parameters and auth tokens', () => {
      expect(provider.canHandle('https://storage.example.com/audio/carnival.mp3?token=abc123xyz')).toBe(true);
      expect(provider.canHandle('https://storage.example.com/video/pan.mp4?expires=12345')).toBe(true);
      expect(provider.canHandle('https://cdn.example.com/photo.png?v=2')).toBe(true);
    });

    it('marks audio files playable via native TukubiAudioPlayer', async () => {
      const url = new URL('https://cdn.caribbean.com/stems/reggae_groove.wav');
      const res = await provider.resolve(url);
      expect(res).not.toBeNull();
      expect(res!.contentType).toBe('audio');
      expect(res!.isPlayable).toBe(true);
      expect(res!.embedUrl).toBe('https://cdn.caribbean.com/stems/reggae_groove.wav');
    });

    it('marks video files playable via native TukubiVideoPlayer', async () => {
      const url = new URL('https://cdn.caribbean.com/clips/carnival_mas.mp4');
      const res = await provider.resolve(url);
      expect(res).not.toBeNull();
      expect(res!.contentType).toBe('video');
      expect(res!.isPlayable).toBe(true);
      expect(res!.aspectRatio).toBe('16:9');
    });
  });
});
