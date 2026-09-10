/**
 * TUKUBI Forge Integration Architecture
 * "Create Once -> Adapt -> Publish Everywhere"
 * Enables Forge multi-platform content engine to orchestrate and publish to Tukubi.
 */

export type ForgePlatform = 'tukubi' | 'instagram' | 'tiktok' | 'youtube' | 'facebook' | 'threads';

export type ForgeContentType = 'post' | 'reel' | 'story' | 'ad';

export interface ForgeMediaAsset {
  url: string;
  kind: 'image' | 'video' | 'audio';
  aspectRatio?: '1:1' | '9:16' | '16:9' | '4:5';
  durationSeconds?: number;
  mimeType?: string;
  altText?: string;
}

export interface ForgeBaseContent {
  title?: string;
  body: string;
  media: ForgeMediaAsset[];
  culturalTags: string[];
  islandOriginIso?: string;
  targetDiasporaCity?: string;
}

export interface ForgeAdaptedContent {
  headline?: string;
  caption: string;
  hashtags: string[];
  mediaUrl?: string;
  aspectRatio?: string;
  ctaText?: string;
  ctaUrl?: string;
}

export interface ForgePublishPayload {
  sourceId: string;
  creatorId: string;
  contentType: ForgeContentType;
  content: ForgeBaseContent;
  adaptations?: Partial<Record<ForgePlatform, ForgeAdaptedContent>>;
  publishedPlatforms?: ForgePlatform[];
  options?: {
    monetizationEnabled?: boolean;
    allowRemix?: boolean;
    boostOnPublish?: boolean;
    initialBoostBudgetMinor?: number;
  };
}

export interface ForgePublishResult {
  success: boolean;
  platform: 'tukubi';
  publicationId?: string;
  liveUrl?: string;
  error?: string;
  timestamp: string;
}

/**
 * Validates whether an incoming Forge payload has the minimum required structure.
 */
export function validateForgePublishPayload(payload: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!payload) return { valid: false, errors: ['Empty payload'] };
  if (!payload.sourceId) errors.push('Missing sourceId');
  if (!payload.creatorId) errors.push('Missing creatorId');
  if (!payload.contentType || !['post', 'reel', 'story', 'ad'].includes(payload.contentType)) {
    errors.push('Invalid or missing contentType (must be post, reel, story, or ad)');
  }
  if (!payload.content || typeof payload.content.body !== 'string') {
    errors.push('Missing content.body');
  }
  return { valid: errors.length === 0, errors };
}
