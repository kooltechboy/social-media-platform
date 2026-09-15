export type StreamState = 'scheduled' | 'live' | 'ended' | 'cancelled';
export type StreamAccess = 'public' | 'followers' | 'subscribers' | 'community';

export const VALID_TRANSITIONS: Record<StreamState, StreamState[]> = {
  scheduled: ['live', 'cancelled'],
  live: ['ended'],
  ended: [],
  cancelled: [],
};

export interface StreamContext {
  creatorId: string;
  state: StreamState;
  accessLevel: StreamAccess;
  communityId?: string;
}

export class StreamStateMachine {
  public canTransition(from: StreamState, to: StreamState): boolean {
    return VALID_TRANSITIONS[from].includes(to);
  }

  public transition(from: StreamState, to: StreamState): StreamState {
    if (!this.canTransition(from, to)) {
      throw new Error(`Invalid stream transition: ${from} → ${to}`);
    }
    return to;
  }

  public canView(stream: StreamContext, viewer: {
    id: string;
    followsCreator: boolean;
    isSubscriber: boolean;
    communityMember: boolean;
  }): boolean {
    if (viewer.id === stream.creatorId) return true;
    switch (stream.accessLevel) {
      case 'public':
        return true;
      case 'followers':
        return viewer.followsCreator;
      case 'subscribers':
        return viewer.isSubscriber;
      case 'community':
        return viewer.communityMember;
      default:
        return false;
    }
  }

  public canChat(stream: StreamContext, viewer: { id: string; banned: boolean }): boolean {
    if (viewer.banned) return false;
    return stream.state === 'live' && viewer.id.length > 0;
  }

  public updatePeakViewers(currentPeak: number, concurrentViewers: number): number {
    return Math.max(currentPeak, concurrentViewers);
  }
}

export interface GiftCatalogItem {
  key: string;
  label: string;
  priceMinor: number;
  currency: string;
  emoji: string;
}

export const GIFT_CATALOG: GiftCatalogItem[] = [
  { key: 'island_rose', label: 'Island Rose', priceMinor: 99, currency: 'USD', emoji: '🌹' },
  { key: 'steel_pan', label: 'Steel Pan', priceMinor: 499, currency: 'USD', emoji: '🪘' },
  { key: 'carnival_crown', label: 'Carnival Crown', priceMinor: 999, currency: 'USD', emoji: '👑' },
  { key: 'sunrise_fete', label: 'Sunrise Fete', priceMinor: 4999, currency: 'USD', emoji: '🎉' },
];

export function findGift(key: string): GiftCatalogItem | undefined {
  return GIFT_CATALOG.find((gift) => gift.key === key);
}

export interface GiftPurchase {
  giftKey: string;
  senderId: string;
  livestreamId: string;
  idempotencyKey: string;
}

export function validateGiftPurchase(purchase: GiftPurchase): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!findGift(purchase.giftKey)) errors.push(`Unknown gift: ${purchase.giftKey}`);
  if (!purchase.senderId) errors.push('Sender is required');
  if (!purchase.livestreamId) errors.push('Livestream is required');
  if (!purchase.idempotencyKey || purchase.idempotencyKey.length < 8) {
    errors.push('Idempotency key of at least 8 characters is required');
  }
  return { valid: errors.length === 0, errors };
}

export const LIVE_CATEGORIES = [
  'All Broadcasts',
  'Carnival & Mas',
  'Sound Systems & Dub',
  'Acoustic & Bachata',
  'DJ Sets & Riddims',
  'Culture & Talk',
  'Diaspora Live',
] as const;

export type LiveCategory = typeof LIVE_CATEGORIES[number];

export interface StreamCreationParams {
  creatorId: string;
  title: string;
  accessLevel?: StreamAccess;
  category?: string;
  scheduledFor?: string | null;
}

export function validateStreamCreation(params: StreamCreationParams): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!params.creatorId) errors.push('Creator ID is required');
  if (!params.title || params.title.trim().length < 3) {
    errors.push('Stream title must be at least 3 characters');
  }
  if (params.title && params.title.length > 150) {
    errors.push('Stream title cannot exceed 150 characters');
  }
  return { valid: errors.length === 0, errors };
}

export function formatLiveDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) {
    return `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  }
  return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

// Cloudflare Stream CDN integration
export { CloudflareStreamClient, createCloudflareStreamClient } from './cloudflare-stream';
export type { CloudflareStreamLiveInput, CfStreamConfig } from './cloudflare-stream';

// Caribbean Audio Spaces ("Tukubi Sound Lounge")
export * from './sound-lounge';

// =============================================================================
// Live Shopping Stream Integration (Phase 13)
// =============================================================================

export interface LiveShoppingProduct {
  id: string;
  livestreamId: string;
  productId: string;
  isPinned: boolean;
  pinnedAt?: string | null;
  flashDiscountBps: number;
  displayOrder: number;
  productTitle?: string;
  productPriceMinor?: number;
  productCurrency?: string;
  productImageUrl?: string;
}

export function validateLiveProductPin(
  livestreamId: string,
  productId: string,
  flashDiscountBps: number = 0
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!livestreamId || typeof livestreamId !== 'string') {
    errors.push('Valid livestream ID is required');
  }
  if (!productId || typeof productId !== 'string') {
    errors.push('Valid product ID is required');
  }
  if (flashDiscountBps < 0 || flashDiscountBps > 9000) {
    errors.push('Flash discount must be between 0% (0 bps) and 90% (9000 bps)');
  }
  return { valid: errors.length === 0, errors };
}

export function calculateLiveDiscountPrice(
  originalMinor: number,
  flashDiscountBps: number
): { discountedMinor: number; savingsMinor: number } {
  if (!Number.isInteger(originalMinor) || originalMinor <= 0) {
    throw new Error('Original price must be positive integer minor units');
  }
  if (flashDiscountBps <= 0) {
    return { discountedMinor: originalMinor, savingsMinor: 0 };
  }
  const clampedBps = Math.min(9000, Math.max(0, flashDiscountBps));
  const savingsMinor = Math.round((originalMinor * clampedBps) / 10000);
  return {
    discountedMinor: Math.max(1, originalMinor - savingsMinor),
    savingsMinor,
  };
}


