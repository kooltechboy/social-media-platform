import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  StreamStateMachine,
  GIFT_CATALOG,
  findGift,
  validateStreamCreation,
  formatLiveDuration,
} from '../../packages/live/src/index';
import {
  validateEpisode,
  validateChapters,
  buildRssFeed,
  slugifyPodcast,
  formatTimestamp,
  parseTimestampToSeconds,
} from '../../packages/podcasts/src/index';
import {
  applyFees,
  evaluatePayout,
  isSubscriptionActive,
  DEFAULT_FEES,
} from '../../packages/creator/src/index';

describe('TUKUBI Creator Platform — Production Certification Suite', () => {
  describe('1. ZERO MOCK DATA & BRAND INTEGRITY AUDIT', () => {
    it('enforces absolute absence of fake demo podcast IDs across web components', () => {
      const modalCode = readFileSync(
        resolve(__dirname, '../../apps/web/src/components/podcasts/create-podcast-modal.tsx'),
        'utf-8'
      );
      expect(modalCode).not.toContain('pod-showcase-1');
      expect(modalCode).not.toContain('<option value="pod-1">');
      expect(modalCode).not.toContain('<option value="pod-2">');
      expect(modalCode).not.toContain('<option value="pod-3">');
      expect(modalCode).not.toContain('<option value="pod-4">');
    });

    it('enforces absolute absence of mixkit mock media URLs across podcasts and live components', () => {
      const liveViewerCode = readFileSync(
        resolve(__dirname, '../../apps/web/src/components/live/live-viewer-player.tsx'),
        'utf-8'
      );
      const podcastFeedCode = readFileSync(
        resolve(__dirname, '../../apps/web/src/components/podcasts/podcast-network-feed.tsx'),
        'utf-8'
      );
      const podcastModalCode = readFileSync(
        resolve(__dirname, '../../apps/web/src/components/podcasts/create-podcast-modal.tsx'),
        'utf-8'
      );

      expect(liveViewerCode).not.toContain('DEFAULT_STREAM_VIDEO');
      expect(liveViewerCode).not.toContain('mixkit');
      expect(podcastFeedCode).not.toContain('mixkit');
      expect(podcastModalCode).not.toContain('mixkit');
    });

    it('enforces brand domain tukubi.com in RSS generation route and rejects obsolete domains', () => {
      const rssRouteCode = readFileSync(
        resolve(__dirname, '../../apps/web/src/app/api/v1/podcasts/[id]/rss/route.ts'),
        'utf-8'
      );
      expect(rssRouteCode).toContain('https://tukubi.com');
      expect(rssRouteCode).not.toContain('caribbeanone.app');
    });

    it('enforces live studio viewer counts and chat start at 0 with zero simulated system messages', () => {
      const liveStudioCode = readFileSync(
        resolve(__dirname, '../../apps/web/src/components/live/live-host-studio.tsx'),
        'utf-8'
      );
      expect(liveStudioCode).toContain('useState(0)');
      expect(liveStudioCode).toContain('useState<HostChatMessage[]>([])');
      expect(liveStudioCode).not.toContain("sender_name: 'Tukubi System'");
    });
  });

  describe('2. PODCAST PLATFORM LIFECYCLE & VALIDATION', () => {
    it('validates episode creation boundaries and inputs', () => {
      const valid = validateEpisode({
        podcastId: '7f9c8d5a-1234-5678-9abc-def012345678',
        seasonNumber: 1,
        episodeNumber: 1,
        title: 'Voices of the Archipelago: Maritime Heritage',
        durationSeconds: 1800,
        audioPath: 'user-uuid/master_ep_1.mp3',
        isSubscriberOnly: false,
      });
      expect(valid.valid).toBe(true);
      expect(valid.errors).toHaveLength(0);

      const tooShort = validateEpisode({
        podcastId: 'pod-uuid',
        seasonNumber: 1,
        episodeNumber: 1,
        title: 'Too Short',
        durationSeconds: 5,
        audioPath: 'path.mp3',
        isSubscriberOnly: false,
      });
      expect(tooShort.valid).toBe(false);
      expect(tooShort.errors[0]).toContain('too short');

      const missingAudio = validateEpisode({
        podcastId: 'pod-uuid',
        seasonNumber: 1,
        episodeNumber: 1,
        title: 'Valid Title',
        durationSeconds: 600,
        audioPath: '',
        isSubscriberOnly: false,
      });
      expect(missingAudio.valid).toBe(false);
      expect(missingAudio.errors[0]).toContain('Audio is required');
    });

    it('validates strictly ascending chapter markers', () => {
      const validChapters = [
        { startSeconds: 0, title: 'Introduction' },
        { startSeconds: 300, title: 'Deep Dive' },
        { startSeconds: 900, title: 'Interview with Historian' },
      ];
      expect(validateChapters(validChapters, 1800).valid).toBe(true);

      const invalidChapters = [
        { startSeconds: 0, title: 'Introduction' },
        { startSeconds: 600, title: 'Second' },
        { startSeconds: 400, title: 'Back in time' }, // Out of order!
      ];
      const res = validateChapters(invalidChapters, 1800);
      expect(res.valid).toBe(false);
      expect(res.errors[0]).toContain('ascending timestamp order');
    });

    it('builds standards-compliant RSS 2.0 XML with iTunes tags', () => {
      const xml = buildRssFeed({
        podcastTitle: 'Caribbean Tech Chronicles',
        podcastDescription: 'Innovation from Kingston to Port-of-Spain.',
        siteUrl: 'https://tukubi.com/podcasts/caribbean-tech-chronicles',
        feedUrl: 'https://tukubi.com/api/v1/podcasts/uuid/rss',
        language: 'en',
        coverUrl: 'https://tukubi.com/covers/tech.jpg',
        episodes: [
          {
            guid: 'ep-1-uuid',
            title: 'Episode 1: Decentralized Trade in the Diaspora',
            description: 'Discussing borderless payments and creator tokens.',
            audioUrl: 'https://tukubi.com/storage/ep1.mp3',
            durationSeconds: 1920,
            publishedAt: '2026-09-01T12:00:00Z',
            seasonNumber: 1,
            episodeNumber: 1,
          },
        ],
      });

      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('<rss version="2.0"');
      expect(xml).toContain('xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"');
      expect(xml).toContain('<title>Caribbean Tech Chronicles</title>');
      expect(xml).toContain('<itunes:duration>32:00</itunes:duration>');
      expect(xml).toContain('<itunes:email>podcasts@tukubi.com</itunes:email>');
      expect(xml).toContain('url="https://tukubi.com/storage/ep1.mp3"');
    });

    it('formats and parses audio timestamps bidirectionally', () => {
      expect(formatTimestamp(75)).toBe('1:15');
      expect(formatTimestamp(3665)).toBe('1:01:05');
      expect(parseTimestampToSeconds('1:15')).toBe(75);
      expect(parseTimestampToSeconds('1:01:05')).toBe(3665);
    });
  });

  describe('3. LIVE STREAMING STATE MACHINE & LIFECYCLE', () => {
    const machine = new StreamStateMachine();
    const stream = {
      creatorId: 'creator_abc',
      state: 'scheduled' as const,
      accessLevel: 'public' as const,
    };

    it('manages strict state lifecycle transitions', () => {
      expect(machine.canTransition('scheduled', 'live')).toBe(true);
      expect(machine.canTransition('scheduled', 'cancelled')).toBe(true);
      expect(machine.canTransition('live', 'ended')).toBe(true);
      expect(machine.canTransition('ended', 'live')).toBe(false);
      expect(machine.canTransition('cancelled', 'live')).toBe(false);

      expect(machine.transition('scheduled', 'live')).toBe('live');
      expect(machine.transition('live', 'ended')).toBe('ended');
      expect(() => machine.transition('ended', 'live')).toThrow();
    });

    it('verifies stream creation metadata and category definitions', () => {
      const valid = validateStreamCreation({
        creatorId: 'creator-uuid',
        title: 'Soca Monarch 2026 Virtual Rehearsal',
        accessLevel: 'public',
      });
      expect(valid.valid).toBe(true);

      const invalid = validateStreamCreation({
        creatorId: 'creator-uuid',
        title: 'Hi', // too short (<3 chars)
      });
      expect(invalid.valid).toBe(false);
    });

    it('resolves virtual gifting catalog with minor-unit ledger prices', () => {
      expect(GIFT_CATALOG.length).toBeGreaterThanOrEqual(4);
      const crown = findGift('carnival_crown');
      expect(crown?.priceMinor).toBe(999);
      expect(crown?.currency).toBe('USD');
      expect(crown?.emoji).toBe('👑');
    });
  });

  describe('4. CREATOR STUDIO, COMMERCE & FINANCIAL INTEGRITY', () => {
    it('applies platform fees accurately without mutable column increments', () => {
      const gross = 10000; // $100.00
      const fees = applyFees(gross, DEFAULT_FEES);

      expect(fees.grossMinor).toBe(10000);
      expect(fees.platformFeeMinor).toBe(1500); // 15%
      expect(fees.processingFeeMinor).toBe(290); // 2.9%
      expect(fees.netToCreatorMinor).toBe(8210); // $82.10
      expect(fees.platformFeeMinor + fees.processingFeeMinor + fees.netToCreatorMinor).toBe(gross);
    });

    it('evaluates KYC, fraud hold, and minimum threshold before permitting creator payouts', () => {
      const unverified = evaluatePayout({
        kycStatus: 'unverified',
        fraudHold: false,
        chargebackReserveMinor: 0,
        availableBalanceMinor: 25000,
        pendingBalanceMinor: 25000,
        payoutThresholdMinor: 5000,
      });
      expect(unverified.eligible).toBe(false);
      expect(unverified.reasons[0]).toContain('KYC verification required');

      const belowThreshold = evaluatePayout({
        kycStatus: 'verified',
        fraudHold: false,
        chargebackReserveMinor: 0,
        availableBalanceMinor: 3000, // $30 vs $50 threshold
        pendingBalanceMinor: 3000,
        payoutThresholdMinor: 5000,
      });
      expect(belowThreshold.eligible).toBe(false);
      expect(belowThreshold.reasons[0]).toContain('below threshold');

      const verifiedEligible = evaluatePayout({
        kycStatus: 'verified',
        fraudHold: false,
        chargebackReserveMinor: 1000,
        availableBalanceMinor: 10000,
        pendingBalanceMinor: 10000,
        payoutThresholdMinor: 5000,
      });
      expect(verifiedEligible.eligible).toBe(true);
      expect(verifiedEligible.amountMinor).toBe(9000); // 10000 - 1000 reserve
    });

    it('detects active vs expired subscriptions reliably', () => {
      const futureDate = new Date(Date.now() + 86400000 * 10).toISOString();
      const pastDate = new Date(Date.now() - 86400000).toISOString();

      expect(isSubscriptionActive('active', futureDate)).toBe(true);
      expect(isSubscriptionActive('active', pastDate)).toBe(false);
      expect(isSubscriptionActive('cancelled', futureDate)).toBe(false);
      expect(isSubscriptionActive('grace', futureDate)).toBe(true);
    });
  });

  describe('5. DATABASE MIGRATION 00057 INTEGRITY', () => {
    it('verifies migration 00057 contains proper RLS USING clause for podcast_episodes', () => {
      const migrationCode = readFileSync(
        resolve(__dirname, '../../supabase/migrations/00057_creator_platform_hardening.sql'),
        'utf-8'
      );
      expect(migrationCode).toContain('CREATE POLICY "Podcast creator writes episodes" ON public.podcast_episodes');
      expect(migrationCode).toContain('USING (');
      expect(migrationCode).toContain('WITH CHECK (');
    });

    it('verifies migration 00057 defines DELETE policies for podcasts, livestreams, and videos', () => {
      const migrationCode = readFileSync(
        resolve(__dirname, '../../supabase/migrations/00057_creator_platform_hardening.sql'),
        'utf-8'
      );
      expect(migrationCode).toContain('CREATE POLICY "Creator deletes own podcasts" ON public.podcasts');
      expect(migrationCode).toContain('CREATE POLICY "Creator deletes own livestreams" ON public.livestreams');
      expect(migrationCode).toContain('CREATE POLICY "Creator deletes own videos" ON public.videos');
    });

    it('verifies migration 00057 creates creator_content_drafts table with full owner RLS', () => {
      const migrationCode = readFileSync(
        resolve(__dirname, '../../supabase/migrations/00057_creator_platform_hardening.sql'),
        'utf-8'
      );
      expect(migrationCode).toContain('CREATE TABLE IF NOT EXISTS public.creator_content_drafts');
      expect(migrationCode).toContain('ALTER TABLE public.creator_content_drafts ENABLE ROW LEVEL SECURITY;');
      expect(migrationCode).toContain('CREATE POLICY "Creator manages own drafts" ON public.creator_content_drafts');
    });

    it('verifies migration 00057 defines automatic follower count sync trigger and RPCs', () => {
      const migrationCode = readFileSync(
        resolve(__dirname, '../../supabase/migrations/00057_creator_platform_hardening.sql'),
        'utf-8'
      );
      expect(migrationCode).toContain('CREATE OR REPLACE FUNCTION public.handle_podcast_follower_count_change');
      expect(migrationCode).toContain('CREATE TRIGGER trg_podcast_follower_count');
      expect(migrationCode).toContain('CREATE OR REPLACE FUNCTION public.increment_podcast_followers');
      expect(migrationCode).toContain('CREATE OR REPLACE FUNCTION public.decrement_podcast_followers');
    });
  });

  describe('6. SECOND-PASS AUDIT & PRODUCTION HARDENING', () => {
    it('verifies migration 00058 hardens live gifts RLS for stream participants and archives', () => {
      const mig00058 = readFileSync(
        resolve(__dirname, '../../supabase/migrations/00058_creator_platform_second_pass.sql'),
        'utf-8'
      );
      expect(mig00058).toContain('CREATE POLICY "Stream participants read gifts" ON public.live_gifts');
      expect(mig00058).toContain("state IN ('live', 'ended')");
      expect(mig00058).toContain('CREATE POLICY "Creator and sender delete chat" ON public.live_messages');
      expect(mig00058).toContain('CREATE OR REPLACE FUNCTION public.get_creator_gift_earnings');
    });

    it('verifies virtual live gifts catalog lookup and valid pricing in USD minor units', () => {
      expect(GIFT_CATALOG.length).toBeGreaterThanOrEqual(4);
      const rose = findGift('island_rose');
      expect(rose).toBeDefined();
      expect(rose?.priceMinor).toBe(99);
      expect(rose?.currency).toBe('USD');

      const crown = findGift('carnival_crown');
      expect(crown).toBeDefined();
      expect(crown?.priceMinor).toBe(999);

      const nonExistent = findGift('unknown_gift_xyz');
      expect(nonExistent).toBeUndefined();
    });

    it('verifies universal composer enforces real storage uploads with zero blob URL fallbacks', () => {
      const composerCode = readFileSync(
        resolve(__dirname, '../../apps/web/src/components/universal-composer.tsx'),
        'utf-8'
      );
      expect(composerCode).not.toContain('uploadedUrls.push(item.previewUrl)');
      expect(composerCode).toContain('Storage client is unavailable');
    });

    it('verifies podcasts slug page exports dynamic OpenGraph metadata and queries full episodes', () => {
      const slugPageCode = readFileSync(
        resolve(__dirname, '../../apps/web/src/app/podcasts/[slug]/page.tsx'),
        'utf-8'
      );
      expect(slugPageCode).toContain('export async function generateMetadata');
      expect(slugPageCode).toContain('podcast_episodes(');
      expect(slugPageCode).toContain('audio_path');
      expect(slugPageCode).toContain('chapters');
      expect(slugPageCode).toContain('show_notes');
    });

    it('verifies OpenGraph metadata is exported across all primary creator routes', () => {
      const livePageCode = readFileSync(
        resolve(__dirname, '../../apps/web/src/app/live/page.tsx'),
        'utf-8'
      );
      const podcastsPageCode = readFileSync(
        resolve(__dirname, '../../apps/web/src/app/podcasts/page.tsx'),
        'utf-8'
      );
      const createPageCode = readFileSync(
        resolve(__dirname, '../../apps/web/src/app/create/page.tsx'),
        'utf-8'
      );
      const studioPageCode = readFileSync(
        resolve(__dirname, '../../apps/web/src/app/creator-studio/page.tsx'),
        'utf-8'
      );

      expect(livePageCode).toContain('export const metadata: Metadata');
      expect(podcastsPageCode).toContain('export const metadata: Metadata');
      expect(createPageCode).toContain('export const metadata: Metadata');
      expect(studioPageCode).toContain('export const metadata: Metadata');
    });

    it('verifies create-hub triggers in-app podcast creator modal and passes creator shows', () => {
      const hubCode = readFileSync(
        resolve(__dirname, '../../apps/web/src/components/create-hub-client.tsx'),
        'utf-8'
      );
      expect(hubCode).toContain("tool.id === 'podcast'");
      expect(hubCode).toContain('setIsPodcastModalOpen(true)');
      expect(hubCode).toContain('existingPodcasts={creatorPodcasts}');
    });
  });
});
