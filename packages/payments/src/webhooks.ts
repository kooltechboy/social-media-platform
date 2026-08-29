// Universal Webhook Verification & Deduplication Engine

import type { WebhookEvent, WebhookOutcome } from './types';

export class WebhookProcessor {
  private readonly seenEventIds = new Set<string>();

  public constructor(
    private readonly verifySignature: (payload: string, signature: string, secret?: string) => boolean
  ) {}

  public process(event: WebhookEvent, secret?: string): WebhookOutcome {
    const dedupeKey = `${event.providerId}:${event.id}`;

    if (this.seenEventIds.has(dedupeKey)) {
      return { accepted: true, duplicate: true };
    }

    if (!this.verifySignature(event.payload, event.signature, secret)) {
      return { accepted: false, reason: 'Signature verification failed', duplicate: false };
    }

    this.seenEventIds.add(dedupeKey);
    return { accepted: true, duplicate: false };
  }
}
