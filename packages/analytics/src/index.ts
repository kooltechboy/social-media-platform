export const EVENT_NAMES = [
  'user_registered',
  'profile_completed',
  'post_created',
  'post_viewed',
  'post_liked',
  'post_shared',
  'comment_created',
  'creator_followed',
  'community_joined',
  'message_sent',
  'search_performed',
  'report_created',
  'video_started',
  'video_completed',
  'payment_completed',
] as const;

export type EventName = (typeof EVENT_NAMES)[number];

export interface AnalyticsEvent {
  eventName: EventName;
  eventVersion: number;
  userId: string;
  properties: Record<string, string | number | boolean | null>;
  occurredAt: string;
}

export const MAX_PROPERTIES = 20;
export const MAX_PROPERTY_KEY_LENGTH = 60;

export function validateEvent(event: AnalyticsEvent): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!EVENT_NAMES.includes(event.eventName)) {
    errors.push(`Unknown event name: ${event.eventName}`);
  }
  if (event.eventVersion < 1) {
    errors.push('eventVersion must be >= 1');
  }
  if (!event.userId) {
    errors.push('userId is required');
  }
  const keys = Object.keys(event.properties);
  if (keys.length > MAX_PROPERTIES) {
    errors.push(`properties exceed ${MAX_PROPERTIES} entries`);
  }
  for (const key of keys) {
    if (key.length > MAX_PROPERTY_KEY_LENGTH) {
      errors.push(`property key too long: ${key.slice(0, 20)}…`);
    }
  }
  if (Number.isNaN(Date.parse(event.occurredAt))) {
    errors.push('occurredAt must be an ISO timestamp');
  }
  return { valid: errors.length === 0, errors };
}

export interface EventSink {
  emit(event: AnalyticsEvent): Promise<void>;
}

export class ConsoleEventSink implements EventSink {
  public async emit(event: AnalyticsEvent): Promise<void> {
    const validation = validateEvent(event);
    if (!validation.valid) {
      throw new Error(`Invalid analytics event: ${validation.errors.join('; ')}`);
    }
    console.info(JSON.stringify({ channel: 'analytics', ...event }));
  }
}

export class AnalyticsPipeline {
  private readonly sinks: EventSink[];

  public constructor(sinks: EventSink[]) {
    this.sinks = sinks;
  }

  public async track(
    eventName: EventName,
    userId: string,
    properties: AnalyticsEvent['properties'] = {},
  ): Promise<void> {
    const event: AnalyticsEvent = {
      eventName,
      eventVersion: 1,
      userId,
      properties,
      occurredAt: new Date().toISOString(),
    };
    await Promise.all(this.sinks.map((sink) => sink.emit(event)));
  }
}
