export interface CaribbeanSound {
  id: string;
  title: string;
  artist: string;
  artistHandle: string;
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
}

export const CARIBBEAN_SOUNDS: CaribbeanSound[] = [
  {
    id: 'sound-soca-01',
    title: 'Soca Monarch Anthem (Fete Stomp)',
    artist: 'Machel & Kes',
    artistHandle: 'machelkes',
    countryIso: 'TTO',
    countryName: 'Trinidad & Tobago',
    flag: '🇹🇹',
    genre: 'Soca',
    durationSeconds: 48,
    durationFormatted: '0:48',
    audioUrl: 'https://assets.mixkit.co/active_storage/sfx/2874/2874-preview.mp3',
    coverGradient: 'from-purple-900 via-rose-950 to-[#110D17]',
    usageCount: 0,
    usageCountFormatted: '0 uses',
    bpm: 160,
    isTrending: true,
    isVerifiedArtist: true,
    releaseYear: 2026,
    sampleLyrics: 'Jump on the road, jump on the avenue! Soca in the air tonight!',
  },
  {
    id: 'sound-dancehall-02',
    title: 'Dutty Bass Riddim (Kingston Heat)',
    artist: 'Shenseea & Skillibeng',
    artistHandle: 'shenseea',
    countryIso: 'JAM',
    countryName: 'Jamaica',
    flag: '🇯🇲',
    genre: 'Dancehall',
    durationSeconds: 45,
    durationFormatted: '0:45',
    audioUrl: 'https://assets.mixkit.co/active_storage/sfx/2875/2875-preview.mp3',
    coverGradient: 'from-amber-900 via-emerald-950 to-[#110D17]',
    usageCount: 0,
    usageCountFormatted: '0 uses',
    bpm: 102,
    isTrending: true,
    isVerifiedArtist: true,
    releaseYear: 2026,
    sampleLyrics: 'Pull up the sound, bass roll deep from Kingston to Miami!',
  },
  {
    id: 'sound-kompa-03',
    title: 'Gouyad Nuits d’Été',
    artist: 'Kai & Enposib',
    artistHandle: 'kaienposib',
    countryIso: 'HTI',
    countryName: 'Haiti',
    flag: '🇭🇹',
    genre: 'Kompa',
    durationSeconds: 52,
    durationFormatted: '0:52',
    audioUrl: 'https://assets.mixkit.co/active_storage/sfx/2876/2876-preview.mp3',
    coverGradient: 'from-blue-900 via-indigo-950 to-[#110D17]',
    usageCount: 0,
    usageCountFormatted: '0 uses',
    bpm: 96,
    isTrending: true,
    isVerifiedArtist: true,
    releaseYear: 2026,
    sampleLyrics: 'Kite m kenbe men w, danse douceman anba zetwal yo.',
  },
  {
    id: 'sound-bachata-04',
    title: 'Bachata de la Zona Colonial',
    artist: 'Aventura & Romeo',
    artistHandle: 'romeosantos',
    countryIso: 'DOM',
    countryName: 'Dominican Republic',
    flag: '🇩🇴',
    genre: 'Bachata',
    durationSeconds: 40,
    durationFormatted: '0:40',
    audioUrl: 'https://assets.mixkit.co/active_storage/sfx/2877/2877-preview.mp3',
    coverGradient: 'from-red-900 via-slate-900 to-[#110D17]',
    usageCount: 0,
    usageCountFormatted: '0 uses',
    bpm: 128,
    isTrending: true,
    isVerifiedArtist: true,
    releaseYear: 2026,
    sampleLyrics: 'Guitarra que llora en el Malecón con el viento del Caribe.',
  },
  {
    id: 'sound-reggae-05',
    title: 'Blue Mountain Dubplate Vibration',
    artist: 'Chronixx & Protoje',
    artistHandle: 'chronixx',
    countryIso: 'JAM',
    countryName: 'Jamaica',
    flag: '🇯🇲',
    genre: 'Reggae',
    durationSeconds: 55,
    durationFormatted: '0:55',
    audioUrl: 'https://assets.mixkit.co/active_storage/sfx/2878/2878-preview.mp3',
    coverGradient: 'from-emerald-900 via-slate-900 to-[#110D17]',
    usageCount: 0,
    usageCountFormatted: '0 uses',
    bpm: 75,
    isTrending: false,
    isVerifiedArtist: true,
    releaseYear: 2025,
    sampleLyrics: 'Roots culture rising, one love across all nations and shores.',
  },
  {
    id: 'sound-bouyon-06',
    title: 'Dominica Road Block (Bouyon Wave)',
    artist: 'Triple Kay International',
    artistHandle: 'triplekay',
    countryIso: 'DMA',
    countryName: 'Dominica',
    flag: '🇩🇲',
    genre: 'Bouyon',
    durationSeconds: 42,
    durationFormatted: '0:42',
    audioUrl: 'https://assets.mixkit.co/active_storage/sfx/2879/2879-preview.mp3',
    coverGradient: 'from-yellow-900 via-emerald-950 to-[#110D17]',
    usageCount: 0,
    usageCountFormatted: '0 uses',
    bpm: 155,
    isTrending: true,
    isVerifiedArtist: true,
    releaseYear: 2026,
    sampleLyrics: 'Move your waist, jump and wave the green flag in nature island!',
  },
  {
    id: 'sound-steelpan-07',
    title: 'Pan in A Minor (Savannah Symphony)',
    artist: 'Desperadoes Steel Orchestra',
    artistHandle: 'desperadoes',
    countryIso: 'TTO',
    countryName: 'Trinidad & Tobago',
    flag: '🇹🇹',
    genre: 'Steelpan',
    durationSeconds: 60,
    durationFormatted: '1:00',
    audioUrl: 'https://assets.mixkit.co/active_storage/sfx/2880/2880-preview.mp3',
    coverGradient: 'from-cyan-900 via-indigo-950 to-[#110D17]',
    usageCount: 0,
    usageCountFormatted: '0 uses',
    bpm: 120,
    isTrending: false,
    isVerifiedArtist: true,
    releaseYear: 2025,
    sampleLyrics: '[Acoustic Tenor Pan Melodies and Harmonic Iron Percussion]',
  },
  {
    id: 'sound-zouk-08',
    title: 'Zouk Lanmou Karukera',
    artist: 'Kassav Tribute Ensemble',
    artistHandle: 'kassavzouk',
    countryIso: 'GLP',
    countryName: 'Guadeloupe',
    flag: '🇬🇵',
    genre: 'Zouk',
    durationSeconds: 47,
    durationFormatted: '0:47',
    audioUrl: 'https://assets.mixkit.co/active_storage/sfx/2881/2881-preview.mp3',
    coverGradient: 'from-pink-900 via-purple-950 to-[#110D17]',
    usageCount: 0,
    usageCountFormatted: '0 uses',
    bpm: 108,
    isTrending: true,
    isVerifiedArtist: true,
    releaseYear: 2026,
    sampleLyrics: 'Zouk la se sel medikaman nou ni pou geri ke nou.',
  },
  {
    id: 'sound-calypso-09',
    title: 'Kaiso Heritage (Port of Spain Story)',
    artist: 'David Rudder & Friends',
    artistHandle: 'davidrudder',
    countryIso: 'TTO',
    countryName: 'Trinidad & Tobago',
    flag: '🇹🇹',
    genre: 'Calypso',
    durationSeconds: 50,
    durationFormatted: '0:50',
    audioUrl: 'https://assets.mixkit.co/active_storage/sfx/2882/2882-preview.mp3',
    coverGradient: 'from-amber-950 via-slate-900 to-[#110D17]',
    usageCount: 0,
    usageCountFormatted: '0 uses',
    bpm: 114,
    isTrending: false,
    isVerifiedArtist: true,
    releaseYear: 2025,
    sampleLyrics: 'Calypso music is a living newspaper of the Caribbean spirit.',
  },
  {
    id: 'sound-punta-10',
    title: 'Garifuna Punta Drum Roll',
    artist: 'Aurelio Martinez',
    artistHandle: 'aureliopunta',
    countryIso: 'BLZ',
    countryName: 'Belize',
    flag: '🇧🇿',
    genre: 'Punta',
    durationSeconds: 44,
    durationFormatted: '0:44',
    audioUrl: 'https://assets.mixkit.co/active_storage/sfx/2883/2883-preview.mp3',
    coverGradient: 'from-teal-900 via-slate-900 to-[#110D17]',
    usageCount: 0,
    usageCountFormatted: '0 uses',
    bpm: 142,
    isTrending: false,
    isVerifiedArtist: true,
    releaseYear: 2026,
    sampleLyrics: 'Ancestral Garifuna drums resounding from Belize to Dangriga.',
  },
  {
    id: 'sound-chutney-11',
    title: 'Chutney Soca Dholak Groove',
    artist: 'Ravi B & Karma',
    artistHandle: 'ravib',
    countryIso: 'GUY',
    countryName: 'Guyana',
    flag: '🇬🇾',
    genre: 'Chutney',
    durationSeconds: 46,
    durationFormatted: '0:46',
    audioUrl: 'https://assets.mixkit.co/active_storage/sfx/2884/2884-preview.mp3',
    coverGradient: 'from-orange-950 via-slate-900 to-[#110D17]',
    usageCount: 0,
    usageCountFormatted: '0 uses',
    bpm: 148,
    isTrending: true,
    isVerifiedArtist: true,
    releaseYear: 2026,
    sampleLyrics: 'Dholak and harmonium mixing with modern carnival rhythm.',
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
    results = results.filter((s) => s.isTrending);
  }

  if (options.query && options.query.trim()) {
    const q = options.query.trim().toLowerCase();
    results = results.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q) ||
        s.artistHandle.toLowerCase().includes(q) ||
        s.genre.toLowerCase().includes(q) ||
        s.countryName.toLowerCase().includes(q)
    );
  }

  return results;
}
