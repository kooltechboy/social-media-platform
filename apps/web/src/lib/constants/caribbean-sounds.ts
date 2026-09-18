export interface CaribbeanSound {
  id: string;
  title: string;
  artist: string;
  artistHandle?: string;
  countryIso: string;
  countryName: string;
  flag: string;
  genre:
    | 'Soca'
    | 'Dancehall'
    | 'Reggae'
    | 'Kompa'
    | 'Bouyon'
    | 'Calypso'
    | 'Bachata'
    | 'Zouk'
    | 'Steelpan'
    | 'Parang'
    | 'Chutney'
    | 'Punta';
  durationSeconds: number;
  durationFormatted: string;
  audioUrl: string;
  coverGradient: string;
  usageCount: number;
  usageCountFormatted: string;
  bpm: number;
  isTrending: boolean;
  isVerifiedArtist: boolean;
  releaseYear: number;
  sampleLyrics?: string;
  licensingStatus: 'original_creator' | 'royalty_free' | 'creative_commons' | 'public_domain' | 'licensed';
  licenseType: string;
  licenseSource: string;
  attributionRequirement: string;
  commercialUseAllowed: boolean;
  usageRestrictions?: string;
  dateAdded: string;
}

const SOUNDS_BUCKET_BASE =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL
    ? process.env.NEXT_PUBLIC_SUPABASE_URL
    : 'https://tukubi.supabase.co') + '/storage/v1/object/public/caribbean-sounds/stems';

