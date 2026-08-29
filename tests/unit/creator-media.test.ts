import { describe, it, expect } from 'vitest';
import {
  applyFees,
  evaluatePayout,
  TIER_PRICES_MINOR,
  isSubscriptionActive,
  nextPeriodEnd,
  DEFAULT_FEES,
  CREATOR_PLATFORM_TIERS,
  hasCreatorEntitlement,
} from '../../packages/creator/src/index';
import { MediaPipeline, SURFACE_LIMITS, storyExpiry, STAGE_ORDER } from '../../packages/media/src/index';

describe('Creator revenue math (minor units)', () => {
  it('splits a $4.99 subscription into platform, processing and creator net', () => {
    const breakdown = applyFees(TIER_PRICES_MINOR.plus);
    expect(breakdown.grossMinor).toBe(499);
    expect(breakdown.platformFeeMinor).toBe(75);
    expect(breakdown.processingFeeMinor).toBe(14);
    expect(breakdown.netToCreatorMinor).toBe(410);
    expect(
      breakdown.platformFeeMinor + breakdown.processingFeeMinor + breakdown.withholdingMinor + breakdown.netToCreatorMinor,
    ).toBe(breakdown.grossMinor);
  });

  it('rejects non-integer or non-positive gross amounts', () => {
    expect(() => applyFees(10.5)).toThrow('positive integer');
    expect(() => applyFees(0)).toThrow('positive integer');
  });

  it('never produces a negative creator net under default fees', () => {
    expect(applyFees(1).netToCreatorMinor).toBeGreaterThanOrEqual(0);
    expect(DEFAULT_FEES.platformCommissionBps + DEFAULT_FEES.paymentProcessingBps).toBeLessThan(10000);
  });
});

describe('Creator payout gates', () => {
  const base = {
    availableBalanceMinor: 20000,
    pendingBalanceMinor: 5000,
    payoutThresholdMinor: 5000,
    chargebackReserveMinor: 1000,
  };

  it('blocks payouts without verified KYC', () => {
    const evaluation = evaluatePayout({ ...base, kycStatus: 'unverified', fraudHold: false });
    expect(evaluation.eligible).toBe(false);
    expect(evaluation.reasons[0]).toContain('KYC');
  });

  it('blocks payouts during fraud holds', () => {
    const evaluation = evaluatePayout({ ...base, kycStatus: 'verified', fraudHold: true });
    expect(evaluation.eligible).toBe(false);
    expect(evaluation.reasons.join(' ')).toContain('fraud');
  });

  it('pays out available balance minus reserves when eligible', () => {
    const evaluation = evaluatePayout({ ...base, kycStatus: 'verified', fraudHold: false });
    expect(evaluation.eligible).toBe(true);
    expect(evaluation.amountMinor).toBe(19000);
  });
});

describe('Subscription lifecycle helpers', () => {
  it('detects active subscriptions from status and period end', () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    const past = new Date(Date.now() - 86400000).toISOString();
    expect(isSubscriptionActive('active', future)).toBe(true);
    expect(isSubscriptionActive('active', past)).toBe(false);
    expect(isSubscriptionActive('cancelled', future)).toBe(false);
  });

  it('rolls monthly periods forward', () => {
    const from = new Date('2026-08-20T00:00:00Z');
    expect(nextPeriodEnd(from).toISOString()).toBe('2026-09-20T00:00:00.000Z');
  });
});

