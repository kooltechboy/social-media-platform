import { NextRequest, NextResponse } from 'next/server';
import { validateForgePublishPayload, type ForgePublishPayload, type ForgePublishResult } from '@caribbean/api';
import { createSupabaseServerClient } from '../../../../../lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-forge-key') || req.headers.get('authorization')?.replace('Bearer ', '');
  const expectedKey = process.env.FORGE_SERVICE_API_KEY;

  if (!expectedKey || apiKey !== expectedKey) {
    return NextResponse.json(
      { success: false, platform: 'tukubi', error: 'Unauthorized: Invalid or missing Forge Service Key', timestamp: new Date().toISOString() },
      { status: 401 }
    );
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { success: false, platform: 'tukubi', error: 'Internal server error: Database unreachable', timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }

  // Feature Flag Check: forge_integration_enabled
  const { data: flag } = await supabase
    .from('feature_flags')
    .select('is_enabled')
    .eq('flag_name', 'forge_integration_enabled')
    .maybeSingle();

  if (!flag || !flag.is_enabled) {
    return NextResponse.json(
      { success: false, platform: 'tukubi', error: 'Forge integration is currently disabled by feature flag', timestamp: new Date().toISOString() },
      { status: 403 }
    );
  }

  let payload: ForgePublishPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, platform: 'tukubi', error: 'Invalid JSON payload', timestamp: new Date().toISOString() },
      { status: 400 }
    );
  }

  const validation = validateForgePublishPayload(payload);
  if (!validation.valid) {
    return NextResponse.json(
      { success: false, platform: 'tukubi', error: validation.errors.join('; '), timestamp: new Date().toISOString() },
      { status: 400 }
    );
  }

  try {
    let publicationId: string | undefined;

    if (payload.contentType === 'post') {
      const mediaUrls = payload.content.media?.map((m: { url: string }) => m.url) || [];
      const { data, error } = await supabase
        .from('posts')
        .insert({
          author_id: payload.creatorId,
          content: payload.content.body,
          cultural_tags: payload.content.culturalTags || [],
          media_urls: mediaUrls,
          visibility: 'public',
        })
        .select('id')
        .single();

      if (error) throw error;
      publicationId = data.id;
    } else if (payload.contentType === 'reel') {
      const videoAsset = payload.content.media?.find((m: { kind: string }) => m.kind === 'video') || payload.content.media?.[0];
      const { data, error } = await supabase
        .from('videos')
        .insert({
          creator_id: payload.creatorId,
          title: payload.content.title || payload.content.body.slice(0, 60),
          description: payload.content.body,
          video_kind: 'reel',
          storage_path: videoAsset?.url || '',
          state: 'ready',
        })
        .select('id')
        .single();

      if (error) throw error;
      publicationId = data.id;
    } else if (payload.contentType === 'story') {
      const mediaAsset = payload.content.media?.[0];
      const { data, error } = await supabase
        .from('stories')
        .insert({
          author_id: payload.creatorId,
          media_url: mediaAsset?.url || null,
          media_kind: mediaAsset?.kind === 'video' ? 'video' : 'photo',
          caption: payload.content.body,
        })
        .select('id')
        .single();

      if (error) throw error;
      publicationId = data.id;
    }

    const result: ForgePublishResult = {
      success: true,
      platform: 'tukubi',
      publicationId,
      liveUrl: publicationId ? `https://tukubi.com/post/${publicationId}` : undefined,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        platform: 'tukubi',
        error: err?.message || 'Publishing failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
