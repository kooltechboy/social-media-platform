// apps/web/src/lib/commerce/types.ts — Web Commerce Client & Storefront Type Contracts

import type {
  SellerType,
  StorefrontSection,
  StorefrontSectionType,
  EscrowStatus,
  TaggedProductSummary,
} from '@caribbean/marketplace';

export type {
  SellerType,
  StorefrontSection,
  StorefrontSectionType,
  EscrowStatus,
  TaggedProductSummary,
};

/**
 * Public and merchant storefront configuration.
 */
export interface StorefrontConfig {
  id: string;
  sellerId: string;
  businessId?: string | null;
  sellerType: SellerType;
  headline?: string | null;
  heroImageUrl?: string | null;
  sections: StorefrontSection[];
  brandColor?: string | null;
  policies?: Record<string, unknown> | null;
  returnPolicy?: string | null;
  shippingPolicy?: string | null;
  currency: string;
  supportEmail?: string | null;
  socialLinks?: Record<string, string> | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;

  // Database snake_case aliases for direct Supabase query responses
  seller_id?: string;
  business_id?: string | null;
  seller_type?: SellerType;
  hero_image_url?: string | null;
  brand_color?: string | null;
  return_policy?: string | null;
  shipping_policy?: string | null;
  support_email?: string | null;
  social_links?: Record<string, string> | null;
  is_published?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Payload for onboarding or provisioning a new merchant storefront.
 */
export interface CreateStorefrontInput {
  sellerId?: string;
  businessId?: string;
  sellerType?: SellerType;
  headline?: string;
  heroImageUrl?: string;
  sections?: StorefrontSection[];
  brandColor?: string;
  returnPolicy?: string;
  shippingPolicy?: string;
  currency?: string;
  supportEmail?: string;
  socialLinks?: Record<string, string>;
  isPublished?: boolean;
}

/**
 * Payload for updating an existing merchant storefront.
 */
export interface UpdateStorefrontInput extends Partial<CreateStorefrontInput> {
  id?: string;
}

/**
 * Feed post item annotated with tagged commerce products.
 */
export interface ShoppablePostItem {
  id: string;
  content: string;
  authorId: string;
  authorName?: string;
  authorAvatar?: string;
  mediaUrls?: string[];
  taggedProductIds: string[];
  taggedProducts?: TaggedProductSummary[];
  createdAt: string;
}

/**
 * Caribbean Reel or video item annotated with tagged commerce products.
 */
export interface ShoppableReelItem {
  id: string;
  videoUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  creatorId: string;
  creatorName?: string;
  creatorAvatar?: string;
  taggedProductIds: string[];
  taggedProducts?: TaggedProductSummary[];
  createdAt: string;
}

/**
 * Order escrow summary and audit status.
 */
export interface OrderEscrowDetails {
  orderId: string;
  buyerId: string;
  sellerId: string;
  escrowStatus: EscrowStatus;
  totalMinor: number;
  currency: string;
  createdAt: string;
  escrowReleasedAt?: string | null;
  disputeReason?: string | null;
}
