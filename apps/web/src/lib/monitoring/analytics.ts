import { AnalyticsPipeline, ConsoleEventSink, EventSink, EventName, AnalyticsEvent } from '@caribbean/analytics';

class PostHogSink implements EventSink {
  async emit(event: unknown): Promise<void> {
    if (typeof window === 'undefined') return; // server-side guard
    const ph = (await import('posthog-js')).default;
    const e = event as AnalyticsEvent;
    ph.capture(e.eventName, { ...e.properties, userId: e.userId });
  }
}

const sinks: EventSink[] = [new ConsoleEventSink()];
if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  sinks.push(new PostHogSink());
}

export const pipeline = new AnalyticsPipeline(sinks);

export function track(name: EventName, props?: AnalyticsEvent['properties'], userId?: string) {
  pipeline.track(name, userId ?? 'anonymous', props ?? {}).catch(() => { /* fire and forget */ });
}
