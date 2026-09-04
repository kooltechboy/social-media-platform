export type ConversationKind = 'direct' | 'group';

export type ConversationCategory = 
  | 'personal' 
  | 'business' 
  | 'marketplace' 
  | 'creator' 
  | 'event' 
  | 'community' 
  | 'support';

export type MessageKind = 
  | 'text' 
  | 'voice' 
  | 'media' 
  | 'product' 
  | 'order' 
  | 'event' 
  | 'livestream' 
  | 'store' 
  | 'community' 
  | 'profile' 
  | 'system' 
  | 'ai_response';

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed' | 'retry';

export interface MemberContext {
  profileId: string;
  conversationId: string;
  role: 'member' | 'admin' | null;
  leftAt: string | null;
  mutedUntil: string | null;
  status?: 'active' | 'pending_request' | 'archived' | 'rejected' | 'blocked';
  lastReadSequence?: number;
  lastReadAt?: string | null;
}

export const MESSAGE_MAX_LENGTH = 4000;
export const MAX_ATTACHMENT_BYTES = 50 * 1024 * 1024; // 50MB
export const MAX_GROUP_MEMBERS = 256;
export const MAX_EDIT_TIME_WINDOW_MINUTES = 15;

// =============================================================================
// CONVERSATIONAL COMMERCE & CONTEXTUAL CARD PAYLOADS
// =============================================================================

export interface ProductContextPayload {
  productId: string;
  title: string;
  priceMinor: number;
  currency: string;
  sellerId: string;
  sellerName?: string;
  imageUrl?: string | null;
  sku?: string;
  listingUrl: string;
  isAvailable?: boolean;
  inventoryCount?: number;
}

export interface OrderContextPayload {
  orderId: string;
  orderNumber: string;
  totalMinor: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  itemsCount: number;
  itemsSummary: string;
  buyerId: string;
  sellerId: string;
  fulfillmentType: 'shipping' | 'local_pickup';
  orderUrl: string;
}

export interface EventContextPayload {
  eventId: string;
  title: string;
  startDate: string;
  location: string;
  islandCountry?: string;
  organizerName: string;
  coverUrl?: string | null;
  ticketPriceMinor?: number;
  currency?: string;
  eventUrl: string;
}

export interface LivestreamContextPayload {
  streamId: string;
  title: string;
  hostName: string;
  hostAvatarUrl?: string | null;
  isLive: boolean;
  peakViewers?: number;
  streamUrl: string;
}

export interface StoreContextPayload {
  storeId: string;
  storeSlug: string;
  name: string;
  logoUrl?: string | null;
  category: string;
  rating?: number;
  islandCountry?: string;
  storeUrl: string;
}

export interface ProfileContextPayload {
  profileId: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  isVerified?: boolean;
  bio?: string | null;
  profileUrl: string;
}

export interface CommunityContextPayload {
  communityId: string;
  slug: string;
  name: string;
  avatarUrl?: string | null;
  memberCount: number;
  islandCountry?: string;
  communityUrl: string;
}

export interface AiResponsePayload {
  promptUsed: string;
  suggestedActions?: Array<{ label: string; action: string; payload?: Record<string, unknown> }>;
  groundedCatalogIds?: string[];
  isHumanEscalated?: boolean;
  confidenceScore?: number;
  detectedLanguage?: 'en' | 'es' | 'fr' | 'ht' | 'pt';
}

export interface MessageMetadata {
  audio_url?: string;
  media_urls?: string[];
  product?: ProductContextPayload;
  order?: OrderContextPayload;
  event?: EventContextPayload;
  livestream?: LivestreamContextPayload;
  store?: StoreContextPayload;
  profile?: ProfileContextPayload;
  community?: CommunityContextPayload;
  ai?: AiResponsePayload;
  translation?: {
    originalText: string;
    translatedText: string;
    sourceLanguage: string;
    targetLanguage: string;
  };
  [key: string]: unknown;
}

export interface MessageDraft {
  senderId: string;
  conversationId: string;
  body: string;
  messageKind?: MessageKind;
  clientMessageId?: string;
  replyToId?: string;
  attachmentBytes?: number;
  audioUrl?: string;
  mediaUrls?: string[];
  metadata?: MessageMetadata;
}

export interface DraftValidation {
  valid: boolean;
  errors: string[];
}

export function validateDraft(draft: MessageDraft): DraftValidation {
  const errors: string[] = [];
  const hasText = draft.body && draft.body.trim().length > 0;
  const hasAudio = !!draft.audioUrl;
  const hasMedia = draft.mediaUrls && draft.mediaUrls.length > 0;
  const hasAttachment = (draft.attachmentBytes || 0) > 0;
  const isRichCard = [
    'product', 'order', 'event', 'livestream', 'store', 'community', 'profile', 'ai_response'
  ].includes(draft.messageKind || '');

  if (!hasText && !hasAudio && !hasMedia && !hasAttachment && !isRichCard) {
    errors.push('Message must contain text, voice note, attachment, or a context card.');
  }
  if (draft.body && draft.body.length > MESSAGE_MAX_LENGTH) {
    errors.push(`Message exceeds maximum limit of ${MESSAGE_MAX_LENGTH} characters.`);
  }
  if ((draft.attachmentBytes || 0) > MAX_ATTACHMENT_BYTES) {
    errors.push(`Attachments are limited to ${MAX_ATTACHMENT_BYTES / (1024 * 1024)} MB.`);
  }
  return { valid: errors.length === 0, errors };
}

