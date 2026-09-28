// packages/marketplace/src/tagging.ts — TUKUBI Social Commerce Product Tagging & Escrow Primitives

/**
 * Maximum products that can be attached to a social feed post.
 */
export const MAX_TAGGED_PRODUCTS_PER_POST = 5;

/**
 * Maximum products that can be attached to a video or Caribbean Reel.
 */
export const MAX_TAGGED_PRODUCTS_PER_VIDEO = 5;

/**
 * Valid states for buyer purchase funds protected in TUKUBI escrow.
 */
export type EscrowStatus = 'held' | 'releasing' | 'released' | 'refunded' | 'disputed';

export interface EscrowStatusMeta {
  label: string;
  description: string;
  color: 'amber' | 'blue' | 'emerald' | 'rose' | 'purple';
}

/**
 * Trust & Safety Escrow Metadata for UI rendering and order tracking.
 */
export const ESCROW_STATUS_METADATA: Record<EscrowStatus, EscrowStatusMeta> = {
  held: {
    label: 'Held in Escrow',
    description: 'Protected by TUKUBI 30-Day Escrow Guarantee. Funds released upon verified delivery or confirmation.',
    color: 'amber',
  },
  releasing: {
    label: 'Releasing',
    description: 'Delivery confirmed. Escrow payout processing to merchant wallet.',
    color: 'blue',
  },
  released: {
    label: 'Settled to Seller',
    description: 'Funds settled to merchant wallet.',
    color: 'emerald',
  },
  refunded: {
    label: 'Refunded to Buyer',
    description: 'Funds reversed to buyer payment method.',
    color: 'rose',
  },
  disputed: {
    label: 'Under Mediation',
    description: 'Escrow frozen pending Caribbean dispute resolution.',
    color: 'purple',
  },
};

/**
 * Allowed escrow state machine transitions.
 * Terminal states (released, refunded) cannot transition to any status.
 */
const VALID_ESCROW_TRANSITIONS: Record<EscrowStatus, readonly EscrowStatus[]> = {
  held: ['releasing', 'refunded', 'disputed'],
  releasing: ['released', 'disputed'],
  disputed: ['released', 'refunded'],
  released: [],
  refunded: [],
};

/**
 * Validates whether an escrow status transition is legally permitted.
 */
export function canTransitionEscrow(current: EscrowStatus, target: EscrowStatus): boolean {
  if (!current || !target || current === target) {
    return false;
  }
  const allowed = VALID_ESCROW_TRANSITIONS[current];
  return allowed ? allowed.includes(target) : false;
}

/**
 * Lightweight tagged product summary for post cards, reel bottom sheets, and trays.
 */
export interface TaggedProductSummary {
  id: string;
  title: string;
  priceMinor: number;
  currency?: string;
  thumbnailUrl?: string;
  imageUrl?: string;
  sellerId?: string;
  sellerName?: string;
  sellerAvatar?: string;
  originCountry?: string;
  originTerritory?: string;
  inventoryCount?: number;
  isAvailable?: boolean;
  rating?: number;
}

export interface TaggedProductValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates tagged product ID list against tagging rules and maximum limits.
 */
export function validateProductTags(productIds: string[]): TaggedProductValidationResult {
  if (!Array.isArray(productIds)) {
    return { isValid: false, error: 'Product IDs must be provided as an array.' };
  }

  if (productIds.length > MAX_TAGGED_PRODUCTS_PER_POST) {
    return {
      isValid: false,
      error: `Maximum ${MAX_TAGGED_PRODUCTS_PER_POST} products can be tagged per post or video.`,
    };
  }

  const seen = new Set<string>();
  for (const id of productIds) {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return { isValid: false, error: 'Invalid product ID tag.' };
    }
    const trimmed = id.trim();
    if (seen.has(trimmed)) {
      return { isValid: false, error: 'Duplicate product tags are not allowed.' };
    }
    seen.add(trimmed);
  }

  return { isValid: true };
}

/**
 * Formats minor currency units into localized Caribbean currency display.
 */
export function formatProductPrice(
  priceMinor: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  const normCurrency = (currency || 'USD').toUpperCase().trim();
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: normCurrency,
    }).format(priceMinor / 100);
  } catch {
    return `$${(priceMinor / 100).toFixed(2)}`;
  }
}

/**
 * Normalizes raw product tags from string arrays, comma lists, JSON strings, or Postgres array representations.
 */
export function parseTaggedProductIds(raw: unknown): string[] {
  if (!raw) return [];

  let candidates: unknown[] = [];

  if (Array.isArray(raw)) {
    candidates = raw;
  } else if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return [];

    // JSON array: '["id1", "id2"]'
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          candidates = parsed;
        }
      } catch {
        // Fallback to string split below
      }
    }

    // Postgres array literal: '{id1,id2}'
    if (candidates.length === 0 && trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const inside = trimmed.slice(1, -1).trim();
      candidates = inside ? inside.split(',') : [];
    }

    // Plain comma-separated list: 'id1, id2, id3'
    if (candidates.length === 0) {
      candidates = trimmed.split(',');
    }
  }

  const result: string[] = [];
  const seen = new Set<string>();

  for (const item of candidates) {
    let idStr = '';
    if (typeof item === 'string') {
      idStr = item.trim().replace(/^['"]|['"]$/g, '');
    } else if (item && typeof item === 'object' && 'id' in item && typeof (item as { id: unknown }).id === 'string') {
      idStr = ((item as { id: string }).id || '').trim();
    }

    if (idStr.length > 0 && !seen.has(idStr)) {
      seen.add(idStr);
      result.push(idStr);
    }
  }

  return result;
}

/**
 * Determines whether a piece of content qualifies as shoppable.
 */
export function isShoppableContent(taggedProductIds?: string[] | null): boolean {
  return Array.isArray(taggedProductIds) && taggedProductIds.length > 0;
}
