import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  InMemoryQueueAdapter,
  RedisQueueAdapter,
  JobWorker,
  getGlobalQueue,
  resetGlobalQueue,
  Job,
} from '../../packages/jobs/src';

describe('@caribbean/jobs Queue Subsystem', () => {
  let queue: InMemoryQueueAdapter;

  beforeEach(() => {
    queue = new InMemoryQueueAdapter();
  });

  afterEach(async () => {
    await queue.close();
    resetGlobalQueue();
  });

  it('enqueues and dequeues standard jobs in FIFO order within same priority', async () => {
    const job1 = await queue.enqueue('notification.fanout', {
      senderId: 'user_1',
      recipientIds: ['user_2', 'user_3'],
      notificationType: 'like',
      title: 'New Like',
      body: 'Someone liked your post',
    });

    const job2 = await queue.enqueue('notification.fanout', {
      senderId: 'user_4',
      recipientIds: ['user_5'],
      notificationType: 'comment',
      title: 'New Comment',
      body: 'Someone commented on your post',
    });

    expect(job1.id).toBeDefined();
    expect(job2.id).toBeDefined();
    expect(job1.status).toBe('queued');

    const dequeued1 = await queue.dequeue();
    expect(dequeued1?.id).toBe(job1.id);
    expect(dequeued1?.status).toBe('processing');
    expect(dequeued1?.attempts).toBe(1);

    const dequeued2 = await queue.dequeue();
    expect(dequeued2?.id).toBe(job2.id);

    const empty = await queue.dequeue();
    expect(empty).toBeNull();
  });

  it('prioritizes critical and high priority jobs ahead of normal and low jobs', async () => {
    await queue.enqueue('analytics.rollup', { date: '2026-09-12' }, { priority: 'low' });
    await queue.enqueue('notification.fanout', { title: 'Standard' }, { priority: 'normal' });
    await queue.enqueue('media.transcode', { assetId: 'vid_123' }, { priority: 'critical' });
    await queue.enqueue('moderation.scan', { contentId: 'post_456' }, { priority: 'high' });

    const first = await queue.dequeue();
    expect(first?.name).toBe('media.transcode');
    expect(first?.priority).toBe('critical');

    const second = await queue.dequeue();
    expect(second?.name).toBe('moderation.scan');
    expect(second?.priority).toBe('high');

    const third = await queue.dequeue();
    expect(third?.name).toBe('notification.fanout');
    expect(third?.priority).toBe('normal');

    const fourth = await queue.dequeue();
    expect(fourth?.name).toBe('analytics.rollup');
    expect(fourth?.priority).toBe('low');
  });

  it('delays jobs when delayMs is specified until delay window expires', async () => {
    const delayedJob = await queue.enqueue(
      'creator.payout_reconciliation',
      { creatorId: 'cr_1', periodEndIso: '2026-09-12T00:00:00Z', currency: 'USD', idempotencyKey: 'k_1' },
      { delayMs: 150 }
    );

    expect(delayedJob.status).toBe('delayed');

    // Immediate dequeue should return null
    const notReady = await queue.dequeue();
    expect(notReady).toBeNull();

    const statsInitial = await queue.getStats();
    expect(statsInitial.delayed).toBe(1);

    // Wait for delay
    await new Promise((r) => setTimeout(r, 200));

    const ready = await queue.dequeue();
    expect(ready).not.toBeNull();
    expect(ready?.id).toBe(delayedJob.id);
  });

  it('retries failed jobs with exponential backoff and routes to dead-letter queue after max retries', async () => {
    const job = await queue.enqueue(
      'media.transcode',
      { assetId: 'transcode_err' },
      { maxRetries: 2, backoffMs: 50 }
    );

    // Attempt 1
    const attempt1 = await queue.dequeue();
    expect(attempt1?.id).toBe(job.id);
    expect(attempt1?.attempts).toBe(1);

    await queue.nack(attempt1!.id, new Error('FFmpeg segment error'));
    const jobAfterFail1 = await queue.getJob(job.id);
    expect(jobAfterFail1?.status).toBe('delayed');
    expect(jobAfterFail1?.error).toBe('FFmpeg segment error');

    // Wait for backoff (50ms)
    await new Promise((r) => setTimeout(r, 80));

    // Attempt 2 (final retry)
    const attempt2 = await queue.dequeue();
    expect(attempt2?.id).toBe(job.id);
    expect(attempt2?.attempts).toBe(2);

    await queue.nack(attempt2!.id, 'Corrupted input stream');
    const jobDeadLetter = await queue.getJob(job.id);
    expect(jobDeadLetter?.status).toBe('dead_letter');
    expect(jobDeadLetter?.error).toBe('Corrupted input stream');

    const stats = await queue.getStats();
    expect(stats.deadLetter).toBe(1);
  });

  it('processes jobs with JobWorker pool and supports graceful shutdown', async () => {
    const processed: string[] = [];

    const worker = new JobWorker(queue, {
      concurrency: 2,
      pollIntervalMs: 25,
    });

    worker.register('worker.task', async (job: Job<unknown>) => {
      const payload = job.payload as { item: string };
      processed.push(payload.item);
    });

    worker.start();
    expect(worker.isRunning()).toBe(true);

    await queue.enqueue('worker.task', { item: 'alpha' });
    await queue.enqueue('worker.task', { item: 'beta' });

    // Wait for worker processing
    await new Promise((r) => setTimeout(r, 120));

    expect(processed).toContain('alpha');
    expect(processed).toContain('beta');

    await worker.stop();
    expect(worker.isRunning()).toBe(false);
  });

  it('handles RedisQueueAdapter in fallback mode when environment credentials are unset', async () => {
    const redisAdapter = new RedisQueueAdapter();
    expect(redisAdapter.getAdapterMode()).toBe('fallback');
    expect(redisAdapter.getPrefix()).toBe('tukubi:jobs');

    const job = await redisAdapter.enqueue('test.redis', { ping: 'pong' });
    expect(job.id).toBeDefined();

    const stats = await redisAdapter.getStats();
    expect(stats.total).toBe(1);

    await redisAdapter.close();
  });

  it('provides a singleton global queue instance via getGlobalQueue', () => {
    const q1 = getGlobalQueue();
    const q2 = getGlobalQueue();
    expect(q1).toBe(q2);

    resetGlobalQueue();
    const q3 = getGlobalQueue();
    expect(q3).not.toBe(q1);
  });
});
