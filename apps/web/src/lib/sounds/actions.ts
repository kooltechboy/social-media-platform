'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentUser } from '../supabase/server';
import {
  CARIBBEAN_SOUNDS,
  type CaribbeanSound,
} from '../constants/caribbean-sounds';

export interface SoundActionResult<T = any> {
  success: boolean;
  error?: string | null;
  data?: T;
}

export interface FetchSoundsParams {
  query?: string;
  genre?: string;
  countryIso?: string;
  trendingOnly?: boolean;
  limit?: number;
}

function mapDbSoundToCaribbeanSound(row: any): CaribbeanSound {
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    artistHandle: row.artist_handle || undefined,
    countryIso: row.country_iso || 'CAR',
    countryName: row.country_name || 'Caribbean',
    flag: row.country_iso === 'JAM' ? '🇯🇲' :
          row.country_iso === 'TTO' ? '🇹🇹' :
          row.country_iso === 'BRB' ? '🇧🇧' :
          row.country_iso === 'HTI' ? '🇭🇹' :
          row.country_iso === 'DMA' ? '🇩🇲' :
          row.country_iso === 'LCA' ? '🇱🇨' :
          row.country_iso === 'GRD' ? '🇬🇩' :
          row.country_iso === 'VCT' ? '🇻🇨' :
          row.country_iso === 'ATG' ? '🇦🇬' :
          row.country_iso === 'KNA' ? '🇰🇳' :
          row.country_iso === 'BHS' ? '🇧🇸' :
          row.country_iso === 'GUY' ? '🇬🇾' :
          row.country_iso === 'SUR' ? '🇸🇷' :
          row.country_iso === 'BLZ' ? '🇧🇿' :
          row.country_iso === 'DOM' ? '🇩🇴' :
          row.country_iso === 'PRI' ? '🇵🇷' :
          row.country_iso === 'CUB' ? '🇨🇺' : '🌴',
    genre: row.genre,
    durationSeconds: row.duration_seconds || 30,
    durationFormatted: `${Math.floor((row.duration_seconds || 30) / 60)}:${String((row.duration_seconds || 30) % 60).padStart(2, '0')}`,
    audioUrl: row.audio_url,
    coverGradient: row.cover_gradient || 'from-purple-900 via-rose-950 to-[#110D17]',
    usageCount: row.usage_count || 0,
    usageCountFormatted: row.usage_count ? `${row.usage_count.toLocaleString()} uses` : '0 uses',
    bpm: row.bpm || 120,
    isTrending: (row.usage_count || 0) > 0,
    isVerifiedArtist: Boolean(row.is_verified_artist),
    releaseYear: row.release_year || 2026,
    sampleLyrics: row.sample_lyrics || undefined,
    licensingStatus: row.licensing_status || 'royalty_free',
    licenseType: row.license_type || 'CC-BY-4.0',
    licenseSource: row.license_source || 'Tukubi Media',
    attributionRequirement: row.attribution_requirement || 'Attribute original creator or Tukubi rhythm stem',
    commercialUseAllowed: row.commercial_use_allowed !== false,
    usageRestrictions: row.usage_restrictions || undefined,
    dateAdded: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : '2026-03-01',
  };
}

