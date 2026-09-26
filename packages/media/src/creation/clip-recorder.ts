import type { RecordedClip } from './types';

export class ClipRecorder {
  private clips: RecordedClip[] = [];
  private maxDurationMs: number;

  constructor(maxDurationMs: number = 60000) {
    this.maxDurationMs = maxDurationMs;
  }

  getMaxDurationMs(): number {
    return this.maxDurationMs;
  }

  setMaxDurationMs(maxMs: number): void {
    this.maxDurationMs = maxMs;
  }

  getClips(): RecordedClip[] {
    return [...this.clips];
  }

  getTotalDurationMs(): number {
    return this.clips.reduce((acc, c) => {
      const clipSpan = Math.max(0, c.trimEndMs - c.trimStartMs);
      return acc + clipSpan / c.speed;
    }, 0);
  }

  getRemainingDurationMs(): number {
    return Math.max(0, this.maxDurationMs - this.getTotalDurationMs());
  }

  addClip(blob: Blob, durationMs: number): RecordedClip {
    const id = `clip_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const previewUrl = typeof URL !== 'undefined' && URL.createObjectURL ? URL.createObjectURL(blob) : '';

    const newClip: RecordedClip = {
      id,
      blob,
      previewUrl,
      durationMs,
      trimStartMs: 0,
      trimEndMs: durationMs,
      speed: 1.0,
      order: this.clips.length,
    };

    this.clips.push(newClip);
    return newClip;
  }

  removeClip(id: string): RecordedClip | null {
    const idx = this.clips.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    const [removed] = this.clips.splice(idx, 1);
    if (removed.previewUrl && typeof URL !== 'undefined' && URL.revokeObjectURL) {
      try {
        URL.revokeObjectURL(removed.previewUrl);
      } catch {
        // ignore
      }
    }
    // Re-index remaining clips
    this.clips.forEach((c, i) => {
      c.order = i;
    });
    return removed;
  }

  removeLastClip(): RecordedClip | null {
    if (this.clips.length === 0) return null;
    const last = this.clips[this.clips.length - 1];
    return this.removeClip(last.id);
  }

  reorderClips(clipIds: string[]): void {
    const map = new Map(this.clips.map((c) => [c.id, c]));
    const reordered: RecordedClip[] = [];
    clipIds.forEach((id, idx) => {
      const c = map.get(id);
      if (c) {
        c.order = idx;
        reordered.push(c);
      }
    });
    this.clips = reordered;
  }

  updateClipTrimming(id: string, trimStartMs: number, trimEndMs: number): void {
    const clip = this.clips.find((c) => c.id === id);
    if (!clip) return;
    clip.trimStartMs = Math.max(0, Math.min(trimStartMs, clip.durationMs));
    clip.trimEndMs = Math.max(clip.trimStartMs, Math.min(trimEndMs, clip.durationMs));
  }

  updateClipSpeed(id: string, speed: 0.5 | 1.0 | 1.5 | 2.0): void {
    const clip = this.clips.find((c) => c.id === id);
    if (!clip) return;
    clip.speed = speed;
  }

  clear(): void {
    this.clips.forEach((c) => {
      if (c.previewUrl && typeof URL !== 'undefined' && URL.revokeObjectURL) {
        try {
          URL.revokeObjectURL(c.previewUrl);
        } catch {
          // ignore
        }
      }
    });
    this.clips = [];
  }
}
