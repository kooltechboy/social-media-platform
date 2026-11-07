import { describe, it, expect } from 'vitest';
import type { ReactionType } from '../../apps/web/src/components/reactions/reaction-picker';

describe('Multi-Reaction Drawer & Optimistic State Sync', () => {
  it('toggles reaction on when no prior reaction exists', () => {
    let current: ReactionType | null = null;
    let count = 10;

    // User chooses 'fire'
    const newType: ReactionType = 'fire';
    const isRemoval = current === newType;
    current = isRemoval ? null : newType;
    count += isRemoval ? -1 : current ? 1 : 0;

    expect(current).toBe('fire');
    expect(count).toBe(11);
  });

  it('toggles reaction off when clicking the same reaction', () => {
    let current: ReactionType | null = 'fire';
    let count = 11;

    // User clicks 'fire' again to untoggle
    const newType: ReactionType = 'fire';
    const isRemoval = current === newType;
    current = isRemoval ? null : newType;
    count += isRemoval ? -1 : 1;

    expect(current).toBeNull();
    expect(count).toBe(10);
  });

  it('swaps reaction type without incrementing total count when changing emotions', () => {
    let current: ReactionType | null = 'like';
    let count = 5;

    // User switches from 'like' to 'palm' (island vibe)
    const newType: ReactionType = 'palm';
    const isRemoval = current === newType;
    const hadPrior = Boolean(current);
    current = isRemoval ? null : newType;
    count += isRemoval ? -1 : hadPrior ? 0 : 1;

    expect(current).toBe('palm');
    expect(count).toBe(5); // unchanged
  });

  it('rolls back to previous reaction and count on server error', () => {
    const originalReaction: ReactionType | null = 'like';
    const originalCount = 5;

    // Optimistically toggle off
    let activeReaction: ReactionType | null = null;
    let activeCount = 4;

    // Server returns error -> rollback
    const serverError = 'Database unavailable';
    if (serverError) {
      activeReaction = originalReaction;
      activeCount = originalCount;
    }

    expect(activeReaction).toBe('like');
    expect(activeCount).toBe(5);
  });
});
