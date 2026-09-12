import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Database Partitioning Architecture (00076_table_partitioning.sql)', () => {
  const migrationPath = path.resolve(
    __dirname,
    '../../supabase/migrations/00076_table_partitioning.sql'
  );

  it('migration file exists and is populated', () => {
    expect(fs.existsSync(migrationPath)).toBe(true);
    const content = fs.readFileSync(migrationPath, 'utf-8');
    expect(content.length).toBeGreaterThan(500);
  });

  it('defines range partitioning on public.analytics_events by created_at', () => {
    const content = fs.readFileSync(migrationPath, 'utf-8');
    expect(content).toContain('PARTITION BY RANGE (created_at)');
    expect(content).toContain('public.analytics_events');
    expect(content).toContain('public.analytics_events_2026_01');
    expect(content).toContain('public.analytics_events_default');
  });

  it('defines range partitioning on public.feed_activity_timeline by created_at', () => {
    const content = fs.readFileSync(migrationPath, 'utf-8');
    expect(content).toContain('public.feed_activity_timeline');
    expect(content).toContain('public.feed_activity_timeline_2026_08');
    expect(content).toContain('public.feed_activity_timeline_default');
  });

  it('defines hash partitioning on public.chat_messages_partitioned by conversation_id across 8 shards', () => {
    const content = fs.readFileSync(migrationPath, 'utf-8');
    expect(content).toContain('PARTITION BY HASH (conversation_id)');
    expect(content).toContain('MODULUS 8, REMAINDER 0');
    expect(content).toContain('MODULUS 8, REMAINDER 7');
  });

  it('enforces Row Level Security (RLS) on all partitioned structures', () => {
    const content = fs.readFileSync(migrationPath, 'utf-8');
    expect(content).toContain('ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;');
    expect(content).toContain('ALTER TABLE public.feed_activity_timeline ENABLE ROW LEVEL SECURITY;');
    expect(content).toContain('ALTER TABLE public.chat_messages_partitioned ENABLE ROW LEVEL SECURITY;');
  });

  it('provides security-definer dynamic partition maintenance function', () => {
    const content = fs.readFileSync(migrationPath, 'utf-8');
    expect(content).toContain('CREATE OR REPLACE FUNCTION public.create_monthly_partition');
    expect(content).toContain('SECURITY DEFINER');
    expect(content).toContain('SET search_path = public');
  });
});
