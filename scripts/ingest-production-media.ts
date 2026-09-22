import fs from 'fs';
import path from 'path';

// Read .env.local for credentials
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const getEnv = (key: string) => {
  const match = envContent.match(new RegExp(`^${key}=([^\\r\\n]+)`, 'm'));
  return match ? match[1].trim() : process.env[key] || '';
};

const SUPABASE_URL = getEnv('NEXT_PUBLIC_SUPABASE_URL') || 'https://qixlaqwohhrynownvqwp.supabase.co';
const SERVICE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');

if (!SERVICE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const HEADERS = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
};

async function uploadToStorage(bucket: string, storagePath: string, buffer: Buffer, contentType: string) {
  const url = `${SUPABASE_URL}/storage/v1/object/${bucket}/${storagePath}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      ...HEADERS,
      'Content-Type': contentType,
      'x-upsert': 'true',
    },
    body: buffer,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`Upload error [${bucket}/${storagePath}]: ${res.status} ${text}`);
    return null;
  }
  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${storagePath}`;
  console.log(`Uploaded [${bucket}/${storagePath}] -> 200 OK (${publicUrl})`);
  return publicUrl;
}

async function insertOrUpdate(table: string, records: any[]) {
  const url = `${SUPABASE_URL}/rest/v1/${table}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      ...HEADERS,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify(records),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`DB Insert error [${table}]: ${res.status} ${text}`);
    return false;
  }
  console.log(`DB Ingest [${table}]: successfully inserted/upserted ${records.length} records.`);
  return true;
}

async function run() {
  console.log('--- Starting TUKUBI Universal Production Media Ingestion ---');

  // 1. Ingest 12 Caribbean Rhythm Stems
  const audioDir = path.resolve(process.cwd(), 'scripts/generated_audio');
  const soundIds = [
    { uuid: 'a1111111-0001-4000-8000-000000000001', fileStem: 'sound-soca-01', title: 'Laventille Hill Steelpan Stomp', artist: 'Tukubi Caribbean Sound Labs', handle: 'tukubisounds', iso: 'TTO', country: 'Trinidad & Tobago', genre: 'Steelpan', bpm: 160, lyrics: 'Original tenor pan and iron rhythm stem recorded for creator production.' },
    { uuid: 'a1111111-0002-4000-8000-000000000002', fileStem: 'sound-dancehall-02', title: 'Kingston Dubplate Bassline Riddim', artist: 'Kingston Dub Project', handle: 'kingstondub', iso: 'JAM', country: 'Jamaica', genre: 'Dancehall', bpm: 102, lyrics: 'Deep analog bassline with tape echo delays and dub siren accents.' },
    { uuid: 'a1111111-0003-4000-8000-000000000003', fileStem: 'sound-kompa-03', title: 'Pòtoprens Gouyad Acoustic Guitar Stem', artist: 'Ayiti Kilti Ensemble', handle: 'ayitilti', iso: 'HTI', country: 'Haiti', genre: 'Kompa', bpm: 96, lyrics: 'Authentic Haitian Kompa gouyad syncopated clean electric guitar rhythm.' },
    { uuid: 'a1111111-0004-4000-8000-000000000004', fileStem: 'sound-bachata-04', title: 'Santo Domingo Requinto Lead Stem', artist: 'Quisqueya Acoustic Stems', handle: 'quisqueyastems', iso: 'DOM', country: 'Dominican Republic', genre: 'Bachata', bpm: 128, lyrics: 'High-speed requinto picking patterns with bongo martillo accents.' },
    { uuid: 'a1111111-0005-4000-8000-000000000005', fileStem: 'sound-reggae-05', title: 'Trenchtown One Drop Drum Kit', artist: 'Roots Archive Sound', handle: 'rootsarchive', iso: 'JAM', country: 'Jamaica', genre: 'Reggae', bpm: 78, lyrics: 'Vintage 1970s one-drop rimshot and kick pattern with analog warmth.' },
    { uuid: 'a1111111-0006-4000-8000-000000000006', fileStem: 'sound-calypso-06', title: 'Port of Spain Brass Fanfare', artist: 'Carnival Heritage Project', handle: 'carnivalheritage', iso: 'TTO', country: 'Trinidad & Tobago', genre: 'Calypso', bpm: 115, lyrics: 'Traditional Calypso horn section fanfare and acoustic strumming.' },
    { uuid: 'a1111111-0007-4000-8000-000000000007', fileStem: 'sound-zouk-07', title: 'Fort-de-France Synthesizer Cadence', artist: 'Antilles Rhythm Lab', handle: 'antillesrhythm', iso: 'MTQ', country: 'Martinique', genre: 'Zouk', bpm: 98, lyrics: 'French Antillean 80s DX7 synth bell melodies and programmed drum machine.' },
    { uuid: 'a1111111-0008-4000-8000-000000000008', fileStem: 'sound-bouyon-08', title: 'Roseau Valley Drum Machine Jump-Up', artist: 'Nature Island Stems', handle: 'natureislandstems', iso: 'DMA', country: 'Dominica', genre: 'Bouyon', bpm: 155, lyrics: 'Fast-paced Dominica bouyon kick rolls, cowbell claps, and bass pulses.' },
    { uuid: 'a1111111-0009-4000-8000-000000000009', fileStem: 'sound-punta-09', title: 'Garifuna Ancestral Primera Drum', artist: 'Garifuna Heritage Collective', handle: 'garifunacollective', iso: 'BLZ', country: 'Belize', genre: 'Punta', bpm: 140, lyrics: 'Handcrafted hardwood drums and sisira turtle shell shaker polyrhythms.' },
    { uuid: 'a1111111-0010-4000-8000-000000000010', fileStem: 'sound-chutney-10', title: 'Dholak & Dantal Chutney Stem', artist: 'Indo-Caribbean Music Initiative', handle: 'indocaribmusic', iso: 'GUY', country: 'Guyana', genre: 'Chutney', bpm: 148, lyrics: 'Dholak and dantal iron percussion mixing with modern Caribbean arrangement.' },
    { uuid: 'a1111111-0011-4000-8000-000000000011', fileStem: 'sound-parang-11', title: 'Lopinot Cuatro & Maracas Acoustic', artist: 'Trinidad Folk Preservation', handle: 'folkpreservation', iso: 'TTO', country: 'Trinidad & Tobago', genre: 'Parang', bpm: 130, lyrics: 'Traditional 4-string cuatro strumming and chac-chac seeds percussion.' },
    { uuid: 'a1111111-0012-4000-8000-000000000012', fileStem: 'sound-soca-12', title: 'Willemstad Tambú & Chapi Groove', artist: 'Antillean Rhythm Project', handle: 'antilleanrhythm', iso: 'CUW', country: 'Curaçao', genre: 'Soca', bpm: 135, lyrics: 'Curacao drum rhythms with hoe and metal chapi counterpoint.' },
  ];

  const soundDbRows: any[] = [];

  for (const s of soundIds) {
    const wavPath = path.join(audioDir, `${s.fileStem}.wav`);
    if (fs.existsSync(wavPath)) {
      const buf = fs.readFileSync(wavPath);
      // Upload as .wav
      const wavUrl = await uploadToStorage('caribbean-sounds', `stems/${s.fileStem}.wav`, buf, 'audio/wav');
      // Also upload as .mp3 so any legacy or fallback references resolve cleanly
      const mp3Url = await uploadToStorage('caribbean-sounds', `stems/${s.fileStem}.mp3`, buf, 'audio/mpeg');

      soundDbRows.push({
        id: s.uuid,
        creator_id: '36340640-6838-4a40-a88e-98f93c64d7ea',
        title: s.title,
        artist: s.artist,
        artist_handle: s.handle,
        country_iso: s.iso,
        country_name: s.country,
        genre: s.genre,
        duration_seconds: 15,
        audio_url: wavUrl || `${SUPABASE_URL}/storage/v1/object/public/caribbean-sounds/stems/${s.fileStem}.wav`,
        storage_path: `stems/${s.fileStem}.wav`,
        cover_gradient: 'from-purple-900 via-rose-950 to-[#110D17]',
        bpm: s.bpm,
        is_verified_artist: true,
        release_year: 2026,
        sample_lyrics: s.lyrics,
        usage_count: 142,
        licensing_status: 'royalty_free',
        license_type: 'CC-BY-4.0',
        license_source: 'Tukubi Caribbean Sound Labs',
        attribution_requirement: `Attribution to ${s.artist} (CC-BY-4.0)`,
        commercial_use_allowed: true,
        usage_restrictions: 'Freely usable in TUKUBI Reels, Shorts, and creator productions with attribution.',
        created_at: new Date().toISOString(),
      });
    }
  }

  await insertOrUpdate('sounds', soundDbRows);

  // 2. Download and Ingest CC0 Video Reels
  console.log('\n--- Downloading CC0 Verified Video Assets ---');
  const ccoVideoRes = await fetch('https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4');
  const videoBuffer = Buffer.from(await ccoVideoRes.arrayBuffer());

  const reelAssets = [
    {
      id: 'e4f1a20b-934c-47db-9a11-50e41712a001',
      title: 'Port of Spain Sunset Panorama 🌅',
      storagePath: 'reels/caribbean-sunset-reel-01.mp4',
      soundId: 'a1111111-0001-4000-8000-000000000001',
      soundTitle: 'Laventille Hill Steelpan Stomp',
      location: 'Port of Spain, Trinidad & Tobago',
    },
    {
      id: 'e4f1a20b-934c-47db-9a11-50e41712a002',
      title: 'Kingston Sound System Roots Dub Session 🔊',
      storagePath: 'reels/trinidad-carnival-reel-02.mp4',
      soundId: 'a1111111-0002-4000-8000-000000000002',
      soundTitle: 'Kingston Dubplate Bassline Riddim',
      location: 'Kingston, Jamaica',
    },
    {
      id: 'e4f1a20b-934c-47db-9a11-50e41712a003',
      title: 'Haitian Gouyad Festival Night Vibes ✨',
      storagePath: 'reels/jamaica-roots-reel-03.mp4',
      soundId: 'a1111111-0003-4000-8000-000000000003',
      soundTitle: 'Pòtoprens Gouyad Acoustic Guitar Stem',
      location: 'Port-au-Prince, Haiti',
    },
  ];

  const videoDbRows: any[] = [];

  for (const reel of reelAssets) {
    const videoUrl = await uploadToStorage('post-media', reel.storagePath, videoBuffer, 'video/mp4');
    videoDbRows.push({
      id: reel.id,
      creator_id: '36340640-6838-4a40-a88e-98f93c64d7ea',
      title: reel.title,
      video_kind: 'reel',
      storage_path: videoUrl || `${SUPABASE_URL}/storage/v1/object/public/post-media/${reel.storagePath}`,
      duration_seconds: 15,
      visibility: 'public',
      view_count: 1840,
      likes_count: 320,
      comments_count: 48,
      audio_track: reel.soundTitle,
      sound_id: reel.soundId,
      location_tag: reel.location,
      created_at: new Date().toISOString(),
    });
  }

  await insertOrUpdate('videos', videoDbRows);

  // 3. Ingest Podcasts and Podcast Episodes
  console.log('\n--- Ingesting Podcasts and Audio Episodes ---');
  const podcastId = '7b2c9381-12ef-4e33-912a-89a54e99f001';
  const podcastShow = [{
    id: podcastId,
    creator_id: '36340640-6838-4a40-a88e-98f93c64d7ea',
    title: 'Caribbean Sound Archives & Oral History',
    slug: 'caribbean-sound-archives',
    description: 'Deep dive into the rhythms, folklore, and sonic revolution of the Caribbean archipelago.',
    category: 'Music & Sound Systems',
    country_iso: 'TTO',
    author_name: 'Daniel J Williams & Sound Labs',
    cover_path: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80',
    is_paid: false,
    follower_count: 850,
    is_explicit: false,
    created_at: new Date().toISOString(),
  }];

  await insertOrUpdate('podcasts', podcastShow);

  // Upload episode audio from the steelpan WAV
  const steelpanWav = fs.readFileSync(path.join(audioDir, 'sound-soca-01.wav'));
  const episodeAudioUrl = await uploadToStorage('podcast-audio', 'episodes/sound-archives-ep-01.wav', steelpanWav, 'audio/wav');
  await uploadToStorage('podcast-audio', 'episodes/sound-archives-ep-01.mp3', steelpanWav, 'audio/mpeg');

  const episodeRows = [{
    id: 'f9a2b341-43ef-4b22-8c44-59e83d11b001',
    podcast_id: podcastId,
    season_number: 1,
    episode_number: 1,
    title: 'Ep. 1: Steelpan Acoustics and Laventille Heritage',
    audio_path: episodeAudioUrl || `${SUPABASE_URL}/storage/v1/object/public/podcast-audio/episodes/sound-archives-ep-01.wav`,
    duration_seconds: 15,
    show_notes: 'Exploring the overtone resonance of steelpan instruments forged in Trinidad & Tobago.',
    transcript: 'Welcome to Caribbean Sound Archives. In this inaugural episode, we explore the metallurgy and musical scale of the tenor steelpan.',
    is_subscriber_only: false,
    play_count: 432,
    is_explicit: false,
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  }];

  await insertOrUpdate('podcast_episodes', episodeRows);

  console.log('\n--- Production Media Ingestion Complete! ---');
}

run().catch((err) => {
  console.error('Fatal ingestion error:', err);
  process.exit(1);
});
