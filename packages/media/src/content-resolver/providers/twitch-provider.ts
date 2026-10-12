/**
 * TUKUBI Universal Content & Media Architecture
 * Twitch Content Provider
 */

import { ContentProviderName, ContentResolutionOptions, ResolvedContentMetadata } from '../types';
import { BaseContentProvider } from './base-provider';

export class TwitchProvider extends BaseContentProvider {
  readonly name: ContentProviderName = 'twitch';
  readonly displayName = 'Twitch';

  canHandle(target: URL | string): boolean {
    const url = this.toURL(target);
    if (!url) return false;
    const host = url.hostname.toLowerCase();
    return (
      host === 'twitch.tv' ||
      host === 'www.twitch.tv' ||
      host === 'm.twitch.tv' ||
      host === 'clips.twitch.tv'
    );
  }

  extractDetails(url: URL): { kind: 'video' | 'clip' | 'channel'; id: string } | null {
    const host = url.hostname.toLowerCase();
    const pathname = url.pathname;

    if (host === 'clips.twitch.tv') {
      const clipId = pathname.replace(/^\/+/, '').split('/')[0];
      return clipId ? { kind: 'clip', id: clipId } : null;
    }

    const videoMatch = pathname.match(/\/videos\/(\d+)/i);
    if (videoMatch && videoMatch[1]) {
      return { kind: 'video', id: videoMatch[1] };
    }

    const clipMatch = pathname.match(/\/clip\/([a-zA-Z0-9_-]+)/i);
    if (clipMatch && clipMatch[1]) {
      return { kind: 'clip', id: clipMatch[1] };
    }

    const channel = pathname.replace(/^\/+/, '').split('/')[0];
    if (channel && !['directory', 'p', 'downloads', 'jobs'].includes(channel.toLowerCase())) {
      return { kind: 'channel', id: channel };
    }

    return null;
  }

  async resolve(
    url: URL,
    _options?: ContentResolutionOptions
  ): Promise<ResolvedContentMetadata | null> {
    const details = this.extractDetails(url);
    if (!details) {
      return this.buildFallback(url, 'Not a recognized Twitch stream or video');
    }

    const parentParam = '&parent=tukubi.com&parent=localhost';
    let embedUrl = '';
    let title = '';
    let description = '';

    if (details.kind === 'video') {
      embedUrl = `https://player.twitch.tv/?video=${details.id}&autoplay=false${parentParam}`;
      title = `Twitch VOD (${details.id})`;
      description = 'Watch video on Twitch';
    } else if (details.kind === 'clip') {
      embedUrl = `https://clips.twitch.tv/embed?clip=${details.id}&autoplay=false${parentParam}`;
      title = `Twitch Clip (${details.id})`;
      description = 'Watch clip on Twitch';
    } else {
      embedUrl = `https://player.twitch.tv/?channel=${details.id}&autoplay=false${parentParam}`;
      title = `${details.id} on Twitch`;
      description = `Watch live stream from ${details.id} on Twitch`;
    }

    return this.buildBaseMetadata({
      url,
      contentType: 'video',
      title,
      description,
      embedUrl,
      aspectRatio: '16:9',
      isPlayable: true,
      canEmbed: true,
      status: 'resolved',
      extra: { ...details },
    });
  }
}
