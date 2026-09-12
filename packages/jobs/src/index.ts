/**
 * @file packages/jobs/src/index.ts
 * @description Root entrypoint for @caribbean/jobs background processing subsystem.
 */

export * from './types';
export * from './adapters/in-memory';
export * from './adapters/redis';
export * from './worker';

import { InMemoryQueueAdapter } from './adapters/in-memory';
import { RedisQueueAdapter } from './adapters/redis';
import { IQueueAdapter } from './types';

// Global shared default queue instance
let defaultQueue: IQueueAdapter | null = null;

export function getGlobalQueue(): IQueueAdapter {
  if (!defaultQueue) {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      defaultQueue = new RedisQueueAdapter({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
    } else {
      defaultQueue = new InMemoryQueueAdapter();
    }
  }
  return defaultQueue;
}

export function resetGlobalQueue(): void {
  if (defaultQueue) {
    defaultQueue.close().catch(() => {});
    defaultQueue = null;
  }
}
