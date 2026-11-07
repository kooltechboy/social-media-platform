import { describe, it, expect } from 'vitest';

describe('Feed Realtime Buffer Logic', () => {
  it('deduplicates incoming realtime posts against existing timeline IDs', () => {
    const existing = [{ id: 'p1' }, { id: 'p2' }];
    const incoming = [{ id: 'p2' }, { id: 'p3' }];
    const existingIds = new Set(existing.map((p) => p.id));
    const toBuffer = incoming.filter((p) => !existingIds.has(p.id));

    expect(toBuffer).toHaveLength(1);
    expect(toBuffer[0].id).toBe('p3');
  });

  it('flushing prepends all new items to the top without mutating original order', () => {
    const timeline = [{ id: 'p1' }, { id: 'p2' }];
    const pending = [{ id: 'p4' }, { id: 'p3' }]; // newly arrived

    const existingIds = new Set(timeline.map((p) => p.id));
    const toAdd = pending.filter((p) => !existingIds.has(p.id));
    const result = [...toAdd, ...timeline];

    expect(result.map((p) => p.id)).toEqual(['p4', 'p3', 'p1', 'p2']);
  });

  it('prevents duplicate insertions if the same post arrives twice in pending buffer', () => {
    let pending: Array<{ id: string }> = [];

    function bufferPost(post: { id: string }) {
      if (!pending.some((p) => p.id === post.id)) {
        pending = [post, ...pending];
      }
    }

    bufferPost({ id: 'p1' });
    bufferPost({ id: 'p2' });
    bufferPost({ id: 'p1' }); // duplicate arrival

    expect(pending).toHaveLength(2);
    expect(pending.map((p) => p.id)).toEqual(['p2', 'p1']);
  });
});
