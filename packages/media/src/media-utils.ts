/**
 * TUKUBI Media Utilities
 * Handles client-side dimension extraction, EXIF orientation normalization,
 * safe progressive compression, and aspect ratio intelligence.
 */

export interface ImageDimensions {
  width: number;
  height: number;
  aspectRatio: number;
  category: 'square' | 'landscape' | 'portrait' | 'tall' | 'wide';
  cssAspectRatio: string;
}

export interface CompressImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0
  format?: 'image/jpeg' | 'image/webp';
}

/**
 * Classifies the aspect ratio of an image into standard social platform categories
 * with safe bounding to avoid extreme squashing, tiny thumbnails, or vertical overflow.
 */
export function classifyAspectRatio(width: number, height: number): ImageDimensions {
  if (!width || !height || width <= 0 || height <= 0) {
    return {
      width: 1200,
      height: 900,
      aspectRatio: 4 / 3,
      category: 'landscape',
      cssAspectRatio: '4 / 3',
    };
  }

  const ratio = width / height;

  let category: ImageDimensions['category'] = 'landscape';
  if (Math.abs(ratio - 1) < 0.08) {
    category = 'square';
  } else if (ratio < 0.6) {
    category = 'tall'; // e.g. 9:16 or extreme vertical
  } else if (ratio < 0.95) {
    category = 'portrait'; // e.g. 4:5, 3:4, 2:3
  } else if (ratio > 2.2) {
    category = 'wide'; // panoramic, ultrawide
  } else {
    category = 'landscape'; // 4:3, 3:2, 16:9
  }

  // Format as a simplified ratio string or fractional string
  let cssAspectRatio = `${Math.round(ratio * 100) / 100}`;
  if (category === 'square') cssAspectRatio = '1 / 1';
  else if (Math.abs(ratio - 16 / 9) < 0.05) cssAspectRatio = '16 / 9';
  else if (Math.abs(ratio - 4 / 3) < 0.05) cssAspectRatio = '4 / 3';
  else if (Math.abs(ratio - 3 / 2) < 0.05) cssAspectRatio = '3 / 2';
  else if (Math.abs(ratio - 4 / 5) < 0.05) cssAspectRatio = '4 / 5';
  else if (Math.abs(ratio - 9 / 16) < 0.05) cssAspectRatio = '9 / 16';

  return {
    width,
    height,
    aspectRatio: ratio,
    category,
    cssAspectRatio,
  };
}

export interface ClampedAspectRatioResult {
  clampedRatio: number;
  isClamped: boolean;
  cssAspectRatio: string;
}

/**
 * Bounds aspect ratio within ergonomic feed display limits.
 * Default bounds: min 0.8 (4:5 portrait) to max 16/9 (approx 1.777 landscape).
 * Returns structured clamp details including cssAspectRatio string.
 */
export function getClampedAspectRatio(
  aspectRatio: number,
  minRatio: number = 0.8, // 4:5
  maxRatio: number = 16 / 9 // 16:9
): ClampedAspectRatioResult {
  if (isNaN(aspectRatio) || aspectRatio <= 0) {
    return { clampedRatio: 1.0, isClamped: false, cssAspectRatio: '1 / 1' };
  }
  const isClamped = aspectRatio < minRatio || aspectRatio > maxRatio;
  const clampedRatio = Math.min(Math.max(aspectRatio, minRatio), maxRatio);

  let cssAspectRatio = `${Math.round(clampedRatio * 100) / 100}`;
  if (Math.abs(clampedRatio - 0.8) < 0.02) cssAspectRatio = '4 / 5';
  else if (Math.abs(clampedRatio - 1) < 0.02) cssAspectRatio = '1 / 1';
  else if (Math.abs(clampedRatio - 16 / 9) < 0.02) cssAspectRatio = '16 / 9';
  else if (Math.abs(clampedRatio - 4 / 3) < 0.02) cssAspectRatio = '4 / 3';
  else if (Math.abs(clampedRatio - 3 / 4) < 0.02) cssAspectRatio = '3 / 4';

  return { clampedRatio, isClamped, cssAspectRatio };
}

/**
 * Reads intrinsic dimensions from an image File or Blob.
 */
