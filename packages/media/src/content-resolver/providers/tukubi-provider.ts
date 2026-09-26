/**
 * TUKUBI Universal Content & Media Architecture
 * Native TUKUBI Content & Caribbean Sounds Provider
 */

import { ContentProviderName, ContentResolutionOptions, ResolvedContentMetadata } from '../types';
import { BaseContentProvider } from './base-provider';

// Canonical catalog of Caribbean Sounds
const NATIVE_SOUNDS: Record<
  string,
  {
    title: string;
    artist: string;
    genre: string;
    durationSeconds: number;
    audioUrl: string;
    flag: string;
    bpm: number;
  }
> = {
  'sound-soca-01': {
    title: 'Laventille Hill Steelpan Stomp',
    artist: 'Tukubi Caribbean Sound Labs',
    genre: 'Steelpan',
    durationSeconds: 48,
    audioUrl: '/audio/sound-soca-01.wav',
    flag: '🇹🇹',
    bpm: 160,
  },
  'sound-dancehall-02': {
    title: 'Kingston Dubplate Bassline Riddim',
    artist: 'Kingston Dub Project',
    genre: 'Dancehall',
    durationSeconds: 45,
    audioUrl: '/audio/sound-dancehall-02.wav',
    flag: '🇯🇲',
    bpm: 102,
  },
  'sound-kompa-03': {
    title: 'Petion-Ville Midnight Tanbou Groove',
    artist: 'Ayiti Kilti Ensemble',
    genre: 'Kompa',
    durationSeconds: 52,
    audioUrl: '/audio/sound-kompa-03.wav',
    flag: '🇭🇹',
    bpm: 110,
  },
  'sound-bachata-04': {
    title: 'Santo Domingo Requinto Solitude',
    artist: 'Quisqueya Guitar Collective',
    genre: 'Bachata',
    durationSeconds: 42,
    audioUrl: '/audio/sound-bachata-04.wav',
    flag: '🇩🇴',
    bpm: 128,
  },
  'sound-reggae-05': {
    title: 'Blue Mountain Roots Horns Fanfare',
    artist: 'St. Andrew Brass Fellowship',
    genre: 'Reggae',
    durationSeconds: 50,
    audioUrl: '/audio/sound-reggae-05.wav',
    flag: '🇯🇲',
    bpm: 78,
  },
  'sound-calypso-06': {
    title: 'Port of Spain Golden Era Strum',
    artist: 'Trinidad Calypso Archive',
    genre: 'Calypso',
    durationSeconds: 46,
    audioUrl: '/audio/sound-calypso-06.wav',
    flag: '🇹🇹',
    bpm: 118,
  },
  'sound-zouk-07': {
    title: 'Fort-de-France Twilight Synthesizer',
    artist: 'Madinina Waves',
    genre: 'Zouk',
    durationSeconds: 44,
    audioUrl: '/audio/sound-zouk-07.wav',
    flag: '🇲🇶',
    bpm: 120,
  },
  'sound-bouyon-08': {
    title: 'Roseau Valley Jump Up Pulse',
    artist: 'Waitukubuli Rhythm Clan',
    genre: 'Bouyon',
    durationSeconds: 40,
    audioUrl: '/audio/sound-bouyon-08.wav',
    flag: '🇩🇲',
    bpm: 155,
  },
  'sound-punta-09': {
    title: 'Dangriga Garifuna Primera Call',
    artist: 'Garifuna Heritage Drummers',
    genre: 'Punta',
    durationSeconds: 47,
    audioUrl: '/audio/sound-punta-09.wav',
    flag: '🇧🇿',
    bpm: 145,
  },
  'sound-chutney-10': {
    title: 'Caroni Plains Dholak Fusion Drive',
    artist: 'Chutney Vibes Studio',
    genre: 'Chutney',
    durationSeconds: 43,
    audioUrl: '/audio/sound-chutney-10.wav',
    flag: '🇹🇹',
    bpm: 135,
  },
  'sound-parang-11': {
    title: 'Arima Valley Cuatro Celebration',
    artist: 'Los Parranderos de Tukubi',
    genre: 'Parang',
    durationSeconds: 49,
    audioUrl: '/audio/sound-parang-11.wav',
    flag: '🇹🇹',
    bpm: 130,
  },
  'sound-soca-12': {
    title: 'Carnival Monday Road March Anthem',
    artist: 'Soca Monarch All-Stars',
    genre: 'Soca',
    durationSeconds: 55,
    audioUrl: '/audio/sound-soca-12.wav',
    flag: '🇹🇹',
    bpm: 162,
  },
};

export class TukubiMediaProvider extends BaseContentProvider {
  readonly name: ContentProviderName = 'tukubi_sound';
  readonly displayName = 'TUKUBI';

