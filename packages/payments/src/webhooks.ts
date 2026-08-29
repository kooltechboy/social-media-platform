// Universal Webhook Verification & Deduplication Engine

import type { WebhookEvent, WebhookOutcome } from './types';

export interface WebhookEventStore {
  /** Atomically claims an event. False means the provider event was already claimed. */
  claim(event: WebhookEvent): Promise<boolean>;
}

class InMemoryWebhookEventStore implements WebhookEventStore {
  private readonly seenEventIds = new Set<string>();

  async claim(event: WebhookEvent): Promise<boolean> {
    const key = `${event.providerId}:${event.id}`;
    if (this.seenEventIds.has(key)) return false;
    this.seenEventIds.add(key);
    return true;
  }
}

export class WebhookProcessor {
  public constructor(
    private readonly verifySignature: (payload: string, signature: string, secret?: string) => boolean,
    private readonly eventStore: WebhookEventStore = new InMemoryWebhookEventStore()
  ) {}

  public async process(event: WebhookEvent, secret?: string): Promise<WebhookOutcome> {
    if (!event.id?.trim()) {
      return { accepted: false, reason: 'Missing provider event ID', duplicate: false };
    }

    if (!event.signature?.trim()) {
      return { accepted: false, reason: 'Missing webhook signature', duplicate: false };
    }

    if (!this.verifySignature(event.payload, event.signature, secret)) {
      return { accepted: false, reason: 'Signature verification failed', duplicate: false };
    }

    try {
      const claimed = await this.eventStore.claim(event);
      return claimed
        ? { accepted: true, duplicate: false }
        : { accepted: true, duplicate: true };
    } catch {
      return { accepted: false, reason: 'Webhook persistence unavailable', duplicate: false };
    }
  }
}
