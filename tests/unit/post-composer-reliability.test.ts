import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateCorrelationId,
  generateIdempotencyKey,
  isRetryableError,
  formatFriendlyErrorMessage,
  type PostingState,
} from '../../apps/web/src/lib/social/posting-state-machine';
import {
  hasMeaningfulDraftContent,
  getComposerDraft,
  saveComposerDraft,
  clearComposerDraft,
} from '../../apps/web/src/lib/social/draft-manager';

describe('TUKUBI Post Composer Reliability & State Machine Engine', () => {
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

  describe('1. Correlation ID Generator', () => {
    it('generates NASA-grade correlation IDs with expected prefix and hex characters', () => {
      const id1 = generateCorrelationId();
      const id2 = generateCorrelationId();

      expect(id1).toMatch(/^TUKUBI-POST-[0-9A-F]{8}$/);
      expect(id2).toMatch(/^TUKUBI-POST-[0-9A-F]{8}$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('2. Idempotency Key Generator', () => {
    it('generates author-scoped idempotency keys for publication deduplication', () => {
      const authorId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const key = generateIdempotencyKey(authorId);

      expect(key).toMatch(/^pub_a1b2c3d4_[a-z0-9]+_[a-z0-9]+$/);
    });

    it('generates fallback prefix when authorId is omitted', () => {
      const key = generateIdempotencyKey();
      expect(key.startsWith('pub_anon_')).toBe(true);
    });
  });

  describe('3. Error Retryability Classification', () => {
    it('correctly classifies non-retryable authorization and policy errors', () => {
      expect(isRetryableError(new Error('Test accounts (Bravo Tester) are prohibited'))).toBe(false);
      expect(isRetryableError('User is banned from posting')).toBe(false);
      expect(isRetryableError('You are not authorized to publish on behalf of TUKUBI')).toBe(false);
      expect(isRetryableError('Please sign in to publish your post')).toBe(false);
      expect(isRetryableError('You are not a member of this community')).toBe(false);
      expect(isRetryableError('Content violates safety review policy')).toBe(false);
    });

    it('correctly classifies transient, retryable infrastructure and network errors', () => {
      expect(isRetryableError(new Error('Network request failed: fetch error'))).toBe(true);
      expect(isRetryableError(new Error('Gateway timeout 504'))).toBe(true);
      expect(isRetryableError('Database connection pool timeout')).toBe(true);
      expect(isRetryableError('Service 503 temporarily unavailable')).toBe(true);
      expect(isRetryableError('Storage media upload rate limit reached')).toBe(true);
    });

    it('returns false for null or undefined errors', () => {
      expect(isRetryableError(null)).toBe(false);
      expect(isRetryableError(undefined)).toBe(false);
    });
  });

  describe('4. User-Friendly Error Formatting with Correlation ID', () => {
    it('embeds correlation ID and friendly message for banned tester accounts', () => {
      const correlationId = 'TUKUBI-POST-1234ABCD';
      const formatted = formatFriendlyErrorMessage('Test accounts (Bravo Tester) are prohibited', correlationId);

      expect(formatted.isRetryable).toBe(false);
      expect(formatted.friendly).toContain('Test accounts');
      expect(formatted.friendly).not.toContain('undefined');
    });

    it('formats storage upload errors with retry hint and correlation ID', () => {
      const correlationId = 'TUKUBI-POST-5678EFAB';
      const formatted = formatFriendlyErrorMessage(new Error('Storage upload failed: timeout'), correlationId);

      expect(formatted.isRetryable).toBe(true);
      expect(formatted.friendly).toContain('upload was interrupted');
      expect(formatted.friendly).toContain(correlationId);
    });

    it('formats transient network errors with retryable true and correlation ID', () => {
      const correlationId = 'TUKUBI-POST-9999AAAA';
      const formatted = formatFriendlyErrorMessage(new Error('Network timeout during fetch'), correlationId);

      expect(formatted.isRetryable).toBe(true);
      expect(formatted.friendly).toContain("We couldn't publish your post right now");
      expect(formatted.friendly).toContain(correlationId);
    });

    it('formats unexpected unknown errors as non-retryable by default with correlation ID', () => {
      const correlationId = 'TUKUBI-POST-7777BBBB';
      const formatted = formatFriendlyErrorMessage(new Error('Malformed payload structure'), correlationId);

      expect(formatted.isRetryable).toBe(false);
      expect(formatted.friendly).toContain("We couldn't publish your post right now");
      expect(formatted.friendly).toContain(correlationId);
    });
  });

  describe('5. Draft Manager Resilience', () => {
    it('identifies meaningful draft content correctly', () => {
      expect(hasMeaningfulDraftContent(null)).toBe(false);
      expect(hasMeaningfulDraftContent(undefined)).toBe(false);
      expect(hasMeaningfulDraftContent({ content: '' })).toBe(false);
      expect(hasMeaningfulDraftContent({ content: '   ' })).toBe(false);

      expect(hasMeaningfulDraftContent({ content: 'Carnival vibes!' })).toBe(true);
      expect(hasMeaningfulDraftContent({ pollQuestion: 'Best beach in Barbados?' })).toBe(true);
      expect(hasMeaningfulDraftContent({ taggedProductIds: ['prod-1'] })).toBe(true);
      expect(hasMeaningfulDraftContent({ linkPreviews: [{ url: 'https://youtube.com/watch?v=123' }] })).toBe(true);
      expect(hasMeaningfulDraftContent({ mediaSummary: [{ id: 'm1', type: 'image' }] })).toBe(true);
    });

    it('stores and retrieves meaningful draft content in localStorage', () => {
      const mockDraft = {
        content: 'Draft content for Caribbean food festival',
        audience: 'everyone',
        mode: 'text',
        isReel: false,
        pollQuestion: '',
        pollOptions: ['', ''],
        selectedCommunityId: null,
        selectedCountryId: 'JAM',
        taggedProductIds: [],
        linkPreviews: [
          {
            url: 'https://youtu.be/dQw4w9WgXcQ',
            title: 'Caribbean Vibes',
            provider: 'youtube',
          },
        ],
        mediaSummary: [
          {
            id: 'media_123',
            type: 'image' as const,
            uploadedUrl: 'https://cdn.tukubi.com/post-media/img.jpg',
          },
        ],
      };

      saveComposerDraft(mockDraft);
      const retrieved = getComposerDraft();

      expect(retrieved).not.toBeNull();
      expect(retrieved?.content).toBe(mockDraft.content);
      expect(retrieved?.linkPreviews?.length).toBe(1);
      expect(retrieved?.mediaSummary?.length).toBe(1);
      expect(retrieved?.mediaSummary?.[0].uploadedUrl).toBe('https://cdn.tukubi.com/post-media/img.jpg');
    });

    it('clears draft deterministically when content is emptied or cleared', () => {
      saveComposerDraft({
        content: 'Temporary draft',
        audience: 'everyone',
        mode: 'text',
        isReel: false,
        pollQuestion: '',
        pollOptions: [],
        selectedCommunityId: null,
        selectedCountryId: null,
        taggedProductIds: [],
        linkPreviews: [],
        mediaSummary: [],
      });

      expect(getComposerDraft()).not.toBeNull();

      clearComposerDraft();
      expect(getComposerDraft()).toBeNull();
    });
  });
});
