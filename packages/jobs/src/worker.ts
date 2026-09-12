/**
 * @file packages/jobs/src/worker.ts
 * @description Background worker pool managing concurrency, job dispatch, and graceful shutdown.
 */

import {
  IQueueAdapter,
  Job,
  JobHandler,
  JobPriority,
} from './types';

export interface WorkerOptions {
  concurrency?: number;
  pollIntervalMs?: number;
  priorities?: JobPriority[];
  onSuccess?: (job: Job<unknown>) => void;
  onError?: (job: Job<unknown>, error: Error) => void;
}

export class JobWorker {
  private handlers = new Map<string, JobHandler<unknown>>();
  private running = false;
  private activeJobs = new Set<string>();
  private pollTimer?: ReturnType<typeof setTimeout>;
  private concurrency: number;
  private pollIntervalMs: number;
  private priorities?: JobPriority[];

  constructor(
    private queue: IQueueAdapter,
    private options: WorkerOptions = {}
  ) {
    this.concurrency = options.concurrency ?? 5;
    this.pollIntervalMs = options.pollIntervalMs ?? 100;
    this.priorities = options.priorities;
  }

  public register<T>(jobName: string, handler: JobHandler<T>): this {
    this.handlers.set(jobName, handler as JobHandler<unknown>);
    return this;
  }

  public start(): void {
    if (this.running) return;
    this.running = true;
    this.scheduleNextTick();
  }

  public async stop(timeoutMs: number = 5000): Promise<void> {
    if (!this.running) return;
    this.running = false;

    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = undefined;
    }

    // Wait for active jobs to drain up to timeoutMs
    const startTime = Date.now();
    while (this.activeJobs.size > 0 && Date.now() - startTime < timeoutMs) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  public isRunning(): boolean {
    return this.running;
  }

  public getActiveCount(): number {
    return this.activeJobs.size;
  }

  private scheduleNextTick(): void {
    if (!this.running) return;
    this.pollTimer = setTimeout(() => {
      this.tick().catch(() => {
        // Suppress unhandled tick errors and continue polling
      }).finally(() => {
        this.scheduleNextTick();
      });
    }, this.pollIntervalMs);
  }

  private async tick(): Promise<void> {
    if (!this.running) return;

    const availableSlots = this.concurrency - this.activeJobs.size;
    if (availableSlots <= 0) return;

    for (let i = 0; i < availableSlots; i++) {
      if (!this.running) break;

      const job = await this.queue.dequeue(this.priorities);
      if (!job) break;

      this.activeJobs.add(job.id);
      this.executeJob(job).finally(() => {
        this.activeJobs.delete(job.id);
      });
    }
  }

  private async executeJob(job: Job<unknown>): Promise<void> {
    const handler = this.handlers.get(job.name);

    if (!handler) {
      const err = new Error(`No registered handler for job: ${job.name}`);
      await this.queue.nack(job.id, err);
      if (this.options.onError) {
        this.options.onError(job, err);
      }
      return;
    }

    try {
      await handler(job);
      await this.queue.ack(job.id);
      if (this.options.onSuccess) {
        this.options.onSuccess(job);
      }
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      await this.queue.nack(job.id, error);
      if (this.options.onError) {
        this.options.onError(job, error);
      }
    }
  }
}
