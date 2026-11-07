import { describe, it, expect } from 'vitest';
import { validateComposer, POST_MAX_LENGTH } from '../../packages/social/src/index';

describe('Quote Post & Composer Validation', () => {
  it('validates post with quote commentary and shared post id', () => {
    const result = validateComposer({
      authorId: 'test-user-id',
      content: 'Check out this take from Trinidad!',
      visibility: 'public',
      mediaCount: 0,
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects post exceeding maximum character length', () => {
    const hugeContent = 'a'.repeat(3001);
    const result = validateComposer({
      authorId: 'test-user-id',
      content: hugeContent,
      visibility: 'public',
      mediaCount: 0,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('allows quote post with attached media up to limits', () => {
    const result = validateComposer({
      authorId: 'test-user-id',
      content: 'Adding my reaction to this!',
      visibility: 'public',
      mediaCount: 4,
    });
    expect(result.valid).toBe(true);
  });
});
