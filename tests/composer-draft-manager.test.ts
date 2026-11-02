import { describe, it, expect, beforeEach } from 'vitest';

class MockStorage implements Storage {
  private store = new Map<string, string>();
  get length() { return this.store.size; }
  clear(): void { this.store.clear(); }
  getItem(key: string): string | null { return this.store.get(key) || null; }
  key(index: number): string | null { return Array.from(this.store.keys())[index] || null; }
  removeItem(key: string): void { this.store.delete(key); }
  setItem(key: string, value: string): void { this.store.set(key, String(value)); }
}

const mockLocal = new MockStorage();
const mockSession = new MockStorage();

(globalThis as any).window = globalThis;
(globalThis as any).localStorage = mockLocal;
(globalThis as any).sessionStorage = mockSession;
(globalThis as any).dispatchEvent = () => true;
(globalThis as any).addEventListener = () => {};
(globalThis as any).removeEventListener = () => {};

import {
  saveComposerDraft,
  getComposerDraft,
  clearComposerDraft,
  hasMeaningfulDraftContent,
  hasRecoverableDraft,
  TUKUBI_COMPOSER_DRAFT_KEY,
} from '../apps/web/src/lib/social/draft-manager';

describe('Composer Draft Lifecycle Manager', () => {
  beforeEach(() => {
    mockLocal.clear();
    mockSession.clear();
  });

  it('detects meaningful draft content correctly', () => {
    expect(hasMeaningfulDraftContent(null)).toBe(false);
    expect(hasMeaningfulDraftContent({ content: '   ' })).toBe(false);
    expect(hasMeaningfulDraftContent({ content: 'Authentic Caribbean soca vibes!' })).toBe(true);
    expect(hasMeaningfulDraftContent({ pollQuestion: 'Best carnival?' })).toBe(true);
  });

  it('persists and retrieves meaningful draft', () => {
    saveComposerDraft({
      content: 'Vibing in Port of Spain 🇹🇹',
      audience: 'everyone',
    });

    expect(hasRecoverableDraft()).toBe(true);
    const draft = getComposerDraft();
    expect(draft).not.toBeNull();
    expect(draft?.content).toBe('Vibing in Port of Spain 🇹🇹');
    expect(draft?.audience).toBe('everyone');
    expect(typeof draft?.updatedAt).toBe('number');
  });

  it('discards empty draft automatically', () => {
    saveComposerDraft({
      content: 'Hello',
    });
    expect(hasRecoverableDraft()).toBe(true);

    // Overwriting with whitespace only should discard
    saveComposerDraft({
      content: '   ',
    });
    expect(hasRecoverableDraft()).toBe(false);
    expect(getComposerDraft()).toBeNull();
  });

  it('clears draft upon clearComposerDraft()', () => {
    saveComposerDraft({
      content: 'Draft to discard',
    });

    clearComposerDraft();
    expect(hasRecoverableDraft()).toBe(false);
    expect(getComposerDraft()).toBeNull();
  });
});