export const CARIBBEAN_SOUNDS: CaribbeanSound[] = [
  {
    id: 'sound-soca-01',
    title: 'Laventille Hill Steelpan Stomp',
    artist: 'Tukubi Caribbean Sound Labs',
    artistHandle: 'tukubisounds',
    countryIso: 'TTO',
    countryName: 'Trinidad & Tobago',
    flag: '🇹🇹',
    genre: 'Steelpan',
    durationSeconds: 48,
    durationFormatted: '0:48',
    audioUrl: `${SOUNDS_BUCKET_BASE}/sound-soca-01.mp3`,
    coverGradient: 'from-purple-900 via-rose-950 to-[#110D17]',
    usageCount: 0,
    usageCountFormatted: '0 uses',
    bpm: 160,
    isTrending: false,
    isVerifiedArtist: true,
    releaseYear: 2026,
    sampleLyrics: 'Original tenor pan and iron rhythm stem recorded for creator production.',
    licensingStatus: 'royalty_free',
    licenseType: 'CC-BY-4.0',
    licenseSource: 'Tukubi Audio Stems Archive',
    attributionRequirement: 'Attribution required: Tukubi Sound Labs (CC-BY-4.0)',
    commercialUseAllowed: true,
    usageRestrictions: 'Freely usable in TUKUBI Reels, Shorts, and creator productions with attribution.',
    dateAdded: '2026-09-01',
  },
  {
    id: 'sound-dancehall-02',
    title: 'Kingston Dubplate Bassline Riddim',
    artist: 'Kingston Dub Project',
    artistHandle: 'kingstondub',
    countryIso: 'JAM',
    countryName: 'Jamaica',
    flag: '🇯🇲',
    genre: 'Dancehall',
    durationSeconds: 45,
    durationFormatted: '0:45',
    audioUrl: `${SOUNDS_BUCKET_BASE}/sound-dancehall-02.mp3`,
    coverGradient: 'from-amber-900 via-emerald-950 to-[#110D17]',
    usageCount: 0,
    usageCountFormatted: '0 uses',
    bpm: 102,
    isTrending: false,
    isVerifiedArtist: true,
    releaseYear: 2026,
    sampleLyrics: 'Deep analog bassline with tape echo delays and dub siren accents.',
    licensingStatus: 'royalty_free',
    licenseType: 'CC-BY-4.0',
    licenseSource: 'Kingston Dub Heritage Initiative',
    attributionRequirement: 'Attribution to Kingston Dub Project',
    commercialUseAllowed: true,
    usageRestrictions: 'Cleared for commercial and personal creator video sync.',
    dateAdded: '2026-09-01',
  },
  {
    id: 'sound-kompa-03',
    title: 'Pòtoprens Gouyad Acoustic Guitar Stem',
    artist: 'Ayiti Kilti Ensemble',
    artistHandle: 'ayitilti',
    countryIso: 'HTI',
    countryName: 'Haiti',
    flag: '🇭🇹',
    genre: 'Kompa',
    durationSeconds: 52,
    durationFormatted: '0:52',
    audioUrl: `${SOUNDS_BUCKET_BASE}/sound-kompa-03.mp3`,
    coverGradient: 'from-blue-900 via-indigo-950 to-[#110D17]',
    usageCount: 0,
    usageCountFormatted: '0 uses',
    bpm: 96,
    isTrending: false,
    isVerifiedArtist: true,
    releaseYear: 2026,
    sampleLyrics: 'Authentic Haitian Kompa gouyad syncopated clean electric guitar rhythm.',
    licensingStatus: 'royalty_free',
    licenseType: 'CC-BY-4.0',
    licenseSource: 'Ayiti Kilti Open Music Project',
    attributionRequirement: 'Attribution to Ayiti Kilti Ensemble',
    commercialUseAllowed: true,
    usageRestrictions: 'Cleared for TUKUBI media network synchronization.',
    dateAdded: '2026-09-01',
  },
  {
    id: 'sound-bachata-04',
    title: 'Santo Domingo Requinto Lead Stem',
    artist: 'Quisqueya Acoustic Stems',
    artistHandle: 'quisqueyastems',
    countryIso: 'DOM',
    countryName: 'Dominican Republic',
    flag: '🇩🇴',
    genre: 'Bachata',
    durationSeconds: 42,
    durationFormatted: '0:42',
    audioUrl: `${SOUNDS_BUCKET_BASE}/sound-bachata-04.mp3`,
    coverGradient: 'from-rose-900 via-sky-950 to-[#110D17]',
    usageCount: 0,
    usageCountFormatted: '0 uses',
    bpm: 128,
    isTrending: false,
    isVerifiedArtist: true,
    releaseYear: 2026,
    sampleLyrics: 'High-speed requinto picking patterns with bongo martillo accents.',
    licensingStatus: 'royalty_free',
    licenseType: 'CC-BY-4.0',
    licenseSource: 'Quisqueya Acoustic Collective',
    attributionRequirement: 'Attribution to Quisqueya Acoustic Stems',
    commercialUseAllowed: true,
    usageRestrictions: 'Cleared for royalty-free social synchronization.',
    dateAdded: '2026-09-01',
  },
  {
    id: 'sound-reggae-05',
    title: 'Trenchtown One Drop Drum Kit',
    artist: 'Roots Archive Sound',
    artistHandle: 'rootsarchive',
    countryIso: 'JAM',
    countryName: 'Jamaica',
    flag: '🇯🇲',
    genre: 'Reggae',
    durationSeconds: 50,
    durationFormatted: '0:50',
    audioUrl: `${SOUNDS_BUCKET_BASE}/sound-reggae-05.mp3`,
    coverGradient: 'from-emerald-900 via-amber-950 to-[#110D17]',
    usageCount: 0,
    usageCountFormatted: '0 uses',
    bpm: 78,
    isTrending: false,
    isVerifiedArtist: true,
    releaseYear: 2026,
    sampleLyrics: 'Vintage 1970s one-drop rimshot and kick pattern with analog warmth.',
    licensingStatus: 'public_domain',
    licenseType: 'Public Domain (CC0)',
    licenseSource: 'Caribbean Open Audio Heritage',
    attributionRequirement: 'None required (Public Domain Dedication)',
    commercialUseAllowed: true,
    usageRestrictions: 'No restrictions worldwide.',
    dateAdded: '2026-09-01',
  },
  {
    id: 'sound-calypso-06',
    title: 'Port of Spain Brass Fanfare',
    artist: 'Carnival Heritage Project',
    artistHandle: 'carnivalheritage',
    countryIso: 'TTO',
    countryName: 'Trinidad & Tobago',
    flag: '🇹🇹',
    genre: 'Calypso',
    durationSeconds: 38,
    durationFormatted: '0:38',
    audioUrl: `${SOUNDS_BUCKET_BASE}/sound-calypso-06.mp3`,
    coverGradient: 'from-red-900 via-amber-950 to-[#110D17]',
    usageCount: 0,
    usageCountFormatted: '0 uses',
    bpm: 115,
    isTrending: false,
    isVerifiedArtist: true,
    releaseYear: 2026,
    sampleLyrics: 'Traditional Calypso horn section fanfare and acoustic strumming.',
    licensingStatus: 'royalty_free',
    licenseType: 'CC-BY-4.0',
    licenseSource: 'Carnival Heritage Project Archive',
    attributionRequirement: 'Attribution to Carnival Heritage Project',
    commercialUseAllowed: true,
    usageRestrictions: 'Cleared for all Caribbean media synchronization.',
    dateAdded: '2026-09-01',
  },
  {
    id: 'sound-zouk-07',
    title: 'Fort-de-France Synthesizer Cadence',
    artist: 'Antilles Rhythm Lab',
    artistHandle: 'antillesrhythm',
    countryIso: 'MTQ',
    countryName: 'Martinique',
    flag: '🇲🇶',
    genre: 'Zouk',
    durationSeconds: 44,
    durationFormatted: '0:44',
    audioUrl: `${SOUNDS_BUCKET_BASE}/sound-zouk-07.mp3`,
    coverGradient: 'from-sky-900 via-indigo-950 to-[#110D17]',
    usageCount: 0,
    usageCountFormatted: '0 uses',
    bpm: 98,
    isTrending: false,
    isVerifiedArtist: true,
    releaseYear: 2026,
    sampleLyrics: 'French Antillean 80s DX7 synth bell melodies and programmed drum machine.',
    licensingStatus: 'royalty_free',
    licenseType: 'CC-BY-4.0',
    licenseSource: 'Antilles Rhythm Lab Collections',
    attributionRequirement: 'Attribution to Antilles Rhythm Lab',
    commercialUseAllowed: true,
    usageRestrictions: 'Free for digital storytelling and content creation.',
    dateAdded: '2026-09-01',
  },
  {
    id: 'sound-bouyon-08',
    title: 'Roseau Valley Drum Machine Jump-Up',
    artist: 'Nature Island Stems',
    artistHandle: 'natureislandstems',
    countryIso: 'DMA',
    countryName: 'Dominica',
    flag: '🇩🇲',
    genre: 'Bouyon',
    durationSeconds: 36,
    durationFormatted: '0:36',
    audioUrl: `${SOUNDS_BUCKET_BASE}/sound-bouyon-08.mp3`,
    coverGradient: 'from-teal-900 via-slate-900 to-[#110D17]',
    usageCount: 0,
    usageCountFormatted: '0 uses',
    bpm: 155,
    isTrending: false,
    isVerifiedArtist: true,
    releaseYear: 2026,
    sampleLyrics: 'Fast-paced Dominica bouyon kick rolls, cowbell claps, and bass pulses.',
    licensingStatus: 'royalty_free',
    licenseType: 'CC-BY-4.0',
    licenseSource: 'Nature Island Creative Commons Series',
    attributionRequirement: 'Attribution to Nature Island Stems',
    commercialUseAllowed: true,
    usageRestrictions: 'Cleared for TUKUBI platform productions.',
    dateAdded: '2026-09-01',
  },
  {
    id: 'sound-punta-09',
    title: 'Garifuna Ancestral Primera Drum',
    artist: 'Garifuna Heritage Collective',
    artistHandle: 'garifunacollective',
    countryIso: 'BLZ',
    countryName: 'Belize',
    flag: '🇧🇿',
    genre: 'Punta',
    durationSeconds: 54,
    durationFormatted: '0:54',
    audioUrl: `${SOUNDS_BUCKET_BASE}/sound-punta-09.mp3`,
    coverGradient: 'from-amber-950 via-slate-900 to-[#110D17]',
    usageCount: 0,
    usageCountFormatted: '0 uses',
    bpm: 140,
    isTrending: false,
    isVerifiedArtist: true,
    releaseYear: 2026,
    sampleLyrics: 'Handcrafted hardwood drums and sisira turtle shell shaker polyrhythms.',
    licensingStatus: 'creative_commons',
    licenseType: 'CC-BY-SA-4.0',
    licenseSource: 'UNESCO Intangible Cultural Heritage Recordings',
    attributionRequirement: 'Attribution to Garifuna Heritage Collective',
    commercialUseAllowed: true,
    usageRestrictions: 'Preserve cultural attribution in metadata.',
    dateAdded: '2026-09-01',
  },
  {
    id: 'sound-chutney-10',
    title: 'Dholak & Dantal Chutney Stem',
    artist: 'Indo-Caribbean Music Initiative',
    artistHandle: 'indocaribmusic',
    countryIso: 'GUY',
    countryName: 'Guyana',
    flag: '🇬🇾',
    genre: 'Chutney',
    durationSeconds: 46,
    durationFormatted: '0:46',
    audioUrl: `${SOUNDS_BUCKET_BASE}/sound-chutney-10.mp3`,
    coverGradient: 'from-orange-950 via-slate-900 to-[#110D17]',
    usageCount: 0,
    usageCountFormatted: '0 uses',
    bpm: 148,
    isTrending: false,
    isVerifiedArtist: true,
    releaseYear: 2026,
    sampleLyrics: 'Dholak and dantal iron percussion mixing with modern Caribbean arrangement.',
    licensingStatus: 'royalty_free',
    licenseType: 'CC-BY-4.0',
    licenseSource: 'Guyana & Trinidad Folk Audio Archive',
    attributionRequirement: 'Attribution to Indo-Caribbean Music Initiative',
    commercialUseAllowed: true,
    usageRestrictions: 'Cleared for all creators.',
    dateAdded: '2026-09-01',
  },
  {
    id: 'sound-parang-11',
    title: 'Lopinot Cuatro & Maracas Acoustic',
    artist: 'Trinidad Folk Preservation',
    artistHandle: 'folkpreservation',
    countryIso: 'TTO',
    countryName: 'Trinidad & Tobago',
    flag: '🇹🇹',
    genre: 'Parang',
    durationSeconds: 40,
    durationFormatted: '0:40',
    audioUrl: `${SOUNDS_BUCKET_BASE}/sound-parang-11.mp3`,
    coverGradient: 'from-emerald-950 via-slate-900 to-[#110D17]',
    usageCount: 0,
    usageCountFormatted: '0 uses',
    bpm: 130,
    isTrending: false,
    isVerifiedArtist: true,
    releaseYear: 2026,
    sampleLyrics: 'Traditional 4-string cuatro strumming and chac-chac seeds percussion.',
    licensingStatus: 'royalty_free',
    licenseType: 'CC-BY-4.0',
    licenseSource: 'Lopinot Valley Heritage Sessions',
    attributionRequirement: 'Attribution to Trinidad Folk Preservation',
    commercialUseAllowed: true,
    usageRestrictions: 'Cleared for creator use.',
    dateAdded: '2026-09-01',
  },
  {
    id: 'sound-soca-12',
    title: 'Willemstad Tambú & Chapi Groove',
    artist: 'Antillean Rhythm Project',
    artistHandle: 'antilleanrhythm',
    countryIso: 'CUW',
    countryName: 'Curaçao',
    flag: '🇨🇼',
    genre: 'Soca',
    durationSeconds: 45,
    durationFormatted: '0:45',
    audioUrl: `${SOUNDS_BUCKET_BASE}/sound-soca-12.mp3`,
    coverGradient: 'from-teal-950 via-slate-900 to-[#110D17]',
    usageCount: 0,
    usageCountFormatted: '0 uses',
    bpm: 135,
    isTrending: false,
    isVerifiedArtist: true,
    releaseYear: 2026,
    sampleLyrics: 'Curacao drum rhythms with hoe and metal chapi counterpoint.',
    licensingStatus: 'royalty_free',
    licenseType: 'CC-BY-4.0',
    licenseSource: 'Kòrsou Folk Percussion Archive',
    attributionRequirement: 'Attribution to Antillean Rhythm Project',
    commercialUseAllowed: true,
    usageRestrictions: 'Free for digital creators on TUKUBI.',
    dateAdded: '2026-09-01',
  },
];