export async function fetchSoundsAction(params: FetchSoundsParams = {}): Promise<CaribbeanSound[]> {
  const supabase = await createSupabaseServerClient();
  let dbSounds: CaribbeanSound[] = [];

  if (supabase) {
    try {
      let query = supabase.from('sounds').select('*');

      if (params.genre && params.genre !== 'All Genres') {
        query = query.eq('genre', params.genre);
      }

      if (params.countryIso) {
        query = query.eq('country_iso', params.countryIso);
      }

      if (params.query) {
        const q = `%${params.query}%`;
        query = query.or(`title.ilike.${q},artist.ilike.${q},genre.ilike.${q}`);
      }

      if (params.trendingOnly) {
        query = query.gt('usage_count', 0).order('usage_count', { ascending: false });
      } else {
        query = query.order('usage_count', { ascending: false }).order('created_at', { ascending: false });
      }

      if (params.limit) {
        query = query.limit(params.limit);
      }

      const { data, error } = await query;
      if (!error && data) {
        dbSounds = data.map(mapDbSoundToCaribbeanSound);
      }
    } catch (err) {
      console.warn('[fetchSoundsAction] DB query failed, falling back to verified stems:', err);
    }
  }

  // Combine with verified royalty-free rhythm stems from CARIBBEAN_SOUNDS
  const existingIds = new Set(dbSounds.map((s) => s.id));
  const verifiedStems = CARIBBEAN_SOUNDS.filter((s) => !existingIds.has(s.id)).filter((s) => {
    if (params.genre && params.genre !== 'All Genres' && s.genre !== params.genre) {
      return false;
    }
    if (params.countryIso && s.countryIso !== params.countryIso) {
      return false;
    }
    if (params.trendingOnly && !s.isTrending) {
      return false;
    }
    if (params.query) {
      const q = params.query.toLowerCase();
      return (
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q) ||
        s.genre.toLowerCase().includes(q) ||
        s.countryName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const all = [...dbSounds, ...verifiedStems];

  if (params.trendingOnly) {
    return all.filter((s) => s.usageCount > 0).sort((a, b) => b.usageCount - a.usageCount);
  }

  return all;
}

export async function getSoundDetailsAction(soundId: string): Promise<{
  sound: CaribbeanSound | null;
  associatedReels: any[];
  totalUses: number;
}> {
  const supabase = await createSupabaseServerClient();
  let sound: CaribbeanSound | null = null;
  let associatedReels: any[] = [];
  let totalUses = 0;

  if (supabase) {
    try {
      // 1. Fetch Sound row if UUID
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(soundId);
      if (isUuid) {
        const { data: dbSound } = await supabase
          .from('sounds')
          .select('*')
          .eq('id', soundId)
          .maybeSingle();

        if (dbSound) {
          sound = mapDbSoundToCaribbeanSound(dbSound);
        }
      }

      // 2. Fetch associated videos
      let videoQuery = supabase
        .from('videos')
        .select(`
          id,
          title,
          description,
          thumbnail_url,
          mux_playback_id,
          view_count,
          likes_count,
          comments_count,
          aspect_ratio,
          created_at,
          profiles:profiles!videos_creator_id_fkey(
            id,
            display_name,
            username,
            avatar_url
          )
        `);

      if (isUuid) {
        videoQuery = videoQuery.eq('sound_id', soundId);
      } else {
        videoQuery = videoQuery.ilike('audio_track', `%${soundId}%`);
      }

      const { data: videos } = await videoQuery.order('created_at', { ascending: false }).limit(24);

      if (videos) {
        associatedReels = videos.map((v: any) => {
          const rawP = v.profiles;
          const p = Array.isArray(rawP) ? rawP[0] : rawP;
          return {
            id: v.id,
            title: v.title,
            thumbnailUrl: v.thumbnail_url,
            muxPlaybackId: v.mux_playback_id,
            views: Number(v.view_count) || 0,
            likes: Number(v.likes_count) || 0,
            comments: Number(v.comments_count) || 0,
            createdAt: v.created_at,
            author: {
              id: p?.id,
              displayName: p?.display_name || 'Caribbean Creator',
              username: p?.username || 'creator',
              avatarUrl: p?.avatar_url || null,
            },
          };
        });
        totalUses = associatedReels.length;
      }
    } catch (err) {
      console.warn('[getSoundDetailsAction] DB error:', err);
    }
  }

  // If not found in DB, check verified stems
  if (!sound) {
    const fallback = CARIBBEAN_SOUNDS.find((s) => s.id === soundId);
    if (fallback) {
      sound = {
        ...fallback,
        usageCount: Math.max(fallback.usageCount, totalUses),
        usageCountFormatted: `${Math.max(fallback.usageCount, totalUses)} uses`,
      };
    }
  }

  return {
    sound,
    associatedReels,
    totalUses: sound ? Math.max(sound.usageCount, totalUses) : totalUses,
  };
}

export async function uploadSoundAction(formData: FormData): Promise<SoundActionResult<CaribbeanSound>> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'You must be signed in to upload rhythm stems.' };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { success: false, error: 'Database service unavailable.' };
  }

  const file = formData.get('audioFile') as File | null;
  if (!file) {
    return { success: false, error: 'Please select an audio file (MP3, WAV, AAC).' };
  }

  if (file.size > 25 * 1024 * 1024) {
    return { success: false, error: 'Audio file must be under 25MB.' };
  }

  const title = String(formData.get('title') ?? '').trim();
  const genre = String(formData.get('genre') ?? 'Soca').trim();
  const countryIso = String(formData.get('countryIso') ?? 'TTO').trim().toUpperCase();
  const countryName = String(formData.get('countryName') ?? 'Trinidad & Tobago').trim();
  const bpm = parseInt(String(formData.get('bpm') ?? '120'), 10) || null;
  const licensingStatus = String(formData.get('licensingStatus') ?? 'original_creator').trim();
  const licenseType = String(formData.get('licenseType') ?? 'CC-BY-4.0').trim();
  const attributionRequirement = String(formData.get('attributionRequirement') ?? `Original audio by @${user.username || user.displayName}`).trim();
  const commercialUseAllowed = formData.get('commercialUseAllowed') !== 'false';
  const durationSeconds = parseInt(String(formData.get('durationSeconds') ?? '30'), 10) || 30;

  if (!title) {
    return { success: false, error: 'Title is required for this sound stem.' };
  }

  // Upload file to Supabase storage 'caribbean-sounds'
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'mp3';
  const filePath = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('caribbean-sounds')
    .upload(filePath, file, {
      contentType: file.type || 'audio/mpeg',
      upsert: false,
    });

  if (uploadError) {
    console.error('[uploadSoundAction] Storage upload error:', uploadError);
    return { success: false, error: `Failed to upload audio: ${uploadError.message}` };
  }

  const { data: publicUrlData } = supabase.storage
    .from('caribbean-sounds')
    .getPublicUrl(uploadData.path);

  const audioUrl = publicUrlData.publicUrl;

  // Insert into public.sounds
  const { data: inserted, error: insertError } = await supabase
    .from('sounds')
    .insert({
      creator_id: user.id,
      title,
      artist: user.displayName || user.username || 'Caribbean Creator',
      artist_handle: user.username || undefined,
      country_iso: countryIso,
      country_name: countryName,
      genre,
      duration_seconds: durationSeconds,
      audio_url: audioUrl,
      storage_path: uploadData.path,
      bpm,
      is_verified_artist: false,
      release_year: new Date().getFullYear(),
      usage_count: 0,
      licensing_status: licensingStatus,
      license_type: licenseType,
      attribution_requirement: attributionRequirement,
      commercial_use_allowed: commercialUseAllowed,
    })
    .select()
    .single();

  if (insertError) {
    console.error('[uploadSoundAction] DB insert error:', insertError);
    return { success: false, error: `Failed to register sound: ${insertError.message}` };
  }

  revalidatePath('/sounds');
  return {
    success: true,
    data: mapDbSoundToCaribbeanSound(inserted),
  };
}

export async function recordSoundUsageAction(
  soundId: string,
  videoId?: string,
  postId?: string
): Promise<SoundActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in to record usage.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database unavailable.' };

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(soundId);
    if (isUuid) {
      await supabase.from('sound_usage').insert({
        sound_id: soundId,
        video_id: videoId || null,
        post_id: postId || null,
        used_by: user.id,
      });
    }
  } catch (err) {
    console.warn('[recordSoundUsageAction] Non-blocking usage record failed:', err);
  }

  return { success: true };
}
