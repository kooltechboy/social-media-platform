import { describe, it, expect } from 'vitest';
import { NotificationFanout, TEMPLATES } from '../../packages/notifications/src/index';
import { validateEvent, AnalyticsPipeline, ConsoleEventSink, EVENT_NAMES } from '../../packages/analytics/src/index';
import { encodeCursor, decodeCursor, hashIdentifier, RlsTestHarness } from '../../packages/database/src/index';

describe('Notification fanout (dedupe + batching)', () => {
  const fanout = new NotificationFanout();

  it('collapses duplicate reactions into batches per template size', () => {
    const dispatched = fanout.plan(
      Array.from({ length: 25 }, (_, i) => ({
        recipientId: 'usr_1',
        kind: 'reaction' as const,
        actorId: `actor_${i}`,
        entityId: 'post_1',
        createdAt: '2026-08-20T10:00:00Z',
      })),
    );
    expect(dispatched).toHaveLength(3);
    expect(dispatched[0].collapsedCount).toBe(10);
    expect(dispatched.every((d) => d.channels.includes('in_app'))).toBe(true);
  });

  it('never batches urgent notifications like payout completion', () => {
    const dispatched = fanout.plan([
      { recipientId: 'usr_1', kind: 'payout_completed', createdAt: '2026-08-20T10:00:00Z' },
      { recipientId: 'usr_1', kind: 'payout_completed', createdAt: '2026-08-20T10:00:05Z' },
    ]);
    expect(dispatched).toHaveLength(2);
    expect(TEMPLATES.payout_completed.batchSize).toBe(1);
  });

  it('routes mention notifications to email as well', () => {
    expect(TEMPLATES.mention.channels).toContain('email');
  });
});

describe('Analytics event validation', () => {
  it('rejects unknown events, bad versions and missing users', () => {
    const result = validateEvent({
      eventName: 'exploded_servers' as never,
      eventVersion: 0,
      userId: '',
      properties: {},
      occurredAt: 'not-a-date',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });

  it('accepts taxonomy events and pipelines them to sinks', async () => {
    expect(EVENT_NAMES).toContain('post_created');
    const events: unknown[] = [];
    const pipeline = new AnalyticsPipeline([
      { emit: async (event) => { events.push(event); } },
    ]);
    await pipeline.track('post_created', 'usr_1', { postId: 'p1' });
    expect(events).toHaveLength(1);
  });

  it('sink rejects invalid events at emit time', async () => {
    const sink = new ConsoleEventSink();
    await expect(
      sink.emit({
        eventName: 'post_created', eventVersion: 1, userId: 'u1', properties: {}, occurredAt: 'nope',
      }),
    ).rejects.toThrow('Invalid analytics event');
  });
});

describe('Database utilities', () => {
  it('round-trips opaque cursors and rejects tampering', () => {
    const cursor = encodeCursor({ sortKey: '2026-08-20T00:00:00Z', id: 'abc' });
    expect(decodeCursor(cursor)).toEqual({ sortKey: '2026-08-20T00:00:00Z', id: 'abc' });
    expect(() => decodeCursor(Buffer.from('{"sortKey":1}').toString('base64url'))).toThrow('Malformed cursor');
  });

  it('hashes identifiers for privacy-safe logging', () => {
    const hash = hashIdentifier('1.2.3.4');
    expect(hash).toHaveLength(64);
    expect(hash).not.toContain('1.2.3.4');
  });

  it('compiles RLS assertions across roles', () => {
    const harness = new RlsTestHarness();
    harness.addForTable('ledger_entries', { clientReadable: false });
    const assertions = harness.compile();
    expect(assertions.length).toBeGreaterThanOrEqual(3);
    expect(assertions[0].name).toContain('anon');
    expect(() => harness.add({ table: 'posts', operation: 'SELECT', role: { role: 'owner' }, shouldSeeRows: true })).toThrow(
      'Owner role requires userId',
    );
  });
});
