/**
 * TUKUBI Web Push & Realtime Notification Protocol Subsystem
 * Implements VAPID-compliant Web Push payload generation,
 * deep link routing, and subscription management.
 */

import type { NotificationKind, DispatchedNotification } from './index';

export interface WebPushAction {
  action: string;
  title: string;
  icon?: string;
}

export interface WebPushPayload {
  title: string;
  body: string;
  icon: string;
  badge: string;
  tag?: string;
  data: {
    url: string;
    kind: NotificationKind | 'system_alert';
    entityId?: string;
    timestamp: number;
    actions?: WebPushAction[];
    metadata?: Record<string, unknown>;
  };
}

export interface WebPushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

export interface WebPushSubscription {
  endpoint: string;
  expirationTime?: number | null;
  keys: WebPushSubscriptionKeys;
}

/**
 * Resolves standard deep links for any TUKUBI notification kind.
 */
export function resolveDeepLink(kind: NotificationKind | 'system_alert', entityId?: string): string {
  switch (kind) {
    case 'comment':
    case 'reaction':
      return entityId ? `/reels?id=${encodeURIComponent(entityId)}` : '/reels';
    case 'follow':
      return entityId ? `/profile/${encodeURIComponent(entityId)}` : '/explore';
    case 'mention':
    case 'community_post':
    case 'community_invitation':
      return entityId ? `/communities/${encodeURIComponent(entityId)}` : '/communities';
    case 'event_reminder':
      return entityId ? `/events/${encodeURIComponent(entityId)}` : '/events';
    case 'payment_received':
    case 'payout_completed':
      return '/financial-center/transactions';
    case 'badge_earned':
    case 'founder_number_assigned':
    case 'achievement_unlocked':
      return '/profile';
    default:
      return '/notifications';
  }
}

/**
 * Generates an accessible, branded Web Push payload formatted for Service Worker dispatch.
 */
export function formatPushPayload(
  params: {
    kind: NotificationKind | 'system_alert';
    actorName?: string;
    entityId?: string;
    customMessage?: string;
    badgeCount?: number;
    metadata?: Record<string, unknown>;
  }
): WebPushPayload {
  const { kind, actorName, entityId, customMessage, metadata } = params;
  const actor = actorName || 'A Caribbean creator';
  const url = resolveDeepLink(kind, entityId);

  let title = 'TUKUBI Caribbean Alert';
  let body = customMessage || 'You have a new update in your Caribbean feed.';
  const actions: WebPushAction[] = [];

  switch (kind) {
    case 'reaction':
      title = '🌴 Reel Reaction';
      body = `${actor} loved your Caribbean reel!`;
      actions.push({ action: 'view_reel', title: 'Watch Reel' });
      break;
    case 'comment':
      title = '💬 New Comment';
      body = `${actor} commented on your reel: "${customMessage || 'Wah gwaan!'}"`;
      actions.push({ action: 'reply', title: 'Reply Now' });
      break;
    case 'follow':
      title = '✨ New Follower';
      body = `${actor} started following your Caribbean journey.`;
      actions.push({ action: 'view_profile', title: 'View Profile' });
      break;
    case 'payment_received':
      title = '💰 Payment Received';
      body = customMessage || 'You received a new payment in your TUKUBI wallet!';
      actions.push({ action: 'view_wallet', title: 'Open Wallet' });
      break;
    case 'payout_completed':
      title = '🏦 Payout Completed';
      body = customMessage || 'Your regional Caribbean payout has been settled successfully.';
      actions.push({ action: 'view_wallet', title: 'View Transfer' });
      break;
    case 'event_reminder':
      title = '🎉 Cultural Event Starting Soon';
      body = customMessage || 'An upcoming carnival or cultural event is starting soon!';
      actions.push({ action: 'view_event', title: 'View Event' });
      break;
    case 'community_post':
      title = '🏝️ Community Update';
      body = `${actor} posted a new update in your island community.`;
      actions.push({ action: 'view_community', title: 'Open Group' });
      break;
  }

  return {
    title,
    body,
    icon: '/icons/icon-192.png',
    badge: '/favicon.svg',
    tag: `tukubi-${kind}-${entityId || 'general'}`,
    data: {
      url,
      kind,
      entityId,
      timestamp: Date.now(),
      actions,
      metadata,
    },
  };
}
