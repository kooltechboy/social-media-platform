import { NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '../../../../../lib/supabase/server';
import { verifyMediaUrlAccessible } from '@caribbean/media';
import { CARIBBEAN_SOUNDS } from '../../../../../lib/constants/caribbean-sounds';

export const dynamic = 'force-dynamic';

interface MediaHealthItem {
  kind: 'sound' | 'video' | 'reel' | 'podcast_episode';
  id: string;
  title: string;
  url: string;
  accessible: boolean;
  httpStatus?: number;
  contentType?: string | null;
  contentLength?: number | null;
  latencyMs: number;
  error?: string;
}

export async function GET() {
  const startTime = Date.now();
  const supabase = await createServiceSupabaseClient();
  const itemsToVerify: Array<{
    kind: 'sound' | 'video' | 'reel' | 'podcast_episode';
    id: string;
    title: string;
    url: string;
  }> = [];

  // 1. Gather Caribbean Sounds
  if (supabase) {
    try {
      const { data: soundRows } = await supabase
        .from('sounds')
        .select('id, title, audio_url')
        .limit(20);

      if (soundRows && soundRows.length > 0) {
        for (const s of soundRows) {
          if (s.audio_url) {
            itemsToVerify.push({
              kind: 'sound',
              id: s.id,
              title: s.title,
              url: s.audio_url,
            });
          }
        }
      }
    } catch {
      // Fall through to constants
    }
  }

  // Fallback to constant stems if DB has none
  if (itemsToVerify.filter((i) => i.kind === 'sound').length === 0) {
    for (const s of CARIBBEAN_SOUNDS) {
      itemsToVerify.push({
        kind: 'sound',
        id: s.id,
        title: s.title,
        url: s.audioUrl,
      });
    }
  }

  // 2. Gather Videos & Reels
  if (supabase) {
    try {
      const { data: videoRows } = await supabase
        .from('videos')
        .select('id, title, video_url, video_kind')
        .limit(20);

      if (videoRows && videoRows.length > 0) {
        for (const v of videoRows) {
          if (v.video_url) {
            itemsToVerify.push({
              kind: v.video_kind === 'reel' ? 'reel' : 'video',
              id: v.id,
              title: v.title || 'Reel Video',
              url: v.video_url,
            });
          }
        }
      }
    } catch {
      // Ignore
    }
  }

  // 3. Gather Podcast Episodes
  if (supabase) {
    try {
      const { data: epRows } = await supabase
        .from('podcast_episodes')
        .select('id, title, audio_path')
        .limit(20);

      if (epRows && epRows.length > 0) {
        for (const ep of epRows) {
          if (ep.audio_path) {
            itemsToVerify.push({
              kind: 'podcast_episode',
              id: ep.id,
              title: ep.title,
              url: ep.audio_path,
            });
          }
        }
      }
    } catch {
      // Ignore
    }
  }

  // Verify each URL concurrently (batches of 6 to avoid gateway rate limits)
  const results: MediaHealthItem[] = [];
  const batchSize = 6;

  for (let i = 0; i < itemsToVerify.length; i += batchSize) {
    const chunk = itemsToVerify.slice(i, i + batchSize);
    const chunkResults = await Promise.all(
      chunk.map(async (item) => {
        const itemStart = Date.now();
        const check = await verifyMediaUrlAccessible(item.url, 6000);
        const itemLatency = Date.now() - itemStart;

        return {
          kind: item.kind,
          id: item.id,
          title: item.title,
          url: item.url,
          accessible: check.accessible,
          httpStatus: check.status,
          contentType: check.contentType,
          contentLength: check.contentLength,
          latencyMs: itemLatency,
          error: check.error,
        };
      })
    );
    results.push(...chunkResults);
  }

  const totalAssets = results.length;
  const accessibleAssets = results.filter((r) => r.accessible).length;
  const failedAssets = totalAssets - accessibleAssets;
  const healthRatio = totalAssets > 0 ? accessibleAssets / totalAssets : 1.0;
  const allMediaOperational = failedAssets === 0;

  return NextResponse.json({
    status: allMediaOperational ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    durationMs: Date.now() - startTime,
    summary: {
      totalAssets,
      accessibleAssets,
      failedAssets,
      healthRatio: Math.round(healthRatio * 100) / 100,
      allMediaOperational,
    },
    details: results,
  });
}
