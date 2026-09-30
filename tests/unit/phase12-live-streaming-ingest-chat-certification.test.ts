import { describe, it, expect } from 'vitest';
import {
  StreamStateMachine,
  StreamContext,
  StreamState,
  GIFT_CATALOG,
  findGift,
  validateGiftPurchase,
  validateStreamCreation,
  formatLiveDuration,
  CloudflareStreamClient,
  validateLiveProductPin,
  calculateLiveDiscountPrice,
} from '../../packages/live/src/index';

describe('Phase 12 — Live Streaming, Cloudflare Ingest & Chat Ledger Certification', () => {
  // ===========================================================================
  // 1. Stream State Machine & Lifecycle Transitions
  // ===========================================================================
  describe('1. Stream State Machine & Lifecycle Invariants', () => {
    const sm = new StreamStateMachine();

    it('allows valid transitions: scheduled -> live -> ended', () => {
      expect(sm.canTransition('scheduled', 'live')).toBe(true);
      expect(sm.transition('scheduled', 'live')).toBe('live');

      expect(sm.canTransition('live', 'ended')).toBe(true);
      expect(sm.transition('live', 'ended')).toBe('ended');
    });

    it('allows cancelling a scheduled stream', () => {
      expect(sm.canTransition('scheduled', 'cancelled')).toBe(true);
      expect(sm.transition('scheduled', 'cancelled')).toBe('cancelled');
    });

    it('strictly forbids illegal transitions (ended -> live, cancelled -> live, live -> scheduled)', () => {
      expect(sm.canTransition('ended', 'live')).toBe(false);
      expect(() => sm.transition('ended', 'live')).toThrow('Invalid stream transition');

      expect(sm.canTransition('cancelled', 'live')).toBe(false);
      expect(() => sm.transition('cancelled', 'live')).toThrow('Invalid stream transition');

      expect(sm.canTransition('live', 'scheduled')).toBe(false);
      expect(() => sm.transition('live', 'scheduled')).toThrow('Invalid stream transition');
    });

    it('updates peak viewers accurately without regression', () => {
      expect(sm.updatePeakViewers(100, 150)).toBe(150);
      expect(sm.updatePeakViewers(150, 120)).toBe(150);
      expect(sm.updatePeakViewers(150, 300)).toBe(300);
    });
  });

  // ===========================================================================
  // 2. Audience Gating & Chat Ledger Moderation
  // ===========================================================================
  describe('2. Audience Gating & Live Chat Permissions', () => {
    const sm = new StreamStateMachine();

    const baseStream: StreamContext = {
      creatorId: 'creator_jamaica',
      state: 'live',
      accessLevel: 'public',
    };

    it('always permits creator to view their own stream regardless of access level', () => {
      const subOnlyStream: StreamContext = { ...baseStream, accessLevel: 'subscribers' };
      const creatorViewer = {
        id: 'creator_jamaica',
        followsCreator: false,
        isSubscriber: false,
        communityMember: false,
      };
      expect(sm.canView(subOnlyStream, creatorViewer)).toBe(true);
    });

    it('enforces audience permissions across public, followers, and subscribers levels', () => {
      const followerStream: StreamContext = { ...baseStream, accessLevel: 'followers' };
      expect(sm.canView(followerStream, { id: 'u1', followsCreator: true, isSubscriber: false, communityMember: false })).toBe(true);
      expect(sm.canView(followerStream, { id: 'u2', followsCreator: false, isSubscriber: false, communityMember: false })).toBe(false);

      const subStream: StreamContext = { ...baseStream, accessLevel: 'subscribers' };
      expect(sm.canView(subStream, { id: 'u3', followsCreator: true, isSubscriber: true, communityMember: false })).toBe(true);
      expect(sm.canView(subStream, { id: 'u4', followsCreator: true, isSubscriber: false, communityMember: false })).toBe(false);
    });

    it('blocks banned users from chatting during live broadcast', () => {
      expect(sm.canChat(baseStream, { id: 'u1', banned: true })).toBe(false);
      expect(sm.canChat(baseStream, { id: 'u1', banned: false })).toBe(true);
    });

    it('forbids chatting when stream is not actively live', () => {
      const endedStream: StreamContext = { ...baseStream, state: 'ended' };
      const scheduledStream: StreamContext = { ...baseStream, state: 'scheduled' };

      expect(sm.canChat(endedStream, { id: 'u1', banned: false })).toBe(false);
      expect(sm.canChat(scheduledStream, { id: 'u1', banned: false })).toBe(false);
    });
  });

  // ===========================================================================
  // 3. Live Gifts Catalog & Financial Idempotency
  // ===========================================================================
  describe('3. Live Gifts Catalog & Idempotency Safety', () => {
    it('verifies all cultural gift items have valid integer prices in minor units', () => {
      expect(GIFT_CATALOG.length).toBeGreaterThanOrEqual(4);
      GIFT_CATALOG.forEach((gift) => {
        expect(Number.isInteger(gift.priceMinor)).toBe(true);
        expect(gift.priceMinor).toBeGreaterThan(0);
        expect(gift.currency).toBe('USD');
        expect(gift.emoji.length).toBeGreaterThan(0);
      });
    });

    it('retrieves gifts by canonical key', () => {
      const steelPan = findGift('steel_pan');
      expect(steelPan).toBeDefined();
      expect(steelPan?.label).toBe('Steel Pan');
      expect(steelPan?.priceMinor).toBe(499); // $4.99
    });

    it('validates gift purchase and requires at least 8-character idempotency key', () => {
      const valid = validateGiftPurchase({
        giftKey: 'carnival_crown',
        senderId: 'fan_123',
        livestreamId: 'stream_789',
        idempotencyKey: 'idemp_crown_999888',
      });
      expect(valid.valid).toBe(true);
      expect(valid.errors.length).toBe(0);

      const invalid = validateGiftPurchase({
        giftKey: 'fake_gift',
        senderId: '',
        livestreamId: '',
        idempotencyKey: 'short',
      });
      expect(invalid.valid).toBe(false);
      expect(invalid.errors.length).toBe(4);
    });
  });

  // ===========================================================================
  // 4. Cloudflare Stream Ingest & Live Commerce
  // ===========================================================================
  describe('4. Cloudflare Ingest Architecture & Live Commerce', () => {
    it('generates compliant HLS and DASH playback URLs from Cloudflare Stream Client', async () => {
      const client = new CloudflareStreamClient({
        accountId: 'mock_cf_account',
        apiToken: 'mock_cf_token',
      });

      // Mock global fetch for live input creation
      const originalFetch = global.fetch;
      global.fetch = async () =>
        ({
          ok: true,
          json: async () => ({
            result: {
              uid: 'live_uid_12345',
              rtmps: { url: 'rtmps://live.cloudflare.com:443/live/', streamKey: 'secret_key_abc' },
              webRTC: { url: 'https://customer-mock.cloudflarestream.com/live_uid_12345/webRTC/publish' },
            },
          }),
        } as any);

      try {
        const input = await client.createLiveInput({
          name: 'Carnival Jouvert Stream',
          creatorId: 'creator_trinidad',
        });

        expect(input.uid).toBe('live_uid_12345');
        expect(input.rtmpsUrl).toContain('rtmps://');
        expect(input.rtmpsKey).toBe('secret_key_abc');
        expect(input.playbackHlsUrl).toBe(
          'https://customer-mock_cf_account.cloudflarestream.com/live_uid_12345/manifest/video.m3u8'
        );
        expect(input.playbackDashUrl).toBe(
          'https://customer-mock_cf_account.cloudflarestream.com/live_uid_12345/manifest/video.mpd'
        );
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('calculates live flash discounts with basis point precision and upper clamp', () => {
      // 20% discount (2000 bps) on $50.00 (5000 minor units)
      const res = calculateLiveDiscountPrice(5000, 2000);
      expect(res.discountedMinor).toBe(4000); // $40.00
      expect(res.savingsMinor).toBe(1000);     // $10.00

      // Flash discount capped at 90%
      const extreme = calculateLiveDiscountPrice(10000, 9500);
      expect(extreme.discountedMinor).toBe(1000); // 90% of 10000 = 9000 savings -> 1000 minor
    });

    it('validates stream creation parameters and rejects titles under 3 characters', () => {
      const valid = validateStreamCreation({
        creatorId: 'cr_1',
        title: 'Tukubi Sunset Acoustic Session',
      });
      expect(valid.valid).toBe(true);

      const invalid = validateStreamCreation({
        creatorId: '',
        title: 'No',
      });
      expect(invalid.valid).toBe(false);
      expect(invalid.errors).toContain('Creator ID is required');
      expect(invalid.errors).toContain('Stream title must be at least 3 characters');
    });

    it('formats stream duration cleanly across minute and hour boundaries', () => {
      expect(formatLiveDuration(45)).toBe('0:45');
      expect(formatLiveDuration(125)).toBe('2:05');
      expect(formatLiveDuration(3665)).toBe('1:01:05');
    });
  });
});
