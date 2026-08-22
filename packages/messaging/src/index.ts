export type ConversationKind = 'direct' | 'group';

export interface MemberContext {
  profileId: string;
  conversationId: string;
  role: 'member' | 'admin' | null;
  leftAt: string | null;
  mutedUntil: string | null;
}

export const MESSAGE_MAX_LENGTH = 4000;
export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;
export const MAX_GROUP_MEMBERS = 256;

export interface MessageDraft {
  senderId: string;
  conversationId: string;
  body: string;
  replyToId?: string;
  attachmentBytes: number;
}

export interface DraftValidation {
  valid: boolean;
  errors: string[];
}

export function validateDraft(draft: MessageDraft): DraftValidation {
  const errors: string[] = [];
  if (!draft.body.trim() && draft.attachmentBytes === 0) {
    errors.push('Message must contain text or an attachment');
  }
  if (draft.body.length > MESSAGE_MAX_LENGTH) {
    errors.push(`Message exceeds ${MESSAGE_MAX_LENGTH} characters`);
  }
  if (draft.attachmentBytes > MAX_ATTACHMENT_BYTES) {
    errors.push(`Attachments are limited to ${MAX_ATTACHMENT_BYTES / (1024 * 1024)} MB`);
  }
  return { valid: errors.length === 0, errors };
}

export class ConversationPolicy {
  public isParticipant(context: MemberContext): boolean {
    return context.role !== null && context.leftAt === null;
  }

  public canSend(context: MemberContext, draft: MessageDraft): DraftValidation {
    if (!this.isParticipant(context)) {
      return { valid: false, errors: ['Sender is not an active member of this conversation'] };
    }
    return validateDraft(draft);
  }

  public canAddMembers(actor: MemberContext, currentMembers: number, additions: number): { allowed: boolean; reason?: string } {
    if (!this.isParticipant(actor)) {
      return { allowed: false, reason: 'Actor is not an active member' };
    }
    if (currentMembers + additions > MAX_GROUP_MEMBERS) {
      return { allowed: false, reason: `Group conversations are limited to ${MAX_GROUP_MEMBERS} members` };
    }
    return { allowed: true };
  }

  public canDeleteMessage(actor: MemberContext, senderId: string): boolean {
    if (!this.isParticipant(actor)) return false;
    return actor.profileId === senderId || actor.role === 'admin';
  }

  public directConversationKey(a: string, b: string): string {
    return [a, b].sort().join(':');
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
