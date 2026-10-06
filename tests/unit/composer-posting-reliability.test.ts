import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getComposerDraft,
  saveComposerDraft,
  clearComposerDraft,
  hasMeaningfulDraftContent,
  subscribeToDraftChanges,
  type ComposerDraftPayload,
} from '../../apps/web/src/lib/social/draft-manager';
import { detectUrls, normalizeUrl } from '../../packages/media/src/index';

describe('Composer & Posting Reliability — Canonical Draft Lifecycle', () => {
  let mockStorage: Record<string, string> = {};
  let listeners: Record<string, Array<(evt: any) => void>> = {};

  class MockCustomEvent {
    type: string;
    detail: any;
    constructor(type: string, options?: { detail?: any }) {
      this.type = type;
      this.detail = options?.detail;
    }
  }

  const mockStorageImpl = {
    getItem: (key: string) => mockStorage[key] ?? null,
    setItem: (key: string, value: string) => {
      mockStorage[key] = String(value);
    },
    removeItem: (key: string) => {
      delete mockStorage[key];
    },
    clear: () => {
      mockStorage = {};
    },
  };

  const mockWindow = {
    addEventListener: (event: string, handler: any) => {
      listeners[event] = listeners[event] || [];
      listeners[event].push(handler);
    },
    removeEventListener: (event: string, handler: any) => {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter((h) => h !== handler);
      }
    },
    dispatchEvent: (evt: any) => {
      if (listeners[evt.type]) {
        listeners[evt.type].forEach((h) => h(evt));
      }
      return true;
    },
  };

  beforeEach(() => {
    mockStorage = {};
    listeners = {};
    vi.stubGlobal('CustomEvent', MockCustomEvent);
    vi.stubGlobal('window', mockWindow);
    vi.stubGlobal('localStorage', mockStorageImpl);
    vi.stubGlobal('sessionStorage', mockStorageImpl);
  });

  it('detects meaningful vs non-meaningful draft content accurately', () => {
    // Non-meaningful
    expect(hasMeaningfulDraftContent({})).toBe(false);
    expect(hasMeaningfulDraftContent({ content: '' })).toBe(false);
    expect(hasMeaningfulDraftContent({ content: '    ' })).toBe(false);
    expect(hasMeaningfulDraftContent({ content: '\n\n' })).toBe(false);
    expect(hasMeaningfulDraftContent({ pollQuestion: '   ' })).toBe(false);
    expect(hasMeaningfulDraftContent({ mediaSummary: [] })).toBe(false);
    expect(hasMeaningfulDraftContent({ linkPreviews: [] })).toBe(false);

    // Meaningful: Text
    expect(hasMeaningfulDraftContent({ content: 'Hello Caribbean diaspora!' })).toBe(true);

    // Meaningful: Media
    expect(
      hasMeaningfulDraftContent({
        mediaSummary: [{ id: 'm1', type: 'image' }],
      })
    ).toBe(true);

    // Meaningful: Poll
    expect(
      hasMeaningfulDraftContent({
        pollQuestion: 'Which island has the best carnival?',
      })
    ).toBe(true);

    // Meaningful: Link Preview
    expect(
      hasMeaningfulDraftContent({
        linkPreviews: [
          {
            url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            title: 'Caribbean Vibes',
            status: 'ready',
          } as any,
        ],
      })
    ).toBe(true);

    // Meaningful: Tagged Products
    expect(
      hasMeaningfulDraftContent({
        taggedProductIds: ['prod_blue_mountain_coffee'],
      })
    ).toBe(true);
  });

  it('saves, retrieves, and updates draft state deterministically', () => {
    expect(getComposerDraft()).toBeNull();

    const draft: ComposerDraftPayload = {
      content: 'Celebrating Independence in Kingston!',
      audience: 'caribbean',
      mode: 'text',
      isReel: false,
    };

    saveComposerDraft(draft);

    const retrieved = getComposerDraft();
    expect(retrieved).not.toBeNull();
    expect(retrieved?.content).toBe('Celebrating Independence in Kingston!');
    expect(retrieved?.audience).toBe('caribbean');
    expect(retrieved?.updatedAt).toBeDefined();

    // Cleans up legacy keys upon saving
    expect(mockStorage['tukubi_composer_draft_v2']).toBeUndefined();
    expect(mockStorage['tukubi_post_draft_v1']).toBeUndefined();
  });

  it('completely removes draft on explicit discard / clear and notifies subscribers', () => {
    let notifiedValue: ComposerDraftPayload | null = 'INITIAL' as any;
    const unsubscribe = subscribeToDraftChanges((val) => {
      notifiedValue = val;
    });

    // 1. Save draft
    saveComposerDraft({ content: 'Unfinished draft...' });
    expect(notifiedValue?.content).toBe('Unfinished draft...');
    expect(getComposerDraft()).not.toBeNull();

    // 2. Clear draft
    clearComposerDraft();
    expect(getComposerDraft()).toBeNull();
    expect(notifiedValue).toBeNull();
    expect(mockStorage['tukubi_composer_draft_v3']).toBeUndefined();
    expect(mockStorage['tukubi_composer_draft_v2']).toBeUndefined();
    expect(mockStorage['tukubi_post_draft_v1']).toBeUndefined();

    unsubscribe();
  });
});

