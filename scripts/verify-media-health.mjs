
async function main() {
  console.log('Testing TUKUBI Supabase Storage Media Health...');

  const supabaseUrl = 'https://qixlaqwohhrynownvqwp.supabase.co';
  const urlsToCheck = [
    // Caribbean sounds
    { name: 'Sound: Steelpan', url: `${supabaseUrl}/storage/v1/object/public/caribbean-sounds/stems/sound-soca-01.wav` },
    { name: 'Sound: Dancehall', url: `${supabaseUrl}/storage/v1/object/public/caribbean-sounds/stems/sound-dancehall-02.wav` },
    { name: 'Sound: Kompa', url: `${supabaseUrl}/storage/v1/object/public/caribbean-sounds/stems/sound-kompa-03.wav` },
    { name: 'Sound: Bachata', url: `${supabaseUrl}/storage/v1/object/public/caribbean-sounds/stems/sound-bachata-04.wav` },
    { name: 'Sound: Reggae', url: `${supabaseUrl}/storage/v1/object/public/caribbean-sounds/stems/sound-reggae-05.wav` },
    { name: 'Sound: Calypso', url: `${supabaseUrl}/storage/v1/object/public/caribbean-sounds/stems/sound-calypso-06.wav` },
    { name: 'Sound: Zouk', url: `${supabaseUrl}/storage/v1/object/public/caribbean-sounds/stems/sound-zouk-07.wav` },
    { name: 'Sound: Bouyon', url: `${supabaseUrl}/storage/v1/object/public/caribbean-sounds/stems/sound-bouyon-08.wav` },
    { name: 'Sound: Punta', url: `${supabaseUrl}/storage/v1/object/public/caribbean-sounds/stems/sound-punta-09.wav` },
    { name: 'Sound: Chutney', url: `${supabaseUrl}/storage/v1/object/public/caribbean-sounds/stems/sound-chutney-10.wav` },
    { name: 'Sound: Parang', url: `${supabaseUrl}/storage/v1/object/public/caribbean-sounds/stems/sound-parang-11.wav` },
    { name: 'Sound: Soca', url: `${supabaseUrl}/storage/v1/object/public/caribbean-sounds/stems/sound-soca-12.wav` },
    // MP3 versions
    { name: 'Sound MP3: Steelpan', url: `${supabaseUrl}/storage/v1/object/public/caribbean-sounds/stems/sound-soca-01.mp3` },
    { name: 'Sound MP3: Soca', url: `${supabaseUrl}/storage/v1/object/public/caribbean-sounds/stems/sound-soca-12.mp3` },
    // Video Reels
    { name: 'Reel Video 1', url: `${supabaseUrl}/storage/v1/object/public/post-media/reels/caribbean-sunset-reel-01.mp4` },
    { name: 'Reel Video 2', url: `${supabaseUrl}/storage/v1/object/public/post-media/reels/trinidad-carnival-reel-02.mp4` },
    { name: 'Reel Video 3', url: `${supabaseUrl}/storage/v1/object/public/post-media/reels/jamaica-roots-reel-03.mp4` },
    // Podcast Episodes
    { name: 'Podcast Episode 1 WAV', url: `${supabaseUrl}/storage/v1/object/public/podcast-audio/episodes/sound-archives-ep-01.wav` },
    { name: 'Podcast Episode 1 MP3', url: `${supabaseUrl}/storage/v1/object/public/podcast-audio/episodes/sound-archives-ep-01.mp3` },
  ];

  let healthy = 0;
  for (const item of urlsToCheck) {
    const start = Date.now();
    try {
      const res = await fetch(item.url, { method: 'HEAD' });
      const latency = Date.now() - start;
      const ok = res.status === 200 || res.status === 206;
      const type = res.headers.get('content-type');
      const length = res.headers.get('content-length');
      if (ok) healthy++;
      console.log(`[${ok ? 'OK ' : 'ERR'}] ${item.name}: HTTP ${res.status} (${latency}ms) - ${type}, ${length} bytes`);
    } catch (e) {
      console.log(`[ERR] ${item.name}: ${e.message}`);
    }
  }

  console.log(`\nMedia Health Summary: ${healthy}/${urlsToCheck.length} verified 100% operational.`);
}

main().catch(console.error);
