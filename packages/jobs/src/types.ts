/**
 * @file packages/jobs/src/types.ts
 * @description Enterprise asynchronous job queue contracts & payload definitions.
 */

export type JobStatus =
  | 'queued'
  | 'delayed'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'dead_letter';

export type JobPriority = 'low' | 'normal' | 'high' | 'critical';

export const PRIORITY_WEIGHTS: Record<JobPriority, number> = {
  critical: 4,
  high: 3,
  normal: 2,
  low: 1,
};

export interface MediaTranscodePayload {
  assetId: string;
  inputUrl: string;
  targetResolutions: ('1080p' | '720p' | '480p' | '360p')[];
  generateBlurhash: boolean;
  watermarkCultureTag?: string;
}

export interface NotificationFanoutPayload {
  senderId: string;
  recipientIds: string[];
  notificationType: 'like' | 'comment' | 'mention' | 'tip' | 'broadcast';
  title: string;
  body: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface ModerationScanPayload {
  contentId: string;
  contentType: 'post' | 'comment' | 'media' | 'profile';
  authorId: string;
  text?: string;
  mediaUrl?: string;
}

export interface AnalyticsRollupPayload {
  date: string; // YYYY-MM-DD
  period: 'hourly' | 'daily' | 'weekly';
  countryIso?: string;
  metrics: ('views' | 'engagements' | 'creator_earnings' | 'active_sessions')[];
}

export interface CreatorPayoutReconciliationPayload {
  creatorId: string;
  periodEndIso: string;
  currency: string;
  idempotencyKey: string;
}

export type StandardJobPayloadMap = {
  'media.transcode': MediaTranscodePayload;
  'notification.fanout': NotificationFanoutPayload;
  'moderation.scan': ModerationScanPayload;
  'analytics.rollup': AnalyticsRollupPayload;
  'creator.payout_reconciliation': CreatorPayoutReconciliationPayload;
};

export type JobName = keyof StandardJobPayloadMap | (string & {});

export interface JobOptions {
  priority?: JobPriority;
  delayMs?: number;
  maxRetries?: number;
  backoffMs?: number;
  timeoutMs?: number;
}

export interface Job<T = unknown> {
  id: string;
  name: string;
  payload: T;
  status: JobStatus;
  priority: JobPriority;
  attempts: number;
  maxRetries: number;
  backoffMs: number;
  runAt: number; // timestamp ms
  createdAt: number; // timestamp ms
  startedAt?: number;
  completedAt?: number;
  failedAt?: number;
  error?: string;
}

export interface QueueStats {
  queued: number;
  delayed: number;
  processing: number;
  completed: number;
  failed: number;
  deadLetter: number;
  total: number;
}

export type JobHandler<T = unknown> = (job: Job<T>) => Promise<void> | void;

export interface IQueueAdapter {
  enqueue<T>(name: string, payload: T, options?: JobOptions): Promise<Job<T>>;
  dequeue(priorities?: JobPriority[]): Promise<Job<unknown> | null>;
  ack(jobId: string): Promise<void>;
  nack(jobId: string, error: Error | string): Promise<void>;
  getJob(jobId: string): Promise<Job<unknown> | null>;
  getStats(): Promise<QueueStats>;
  purge(): Promise<void>;
  close(): Promise<void>;
}
