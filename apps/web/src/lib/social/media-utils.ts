export interface StructuredMediaItem {
  url: string;
  width?: number;
  height?: number;
  aspectRatio?: string;
  type?: 'image' | 'video';
  posterUrl?: string;
}

export function parseMediaPayload(raw: unknown): StructuredMediaItem[] {
  if (raw === null || raw === undefined || raw === '') return [];

  const mapObjectItem = (item: any): StructuredMediaItem => {
    const url = item?.url ? String(item.url) : '';
    const isVideo = item?.type === 'video' || (!item?.type && (url.endsWith('.mp4') || url.includes('video')));
    return {
      url,
      width: item?.width !== undefined && item?.width !== null ? Number(item.width) : undefined,
      height: item?.height !== undefined && item?.height !== null ? Number(item.height) : undefined,
      aspectRatio: item?.aspectRatio ? String(item.aspectRatio) : undefined,
      type: (item?.type || (isVideo ? 'video' : 'image')) as 'image' | 'video',
      posterUrl: item?.posterUrl ? String(item.posterUrl) : undefined,
    };
  };

  const mapStringItem = (u: string): StructuredMediaItem => {
    const isVideo = u.endsWith('.mp4') || u.includes('video');
    return {
      url: u,
      type: isVideo ? 'video' : 'image',
    };
  };

  if (Array.isArray(raw)) {
    return raw
      .map((item) => {
        if (typeof item === 'string') {
          return mapStringItem(item);
        }
        if (typeof item === 'object' && item !== null) {
          return mapObjectItem(item);
        }
        return null;
      })
      .filter((item): item is StructuredMediaItem => Boolean(item && item.url));
  }

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => {
            if (typeof item === 'string') {
              return mapStringItem(item);
            }
            if (typeof item === 'object' && item !== null) {
              return mapObjectItem(item);
            }
            return null;
          })
          .filter((item): item is StructuredMediaItem => Boolean(item && item.url));
      }
      return [];
    } catch {
      return trimmed
        .split(',')
        .map((u) => u.trim())
        .filter(Boolean)
        .map((u) => mapStringItem(u));
    }
  }

  return [];
}
