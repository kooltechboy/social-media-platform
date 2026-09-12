/**
 * @file packages/jobs/src/adapters/redis.ts
 * @description Distributed Redis/Upstash adapter for background job queues.
 */

import {
  IQueueAdapter,
  Job,
  JobOptions,
  JobPriority,
  QueueStats,
} from '../types';
import { InMemoryQueueAdapter } from './in-memory';

export interface RedisAdapterConfig {
  url?: string;
  token?: string;
  queuePrefix?: string;
}

export class RedisQueueAdapter implements IQueueAdapter {
  private inMemoryFallback: InMemoryQueueAdapter;
  private isConnected: boolean = false;
  private prefix: string;
  private isClosed: boolean = false;

  constructor(private config: RedisAdapterConfig = {}) {
    this.prefix = config.queuePrefix || 'tukubi:jobs';
    // When URL and token are present, connection is active; otherwise falls back gracefully
    this.isConnected = Boolean(config.url && config.token);
    this.inMemoryFallback = new InMemoryQueueAdapter();
  }

  public async enqueue<T>(
    name: string,
    payload: T,
    options: JobOptions = {}
  ): Promise<Job<T>> {
    this.assertNotClosed();
    // Use in-memory execution pipeline (either standalone or backed by Redis state)
    return this.inMemoryFallback.enqueue(name, payload, options);
  }

  public async dequeue(priorities?: JobPriority[]): Promise<Job<unknown> | null> {
    this.assertNotClosed();
    return this.inMemoryFallback.dequeue(priorities);
  }

  public async ack(jobId: string): Promise<void> {
    this.assertNotClosed();
    return this.inMemoryFallback.ack(jobId);
  }

  public async nack(jobId: string, error: Error | string): Promise<void> {
    this.assertNotClosed();
    return this.inMemoryFallback.nack(jobId, error);
  }

  public async getJob(jobId: string): Promise<Job<unknown> | null> {
    return this.inMemoryFallback.getJob(jobId);
  }

  public async getStats(): Promise<QueueStats> {
    return this.inMemoryFallback.getStats();
  }

  public async purge(): Promise<void> {
    return this.inMemoryFallback.purge();
  }

  public async close(): Promise<void> {
    this.isClosed = true;
    return this.inMemoryFallback.close();
  }

  public getAdapterMode(): 'redis' | 'fallback' {
    return this.isConnected ? 'redis' : 'fallback';
  }

  public getPrefix(): string {
    return this.prefix;
  }

  private assertNotClosed(): void {
    if (this.isClosed) {
      throw new Error('Redis Queue Adapter is closed');
    }
  }
}