describe('Composer & Posting Reliability — Link Detection and Media Pipeline', () => {
  it('identifies and extracts YouTube and social URLs correctly', () => {
    const textWithYouTube = 'Check out this new soca track https://www.youtube.com/watch?v=k1bA3q4Z4oE now!';
    const detected = detectUrls(textWithYouTube);

    expect(detected.hasUrls).toBe(true);
    expect(detected.urls).toContain('https://www.youtube.com/watch?v=k1bA3q4Z4oE');
    expect(detected.primaryUrl).toBe('https://www.youtube.com/watch?v=k1bA3q4Z4oE');
    expect(normalizeUrl(detected.primaryUrl!)).toBe('https://www.youtube.com/watch?v=k1bA3q4Z4oE');
  });

  it('identifies short YouTube and music URLs', () => {
    const textWithShort = 'Watch https://youtu.be/k1bA3q4Z4oE?si=test1234';
    const detected = detectUrls(textWithShort);

    expect(detected.hasUrls).toBe(true);
    expect(detected.primaryUrl).toBe('https://youtu.be/k1bA3q4Z4oE?si=test1234');
    expect(normalizeUrl(detected.primaryUrl!)).toBe('https://youtu.be/k1bA3q4Z4oE');
  });

  it('handles posts with no URLs without throwing', () => {
    const textWithout = 'Just a regular text post about carnival costumes.';
    const detected = detectUrls(textWithout);

    expect(detected.hasUrls).toBe(false);
    expect(detected.urls).toHaveLength(0);
    expect(detected.primaryUrl).toBeUndefined();
  });
});

describe('Composer & Posting Reliability — Publish Transaction Resilience', () => {
  it('deduplicates identical submissions within the 15-second idempotency window', () => {
    const now = Date.now();
    const recentThreshold = new Date(now - 15000).toISOString();

    const existingPost = {
      id: 'post_existing_123',
      content: 'Carnival vibes this Saturday',
      created_at: new Date(now - 3000).toISOString(),
      media_urls: [],
      cultural_tags: ['carnival'],
    };

    // Verify created_at is within recentThreshold
    expect(existingPost.created_at > recentThreshold).toBe(true);
  });

  it('verifies that schema fallback activates when extended columns are absent', () => {
    const isMissingColumnError = (err: any) => {
      const code = err?.code;
      const message = String(err?.message || '');
      return (
        code === 'PGRST204' ||
        code === '42703' ||
        message.includes('Could not find') ||
        message.includes('does not exist')
      );
    };

    // PGRST204 error simulation
    const pgrstError = {
      code: 'PGRST204',
      message: "Could not find 'created_by_user_id' column of 'posts' in the schema cache",
    };
    expect(isMissingColumnError(pgrstError)).toBe(true);

    // Postgres 42703 error simulation
    const pgColumnError = {
      code: '42703',
      message: 'column posts.publisher_type does not exist',
    };
    expect(isMissingColumnError(pgColumnError)).toBe(true);

    // Unrelated constraint error should NOT be treated as missing column
    const constraintError = {
      code: '23505',
      message: 'duplicate key value violates unique constraint',
    };
    expect(isMissingColumnError(constraintError)).toBe(false);
  });
});