  canHandle(target: URL | string): boolean {
    const url = this.toURL(target);
    if (!url) return false;
    const host = url.hostname.toLowerCase();
    const pathname = url.pathname.toLowerCase();

    const isTukubiHost =
      host === 'tukubi.com' ||
      host === 'www.tukubi.com' ||
      host === 'tukubi.caribbean' ||
      host === 'localhost' ||
      host.endsWith('.supabase.co');

    if (isTukubiHost) {
      if (
        pathname.startsWith('/sounds') ||
        pathname.startsWith('/reels') ||
        pathname.startsWith('/post') ||
        pathname.startsWith('/marketplace') ||
        pathname.startsWith('/audio') ||
        pathname.includes('caribbean-sounds')
      ) {
        return true;
      }
    }

    // Direct audio or video stream files on any permitted domain
    if (
      pathname.endsWith('.mp3') ||
      pathname.endsWith('.wav') ||
      pathname.endsWith('.ogg') ||
      pathname.endsWith('.mp4') ||
      pathname.endsWith('.webm')
    ) {
      return true;
    }

    return false;
  }

  async resolve(
    target: URL | string,
    _options?: ContentResolutionOptions
  ): Promise<ResolvedContentMetadata | null> {
    const url = target instanceof URL ? target : (this.toURL(target) || new URL(target, 'https://tukubi.com'));
    const pathname = url.pathname;

    // Check for native Caribbean Sound match
    for (const [id, sound] of Object.entries(NATIVE_SOUNDS)) {
      if (pathname.includes(id) || url.search.includes(id)) {
        return {
          url: url.toString(),
          normalizedUrl: url.toString(),
          canonicalUrl: `https://tukubi.com/sounds/${id}`,
          provider: 'tukubi_sound',
          providerDisplayName: 'TUKUBI Sounds',
          contentType: 'audio',
          title: sound.title,
          description: `${sound.genre} • ${sound.bpm} BPM ${sound.flag} • Official Caribbean Sound Stems`,
          authorName: sound.artist,
          durationSeconds: sound.durationSeconds,
          durationFormatted: this.formatDuration(sound.durationSeconds),
          siteName: 'TUKUBI Caribbean Sounds',
          isPlayable: true,
          embedUrl: sound.audioUrl,
          status: 'resolved',
          resolvedAt: new Date().toISOString(),
          extra: {
            soundId: id,
            audioUrl: sound.audioUrl,
            genre: sound.genre,
            flag: sound.flag,
            bpm: sound.bpm,
          },
        };
      }
    }

    // Direct Audio File (.mp3, .wav, .ogg)
    if (pathname.endsWith('.mp3') || pathname.endsWith('.wav') || pathname.endsWith('.ogg')) {
      const fileName = pathname.split('/').pop()?.replace(/\.[^/.]+$/, '') || 'Audio Track';
      const cleanTitle = decodeURIComponent(fileName).replace(/[-_]/g, ' ');

      return {
        url: url.toString(),
        normalizedUrl: url.toString(),
        canonicalUrl: url.toString(),
        provider: 'tukubi_sound',
        providerDisplayName: 'TUKUBI Audio',
        contentType: 'audio',
        title: this.sanitizeText(cleanTitle),
        description: 'Caribbean Audio Stream',
        siteName: 'TUKUBI',
        isPlayable: true,
        embedUrl: url.toString(),
        status: 'resolved',
        resolvedAt: new Date().toISOString(),
        extra: {
          directMedia: true,
          audioUrl: url.toString(),
        },
      };
    }

    // Direct Video File (.mp4, .webm)
    if (pathname.endsWith('.mp4') || pathname.endsWith('.webm')) {
      const fileName = pathname.split('/').pop()?.replace(/\.[^/.]+$/, '') || 'Video Stream';
      const cleanTitle = decodeURIComponent(fileName).replace(/[-_]/g, ' ');

      return {
        url: url.toString(),
        normalizedUrl: url.toString(),
        canonicalUrl: url.toString(),
        provider: 'tukubi_video',
        providerDisplayName: 'TUKUBI Video',
        contentType: 'video',
        title: this.sanitizeText(cleanTitle),
        description: 'Caribbean Video Stream',
        siteName: 'TUKUBI',
        isPlayable: true,
        embedUrl: url.toString(),
        aspectRatio: '16:9',
        status: 'resolved',
        resolvedAt: new Date().toISOString(),
        extra: {
          directMedia: true,
          videoUrl: url.toString(),
        },
      };
    }

    return this.buildFallback(url, 'TUKUBI Content Link');
  }
}

export { TukubiMediaProvider as TukubiProvider };
