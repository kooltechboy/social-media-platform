import { describe, it, expect, vi } from 'vitest';

describe('Direct Conversations Resilience Suite', () => {
  it('enforces self-message guard', async () => {
    const { getOrCreateDirectConversation } = await import('../../apps/web/src/lib/messaging/direct-conversations');
    const result = await getOrCreateDirectConversation('user-123', 'user-123');
    expect(result.conversationId).toBeNull();
    expect(result.error).toContain('yourself');
  });

  it('requires authentication to start a direct conversation', async () => {
    const { getOrCreateDirectConversation } = await import('../../apps/web/src/lib/messaging/direct-conversations');
    // Without current user session
    const result = await getOrCreateDirectConversation('user-456', '');
    expect(result.conversationId).toBeNull();
    expect(result.error).toBe('Sign in to start messaging.');
  });
});
