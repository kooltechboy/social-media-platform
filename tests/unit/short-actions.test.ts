import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  publishShortAction,
  toggleShortLikeAction,
  postShortCommentAction,
  fetchShortCommentsAction,
  recordShortViewAction,
  saveShortAction,
  unsaveShortAction,
  reportShortAction,
  deleteShortAction,
} from '../../apps/web/src/lib/media/short-actions';

describe('TUKUBI Shorts Server Actions', () => {
  it('exports all expected action methods', () => {
    expect(typeof publishShortAction).toBe('function');
    expect(typeof toggleShortLikeAction).toBe('function');
    expect(typeof postShortCommentAction).toBe('function');
    expect(typeof fetchShortCommentsAction).toBe('function');
    expect(typeof recordShortViewAction).toBe('function');
    expect(typeof saveShortAction).toBe('function');
    expect(typeof unsaveShortAction).toBe('function');
    expect(typeof reportShortAction).toBe('function');
    expect(typeof deleteShortAction).toBe('function');
  });

  it('rejects publishing when unauthenticated', async () => {
    const formData = new FormData();
    formData.set('title', 'Island Carnival Short');
    formData.set('storagePath', 'https://example.com/video.mp4');
    const res = await publishShortAction(formData);
    expect(res.success).toBe(false);
    expect(res.error).toContain('Sign in');
  });

  it('rejects empty title or missing storage path when publishing', async () => {
    // Missing title
    const formData1 = new FormData();
    formData1.set('storagePath', 'https://example.com/video.mp4');
    const res1 = await publishShortAction(formData1);
    expect(res1.success).toBe(false);

    // Missing video
    const formData2 = new FormData();
    formData2.set('title', 'Carnival Vibe');
    const res2 = await publishShortAction(formData2);
    expect(res2.success).toBe(false);
  });
});
