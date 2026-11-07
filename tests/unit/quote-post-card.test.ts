import { describe, it, expect } from 'vitest';
import QuotePostCard from '../../apps/web/src/components/feed/quote-post-card';

describe('QuotePostCard Component', () => {
  it('is a defined component function', () => {
    expect(typeof QuotePostCard).toBe('function');
  });

  it('renders null when quotedPost is not provided', () => {
    const res = QuotePostCard({ quotedPost: null });
    expect(res).toBeNull();
  });

  it('returns valid element structure when quotedPost is provided', () => {
    const mockPost = {
      id: 'post-123',
      author: 'Rihanna',
      handle: 'badgalriri',
      content: 'Barbados to the world! 🇧🇧',
      time: '2h ago',
      likes: 100,
      reposts: 50,
      comments: 20,
    };
    const res = QuotePostCard({ quotedPost: mockPost });
    expect(res).not.toBeNull();
    expect(res?.props?.href).toBe('/post/post-123');
  });
});
