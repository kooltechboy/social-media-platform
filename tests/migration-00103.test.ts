import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Migration 00103: Events Extensions, Relief Campaigns, Donations & Atomic Increment Trigger', () => {
  const migrationPath = path.join(
    process.cwd(),
    'supabase/migrations/00103_events_and_community_relief.sql'
  );

  it('verifies migration file existence', () => {
    expect(fs.existsSync(migrationPath)).toBe(true);
  });

  it('extends public.events with privacy, livestream, cover image, tags, is_featured, cancelled_at and indexes', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    expect(sql).toMatch(/ALTER\s+TABLE\s+public\.events/i);
    expect(sql).toMatch(/privacy\s+VARCHAR\(20\)\s+DEFAULT\s+'public'\s+NOT\s+NULL/i);
    expect(sql).toMatch(/CHECK\s*\(\s*privacy\s+IN\s*\(\s*'public',\s*'community_only',\s*'invite_only'\s*\)\s*\)/i);
    expect(sql).toMatch(/livestream_url\s+TEXT/i);
    expect(sql).toMatch(/cover_image_url\s+TEXT/i);
    expect(sql).toMatch(/tags\s+TEXT\[\]\s+DEFAULT\s+'\{\}'::text\[\]\s+NOT\s+NULL/i);
    expect(sql).toMatch(/is_featured\s+BOOLEAN\s+DEFAULT\s+false\s+NOT\s+NULL/i);
    expect(sql).toMatch(/cancelled_at\s+TIMESTAMPTZ/i);

    // Indexes
    expect(sql).toMatch(/CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_events_privacy\s+ON\s+public\.events\s*\(\s*privacy,\s*starts_at\s*\)/i);
    expect(sql).toMatch(/CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_events_tags\s+ON\s+public\.events\s+USING\s+gin\s*\(\s*tags\s*\)/i);
  });

  it('extends public.event_attendees with guest_count, check_in_code, checked_in, checked_in_at', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    expect(sql).toMatch(/ALTER\s+TABLE\s+public\.event_attendees/i);
    expect(sql).toMatch(/guest_count\s+INTEGER\s+DEFAULT\s+1\s+NOT\s+NULL/i);
    expect(sql).toMatch(/CHECK\s*\(\s*guest_count\s*>=\s*1\s+AND\s+guest_count\s*<=\s*10\s*\)/i);
    expect(sql).toMatch(/check_in_code\s+VARCHAR\(32\)/i);
    expect(sql).toMatch(/checked_in\s+BOOLEAN\s+DEFAULT\s+false\s+NOT\s+NULL/i);
    expect(sql).toMatch(/checked_in_at\s+TIMESTAMPTZ/i);
  });

  it('creates public.relief_campaigns table with all required fields, constraints, and indexes', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    expect(sql).toMatch(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.relief_campaigns/i);
    expect(sql).toMatch(/id\s+UUID\s+PRIMARY\s+KEY\s+DEFAULT\s+gen_random_uuid\(\)/i);
    expect(sql).toMatch(/creator_id\s+UUID\s+REFERENCES\s+public\.profiles\s*\(\s*id\s*\)\s+ON\s+DELETE\s+CASCADE\s+NOT\s+NULL/i);
    expect(sql).toMatch(/community_id\s+UUID\s+REFERENCES\s+public\.communities\s*\(\s*id\s*\)\s+ON\s+DELETE\s+SET\s+NULL/i);
    expect(sql).toMatch(/title\s+TEXT\s+NOT\s+NULL/i);
    expect(sql).toMatch(/description\s+TEXT\s+NOT\s+NULL/i);
    expect(sql).toMatch(/category\s+VARCHAR\(32\)\s+NOT\s+NULL/i);
    expect(sql).toMatch(/'hurricane_relief',\s*'flood_disaster',\s*'medical_aid',\s*'community_rebuild',\s*'education',\s*'cultural_heritage'/i);
    expect(sql).toMatch(/target_country_iso\s+VARCHAR\(3\)\s+REFERENCES\s+public\.countries\s*\(\s*iso_code\s*\)/i);
    expect(sql).toMatch(/target_city_id\s+UUID\s+REFERENCES\s+public\.cities\s*\(\s*id\s*\)/i);
    expect(sql).toMatch(/goal_minor\s+INTEGER/i);
    expect(sql).toMatch(/CHECK\s*\(\s*goal_minor\s*>\s*0\s*\)/i);
    expect(sql).toMatch(/raised_minor\s+INTEGER\s+DEFAULT\s+0/i);
    expect(sql).toMatch(/CHECK\s*\(\s*raised_minor\s*>=\s*0\s*\)/i);
    expect(sql).toMatch(/currency\s+VARCHAR\(3\)\s+DEFAULT\s+'USD'\s+NOT\s+NULL/i);
    expect(sql).toMatch(/verification_status\s+VARCHAR\(20\)\s+DEFAULT\s+'pending'/i);
    expect(sql).toMatch(/'pending',\s*'verified',\s*'rejected'/i);
    expect(sql).toMatch(/verified_at\s+TIMESTAMPTZ/i);
    expect(sql).toMatch(/verified_by\s+UUID\s+REFERENCES\s+public\.profiles\s*\(\s*id\s*\)/i);
    expect(sql).toMatch(/disaster_declaration_ref\s+TEXT/i);
    expect(sql).toMatch(/supporting_evidence_urls\s+TEXT\[\]\s+DEFAULT\s+'\{\}'::text\[\]\s+NOT\s+NULL/i);
    expect(sql).toMatch(/cover_image_url\s+TEXT/i);
    expect(sql).toMatch(/disbursement_status\s+VARCHAR\(20\)\s+DEFAULT\s+'locked'/i);
    expect(sql).toMatch(/'locked',\s*'verified_ready',\s*'disbursed'/i);
    expect(sql).toMatch(/deadline_at\s+TIMESTAMPTZ/i);
    expect(sql).toMatch(/is_active\s+BOOLEAN\s+DEFAULT\s+true\s+NOT\s+NULL/i);
    expect(sql).toMatch(/donations_count\s+INTEGER\s+DEFAULT\s+0/i);
    expect(sql).toMatch(/CHECK\s*\(\s*donations_count\s*>=\s*0\s*\)/i);

    // Indexes
    expect(sql).toMatch(/CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_relief_campaigns_category\s+ON\s+public\.relief_campaigns\s*\(\s*category\s*\)/i);
    expect(sql).toMatch(/CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_relief_campaigns_country\s+ON\s+public\.relief_campaigns\s*\(\s*target_country_iso\s*\)/i);
    expect(sql).toMatch(/CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_relief_campaigns_verification\s+ON\s+public\.relief_campaigns\s*\(\s*verification_status,\s*is_active\s*\)/i);
  });

  it('creates public.relief_donations table with all required fields, constraints, and indexes', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    expect(sql).toMatch(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.relief_donations/i);
    expect(sql).toMatch(/id\s+UUID\s+PRIMARY\s+KEY\s+DEFAULT\s+gen_random_uuid\(\)/i);
    expect(sql).toMatch(/campaign_id\s+UUID\s+REFERENCES\s+public\.relief_campaigns\s*\(\s*id\s*\)\s+ON\s+DELETE\s+CASCADE\s+NOT\s+NULL/i);
    expect(sql).toMatch(/donor_id\s+UUID\s+REFERENCES\s+public\.profiles\s*\(\s*id\s*\)\s+ON\s+DELETE\s+SET\s+NULL/i);
    expect(sql).toMatch(/amount_minor\s+INTEGER/i);
    expect(sql).toMatch(/CHECK\s*\(\s*amount_minor\s*>\s*0\s*\)/i);
    expect(sql).toMatch(/currency\s+VARCHAR\(3\)\s+NOT\s+NULL/i);
    expect(sql).toMatch(/is_anonymous\s+BOOLEAN\s+DEFAULT\s+false\s+NOT\s+NULL/i);
    expect(sql).toMatch(/donor_name\s+TEXT/i);
    expect(sql).toMatch(/donor_message\s+TEXT/i);
    expect(sql).toMatch(/idempotency_key\s+VARCHAR\(128\)\s+UNIQUE\s+NOT\s+NULL/i);

    // Indexes
    expect(sql).toMatch(/CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_relief_donations_campaign\s+ON\s+public\.relief_donations\s*\(\s*campaign_id,\s*created_at\s+DESC\s*\)/i);
    expect(sql).toMatch(/CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_relief_donations_donor\s+ON\s+public\.relief_donations\s*\(\s*donor_id\s*\)/i);
  });

  it('creates atomic trigger function handle_relief_donation_insert with security definer and concurrency locking', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    // Function definition
    expect(sql).toMatch(/CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.handle_relief_donation_insert\(\)/i);
    expect(sql).toContain('SECURITY DEFINER');
    expect(sql).toMatch(/SET\s+search_path\s*=\s*public,\s*pg_temp/i);

    // Campaign validation & locking
    expect(sql).toMatch(/SELECT[\s\S]*FROM\s+public\.relief_campaigns[\s\S]*FOR\s+UPDATE/i);
    expect(sql).toMatch(/is_active/i);
    expect(sql).toMatch(/deadline_at/i);
    expect(sql).toMatch(/rejected/i);

    // Atomic increment
    expect(sql).toMatch(/raised_minor\s*=\s*public\.relief_campaigns\.raised_minor\s*\+\s*NEW\.amount_minor/i);
    expect(sql).toMatch(/donations_count\s*=\s*public\.relief_campaigns\.donations_count\s*\+\s*1/i);

    // Anonymous normalization
    expect(sql).toMatch(/NEW\.is_anonymous\s+IS\s+TRUE/i);
    expect(sql).toContain('Anonymous Supporter');

    // Trigger binding
    expect(sql).toMatch(/CREATE\s+OR\s+REPLACE\s+TRIGGER\s+trg_relief_donations_insert|CREATE\s+TRIGGER\s+trg_relief_donations_insert/i);
    expect(sql).toMatch(/BEFORE\s+INSERT\s+ON\s+public\.relief_donations/i);
    expect(sql).toMatch(/FOR\s+EACH\s+ROW\s+EXECUTE\s+FUNCTION\s+public\.handle_relief_donation_insert\(\)/i);
  });

  it('enforces Row Level Security (RLS) with FORCE and proper policies on relief tables', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    // Enable and Force RLS
    expect(sql).toMatch(/ALTER\s+TABLE\s+public\.relief_campaigns\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i);
    expect(sql).toMatch(/ALTER\s+TABLE\s+public\.relief_campaigns\s+FORCE\s+ROW\s+LEVEL\s+SECURITY/i);
    expect(sql).toMatch(/ALTER\s+TABLE\s+public\.relief_donations\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i);
    expect(sql).toMatch(/ALTER\s+TABLE\s+public\.relief_donations\s+FORCE\s+ROW\s+LEVEL\s+SECURITY/i);

    // Policies
    expect(sql).toMatch(/CREATE\s+POLICY[\s\S]*ON\s+public\.relief_campaigns/i);
    expect(sql).toMatch(/CREATE\s+POLICY[\s\S]*ON\s+public\.relief_donations/i);

    // Proper auth.uid() caching
    expect(sql).toMatch(/\(\s*SELECT\s+auth\.uid\(\)\s*\)/i);
  });
});
