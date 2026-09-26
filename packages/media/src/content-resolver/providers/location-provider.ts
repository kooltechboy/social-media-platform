/**
 * TUKUBI Universal Content & Media Architecture
 * Map & Geographic Location Content Provider
 */

import { ContentProviderName, ContentResolutionOptions, ResolvedContentMetadata } from '../types';
import { BaseContentProvider } from './base-provider';

export class LocationProvider extends BaseContentProvider {
  readonly name: ContentProviderName = 'google_maps';
  readonly displayName = 'Caribbean Map & Location';

  canHandle(target: URL | string): boolean {
    const url = this.toURL(target);
    if (!url) return false;
    const host = url.hostname.toLowerCase();
    return (
      host === 'maps.google.com' ||
      (host === 'www.google.com' && url.pathname.startsWith('/maps')) ||
      (host === 'goo.gl' && url.pathname.startsWith('/maps')) ||
      host === 'maps.apple.com'
    );
  }

  async resolve(
    url: URL,
    _options?: ContentResolutionOptions
  ): Promise<ResolvedContentMetadata | null> {
    const host = url.hostname.toLowerCase();
    const isApple = host === 'maps.apple.com';
    const providerName: ContentProviderName = isApple ? 'apple_maps' : 'google_maps';
    const providerDisplayName = isApple ? 'Apple Maps' : 'Google Maps';

    let locationName = 'Caribbean Location';

    // Parse place name from query params or path
    const q = url.searchParams.get('q') || url.searchParams.get('query') || url.searchParams.get('address');
    if (q) {
      locationName = decodeURIComponent(q.replace(/\+/g, ' '));
    } else if (url.pathname.includes('/place/')) {
      const parts = url.pathname.split('/place/');
      if (parts[1]) {
        const placeSegment = parts[1].split('/')[0];
        locationName = decodeURIComponent(placeSegment.replace(/\+/g, ' '));
      }
    }

    return {
      url: url.toString(),
      normalizedUrl: url.toString(),
      canonicalUrl: url.toString(),
      provider: providerName,
      providerDisplayName,
      contentType: 'map',
      title: locationName,
      description: `View coordinates and directions on ${providerDisplayName}`,
      siteName: providerDisplayName,
      faviconUrl: this.getFaviconUrl(url),
      isPlayable: false,
      status: 'resolved',
      resolvedAt: new Date().toISOString(),
      extra: {
        rawQuery: q || undefined,
      },
    };
  }
}
