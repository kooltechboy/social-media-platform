/**
 * @file packages/jobs/src/adapters/in-memory.ts
 * @description In-memory queue adapter with priority scheduling, exponential backoff retries, and dead-letter queue.
 */

import {
  IQueueAdapter,
  Job,
  JobOptions,
  JobPriority,
  PRIORITY_WEIGHTS,
  QueueStats,
} from '../types';

export class InMemoryQueueAdapter implements IQueueAdapter {
  private jobs = new Map<string, Job<unknown>>();
  private isClosed = false;

  public async enqueue<T>(
    name: string,
    payload: T,
    options: JobOptions = {}
  ): Promise<Job<T>> {
    this.assertNotClosed();
    const now = Date.now();
    const delayMs = Math.max(0, options.delayMs ?? 0);
    const runAt = now + delayMs;
    const priority: JobPriority = options.priority ?? 'normal';
    const id = `job_${now}_${Math.random().toString(36).substring(2, 9)}`;

    const job: Job<T> = {
      id,
      name,
      payload,
      status: delayMs > 0 ? 'delayed' : 'queued',
      priority,
      attempts: 0,
      maxRetries: options.maxRetries ?? 3,
      backoffMs: options.backoffMs ?? 1000,
      runAt,
      createdAt: now,
    };

    this.jobs.set(id, job as Job<unknown>);
    return job;
  }

  public async dequeue(priorities?: JobPriority[]): Promise<Job<unknown> | null> {
    this.assertNotClosed();
    const now = Date.now();

    // 1. Promote delayed jobs that have reached runAt
    for (const job of this.jobs.values()) {
      if (job.status === 'delayed' && job.runAt <= now) {
        job.status = 'queued';
      }
    }

    // 2. Filter available queued jobs
    const eligibleJobs: Job<unknown>[] = [];
    for (const job of this.jobs.values()) {
      if (job.status === 'queued') {
        if (!priorities || priorities.includes(job.priority)) {
          eligibleJobs.push(job);
        }
      }
    }

    if (eligibleJobs.length === 0) {
      return null;
    }

    // 3. Sort by priority (higher first), then FIFO by createdAt
    eligibleJobs.sort((a, b) => {
      const weightDiff = PRIORITY_WEIGHTS[b.priority] - PRIORITY_WEIGHTS[a.priority];
      if (weightDiff !== 0) return weightDiff;
      return a.createdAt - b.createdAt;
    });

    const selectedJob = eligibleJobs[0];
    selectedJob.status = 'processing';
    selectedJob.startedAt = now;
    selectedJob.attempts += 1;

    return selectedJob;
  }

  public async ack(jobId: string): Promise<void> {
    this.assertNotClosed();
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = 'completed';
    job.completedAt = Date.now();
  }

  public async nack(jobId: string, error: Error | string): Promise<void> {
    this.assertNotClosed();
    const job = this.jobs.get(jobId);
    if (!job) return;

    const errorMsg = typeof error === 'string' ? error : error.message;
    job.error = errorMsg;

    if (job.attempts < job.maxRetries) {
      // Exponential backoff
      const backoff = job.backoffMs * Math.pow(2, job.attempts - 1);
      job.status = 'delayed';
      job.runAt = Date.now() + backoff;
    } else {
      // Exceeded max retries -> route to Dead Letter Queue (DLQ)
      job.status = 'dead_letter';
      job.failedAt = Date.now();
    }
  }

  public async getJob(jobId: string): Promise<Job<unknown> | null> {
    return this.jobs.get(jobId) || null;
  }

  public async getStats(): Promise<QueueStats> {
    const stats: QueueStats = {
      queued: 0,
      delayed: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      deadLetter: 0,
      total: this.jobs.size,
    };

    const now = Date.now();
    for (const job of this.jobs.values()) {
      if (job.status === 'delayed') {
        if (job.runAt <= now) {
          stats.queued += 1;
        } else {
          stats.delayed += 1;
        }
      } else if (job.status === 'queued') {
        stats.queued += 1;
      } else if (job.status === 'processing') {
        stats.processing += 1;
      } else if (job.status === 'completed') {
        stats.completed += 1;
      } else if (job.status === 'failed') {
        stats.failed += 1;
      } else if (job.status === 'dead_letter') {
        stats.deadLetter += 1;
      }
    }

    return stats;
  }

  public async purge(): Promise<void> {
    this.jobs.clear();
  }

  public async close(): Promise<void> {
    this.isClosed = true;
    this.jobs.clear();
  }

  private assertNotClosed(): void {
    if (this.isClosed) {
      throw new Error('Queue is closed');
    }
  }
}
