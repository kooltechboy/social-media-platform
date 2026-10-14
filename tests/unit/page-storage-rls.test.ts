import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('TUKUBI Page Management Migration 00112 — Storage & Database RLS', () => {
  const migrationPath = path.resolve(__dirname, '../../supabase/migrations/00112_page_management_storage_and_profile_customization.sql');

  it('migration file 00112 exists', () => {
    expect(fs.existsSync(migrationPath)).toBe(true);
  });

  it('provisions page-media storage bucket with correct parameters', () => {
    if (!fs.existsSync(migrationPath)) return;
    const content = fs.readFileSync(migrationPath, 'utf8');

    expect(content).toContain("'page-media'");
    expect(content).toContain('10485760'); // 10MB limit
    expect(content).toContain("'image/jpeg'");
    expect(content).toContain("'image/png'");
    expect(content).toContain("'image/webp'");
  });

  it('defines can_manage_page_path function for safe storage folder extraction', () => {
    if (!fs.existsSync(migrationPath)) return;
    const content = fs.readFileSync(migrationPath, 'utf8');

    expect(content).toContain('CREATE OR REPLACE FUNCTION public.can_manage_page_path');
    expect(content).toContain('SECURITY DEFINER');
    expect(content).toContain('search_path = public, pg_temp');
  });

  it('defines sync_business_image_columns trigger function for avatar/logo and cover/banner compatibility', () => {
    if (!fs.existsSync(migrationPath)) return;
    const content = fs.readFileSync(migrationPath, 'utf8');

    expect(content).toContain('CREATE OR REPLACE FUNCTION public.sync_business_image_columns');
    expect(content).toContain('trg_sync_business_image_columns');
    expect(content).toContain('BEFORE INSERT OR UPDATE ON public.businesses');
  });

  it('configures strict storage RLS policies for page-media bucket', () => {
    if (!fs.existsSync(migrationPath)) return;
    const content = fs.readFileSync(migrationPath, 'utf8');

    expect(content).toContain('page_media_select_policy');
    expect(content).toContain('page_media_insert_policy');
    expect(content).toContain('page_media_update_policy');
    expect(content).toContain('page_media_delete_policy');
    expect(content).toContain('public.can_manage_page_path');
  });

  it('updates can_manage_page function to guarantee owner_id fallback safety', () => {
    if (!fs.existsSync(migrationPath)) return;
    const content = fs.readFileSync(migrationPath, 'utf8');

    expect(content).toContain('CREATE OR REPLACE FUNCTION public.can_manage_page');
    expect(content).toContain('owner_id = p_user_id');
  });
});
