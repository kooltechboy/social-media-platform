import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  canonicalizeUrl,
  detectUrls,
  extractDomain,
} from '../../packages/media/src/index';
import { isSafeEmbedUrl, ALLOWED_EMBED_ORIGINS } from '../../apps/web/src/components/media/rich-media-player';

describe('Universal Rich Media Engine — Controlled Player State Machine & Fallback', () => {
  const TEST_YOUTUBE_URL = 'https://youtu.be/IIQ3mIGKquc?si=faAZYkCPvSl1iH44';
  const CANONICAL_YOUTUBE_URL = 'https://www.youtube.com/watch?v=IIQ3mIGKquc';

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('1. URL Canonicalization & Extraction', () => {
    it('canonicalizes target YouTube URL and strips tracking parameter', () => {
      const canonical = canonicalizeUrl(TEST_YOUTUBE_URL);
      expect(canonical).toBe(CANONICAL_YOUTUBE_URL);
    });

    it('extracts canonical provider and domain', () => {
      const domain = extractDomain(TEST_YOUTUBE_URL);
      expect(domain).toBe('youtu.be');

      const canonicalDomain = extractDomain(CANONICAL_YOUTUBE_URL);
      expect(canonicalDomain).toBe('youtube.com');
    });

    it('detects URL within user post content', () => {
      const text = `Caribbean vibes all weekend! Check this track: ${TEST_YOUTUBE_URL} straight fire!`;
      const detected = detectUrls(text);
      expect(detected.hasUrls).toBe(true);
      expect(detected.primaryUrl).toBe(TEST_YOUTUBE_URL);
      expect(canonicalizeUrl(detected.primaryUrl!)).toBe(CANONICAL_YOUTUBE_URL);
    });
  });

  describe('2. Player State Machine Dynamics', () => {
    type PlayerState = 'idle' | 'loading' | 'playing' | 'fallback';

    class ControlledPlayerStateMachine {
      public state: PlayerState = 'idle';
      public fallbackReason: string = '';
      public watchdogTimer: any = null;

      constructor(
        public embedUrl: string,
        public externalUrl: string,
        public watchdogMs: number = 4500
      ) {}

      public play(): void {
        this.state = 'loading';
        // Watchdog timer: If iframe does not load or postMessage handshake times out
        this.watchdogTimer = setTimeout(() => {
          if (this.state === 'loading') {
            this.state = 'fallback';
            this.fallbackReason = 'Embed response timed out.';
          }
        }, this.watchdogMs);
      }

      public onIframeLoad(): void {
        if (this.state === 'loading') {
          this.state = 'playing';
          if (this.watchdogTimer) {
            clearTimeout(this.watchdogTimer);
            this.watchdogTimer = null;
          }
        }
      }

      public handlePostMessage(data: any): void {
        let parsed = data;
        if (typeof data === 'string') {
          try {
            parsed = JSON.parse(data);
          } catch {
            return;
          }
        }

        // YouTube postMessage error trapping
        if (parsed?.event === 'onError' || parsed?.info === 'onError') {
          const errCode = parsed?.data ?? parsed?.args?.[0];
          this.state = 'fallback';
          if (errCode === 150 || errCode === 101) {
            this.fallbackReason = 'Embedding disabled by content owner.';
          } else {
            this.fallbackReason = `Playback restricted (code ${errCode}).`;
          }
          if (this.watchdogTimer) clearTimeout(this.watchdogTimer);
        }
      }

      public onNativeError(): void {
        this.state = 'fallback';
        this.fallbackReason = 'Playback error encountered.';
        if (this.watchdogTimer) clearTimeout(this.watchdogTimer);
      }
    }

    it('initializes in idle state', () => {
      const player = new ControlledPlayerStateMachine(
        'https://www.youtube-nocookie.com/embed/IIQ3mIGKquc?autoplay=1&enablejsapi=1',
        CANONICAL_YOUTUBE_URL
      );
      expect(player.state).toBe('idle');
      expect(player.fallbackReason).toBe('');
    });

    it('transitions idle -> loading -> playing on clean iframe load', () => {
      const player = new ControlledPlayerStateMachine(
        'https://www.youtube-nocookie.com/embed/IIQ3mIGKquc?autoplay=1&enablejsapi=1',
        CANONICAL_YOUTUBE_URL
      );

      player.play();
      expect(player.state).toBe('loading');

      player.onIframeLoad();
      expect(player.state).toBe('playing');
      expect(player.fallbackReason).toBe('');
    });

    it('traps YouTube postMessage error 150 (embed disabled) and transitions to fallback', () => {
      const player = new ControlledPlayerStateMachine(
        'https://www.youtube-nocookie.com/embed/IIQ3mIGKquc?autoplay=1&enablejsapi=1',
        CANONICAL_YOUTUBE_URL
      );

      player.play();
      expect(player.state).toBe('loading');

      // YouTube player API postMessage notification for error 150
      player.handlePostMessage({
        event: 'onError',
        data: 150,
      });

      expect(player.state).toBe('fallback');
      expect(player.fallbackReason).toContain('Embedding disabled by content owner');
    });

    it('traps YouTube postMessage error 101 (embed disabled) and transitions to fallback', () => {
      const player = new ControlledPlayerStateMachine(
        'https://www.youtube-nocookie.com/embed/IIQ3mIGKquc?autoplay=1&enablejsapi=1',
        CANONICAL_YOUTUBE_URL
      );

      player.play();
      player.handlePostMessage(JSON.stringify({
        event: 'onError',
        data: 101,
      }));

      expect(player.state).toBe('fallback');
      expect(player.fallbackReason).toContain('Embedding disabled by content owner');
    });

    it('transitions to fallback when watchdog timer expires (4500ms)', () => {
      const player = new ControlledPlayerStateMachine(
        'https://www.youtube-nocookie.com/embed/IIQ3mIGKquc?autoplay=1&enablejsapi=1',
        CANONICAL_YOUTUBE_URL,
        4500
      );

      player.play();
      expect(player.state).toBe('loading');

      // Fast-forward past 4500ms
      vi.advanceTimersByTime(4600);

      expect(player.state).toBe('fallback');
      expect(player.fallbackReason).toContain('Embed response timed out');
    });

    it('transitions to fallback on native iframe onError event', () => {
      const player = new ControlledPlayerStateMachine(
        'https://www.youtube-nocookie.com/embed/IIQ3mIGKquc?autoplay=1&enablejsapi=1',
        CANONICAL_YOUTUBE_URL
      );

      player.play();
      player.onNativeError();

      expect(player.state).toBe('fallback');
      expect(player.fallbackReason).toContain('Playback error encountered');
    });

    it('ensures fallback provides pristine canonical external link and label', () => {
      const player = new ControlledPlayerStateMachine(
        'https://www.youtube-nocookie.com/embed/IIQ3mIGKquc?autoplay=1&enablejsapi=1',
        CANONICAL_YOUTUBE_URL
      );

      player.play();
      player.handlePostMessage({ event: 'onError', data: 150 });

      expect(player.state).toBe('fallback');
      expect(player.externalUrl).toBe('https://www.youtube.com/watch?v=IIQ3mIGKquc');
    });
  });

  describe('3. Embed Origin Security Gate & Host Whitelisting', () => {
    it('approves legitimate video & audio embed origins including Facebook and Instagram', () => {
      expect(isSafeEmbedUrl('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')).toBe(true);
      expect(isSafeEmbedUrl('https://www.youtube.com/embed/videoseries?list=PL123')).toBe(true);
      expect(isSafeEmbedUrl('https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Ffb.com')).toBe(true);
      expect(isSafeEmbedUrl('https://web.facebook.com/plugins/post.php?href=xyz')).toBe(true);
      expect(isSafeEmbedUrl('https://www.instagram.com/p/C4s9-123/embed/')).toBe(true);
      expect(isSafeEmbedUrl('https://www.instagram.com/reel/C4s9-456/embed/')).toBe(true);
      expect(isSafeEmbedUrl('https://www.tiktok.com/embed/v2/123456789')).toBe(true);
      expect(isSafeEmbedUrl('https://open.spotify.com/embed/track/123')).toBe(true);
      expect(isSafeEmbedUrl('https://player.vimeo.com/video/123')).toBe(true);
    });

    it('rejects unapproved, HTTP, and malicious origins', () => {
      expect(isSafeEmbedUrl('http://www.youtube.com/embed/123')).toBe(false);
      expect(isSafeEmbedUrl('https://attacker-embed.com/video')).toBe(false);
      expect(isSafeEmbedUrl('javascript:alert(1)')).toBe(false);
      expect(isSafeEmbedUrl('https://169.254.169.254/embed')).toBe(false);
      expect(isSafeEmbedUrl('')).toBe(false);
      expect(isSafeEmbedUrl(undefined)).toBe(false);
    });
  });
});