export async function extractImageDimensions(fileOrBlob: Blob): Promise<ImageDimensions> {
  if (typeof window === 'undefined') {
    return classifyAspectRatio(1200, 900);
  }

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(fileOrBlob);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const dimensions = classifyAspectRatio(img.naturalWidth, img.naturalHeight);
      resolve(dimensions);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      // Fallback
      resolve(classifyAspectRatio(1200, 900));
    };

    img.src = objectUrl;
  });
}

/**
 * Client-side EXIF normalization and high-efficiency image compression.
 * Modern cameras and smartphones (iPhone, DSLR, Android) produce 15MB-40MB JPEGs/HEICs.
 * This ensures the image is properly oriented, scales excessive dimensions to standard
 * ultra-crisp display boundaries (max 2560px), and compresses cleanly with zero blurriness.
 */
export async function normalizeExifAndCompressImage(
  file: File,
  options: CompressImageOptions = {}
): Promise<{
  file: File;
  width: number;
  height: number;
  aspectRatio: number;
  previewUrl: string;
}> {
  const {
    maxWidth = 2560,
    maxHeight = 2560,
    quality = 0.88,
    format = 'image/jpeg',
  } = options;

  if (typeof window === 'undefined') {
    const previewUrl = '';
    return {
      file,
      width: 1200,
      height: 900,
      aspectRatio: 4 / 3,
      previewUrl,
    };
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = async () => {
      let srcWidth = img.naturalWidth;
      let srcHeight = img.naturalHeight;

      // Handle invalid or 0 dimensions gracefully
      if (!srcWidth || !srcHeight) {
        srcWidth = 1200;
        srcHeight = 900;
      }

      // Check if scaling is needed
      let targetWidth = srcWidth;
      let targetHeight = srcHeight;

      if (targetWidth > maxWidth || targetHeight > maxHeight) {
        const ratio = Math.min(maxWidth / targetWidth, maxHeight / targetHeight);
        targetWidth = Math.round(targetWidth * ratio);
        targetHeight = Math.round(targetHeight * ratio);
      }

      // If file is small (< 1.5MB) and doesn't need downscaling and is already standard jpeg/png/webp,
      // keep original to avoid re-compression artifacts
      if (
        file.size < 1.5 * 1024 * 1024 &&
        targetWidth === srcWidth &&
        targetHeight === srcHeight &&
        (file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp')
      ) {
        const previewUrl = URL.createObjectURL(file);
        URL.revokeObjectURL(objectUrl);
        return resolve({
          file,
          width: srcWidth,
          height: srcHeight,
          aspectRatio: srcWidth / srcHeight,
          previewUrl,
        });
      }

      try {
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          throw new Error('Canvas 2D context unavailable');
        }

        // Use high-quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw image onto canvas (browsers automatically respect EXIF orientation in <img>)
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // Convert to Blob
        const outputType =
          format === 'image/webp' && canvas.toDataURL('image/webp').startsWith('data:image/webp')
            ? 'image/webp'
            : 'image/jpeg';

        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(objectUrl);
            if (!blob) {
              const fallbackUrl = URL.createObjectURL(file);
              return resolve({
                file,
                width: srcWidth,
                height: srcHeight,
                aspectRatio: srcWidth / srcHeight,
                previewUrl: fallbackUrl,
              });
            }

            const cleanBaseName = file.name.replace(/\.[^/.]+$/, '');
            const ext = outputType === 'image/webp' ? 'webp' : 'jpg';
            const compressedFile = new File([blob], `${cleanBaseName}.${ext}`, {
              type: outputType,
              lastModified: Date.now(),
            });

            const previewUrl = URL.createObjectURL(compressedFile);
            resolve({
              file: compressedFile,
              width: targetWidth,
              height: targetHeight,
              aspectRatio: targetWidth / targetHeight,
              previewUrl,
            });
          },
          outputType,
          quality
        );
      } catch {
        // Fallback to original
        URL.revokeObjectURL(objectUrl);
        const fallbackUrl = URL.createObjectURL(file);
        resolve({
          file,
          width: srcWidth,
          height: srcHeight,
          aspectRatio: srcWidth / srcHeight,
          previewUrl: fallbackUrl,
        });
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      const fallbackUrl = URL.createObjectURL(file);
      resolve({
        file,
        width: 1200,
        height: 900,
        aspectRatio: 4 / 3,
        previewUrl: fallbackUrl,
      });
    };

    img.src = objectUrl;
  });
}

/**
 * Formats bytes to user-friendly string (e.g. 2.4 MB)
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
