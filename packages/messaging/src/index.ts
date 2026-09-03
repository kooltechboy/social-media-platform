export type ConversationKind = 'direct' | 'group';

export type MessageKind = 'text' | 'voice' | 'media' | 'system';

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
  metadata?: Record<string, unknown>;
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

  if (!hasText && !hasAudio && !hasMedia && !hasAttachment) {
    errors.push('Message must contain text, voice note, or an attachment.');
  }
  if (draft.body && draft.body.length > MESSAGE_MAX_LENGTH) {
    errors.push(`Message exceeds maximum limit of ${MESSAGE_MAX_LENGTH} characters.`);
  }
  if ((draft.attachmentBytes || 0) > MAX_ATTACHMENT_BYTES) {
    errors.push(`Attachments are limited to ${MAX_ATTACHMENT_BYTES / (1024 * 1024)} MB.`);
  }
  return { valid: errors.length === 0, errors };
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

  public directConversationKey(a: string, b: string): string {
    return [a, b].sort().join(':');
  }

  public calculateUnreadCount(lastReadSequence: number, latestSequence: number): number {
    return Math.max(0, latestSequence - lastReadSequence);
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
