export type NotificationKind =
  | 'follow'
  | 'reaction'
  | 'comment'
  | 'mention'
  | 'community_invitation'
  | 'community_post'
  | 'event_reminder'
  | 'payment_received'
  | 'payout_completed'
  | 'moderation_decision';

export type NotificationChannel = 'in_app' | 'push' | 'email' | 'sms';

export interface NotificationTemplate {
  kind: NotificationKind;
  channels: NotificationChannel[];
  batchSize: number;
}

export const TEMPLATES: Record<NotificationKind, NotificationTemplate> = {
  follow: { kind: 'follow', channels: ['in_app', 'push'], batchSize: 1 },
  reaction: { kind: 'reaction', channels: ['in_app'], batchSize: 10 },
  comment: { kind: 'comment', channels: ['in_app', 'push'], batchSize: 3 },
  mention: { kind: 'mention', channels: ['in_app', 'push', 'email'], batchSize: 1 },
  community_invitation: { kind: 'community_invitation', channels: ['in_app', 'push', 'email'], batchSize: 1 },
  community_post: { kind: 'community_post', channels: ['in_app'], batchSize: 20 },
  event_reminder: { kind: 'event_reminder', channels: ['in_app', 'push', 'email', 'sms'], batchSize: 1 },
  payment_received: { kind: 'payment_received', channels: ['in_app', 'push'], batchSize: 1 },
  payout_completed: { kind: 'payout_completed', channels: ['in_app', 'push', 'email'], batchSize: 1 },
  moderation_decision: { kind: 'moderation_decision', channels: ['in_app', 'email'], batchSize: 1 },
};

export interface PendingNotification {
  recipientId: string;
  kind: NotificationKind;
  actorId?: string;
  entityId?: string;
  createdAt: string;
}

export interface DispatchedNotification {
  recipientId: string;
  kind: NotificationKind;
  channels: NotificationChannel[];
  collapsedCount: number;
}

export class NotificationFanout {
  public plan(notifications: PendingNotification[]): DispatchedNotification[] {
    const grouped = new Map<string, PendingNotification[]>();
    for (const notification of notifications) {
      const key = `${notification.recipientId}:${notification.kind}:${notification.entityId ?? ''}`;
      const bucket = grouped.get(key) ?? [];
      bucket.push(notification);
      grouped.set(key, bucket);
    }

    const dispatched: DispatchedNotification[] = [];
    for (const bucket of grouped.values()) {
      const template = TEMPLATES[bucket[0].kind];
      const batchCount = Math.ceil(bucket.length / template.batchSize);
      for (let batch = 0; batch < batchCount; batch += 1) {
        const slice = bucket.slice(batch * template.batchSize, (batch + 1) * template.batchSize);
        dispatched.push({
          recipientId: slice[0].recipientId,
          kind: template.kind,
          channels: template.channels,
          collapsedCount: slice.length,
        });
      }
    }
    return dispatched;
  }
}
