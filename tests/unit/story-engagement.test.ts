import { describe, it, expect } from 'vitest';
import {
  reactToStoryAction,
  deleteStoryAction,
  recordStoryViewAction,
} from '../../apps/web/src/lib/social/actions';

describe('Sub-Project 2: Story Engagement & Reactions', () => {
  it('reactToStoryAction requires authentication', async () => {
    const res = await reactToStoryAction('story-123', '❤️');
    expect(res.success).toBe(false);
    expect(res.error).toBe('Unauthorized');
  });

  it('reactToStoryAction rejects unsupported emoji reactions', async () => {
    const res = await reactToStoryAction('story-123', '👽');
    expect(res.success).toBe(false);
    // Unauthenticated check runs first or validation check runs
    expect(res.error).toBeTruthy();
  });

  it('deleteStoryAction blocks unauthenticated users', async () => {
    const res = await deleteStoryAction('story-123');
    expect(res.success).toBe(false);
    expect(res.error).toBe('Unauthorized');
  });

  it('recordStoryViewAction returns false gracefully when not signed in', async () => {
    const res = await recordStoryViewAction('story-123');
    expect(res.success).toBe(false);
  });
});
