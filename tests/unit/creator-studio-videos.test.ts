import { describe, it, expect } from 'vitest';
import { deleteVideoAction } from '../../apps/web/src/lib/media/reel-actions';
import { deleteShortAction } from '../../apps/web/src/lib/media/short-actions';

describe('Sub-Project 2: Creator Studio Video Management', () => {
  it('deleteVideoAction requires authentication', async () => {
    const res = await deleteVideoAction('nonexistent-video-id');
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/Sign in/i);
  });

  it('deleteShortAction requires authentication', async () => {
    const res = await deleteShortAction('nonexistent-short-id');
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/Sign in/i);
  });
});
