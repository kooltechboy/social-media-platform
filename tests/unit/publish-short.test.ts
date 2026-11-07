import { describe, it, expect } from 'vitest';
import {
  publishShortAction,
  reportShortAction,
  saveShortAction,
  unsaveShortAction,
} from '../../apps/web/src/lib/media/short-actions';

describe('Sub-Project 2: Shorts Publishing & Engagement', () => {
  it('publishShortAction blocks unauthenticated users', async () => {
    const formData = new FormData();
    formData.append('title', 'Vibrant Carnival Clip');
    formData.append('storagePath', 'videos/carnival.mp4');

    const result = await publishShortAction(formData);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Sign in|auth/i);
  });

  it('publishShortAction rejects empty title or storagePath', async () => {
    const formData = new FormData();
    formData.append('title', '');
    formData.append('storagePath', '');

    const result = await publishShortAction(formData);
    expect(result.success).toBe(false);
  });

  it('saveShortAction and unsaveShortAction require authentication', async () => {
    const saveRes = await saveShortAction('test-short-id');
    expect(saveRes.success).toBe(false);
    expect(saveRes.error).toMatch(/Sign in/i);

    const unsaveRes = await unsaveShortAction('test-short-id');
    expect(unsaveRes.success).toBe(false);
    expect(unsaveRes.error).toMatch(/Sign in/i);
  });

  it('reportShortAction requires authentication', async () => {
    const reportRes = await reportShortAction('test-short-id', 'inappropriate');
    expect(reportRes.success).toBe(false);
    expect(reportRes.error).toMatch(/Sign in/i);
  });
});
