/**
 * TUKUBI Image Optimization & CDN Delivery Layer
 * Provides automatic WebP/AVIF formatting, responsive srcsets, and Caribbean gradient placeholders.
 */

export interface ImageTransformationOptions {
  width?: number;
  height?: number;
  quality?: number; // 1 to 100, default 80
  format?: 'auto' | 'webp' | 'avif' | 'jpeg' | 'png';
  fit?: 'cover' | 'contain' | 'fill' | 'inside';
}

export const DEFAULT_RESPONSIVE_WIDTHS = [320, 640, 768, 1024, 1280, 1920];

/**
 * Builds an optimized CDN image URL with auto-formatting, compression, and sizing.
 */
export function generateOptimizedImageUrl(
  rawUrl: string,
  options: ImageTransformationOptions = {}
): string {
  if (!rawUrl || rawUrl.startsWith('data:') || rawUrl.startsWith('blob:')) {
    return rawUrl;
  }

  const { width, height, quality = 80, format = 'auto', fit = 'cover' } = options;

  try {
    const url = new URL(rawUrl);

    // 1. Supabase Storage Image Transformation
    if (url.hostname.endsWith('.supabase.co') || url.hostname.endsWith('.supabase.in')) {
      if (url.pathname.includes('/storage/v1/object/public/')) {
        // Transform to render endpoint if available, or append query params
        const transformedPath = url.pathname.replace(
          '/storage/v1/object/public/',
          '/storage/v1/render/image/public/'
        );
        const transformed = new URL(url.toString());
        transformed.pathname = transformedPath;
        if (width) transformed.searchParams.set('width', width.toString());
        if (height) transformed.searchParams.set('height', height.toString());
        transformed.searchParams.set('quality', quality.toString());
        transformed.searchParams.set('resize', fit);
        if (format !== 'auto') transformed.searchParams.set('format', format);
        return transformed.toString();
      }
    }

    // 2. Cloudinary Transformation
    if (url.hostname.includes('cloudinary.com')) {
      const parts = url.pathname.split('/upload/');
      if (parts.length === 2) {
        const transforms: string[] = [`f_${format}`, `q_${quality}`];
        if (width) transforms.push(`w_${width}`);
        if (height) transforms.push(`h_${height}`);
        transforms.push(`c_${fit}`);
        return `${url.origin}${parts[0]}/upload/${transforms.join(',')}/${parts[1]}`;
      }
    }

    // 3. Unsplash Transformation
    if (url.hostname.includes('unsplash.com')) {
      if (width) url.searchParams.set('w', width.toString());
      if (height) url.searchParams.set('h', height.toString());
      url.searchParams.set('q', quality.toString());
      url.searchParams.set('auto', 'format');
      url.searchParams.set('fit', fit === 'cover' ? 'crop' : 'max');
      return url.toString();
    }

    // 4. Default URL pass-through if no recognized CDN
    return rawUrl;
  } catch {
    return rawUrl;
  }
}

/**
 * Generates an HTML standard srcset attribute string for responsive mobile/desktop loading.
 */
export function generateSrcSet(
  rawUrl: string,
  widths: number[] = DEFAULT_RESPONSIVE_WIDTHS,
  options: Omit<ImageTransformationOptions, 'width'> = {}
): string {
  if (!rawUrl || rawUrl.startsWith('data:') || rawUrl.startsWith('blob:')) {
    return '';
  }

  return widths
    .map((w) => {
      const optimizedUrl = generateOptimizedImageUrl(rawUrl, { ...options, width: w });
      return `${optimizedUrl} ${w}w`;
    })
    .join(', ');
}

/**
 * Returns a high-aesthetic CSS background gradient placeholder in Caribbean Futurism tones
 * for use while images or video thumbnails are hydrating.
 */
export function getCaribbeanPlaceholderGradient(): string {
  return 'linear-gradient(135deg, #0A0F22 0%, #17112E 50%, #032030 100%)';
}
