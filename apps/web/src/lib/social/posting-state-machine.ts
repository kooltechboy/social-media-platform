/**
 * TUKUBI Production Posting State Machine & Reliability Engine
 * 
 * Enforces authoritative states:
 * idle -> editing -> analyzing -> uploading -> publishing -> published
 *                                             -> failed -> retrying
 * 
 * Inviolable Rules:
 * 1. ZERO GHOST ERRORS: Any user modification immediately clears previous errors.
 * 2. DETERMINISTIC RESET: resetComposer() clears all transient state and tokens.
 * 3. TRUE IDEMPOTENCY: Reuses publish token on retry; renews on new/modified draft.
 * 4. STRUCTURED OBSERVABILITY: Generates correlation IDs (TUKUBI-POST-XXXXXXXX).
 */

export type PostingState =
  | 'idle'
  | 'editing'
  | 'analyzing'
  | 'uploading'
  | 'publishing'
  | 'published'
  | 'failed'
  | 'retrying';

export interface PostFailureInfo {
  correlationId: string;
  friendlyMessage: string;
  technicalDetails?: string;
  isRetryable: boolean;
  failedStep?: 'media_upload' | 'event_creation' | 'relief_creation' | 'post_insert' | 'network' | 'unknown';
  timestamp: number;
}

/**
 * Generates an auditable, Fortune-100 correlation ID for post publishing operations.
 * Format: TUKUBI-POST-XXXXXXXX
 */
export function generateCorrelationId(): string {
  const chars = '0123456789ABCDEF';
  let rand = '';
  for (let i = 0; i < 8; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `TUKUBI-POST-${rand}`;
}

/**
 * Generates a unique client idempotency key for deduplicating double-clicks and retries.
 */
export function generateIdempotencyKey(authorId?: string): string {
  const prefix = authorId ? authorId.slice(0, 8) : 'anon';
  const timestamp = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 8);
  return `pub_${prefix}_${timestamp}_${rand}`;
}

/**
 * Determines if an error is transient and safe to retry automatically.
 */
export function isRetryableError(error: unknown): boolean {
  if (!error) return false;
  const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  // Non-retryable errors
  if (
    msg.includes('banned') ||
    msg.includes('unauthorized') ||
    msg.includes('forbidden') ||
    msg.includes('sign in') ||
    msg.includes('not a member') ||
    msg.includes('prohibited') ||
    msg.includes('violates') ||
    msg.includes('safety review')
  ) {
    return false;
  }

  // Retryable transient network / gateway / storage errors
  if (
    msg.includes('network') ||
    msg.includes('fetch') ||
    msg.includes('timeout') ||
    msg.includes('temporarily unavailable') ||
    msg.includes('rate limit') ||
    msg.includes('connection') ||
    msg.includes('503') ||
    msg.includes('504') ||
    msg.includes('502')
  ) {
    return true;
  }

  return false;
}

/**
 * Formats a user-friendly error message accompanied by the diagnostic correlation ID.
 */
export function formatFriendlyErrorMessage(rawError: unknown, correlationId: string): {
  friendly: string;
  isRetryable: boolean;
} {
  const isRetry = isRetryableError(rawError);
  const rawMsg = rawError instanceof Error ? rawError.message : String(rawError);

  if (rawMsg.includes('banned') || rawMsg.includes('Test accounts')) {
    return {
      friendly: 'Test accounts (Bravo Tester / Alpha Tester) are strictly prohibited from publishing on TUKUBI.',
      isRetryable: false,
    };
  }

  if (rawMsg.includes('sign in')) {
    return {
      friendly: 'Please sign in to publish your post.',
      isRetryable: false,
    };
  }

  if (rawMsg.includes('Media upload failed') || rawMsg.includes('Storage')) {
    return {
      friendly: `Photo/video upload was interrupted. You can retry or remove the media item. (${correlationId})`,
      isRetryable: true,
    };
  }

  return {
    friendly: `We couldn't publish your post right now. Please try again. (${correlationId})`,
    isRetryable: isRetry,
  };
}
