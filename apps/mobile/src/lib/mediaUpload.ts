import { supabase } from './supabase';

export interface UploadResult {
  url: string;
  path: string;
  error?: string | null;
}

export interface MediaUploadOptions {
  bucket?: 'post-media' | 'caribbean-sounds' | 'live-replays';
  folder?: string;
  contentType?: string;
  maxSizeMB?: number;
}

/**
 * Uploads a media file or blob to Supabase Storage.
 * Handles both web/PWA Blob/File and base64/ArrayBuffer data.
 */
export async function uploadMedia(
  fileOrBlob: Blob | File | ArrayBuffer,
  fileName: string,
  options: MediaUploadOptions = {}
): Promise<UploadResult> {
  const {
    bucket = 'post-media',
    folder = 'uploads',
    contentType = 'image/jpeg',
    maxSizeMB = 20,
  } = options;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || 'anon';
    const timestamp = Date.now();
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${userId}/${folder}/${timestamp}_${cleanFileName}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(storagePath, fileOrBlob, {
        contentType,
        upsert: false,
      });

    if (error) {
      console.warn('[uploadMedia] Storage error:', error.message);
      return { url: '', path: '', error: error.message };
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      url: publicUrlData.publicUrl,
      path: data.path,
      error: null,
    };
  } catch (err: any) {
    console.warn('[uploadMedia] Exception:', err);
    return { url: '', path: '', error: err.message || 'Upload failed' };
  }
}

/**
 * Converts a base64 string to an ArrayBuffer for binary upload
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = typeof atob !== 'undefined'
    ? atob(base64)
    : Buffer.from(base64, 'base64').toString('binary');
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Resolves a storage path or external URL to a full playable CDN/public URL.
 * Handles both absolute URLs (e.g. Cloudflare Stream / external) and relative Supabase Storage paths.
 */
export function resolveReelMediaUrl(pathOrUrl?: string | null, bucket: string = 'videos'): string | null {
  if (!pathOrUrl) return null;
  const trimmed = pathOrUrl.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return supabase.storage.from(bucket).getPublicUrl(trimmed).data.publicUrl;
}

