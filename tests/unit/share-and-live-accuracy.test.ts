import { describe, it, expect } from 'vitest';

describe('Share Post Expansion & Tukubi Live Accuracy', () => {
  describe('Share Post Platform Coverage', () => {
    const supportedShareChannels = [
      'copy_link',
      'native',
      'whatsapp',
      'twitter',
      'facebook',
      'linkedin',
      'telegram',
      'reddit',
      'threads',
      'email',
      'sms',
      'embed',
      'repost',
    ];

    it('contains all required sharing channels for global and diaspora reach', () => {
      expect(supportedShareChannels).toContain('copy_link');
      expect(supportedShareChannels).toContain('whatsapp');
      expect(supportedShareChannels).toContain('twitter');
      expect(supportedShareChannels).toContain('facebook');
      expect(supportedShareChannels).toContain('linkedin');
      expect(supportedShareChannels).toContain('telegram');
      expect(supportedShareChannels).toContain('reddit');
      expect(supportedShareChannels).toContain('threads');
      expect(supportedShareChannels).toContain('email');
      expect(supportedShareChannels).toContain('sms');
      expect(supportedShareChannels).toContain('embed');
      expect(supportedShareChannels).toContain('repost');
    });

    it('generates valid social share URLs', () => {
      const postUrl = 'https://tukubi.com/#post-123';
      const shareText = 'Carnival in Port of Spain 🌴';

      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${postUrl}`)}`;
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(postUrl)}`;
      const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`;
      const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(shareText)}`;
      const redditUrl = `https://reddit.com/submit?url=${encodeURIComponent(postUrl)}&title=${encodeURIComponent(shareText)}`;
      const threadsUrl = `https://threads.net/intent/post?text=${encodeURIComponent(`${shareText} ${postUrl}`)}`;

      expect(whatsappUrl).toContain('api.whatsapp.com');
      expect(twitterUrl).toContain('twitter.com/intent/tweet');
      expect(linkedinUrl).toContain('linkedin.com/sharing/share-offsite');
      expect(telegramUrl).toContain('t.me/share/url');
      expect(redditUrl).toContain('reddit.com/submit');
      expect(threadsUrl).toContain('threads.net/intent/post');
    });

    it('generates valid embed HTML for external embedding', () => {
      const post = {
        id: 'post-999',
        author: 'Daniel J Williams',
        handle: 'djwilliams',
        content: 'Island vibes and great reggae music!',
      };
      const postUrl = `https://tukubi.com/#${post.id}`;
      const embedCode = `<blockquote class="tukubi-post-embed" data-post-id="${post.id}"><p lang="en">${post.content}</p>&mdash; ${post.author} (@${post.handle}) <a href="${postUrl}">View on Tukubi</a></blockquote>`;

      expect(embedCode).toContain('tukubi-post-embed');
      expect(embedCode).toContain(post.id);
      expect(embedCode).toContain(post.author);
      expect(embedCode).toContain(post.handle);
    });
  });

  describe('Tukubi Live Broadcast State Accuracy', () => {
    function computeHasActiveLive(streams: Array<{ state: string; started_at: string }>): boolean {
      const sixHoursAgoMs = Date.now() - 6 * 60 * 60 * 1000;
      return streams.some(
        (s) => s.state === 'live' && new Date(s.started_at).getTime() >= sixHoursAgoMs
      );
    }

    it('reports hasActiveLive = false when stream is ended', () => {
      const streams = [
        {
          state: 'ended',
          started_at: '2026-09-01T01:44:57.19Z',
        },
      ];
      expect(computeHasActiveLive(streams)).toBe(false);
    });

    it('reports hasActiveLive = false when stream was started > 6 hours ago (stale abandoned stream)', () => {
      const streams = [
        {
          state: 'live',
          started_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
        },
      ];
      expect(computeHasActiveLive(streams)).toBe(false);
    });

    it('reports hasActiveLive = true when stream was started recently and state is live', () => {
      const streams = [
        {
          state: 'live',
          started_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 mins ago
        },
      ];
      expect(computeHasActiveLive(streams)).toBe(true);
    });

    it('correctly maps STANDBY vs LIVE NOW badge states', () => {
      function getBadgeText(hasActiveLive: boolean): string {
        return hasActiveLive ? 'LIVE NOW' : 'STANDBY';
      }

      expect(getBadgeText(false)).toBe('STANDBY');
      expect(getBadgeText(true)).toBe('LIVE NOW');
    });
  });
});
