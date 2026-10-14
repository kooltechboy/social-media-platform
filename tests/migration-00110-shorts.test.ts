import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('Migration 00110 — TUKUBI Shorts Video Infrastructure', () => {
  const rootDir = join(__dirname, '..');
  const migrationPath = join(rootDir, 'supabase/migrations/00110_tukubi_shorts_video_infrastructure.sql');

  it('migration file 00110 exists in supabase/migrations/', () => {
    expect(existsSync(migrationPath)).toBe(true);
  });

  it('expands video_kind check constraint to include "short"', () => {
    const content = readFileSync(migrationPath, 'utf-8');
    expect(content).toContain('videos_video_kind_check');
    expect(content).toContain("'short'");
    expect(content).toContain("'reel'");
  });

  it('attaches page_id referencing public.businesses for Page-authored Shorts', () => {
    const content = readFileSync(migrationPath, 'utf-8');
    expect(content).toContain('ADD COLUMN IF NOT EXISTS page_id UUID REFERENCES public.businesses(id)');
  });

  it('adds category column with index for Caribbean discovery', () => {
    const content = readFileSync(migrationPath, 'utf-8');
    expect(content).toContain('ADD COLUMN IF NOT EXISTS category VARCHAR(40)');
    expect(content).toContain('idx_videos_category_created');
  });

  it('adds moderation_status column and index', () => {
    const content = readFileSync(migrationPath, 'utf-8');
    expect(content).toContain('moderation_status');
    expect(content).toContain("'approved'");
  });

  it('configures RLS policies for page and profile video lifecycle', () => {
    const content = readFileSync(migrationPath, 'utf-8');
    expect(content).toContain('CREATE POLICY');
    expect(content).toContain('is_page_member');
  });
});
