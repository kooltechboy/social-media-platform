/**
 * TUKUBI Canonical Composer Draft Lifecycle Manager
 * 
 * Defines a deterministic, single source of truth for post draft states:
 * EMPTY -> EDITING -> DIRTY -> SAVING -> SAVED -> PUBLISHING -> PUBLISHED / ERROR
 * Cancellation:
 * EDITING / DIRTY / SAVED -> DISCARD -> EMPTY
 * Successful publish:
 * PUBLISHING -> PUBLISHED -> CLEAR DRAFT -> EMPTY
 */

export const TUKUBI_COMPOSER_DRAFT_KEY = 'tukubi_composer_draft_v3';
const LEGACY_DRAFT_KEYS = ['tukubi_composer_draft_v2', 'tukubi_composer_draft'];

export type ComposerDraftStatus = 'empty' | 'editing' | 'dirty' | 'saved' | 'publishing' | 'published' | 'error';

export interface ComposerDraftData {
  id?: string;
  content: string;
  audience?: string;
  mode?: string;
  isReel?: boolean;
  pollQuestion?: string;
  pollOptions?: string[];
  selectedCommunityId?: string | null;
  selectedCountryId?: string | null;
  taggedProductIds?: string[];
  linkPreviews?: any[];
  mediaSummary?: Array<{ id: string; type: 'image' | 'video'; name?: string; uploadedUrl?: string }>;
  updatedAt: number;
}

/**
 * Determines whether the draft payload contains meaningful, recoverable user content.
 * An empty composer, or one with only whitespace, is NOT considered a draft.
 */
export function hasMeaningfulDraftContent(draft: Partial<ComposerDraftData> | null | undefined): boolean {
  if (!draft) return false;
  if (typeof draft.content === 'string' && draft.content.trim().length > 0) return true;
  if (typeof draft.pollQuestion === 'string' && draft.pollQuestion.trim().length > 0) return true;
  if (Array.isArray(draft.taggedProductIds) && draft.taggedProductIds.length > 0) return true;
  if (Array.isArray(draft.linkPreviews) && draft.linkPreviews.length > 0) return true;
  if (Array.isArray(draft.mediaSummary) && draft.mediaSummary.length > 0) return true;
  return false;
}

/**
 * Retrieves the current draft from storage if valid and meaningful.
 * Cleans up stale or empty draft records automatically.
 */
export function getComposerDraft(): ComposerDraftData | null {
  if (typeof window === 'undefined') return null;

  try {
    let raw = localStorage.getItem(TUKUBI_COMPOSER_DRAFT_KEY);
    if (!raw) {
      for (const legacyKey of LEGACY_DRAFT_KEYS) {
        const legacyVal = localStorage.getItem(legacyKey);
        if (legacyVal) {
          raw = legacyVal;
          break;
        }
      }
    }

    if (!raw) return null;

    const parsed: ComposerDraftData = JSON.parse(raw);
    if (hasMeaningfulDraftContent(parsed)) {
      return parsed;
    }

    // Clean up empty/meaningless drafts
    clearComposerDraft();
    return null;
  } catch {
    clearComposerDraft();
    return null;
  }
}

/**
 * Persists a meaningful draft to storage and notifies listening components.
 * If the content is not meaningful, automatically discards the draft.
 */
export function saveComposerDraft(data: Omit<ComposerDraftData, 'updatedAt'>): void {
  if (typeof window === 'undefined') return;

  if (!hasMeaningfulDraftContent(data)) {
    clearComposerDraft();
    return;
  }

  const payload: ComposerDraftData = {
    ...data,
    updatedAt: Date.now(),
  };

  try {
    localStorage.setItem(TUKUBI_COMPOSER_DRAFT_KEY, JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent('tukubi:composer-draft-saved', { detail: payload }));
  } catch (err) {
    console.warn('[DraftManager] Failed to persist draft to localStorage:', err);
  }
}

/**
 * Authoritatively deletes the composer draft from all storage mechanisms
 * and broadcasts an event to immediately clear any UI reminder banners across tabs and views.
 */
export function clearComposerDraft(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(TUKUBI_COMPOSER_DRAFT_KEY);
    for (const legacyKey of LEGACY_DRAFT_KEYS) {
      localStorage.removeItem(legacyKey);
    }
    sessionStorage.removeItem(TUKUBI_COMPOSER_DRAFT_KEY);
  } catch (err) {
    console.warn('[DraftManager] Failed to remove draft key:', err);
  }

  // Notify all views, tabs, and components to remove draft banners and reset dirty indicators
  window.dispatchEvent(new CustomEvent('tukubi:composer-draft-cleared'));
}

/**
 * Subscribes to composer draft state mutations (save, discard, clear).
 * Returns an unsubscription callback.
 */
export function subscribeToDraftChanges(callback: (draft: ComposerDraftData | null) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleSaved = (e: Event) => {
    const custom = e as CustomEvent<ComposerDraftData>;
    callback(custom.detail || getComposerDraft());
  };

  const handleCleared = () => {
    callback(null);
  };

  const handleStorage = (e: StorageEvent) => {
    if (e.key === TUKUBI_COMPOSER_DRAFT_KEY || LEGACY_DRAFT_KEYS.includes(e.key || '')) {
      callback(getComposerDraft());
    }
  };

  window.addEventListener('tukubi:composer-draft-saved', handleSaved);
  window.addEventListener('tukubi:composer-draft-cleared', handleCleared);
  window.addEventListener('storage', handleStorage);

  return () => {
    window.removeEventListener('tukubi:composer-draft-saved', handleSaved);
    window.removeEventListener('tukubi:composer-draft-cleared', handleCleared);
    window.removeEventListener('storage', handleStorage);
  };
}
