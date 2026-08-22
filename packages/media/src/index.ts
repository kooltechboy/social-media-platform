export type MediaKind = 'image' | 'video' | 'audio';
export type MediaSurface = 'post' | 'story' | 'reel' | 'long_form' | 'podcast' | 'live_replay' | 'message' | 'product';

export type ProcessingStage =
  | 'uploaded' | 'quarantined' | 'processing' | 'transcoding'
  | 'thumbnailing' | 'captioning' | 'ready' | 'failed';

export const STAGE_ORDER: ProcessingStage[] = [
  'uploaded', 'quarantined', 'processing', 'transcoding',
  'thumbnailing', 'captioning', 'ready', 'failed',
];

export interface MediaAsset {
  id: string;
  kind: MediaKind;
  surface: MediaSurface;
  stage: ProcessingStage;
  sizeBytes: number;
  createdAt: string;
}

export interface SurfaceLimits {
  maxBytes: number;
  allowedKinds: MediaKind[];
}

export const SURFACE_LIMITS: Record<MediaSurface, SurfaceLimits> = {
  post: { maxBytes: 50 * 1024 * 1024, allowedKinds: ['image', 'video'] },
  story: { maxBytes: 25 * 1024 * 1024, allowedKinds: ['image', 'video'] },
  reel: { maxBytes: 500 * 1024 * 1024, allowedKinds: ['video'] },
  long_form: { maxBytes: 4 * 1024 * 1024 * 1024, allowedKinds: ['video'] },
  podcast: { maxBytes: 2 * 1024 * 1024 * 1024, allowedKinds: ['audio', 'video'] },
  live_replay: { maxBytes: 8 * 1024 * 1024 * 1024, allowedKinds: ['video'] },
  message: { maxBytes: 25 * 1024 * 1024, allowedKinds: ['image', 'video', 'audio'] },
  product: { maxBytes: 20 * 1024 * 1024, allowedKinds: ['image', 'video'] },
};

export const STORY_TTL_MS = 24 * 60 * 60 * 1000;

export function storyExpiry(from: Date = new Date()): Date {
  return new Date(from.getTime() + STORY_TTL_MS);
}

export class MediaPipeline {
  public validateUpload(kind: MediaKind, surface: MediaSurface, sizeBytes: number): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const limits = SURFACE_LIMITS[surface];
    if (!limits.allowedKinds.includes(kind)) {
      errors.push(`${kind} is not allowed on ${surface}`);
    }
    if (sizeBytes <= 0) {
      errors.push('Media size must be positive');
    }
    if (sizeBytes > limits.maxBytes) {
      errors.push(`Media exceeds ${surface} limit of ${limits.maxBytes} bytes`);
    }
    return { valid: errors.length === 0, errors };
  }

  public nextStage(current: ProcessingStage): ProcessingStage | null {
    if (current === 'ready' || current === 'failed') return null;
    const index = STAGE_ORDER.indexOf(current);
    return STAGE_ORDER[index + 1] ?? null;
  }

  public transition(asset: MediaAsset, target: ProcessingStage): MediaAsset {
    if (this.nextStage(asset.stage) !== target) {
      throw new Error(`Invalid transition: ${asset.stage} → ${target}`);
    }
    return { ...asset, stage: target };
  }

  public isDeliverable(asset: MediaAsset): boolean {
    return asset.stage === 'ready';
  }

  public signedUrlTemplate(asset: MediaAsset, path: string, ttlSeconds: number): { url: string; expiresInSeconds: number } {
    if (!this.isDeliverable(asset)) {
      throw new Error('Media is not ready for delivery');
    }
    return { url: `/cdn/${path}?exp=${ttlSeconds}`, expiresInSeconds: ttlSeconds };
  }
}

// ---------------------------------------------------------------------------
// Supabase Storage integration helpers
// ---------------------------------------------------------------------------

// Structural type — avoids a direct dependency on @supabase/storage-js
type StorageClientLike = {
  storage: {
    from(bucket: string): {
      upload(
        path: string,
        file: Blob | ArrayBuffer,
        options?: { contentType?: string; upsert?: boolean },
      ): Promise<{
        data: { path: string } | null;
        error: { message: string } | null;
      }>;
      getPublicUrl(path: string): { data: { publicUrl: string } };
      remove(
        paths: string[],
      ): Promise<{ data: unknown; error: { message: string } | null }>;
    };
  };
};

const SURFACE_BUCKET_MAP: Record<MediaSurface, string> = {
  post: 'post-media',
  message: 'post-media',
  story: 'story-media',
  reel: 'post-media',
  long_form: 'post-media',
  live_replay: 'post-media',
  podcast: 'podcast-audio',
  product: 'product-images',
};

export class StorageService {
  constructor(private client: StorageClientLike) {}

  /**
   * Upload a file to the correct Supabase Storage bucket based on surface type.
   * File path follows the pattern: `{userId}/{timestamp}_{fileName}`
   */
  async uploadMedia(params: {
    surface: MediaSurface;
    userId: string;
    fileName: string;
    file: Blob | ArrayBuffer;
    contentType: string;
  }): Promise<{ path: string; publicUrl: string } | { error: string }> {
    const bucket = StorageService.bucketForSurface(params.surface);
    const storagePath = `${params.userId}/${Date.now()}_${params.fileName}`;

    const { data, error } = await this.client.storage
      .from(bucket)
      .upload(storagePath, params.file, {
        contentType: params.contentType,
        upsert: false,
      });

    if (error || !data) {
      return { error: error?.message ?? 'Upload failed' };
    }

    const publicUrl = this.getPublicUrl(bucket, data.path);
    return { path: data.path, publicUrl };
  }

  /**
   * Get the public URL for a stored media asset.
   */
  getPublicUrl(bucket: string, path: string): string {
    const { data } = this.client.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  /**
   * Delete a media file from Supabase Storage.
   */
  async deleteMedia(
    bucket: string,
    path: string,
  ): Promise<{ success: boolean; error?: string }> {
    const { error } = await this.client.storage.from(bucket).remove([path]);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  }

  /**
   * Map a media surface type to its Supabase Storage bucket name.
   */
  static bucketForSurface(surface: MediaSurface): string {
    return SURFACE_BUCKET_MAP[surface];
  }
}