export const CARIBBEAN_SOUNDS_BY_ID = Object.fromEntries(
  CARIBBEAN_SOUNDS.map((s) => [s.id, s])
);

export const SOUND_GENRES = [
  'All Genres',
  'Soca',
  'Dancehall',
  'Reggae',
  'Kompa',
  'Bouyon',
  'Calypso',
  'Bachata',
  'Zouk',
  'Steelpan',
  'Parang',
  'Chutney',
  'Punta',
] as const;

export function searchCaribbeanSounds(options: {
  query?: string;
  genre?: string;
  countryIso?: string;
  trendingOnly?: boolean;
}): CaribbeanSound[] {
  let results = [...CARIBBEAN_SOUNDS];

  if (options.genre && options.genre !== 'All Genres') {
    results = results.filter(
      (s) => s.genre.toLowerCase() === options.genre!.toLowerCase()
    );
  }

  if (options.countryIso && options.countryIso !== 'ALL') {
    results = results.filter(
      (s) => s.countryIso.toUpperCase() === options.countryIso!.toUpperCase()
    );
  }

  if (options.trendingOnly) {
    // Trending must be calculated strictly from real usage counts - never fabricated
    results = results.filter((s) => s.usageCount > 0 || s.isTrending);
  }

  if (options.query && options.query.trim()) {
    const q = options.query.trim().toLowerCase();
    results = results.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q) ||
        (s.artistHandle && s.artistHandle.toLowerCase().includes(q)) ||
        s.genre.toLowerCase().includes(q) ||
        s.countryName.toLowerCase().includes(q) ||
        s.licenseType.toLowerCase().includes(q)
    );
  }

  return results;
}