export function validateContextCardPayload(kind: MessageKind, metadata?: MessageMetadata): boolean {
  if (!metadata) return false;
  switch (kind) {
    case 'product':
      return !!(metadata.product?.productId && metadata.product?.title && metadata.product?.listingUrl);
    case 'order':
      return !!(metadata.order?.orderId && metadata.order?.orderNumber && metadata.order?.orderUrl);
    case 'event':
      return !!(metadata.event?.eventId && metadata.event?.title && metadata.event?.eventUrl);
    case 'livestream':
      return !!(metadata.livestream?.streamId && metadata.livestream?.title && metadata.livestream?.streamUrl);
    case 'store':
      return !!(metadata.store?.storeId && metadata.store?.name && metadata.store?.storeUrl);
    case 'community':
      return !!(metadata.community?.communityId && metadata.community?.name && metadata.community?.communityUrl);
    case 'profile':
      return !!(metadata.profile?.profileId && metadata.profile?.username && metadata.profile?.profileUrl);
    case 'ai_response':
      return true;
    default:
      return true;
  }
}

export interface MessageReactionItem {
  id?: string;
  messageId: string;
  profileId: string;
  emoji: string;
  createdAt?: string;
}

export interface MessageRequestItem {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  createdAt: string;
  updatedAt: string;
}

export class ConversationPolicy {
  public isParticipant(context: MemberContext): boolean {
    return context.role !== null && context.leftAt === null && context.status !== 'blocked';
  }

  public canSend(context: MemberContext, draft: MessageDraft, isBlocked: boolean = false): DraftValidation {
    if (isBlocked) {
      return { valid: false, errors: ['Cannot send message to a user with active block settings.'] };
    }
    if (!this.isParticipant(context)) {
      return { valid: false, errors: ['Sender is not an active member of this conversation.'] };
    }
    return validateDraft(draft);
  }

  public canAddMembers(actor: MemberContext, currentMembers: number, additions: number): { allowed: boolean; reason?: string } {
    if (!this.isParticipant(actor)) {
      return { allowed: false, reason: 'Actor is not an active member.' };
    }
    if (currentMembers + additions > MAX_GROUP_MEMBERS) {
      return { allowed: false, reason: `Group conversations are limited to ${MAX_GROUP_MEMBERS} members.` };
    }
    return { allowed: true };
  }

  public canDeleteMessage(actor: MemberContext, senderId: string): boolean {
    if (!this.isParticipant(actor)) return false;
    return actor.profileId === senderId || actor.role === 'admin';
  }

  public canEditMessage(actor: MemberContext, senderId: string, createdAt: string): { allowed: boolean; reason?: string } {
    if (!this.isParticipant(actor)) {
      return { allowed: false, reason: 'Actor is not an active member.' };
    }
    if (actor.profileId !== senderId) {
      return { allowed: false, reason: 'Only the original sender can edit their message.' };
    }
    const messageAgeMinutes = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60);
    if (messageAgeMinutes > MAX_EDIT_TIME_WINDOW_MINUTES) {
      return { allowed: false, reason: `Messages can only be edited within ${MAX_EDIT_TIME_WINDOW_MINUTES} minutes of sending.` };
    }
    return { allowed: true };
  }

  public static directConversationKey(a: string, b: string): string {
    return [a, b].sort().join(':');
  }

  public directConversationKey(a: string, b: string): string {
    return ConversationPolicy.directConversationKey(a, b);
  }

  public static calculateUnreadCount(lastReadSequence: number, latestSequence: number): number {
    return Math.max(0, latestSequence - lastReadSequence);
  }

  public calculateUnreadCount(lastReadSequence: number, latestSequence: number): number {
    return ConversationPolicy.calculateUnreadCount(lastReadSequence, latestSequence);
  }
}

export interface ReceiptState {
  messageId: string;
  profileId: string;
  deliveredAt: string | null;
  readAt: string | null;
}

export function applyReadReceipt(receipt: ReceiptState, timestamp: string): ReceiptState {
  return {
    ...receipt,
    deliveredAt: receipt.deliveredAt ?? timestamp,
    readAt: receipt.readAt ?? timestamp,
  };
}

export function generateClientMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// =============================================================================
// AI BUSINESS AGENT & CARIBBEAN CONTEXT HELPER
// =============================================================================

export interface BusinessAiPromptContext {
  businessName: string;
  category: string;
  catalogItems?: Array<{ id: string; title: string; priceFormatted: string; available: boolean }>;
  faqs?: Array<{ question: string; answer: string }>;
  policy?: { returns?: string; shipping?: string; pickup?: string };
  userQuery: string;
  userLanguage?: string;
}

export function buildBusinessAiSystemPrompt(context: BusinessAiPromptContext): string {
  const catalogList = context.catalogItems?.map(
    (item) => `- ${item.title} (${item.priceFormatted}) [${item.available ? 'In Stock' : 'Out of Stock'}]`
  ).join('\n') || 'No catalog items listed.';

  return `You are the AI Business Assistant for "${context.businessName}", a proud Caribbean business on TUKUBI.
Category: ${context.category}

Core Instructions:
1. Always be polite, warm, and professional, reflecting Caribbean hospitality and cultural respect.
2. Ground all answers STRICTLY in the catalog items and policies provided below. NEVER invent prices, stock numbers, or store policies.
3. If the user asks about an item not in the catalog, state clearly that it is currently unavailable and suggest browsing the store or contacting human staff.
4. If the user asks for human assistance or a complex order negotiation, indicate that you are handing off to the store team.
5. Respond naturally in the user's language (English, Spanish, French, Haitian Creole, or Patois if addressed as such).

Authoritative Business Catalog:
${catalogList}

Shipping & Policies:
- Returns: ${context.policy?.returns || 'Contact store for return inquiries.'}
- Shipping: ${context.policy?.shipping || 'Caribbean & Diaspora regional shipping available.'}
- Local Pickup: ${context.policy?.pickup || 'Available during business hours.'}
`;
}
