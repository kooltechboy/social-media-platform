import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClipRecorder } from '../packages/media/src/creation/clip-recorder';

describe('ClipRecorder', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-preview-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('initializes with zero clips and correct max duration budget', () => {
    const recorder = new ClipRecorder(30000); // 30s budget
    expect(recorder.getClips()).toHaveLength(0);
    expect(recorder.getMaxDurationMs()).toBe(30000);
    expect(recorder.getTotalDurationMs()).toBe(0);
    expect(recorder.getRemainingDurationMs()).toBe(30000);
  });

  it('adds clips and updates total duration', () => {
    const recorder = new ClipRecorder(60000);
    const mockBlob = new Blob(['sample-data'], { type: 'video/webm' });

    const clip = recorder.addClip(mockBlob, 10000);
    expect(clip.id).toBeDefined();
    expect(clip.durationMs).toBe(10000);
    expect(clip.previewUrl).toBe('blob:mock-preview-url');
    expect(clip.order).toBe(0);
    expect(clip.speed).toBe(1.0);
    expect(clip.trimStartMs).toBe(0);
    expect(clip.trimEndMs).toBe(10000);
    expect(recorder.getTotalDurationMs()).toBe(10000);
    expect(recorder.getRemainingDurationMs()).toBe(50000);
  });

  it('allows removing the last clip (undo take)', () => {
    const recorder = new ClipRecorder(60000);
    const b1 = new Blob(['1'], { type: 'video/webm' });
    const b2 = new Blob(['2'], { type: 'video/webm' });

    recorder.addClip(b1, 5000);
    recorder.addClip(b2, 7000);
    expect(recorder.getClips()).toHaveLength(2);

    const removed = recorder.removeLastClip();
    expect(removed?.durationMs).toBe(7000);
    expect(recorder.getClips()).toHaveLength(1);
    expect(recorder.getTotalDurationMs()).toBe(5000);
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-preview-url');
  });

  it('returns null when removing last clip from empty recorder', () => {
    const recorder = new ClipRecorder(60000);
    expect(recorder.removeLastClip()).toBeNull();
  });

  it('removes clip by ID and re-indexes orders', () => {
    const recorder = new ClipRecorder(60000);
    const b1 = new Blob(['1'], { type: 'video/webm' });
    const b2 = new Blob(['2'], { type: 'video/webm' });
    const b3 = new Blob(['3'], { type: 'video/webm' });

    const c1 = recorder.addClip(b1, 5000);
    const c2 = recorder.addClip(b2, 6000);
    const c3 = recorder.addClip(b3, 7000);

    const removed = recorder.removeClip(c2.id);
    expect(removed?.id).toBe(c2.id);

    const clips = recorder.getClips();
    expect(clips).toHaveLength(2);
    expect(clips[0].id).toBe(c1.id);
    expect(clips[0].order).toBe(0);
    expect(clips[1].id).toBe(c3.id);
    expect(clips[1].order).toBe(1);
    expect(recorder.getTotalDurationMs()).toBe(12000);
  });

  it('updates clip trimming bounds and speed multiplier', () => {
    const recorder = new ClipRecorder(60000);
    const b = new Blob(['1'], { type: 'video/webm' });
    const clip = recorder.addClip(b, 10000);

    recorder.updateClipTrimming(clip.id, 1000, 8000);
    recorder.updateClipSpeed(clip.id, 1.5);

    const updated = recorder.getClips().find((c) => c.id === clip.id);
    expect(updated?.trimStartMs).toBe(1000);
    expect(updated?.trimEndMs).toBe(8000);
    expect(updated?.speed).toBe(1.5);

    // Total duration should reflect (8000 - 1000) / 1.5 = 7000 / 1.5
    expect(recorder.getTotalDurationMs()).toBeCloseTo(7000 / 1.5);
  });

  it('clamps trimming boundaries within [0, durationMs]', () => {
    const recorder = new ClipRecorder(60000);
    const b = new Blob(['1'], { type: 'video/webm' });
    const clip = recorder.addClip(b, 10000);

    recorder.updateClipTrimming(clip.id, -500, 15000);
    const updated = recorder.getClips().find((c) => c.id === clip.id);
    expect(updated?.trimStartMs).toBe(0);
    expect(updated?.trimEndMs).toBe(10000);
  });

  it('reorders clips and updates order indices', () => {
    const recorder = new ClipRecorder(60000);
    const b1 = new Blob(['1'], { type: 'video/webm' });
    const b2 = new Blob(['2'], { type: 'video/webm' });
    const b3 = new Blob(['3'], { type: 'video/webm' });

    const c1 = recorder.addClip(b1, 1000);
    const c2 = recorder.addClip(b2, 2000);
    const c3 = recorder.addClip(b3, 3000);

    recorder.reorderClips([c3.id, c1.id, c2.id]);
    const clips = recorder.getClips();
    expect(clips.map((c) => c.id)).toEqual([c3.id, c1.id, c2.id]);
    expect(clips[0].order).toBe(0);
    expect(clips[1].order).toBe(1);
    expect(clips[2].order).toBe(2);
  });

  it('clears all clips and revokes URLs', () => {
    const recorder = new ClipRecorder(60000);
    const b1 = new Blob(['1'], { type: 'video/webm' });
    const b2 = new Blob(['2'], { type: 'video/webm' });

    recorder.addClip(b1, 5000);
    recorder.addClip(b2, 5000);

    recorder.clear();
    expect(recorder.getClips()).toHaveLength(0);
    expect(recorder.getTotalDurationMs()).toBe(0);
    expect(recorder.getRemainingDurationMs()).toBe(60000);
    expect(global.URL.revokeObjectURL).toHaveBeenCalledTimes(2);
  });

  it('does not allow remaining duration to drop below 0', () => {
    const recorder = new ClipRecorder(10000);
    const b1 = new Blob(['1'], { type: 'video/webm' });
    recorder.addClip(b1, 15000);

    expect(recorder.getTotalDurationMs()).toBe(15000);
    expect(recorder.getRemainingDurationMs()).toBe(0);
  });
});
