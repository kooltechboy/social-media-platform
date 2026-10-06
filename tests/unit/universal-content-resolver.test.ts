import { describe, it, expect, vi } from 'vitest';
import {
  detectUrls,
  normalizeUrl,
  hashUrlSync,
  hashUrlAsync,
  extractDomain,
  formatDurationSeconds,
  assertSafeUrl,
  getContentResolver,
  YouTubeProvider,
  DirectMediaProvider,
  SpotifyProvider,
  SoundCloudProvider,
  AppleProvider,
  TikTokProvider,
  VimeoProvider,
  TwitterProvider,
  InstagramProvider,
  FacebookProvider,
  LocationProvider,
  TukubiProvider,
  GenericProvider,
} from '../../packages/media/src/index';

describe('Universal Content Resolver — Tukubi Media Architecture', () => {
  describe('1. URL Detection & Canonicalization', () => {
    it('detects multiple URLs in mixed Caribbean content', () => {
      const text = `
        Check out the new soca anthem on https://youtu.be/dQw4w9WgXcQ
        and stream the album at www.spotify.com/album/4vK98A7b9zL
        More details on https://tukubi.caribbean/news/carnival-2026.
      `;
      const detected = detectUrls(text);
      expect(detected.urls.length).toBe(3);
      expect(detected.urls[0]).toBe('https://youtu.be/dQw4w9WgXcQ');
      expect(detected.urls[1]).toBe('https://www.spotify.com/album/4vK98A7b9zL');
      expect(detected.urls[2]).toBe('https://tukubi.caribbean/news/carnival-2026');
    });

    it('returns empty array when text has no URLs', () => {
      const detected = detectUrls('Just enjoying some good vibes and steelpan music in Port of Spain.');
      expect(detected.hasUrls).toBe(false);
      expect(detected.urls).toEqual([]);
    });

    it('strips tracking parameters (UTM, fbclid, si, ref, etc.)', () => {
      const dirtyUrl = 'https://open.spotify.com/track/123456?si=abcde12345&utm_source=copy-link&utm_medium=social&utm_campaign=share';
      const clean = normalizeUrl(dirtyUrl);
      expect(clean).toBe('https://open.spotify.com/track/123456');
    });

    it('normalizes mobile hostnames to canonical domains', () => {
      const mobileYt = normalizeUrl('https://m.youtube.com/watch?v=dQw4w9WgXcQ&feature=share');
      expect(mobileYt).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');

      const mobileTwitter = normalizeUrl('https://mobile.twitter.com/caribbeannews/status/1234567890');
      expect(mobileTwitter).toBe('https://x.com/caribbeannews/status/1234567890');
    });

    it('generates consistent URL hashes (sync and async SHA-256)', async () => {
      const testUrl = 'https://youtube.com/watch?v=dQw4w9WgXcQ';
      const hashSync = hashUrlSync(testUrl);
      const hashAsync = await hashUrlAsync(testUrl);

      expect(hashSync).toHaveLength(64);
      expect(hashAsync).toHaveLength(64);
      expect(hashSync).toBe(hashAsync);
    });

    it('extracts root domain correctly', () => {
      expect(extractDomain('https://sub.domain.co.uk/path/to/page')).toBe('sub.domain.co.uk');
      expect(extractDomain('https://www.spotify.com/track/123')).toBe('spotify.com');
      expect(extractDomain('invalid-url')).toBe('invalid-url');
    });

    it('formats duration in seconds to human readable strings', () => {
      expect(formatDurationSeconds(45)).toBe('0:45');
      expect(formatDurationSeconds(125)).toBe('2:05');
      expect(formatDurationSeconds(3665)).toBe('1:01:05');
      expect(formatDurationSeconds(undefined)).toBe('');
    });
  });

  describe('2. SSRF Guard & Defense-in-Depth', () => {
    it('rejects loopback addresses (localhost, 127.0.0.1)', async () => {
      await expect(assertSafeUrl('http://localhost:3000/api')).rejects.toThrow(/Blocked internal destination/);
      await expect(assertSafeUrl('http://127.0.0.1/admin')).rejects.toThrow(/Blocked private IPv4/);
      await expect(assertSafeUrl('http://127.0.0.5:8080')).rejects.toThrow(/Blocked private IPv4/);
    });

    it('rejects AWS/GCP cloud metadata IP (169.254.169.254)', async () => {
      await expect(assertSafeUrl('http://169.254.169.254/latest/meta-data/')).rejects.toThrow(/Blocked internal destination/);
    });

    it('rejects RFC 1918 private IPv4 ranges', async () => {
      await expect(assertSafeUrl('http://10.0.0.1/secrets')).rejects.toThrow(/Blocked private IPv4/);
      await expect(assertSafeUrl('http://192.168.1.1/router')).rejects.toThrow(/Blocked private IPv4/);
      await expect(assertSafeUrl('http://172.16.0.1/internal')).rejects.toThrow(/Blocked private IPv4/);
    });

    it('rejects unsafe URI schemes (file, ftp, javascript)', async () => {
      await expect(assertSafeUrl('file:///etc/passwd')).rejects.toThrow(/Disallowed protocol/);
      await expect(assertSafeUrl('ftp://ftp.example.com')).rejects.toThrow(/Disallowed protocol/);
      await expect(assertSafeUrl('javascript:alert(1)')).rejects.toThrow(/Disallowed protocol/);
    });

    it('approves legitimate public HTTPS domains', async () => {
      // Should not throw
      const url = await assertSafeUrl('https://open.spotify.com/track/123');
      expect(url.hostname).toBe('open.spotify.com');
    });
  });

  describe('3. Provider Recognition & CanHandle', () => {
    const youtube = new YouTubeProvider();
    const spotify = new SpotifyProvider();
    const soundcloud = new SoundCloudProvider();
    const apple = new AppleProvider();
    const tiktok = new TikTokProvider();
    const vimeo = new VimeoProvider();
    const twitter = new TwitterProvider();
    const location = new LocationProvider();
    const tukubi = new TukubiProvider();
    const generic = new GenericProvider();

    it('correctly classifies YouTube URLs', () => {
      expect(youtube.canHandle('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
      expect(youtube.canHandle('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
      expect(youtube.canHandle('https://youtube.com/shorts/abcdefghijk')).toBe(true);
      expect(youtube.canHandle('https://www.youtube.com/live/abcdefghijk')).toBe(true);
      expect(youtube.canHandle('https://m.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
      expect(youtube.canHandle('https://vimeo.com/12345')).toBe(false);
    });

    it('extracts YouTube live and shorts video IDs correctly', () => {
      expect(youtube.extractVideoId(new URL('https://www.youtube.com/live/dQw4w9WgXcQ'))).toBe('dQw4w9WgXcQ');
      expect(youtube.extractVideoId(new URL('https://youtube.com/shorts/abcdefghijk'))).toBe('abcdefghijk');
      expect(youtube.extractVideoId(new URL('https://youtu.be/dQw4w9WgXcQ?si=test12345'))).toBe('dQw4w9WgXcQ');
    });

    it('correctly classifies Direct Media URLs', () => {
      const direct = new DirectMediaProvider();
      expect(direct.canHandle('https://example.com/videos/carnival.mp4')).toBe(true);
      expect(direct.canHandle('https://example.com/audio/steelpan.mp3')).toBe(true);
      expect(direct.canHandle('https://example.com/images/beach.png')).toBe(true);
      expect(direct.canHandle('https://example.com/page.html')).toBe(false);
    });

    it('resolves Direct Media files into structured playable metadata', async () => {
      const direct = new DirectMediaProvider();
      const videoRes = await direct.resolve(new URL('https://example.com/videos/carnival_parade.mp4'));
      expect(videoRes).not.toBeNull();
      expect(videoRes!.contentType).toBe('video');
      expect(videoRes!.isPlayable).toBe(true);
      expect(videoRes!.title).toContain('Carnival parade');

      const audioRes = await direct.resolve(new URL('https://example.com/audio/steelband.wav'));
      expect(audioRes).not.toBeNull();
      expect(audioRes!.contentType).toBe('audio');
      expect(audioRes!.isPlayable).toBe(true);

      const imageRes = await direct.resolve(new URL('https://example.com/images/maracas_bay.jpg'));
      expect(imageRes).not.toBeNull();
      expect(imageRes!.contentType).toBe('image');
      expect(imageRes!.thumbnailUrl).toBe('https://example.com/images/maracas_bay.jpg');
    });

    it('correctly classifies Instagram and Facebook URLs', () => {
      const ig = new InstagramProvider();
      expect(ig.canHandle('https://www.instagram.com/p/C4s9-123/')).toBe(true);
      expect(ig.canHandle('https://instagram.com/reel/C4s9-456/')).toBe(true);
      expect(ig.canHandle('https://youtube.com')).toBe(false);

      const fb = new FacebookProvider();
      expect(fb.canHandle('https://www.facebook.com/watch?v=123456789')).toBe(true);
      expect(fb.canHandle('https://fb.watch/xyz123/')).toBe(true);
      expect(fb.canHandle('https://twitter.com')).toBe(false);
    });

    it('correctly classifies Spotify tracks, albums, playlists, and shows', () => {
      expect(spotify.canHandle('https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT')).toBe(true);
      expect(spotify.canHandle('https://open.spotify.com/album/4cOdK2wGLETKBW3PvgPWqT')).toBe(true);
      expect(spotify.canHandle('https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M')).toBe(true);
      expect(spotify.canHandle('https://open.spotify.com/show/0k71w6u1U5793h')).toBe(true);
      expect(spotify.canHandle('https://music.apple.com/us/album/123')).toBe(false);
    });

    it('correctly classifies SoundCloud URLs', () => {
      expect(soundcloud.canHandle('https://soundcloud.com/machelmontano/soca-kingdom')).toBe(true);
      expect(soundcloud.canHandle('https://youtube.com')).toBe(false);
    });

    it('correctly classifies Apple Music & Podcasts URLs', () => {
      expect(apple.canHandle('https://music.apple.com/us/album/legend/123456')).toBe(true);
      expect(apple.canHandle('https://podcasts.apple.com/us/podcast/caribbean-history/id987654')).toBe(true);
      expect(apple.canHandle('https://soundcloud.com')).toBe(false);
    });

    it('correctly classifies TikTok URLs', () => {
      expect(tiktok.canHandle('https://www.tiktok.com/@caribbeandancer/video/7123456789012345678')).toBe(true);
      expect(tiktok.canHandle('https://instagram.com')).toBe(false);
    });

    it('correctly classifies Vimeo URLs', () => {
      expect(vimeo.canHandle('https://vimeo.com/123456789')).toBe(true);
      expect(vimeo.canHandle('https://youtube.com')).toBe(false);
    });

    it('correctly classifies Twitter / X URLs', () => {
      expect(twitter.canHandle('https://twitter.com/TukubiApp/status/1234567890')).toBe(true);
      expect(twitter.canHandle('https://x.com/TukubiApp/status/1234567890')).toBe(true);
      expect(twitter.canHandle('https://facebook.com')).toBe(false);
    });

    it('correctly classifies Maps / Location URLs', () => {
      expect(location.canHandle('https://maps.google.com/?q=Maracas+Bay+Trinidad')).toBe(true);
      expect(location.canHandle('https://goo.gl/maps/abc123xyz')).toBe(true);
      expect(location.canHandle('https://maps.apple.com/?address=Bridgetown,Barbados')).toBe(true);
      expect(location.canHandle('https://tukubi.com')).toBe(false);
    });

    it('correctly classifies Tukubi Native Sounds & media files', () => {
      expect(tukubi.canHandle('/audio/sound-soca-01.wav')).toBe(true);
      expect(tukubi.canHandle('https://tukubi.com/audio/sound-reggae-01.wav')).toBe(true);
      expect(tukubi.canHandle('https://storage.tukubi.com/media/audio.mp3')).toBe(true);
      expect(tukubi.canHandle('https://storage.tukubi.com/media/video.mp4')).toBe(true);
      expect(tukubi.canHandle('https://generic-news.com/article')).toBe(false);
    });

    it('generic provider accepts any valid HTTP/HTTPS URL', () => {
      expect(generic.canHandle('https://jamaica-gleaner.com/article/lead-stories/2026')).toBe(true);
      expect(generic.canHandle('http://barbadostoday.bb')).toBe(true);
      expect(generic.canHandle('not-a-url')).toBe(false);
    });
  });

  describe('4. Tukubi Native Audio Resolver', () => {
    it('resolves authentic Caribbean audio stems with rich metadata', async () => {
      const tukubi = new TukubiProvider();
      const resolved = await tukubi.resolve('/audio/sound-soca-01.wav');

      expect(resolved).not.toBeNull();
      expect(resolved!.status).toBe('resolved');
      expect(resolved!.contentType).toBe('audio');
      expect(resolved!.provider).toBe('tukubi_sound');
      expect(resolved!.title).toBe('Laventille Hill Steelpan Stomp');
      expect(resolved!.embedUrl).toBe('/audio/sound-soca-01.wav');
      expect(resolved!.extra?.genre).toBe('Steelpan');
      expect(resolved!.extra?.flag).toBe('🇹🇹');
      expect(resolved!.authorName).toBe('Tukubi Caribbean Sound Labs');
    });

    it('resolves direct MP3 and MP4 files with appropriate types', async () => {
      const tukubi = new TukubiProvider();
      const mp3 = await tukubi.resolve('https://cdn.caribbean.org/audio/live-kompa.mp3');
      expect(mp3).not.toBeNull();
      expect(mp3!.contentType).toBe('audio');
      expect(mp3!.embedUrl).toBe('https://cdn.caribbean.org/audio/live-kompa.mp3');

      const mp4 = await tukubi.resolve('https://cdn.caribbean.org/video/carnival-recap.mp4');
      expect(mp4).not.toBeNull();
      expect(mp4!.contentType).toBe('video');
      expect(mp4!.embedUrl).toBe('https://cdn.caribbean.org/video/carnival-recap.mp4');
    });
  });

  describe('5. Resolver Engine Orchestration & In-Memory Caching', () => {
    it('registers default providers and resolves URLs through pipeline', async () => {
      const engine = getContentResolver();
      const providers = engine.getProviders();
      expect(providers.length).toBeGreaterThanOrEqual(12);

      // Resolve native sound stem
      const result = await engine.resolve('/audio/sound-dancehall-02.wav');
      expect(result.status).toBe('resolved');
      expect(result.extra?.genre).toBe('Dancehall');
      expect(result.extra?.flag).toBe('🇯🇲');

      // Second resolution hits the LRU cache
      const cached = await engine.resolve('/audio/sound-dancehall-02.wav');
      expect(cached.title).toBe(result.title);
    });

    it('safely handles unresolvable external URLs with graceful fallback', async () => {
      const engine = getContentResolver();
      const fallbackResult = await engine.resolve('https://nonexistent-domain-caribbean-test.org/story');
      expect(fallbackResult).toBeDefined();
      expect(fallbackResult.status).toBe('fallback');
      expect(fallbackResult.provider).toBe('generic');
      expect(fallbackResult.title).toContain('nonexistent-domain-caribbean-test.org');
    });
  });
});

