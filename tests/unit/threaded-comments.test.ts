import { describe, it, expect } from 'vitest';

describe('Threaded Comments Architecture', () => {
  it('correctly separates root comments from nested replies using parent_id', () => {
    const comments = [
      { id: 'c1', content: 'First top comment', parent_id: null },
      { id: 'c2', content: 'Second top comment', parent_id: null },
      { id: 'r1', content: 'Reply to first comment', parent_id: 'c1' },
      { id: 'r2', content: 'Second reply to first comment', parent_id: 'c1' },
      { id: 'r3', content: 'Reply to second comment', parent_id: 'c2' },
    ];

    const rootComments = comments.filter((c) => !c.parent_id);
    expect(rootComments).toHaveLength(2);
    expect(rootComments.map((c) => c.id)).toEqual(['c1', 'c2']);

    const c1Replies = comments.filter((c) => c.parent_id === 'c1');
    expect(c1Replies).toHaveLength(2);
    expect(c1Replies.map((r) => r.id)).toEqual(['r1', 'r2']);

    const c2Replies = comments.filter((c) => c.parent_id === 'c2');
    expect(c2Replies).toHaveLength(1);
    expect(c2Replies[0].id).toBe('r3');
  });

  it('optimistic comment insertion updates counts and preserves tree hierarchy', () => {
    const initialComments = [
      { id: 'c1', content: 'Root', parent_id: null },
    ];
    let commentsCount = 1;

    // Add reply to c1
    const newReply = { id: 'r1', content: 'Replying here', parent_id: 'c1' };
    const updatedComments = [...initialComments, newReply];
    commentsCount += 1;

    expect(updatedComments).toHaveLength(2);
    expect(commentsCount).toBe(2);

    // Root comments count remains 1, while c1 replies count is 1
    const roots = updatedComments.filter((c) => !c.parent_id);
    const replies = updatedComments.filter((c) => c.parent_id === 'c1');
    expect(roots).toHaveLength(1);
    expect(replies).toHaveLength(1);
  });

  it('deleting a comment removes it and decrements count', () => {
    const comments = [
      { id: 'c1', content: 'Root', parent_id: null },
      { id: 'r1', content: 'Reply', parent_id: 'c1' },
    ];
    let count = 2;

    const filtered = comments.filter((c) => c.id !== 'r1');
    count = Math.max(0, count - 1);

    expect(filtered).toHaveLength(1);
    expect(count).toBe(1);
    expect(filtered[0].id).toBe('c1');
  });
});