describe('Media pipeline (surface limits + stage machine)', () => {
  const pipeline = new MediaPipeline();

  it('enforces per-surface kind and size limits', () => {
    expect(pipeline.validateUpload('video', 'reel', 100 * 1024 * 1024).valid).toBe(true);
    expect(pipeline.validateUpload('image', 'reel', 1024).valid).toBe(false);
    expect(pipeline.validateUpload('image', 'post', 60 * 1024 * 1024).valid).toBe(false);
    expect(SURFACE_LIMITS.story.allowedKinds).toEqual(['image', 'video']);
  });

  it('walks the processing stages in order and refuses skips', () => {
    const asset = { id: 'm_1', kind: 'video' as const, surface: 'reel' as const, stage: 'uploaded' as const, sizeBytes: 1, createdAt: '' };
    const quarantined = pipeline.transition(asset, 'quarantined');
    const processing = pipeline.transition(quarantined, 'processing');
    expect(() => pipeline.transition(processing, 'ready')).toThrow('Invalid transition');
    const transcoded = pipeline.transition(processing, 'transcoding');
    expect(transcoded.stage).toBe('transcoding');
    expect(pipeline.isDeliverable(transcoded)).toBe(false);
  });

  it('only delivers ready assets via expiring signed URLs', () => {
    const ready = { id: 'm_2', kind: 'image' as const, surface: 'post' as const, stage: 'ready' as const, sizeBytes: 1, createdAt: '' };
    const signed = pipeline.signedUrlTemplate(ready, 'posts/m_2.jpg', 60);
    expect(signed.url).toContain('/cdn/posts/m_2.jpg');
    expect(signed.expiresInSeconds).toBe(60);
    expect(() =>
      pipeline.signedUrlTemplate({ ...ready, stage: 'processing' }, 'x', 60),
    ).toThrow('not ready');
  });

  it('expires stories after 24 hours', () => {
    const now = new Date('2026-08-20T12:00:00Z');
    expect(storyExpiry(now).toISOString()).toBe('2026-08-21T12:00:00.000Z');
    expect(STAGE_ORDER[STAGE_ORDER.length - 2]).toBe('ready');
  });

  it('validates file magic bytes against known media signatures', () => {
    // JPEG magic bytes: FF D8 FF
    const jpegHeader = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    expect(pipeline.validateMagicBytes(jpegHeader)).toEqual({ valid: true, detectedMime: 'image/jpeg' });

    // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
    const pngHeader = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(pipeline.validateMagicBytes(pngHeader)).toEqual({ valid: true, detectedMime: 'image/png' });

    // MP4 ftyp box: offset 4 'ftyp'
    const mp4Header = new Uint8Array([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70]);
    expect(pipeline.validateMagicBytes(mp4Header)).toEqual({ valid: true, detectedMime: 'video/mp4' });

    // Malicious executable disguised with empty or wrong bytes
    const badHeader = new Uint8Array([0x4d, 0x5a, 0x90, 0x00]); // DOS / PE binary
    expect(pipeline.validateMagicBytes(badHeader)).toEqual({ valid: false });
  });
});

describe('Centralized Creator Platform Tiers & Entitlement Engine', () => {
  it('defines 4 canonical tier levels with unambiguous pricing and limits', () => {
    expect(CREATOR_PLATFORM_TIERS.free_starter.monthlyPriceMinor).toBe(0);
    expect(CREATOR_PLATFORM_TIERS.creator_plus.monthlyPriceMinor).toBe(999);
    expect(CREATOR_PLATFORM_TIERS.creator_pro.monthlyPriceMinor).toBe(2499);
    expect(CREATOR_PLATFORM_TIERS.creator_vip.monthlyPriceMinor).toBe(4999);
  });

  it('evaluates active creator tier entitlements correctly', () => {
    // Free starter has storefront and basic fan memberships, but no live broadcast studio or 4K
    expect(hasCreatorEntitlement('free_starter', 'creator_storefront')).toBe(true);
    expect(hasCreatorEntitlement('free_starter', 'live_broadcast_studio')).toBe(false);
    expect(hasCreatorEntitlement('free_starter', 'media_4k_uploads')).toBe(false);

    // Creator Plus unlocks live studio & podcast hosting
    expect(hasCreatorEntitlement('creator_plus', 'live_broadcast_studio')).toBe(true);
    expect(hasCreatorEntitlement('creator_plus', 'podcast_network_hosting')).toBe(true);
    expect(hasCreatorEntitlement('creator_plus', 'media_4k_uploads')).toBe(false);

    // Creator Pro unlocks 4K uploads & SpotPay instant settlement
    expect(hasCreatorEntitlement('creator_pro', 'media_4k_uploads')).toBe(true);
    expect(hasCreatorEntitlement('creator_pro', 'spotpay_instant_settlement')).toBe(true);

    // VIP Artist unlocks verified badge & priority discovery
    expect(hasCreatorEntitlement('creator_vip', 'verified_creator_badge')).toBe(true);
    expect(hasCreatorEntitlement('creator_vip', 'priority_caribbean_discovery')).toBe(true);
  });

  it('falls back to starter entitlements if subscription status is expired or cancelled', () => {
    expect(hasCreatorEntitlement('creator_pro', 'media_4k_uploads', 'active')).toBe(true);
    expect(hasCreatorEntitlement('creator_pro', 'media_4k_uploads', 'grace')).toBe(true);
    expect(hasCreatorEntitlement('creator_pro', 'media_4k_uploads', 'expired')).toBe(false);
    expect(hasCreatorEntitlement('creator_pro', 'media_4k_uploads', 'cancelled')).toBe(false);
  });
});
