import type { PhotoEditState } from './types';

export class CanvasCompositor {
  buildFilterString(state: PhotoEditState): string {
    const brightnessVal = 100 + state.brightness;
    const contrastVal = 100 + state.contrast;
    const saturationVal = 100 + state.saturation;

    const parts: string[] = [
      `brightness(${Math.max(0, brightnessVal)}%)`,
      `contrast(${Math.max(0, contrastVal)}%)`,
      `saturate(${Math.max(0, saturationVal)}%)`,
    ];

    switch (state.filter) {
      case 'caribbean_warmth':
        parts.push('sepia(18%)', 'hue-rotate(-5deg)');
        break;
      case 'golden_hour':
        parts.push('sepia(25%)', 'contrast(105%)');
        break;
      case 'twilight_purple':
        parts.push('hue-rotate(25deg)', 'saturate(115%)');
        break;
      case 'sea_clarity':
        parts.push('hue-rotate(15deg)', 'contrast(110%)');
        break;
      case 'monochrome':
        parts.push('grayscale(100%)');
        break;
      case 'none':
      default:
        break;
    }

    return parts.join(' ');
  }

  calculateDimensions(
    sourceWidth: number,
    sourceHeight: number,
    aspectRatio: 'free' | '1:1' | '4:5' | '9:16' | '16:9'
  ): { width: number; height: number } {
    if (aspectRatio === 'free') {
      return { width: sourceWidth, height: sourceHeight };
    }

    let targetRatio = 1;
    if (aspectRatio === '1:1') targetRatio = 1;
    else if (aspectRatio === '4:5') targetRatio = 4 / 5;
    else if (aspectRatio === '9:16') targetRatio = 9 / 16;
    else if (aspectRatio === '16:9') targetRatio = 16 / 9;

    const currentRatio = sourceWidth / sourceHeight;
    if (currentRatio > targetRatio) {
      // Source is wider than target; crop sides
      return {
        width: Math.round(sourceHeight * targetRatio),
        height: sourceHeight,
      };
    } else {
      // Source is taller than target; crop top/bottom
      return {
        width: sourceWidth,
        height: Math.round(sourceWidth / targetRatio),
      };
    }
  }

  async exportProcessedPhoto(
    sourceImage: HTMLImageElement | HTMLVideoElement,
    state: PhotoEditState,
    maxDimension: number = 1920
  ): Promise<{ blob: Blob; width: number; height: number }> {
    if (typeof document === 'undefined') {
      throw new Error('Canvas processing is only available in a browser environment');
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not acquire 2D canvas context');

    const isVideo =
      typeof HTMLVideoElement !== 'undefined' && sourceImage instanceof HTMLVideoElement;
    const srcW = isVideo
      ? (sourceImage as HTMLVideoElement).videoWidth
      : (sourceImage as HTMLImageElement).naturalWidth || (sourceImage as HTMLImageElement).width;
    const srcH = isVideo
      ? (sourceImage as HTMLVideoElement).videoHeight
      : (sourceImage as HTMLImageElement).naturalHeight || (sourceImage as HTMLImageElement).height;

    const { width: targetW, height: targetH } = this.calculateDimensions(
      srcW,
      srcH,
      state.aspectRatio
    );

    const isRotated90 = state.rotationDeg === 90 || state.rotationDeg === 270;
    const finalW = isRotated90 ? targetH : targetW;
    const finalH = isRotated90 ? targetW : targetH;

    const scale = Math.min(1, maxDimension / Math.max(finalW, finalH));
    canvas.width = Math.round(finalW * scale);
    canvas.height = Math.round(finalH * scale);

    ctx.filter = this.buildFilterString(state);

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((state.rotationDeg * Math.PI) / 180);
    if (state.flipHorizontal) {
      ctx.scale(-1, 1);
    }

    const cropX = (srcW - targetW) / 2;
    const cropY = (srcH - targetH) / 2;

    ctx.drawImage(
      sourceImage,
      cropX,
      cropY,
      targetW,
      targetH,
      (-targetW * scale) / 2,
      (-targetH * scale) / 2,
      targetW * scale,
      targetH * scale
    );
    ctx.restore();

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({ blob, width: canvas.width, height: canvas.height });
          } else {
            reject(new Error('Canvas toBlob conversion failed'));
          }
        },
        'image/webp',
        0.88
      );
    });
  }

  async extractVideoPoster(
    videoElement: HTMLVideoElement,
    timestampMs: number = 0
  ): Promise<{ posterBlob: Blob; width: number; height: number }> {
    if (typeof document === 'undefined') {
      throw new Error('Canvas processing is only available in a browser environment');
    }

    if (
      timestampMs > 0 &&
      Math.abs(videoElement.currentTime - timestampMs / 1000) > 0.1
    ) {
      try {
        videoElement.currentTime = timestampMs / 1000;
      } catch {
        // ignore if not seekable in mock/runtime
      }
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not acquire 2D canvas context');

    canvas.width = videoElement.videoWidth || 1080;
    canvas.height = videoElement.videoHeight || 1920;

    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({ posterBlob: blob, width: canvas.width, height: canvas.height });
          } else {
            reject(new Error('Failed to extract poster blob'));
          }
        },
        'image/webp',
        0.85
      );
    });
  }
}
