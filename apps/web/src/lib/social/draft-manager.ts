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
export const DRAFT_STORAGE_KEY = TUKUBI_COMPOSER_DRAFT_KEY;
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
  taggedProducts?: Array<any>;
  linkPreviews?: any[];
  mediaSummary?: Array<{ id?: string; type?: 'image' | 'video'; kind?: 'image' | 'video'; status?: string; name?: string; uploadedUrl?: string }>;
  updatedAt: number;
}

export type ComposerDraftPayload = ComposerDraftData;

function isPersistedMediaItem(m: any): boolean {
  if (!m || typeof m !== 'object') return false;
  if (typeof m.uploadedUrl === 'string' && m.uploadedUrl.trim().length > 0) return true;
  if ('status' in m || 'uploadedUrl' in m) return false;
  return Boolean(m.id || m.type);
}

/**
 * Determines whether the draft payload contains meaningful, recoverable user content.
 * An empty composer, one with only whitespace, or one with only un-uploaded local blob
 * references (which cannot survive page reloads) is NOT considered a recoverable draft.
 */
export function hasMeaningfulDraftContent(draft: Partial<ComposerDraftData> | null | undefined): boolean {
  if (!draft) return false;
  if (typeof draft.content === 'string' && draft.content.trim().length > 0) return true;
  if (typeof draft.pollQuestion === 'string' && draft.pollQuestion.trim().length > 0) return true;
  if (Array.isArray(draft.taggedProductIds) && draft.taggedProductIds.length > 0) return true;
  if (Array.isArray(draft.taggedProducts) && draft.taggedProducts.length > 0) return true;
  if (Array.isArray(draft.linkPreviews) && draft.linkPreviews.length > 0) return true;
  if (Array.isArray(draft.mediaSummary) && draft.mediaSummary.some(isPersistedMediaItem)) {
    return true;
  }
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

export const loadComposerDraft = getComposerDraft;

/**
 * Persists a meaningful draft to storage and notifies listening components.
 * If the content is not meaningful, automatically discards any existing stored draft.
 */
export function saveComposerDraft(data: Omit<ComposerDraftData, 'updatedAt'>): void {
  if (typeof window === 'undefined') return;

  if (!hasMeaningfulDraftContent(data)) {
    const hasStoredKey =
      Boolean(localStorage.getItem(TUKUBI_COMPOSER_DRAFT_KEY)) ||
      LEGACY_DRAFT_KEYS.some((k) => Boolean(localStorage.getItem(k)));
    if (hasStoredKey) {
      clearComposerDraft();
    }
    return;
  }

  const normalizedMediaSummary = Array.isArray(data.mediaSummary)
    ? data.mediaSummary.filter(isPersistedMediaItem)
    : undefined;

  const payload: ComposerDraftData = {
    ...data,
    mediaSummary: normalizedMediaSummary,
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
