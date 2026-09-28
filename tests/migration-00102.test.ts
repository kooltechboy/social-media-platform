import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Migration 00102: Social Commerce, Product Tagging, Escrow and Atomic Checkout', () => {
  const migrationPath = path.join(
    process.cwd(),
    'supabase/migrations/00102_social_commerce_and_product_tagging.sql'
  );

  it('verifies migration file existence', () => {
    expect(fs.existsSync(migrationPath)).toBe(true);
  });

  it('extends posts and videos tables with tagged_product_ids and GIN indexes', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    // Posts table tagging column and GIN index
    expect(sql).toMatch(/ALTER\s+TABLE\s+public\.posts/i);
    expect(sql).toMatch(/tagged_product_ids\s+UUID\[\]\s+DEFAULT\s+'\{\}'::uuid\[\]\s+NOT\s+NULL/i);
    expect(sql).toMatch(/CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_posts_tagged_products\s+ON\s+public\.posts\s+USING\s+gin\s*\(\s*tagged_product_ids\s*\)/i);

    // Videos table tagging column and GIN index
    expect(sql).toMatch(/ALTER\s+TABLE\s+public\.videos/i);
    expect(sql).toMatch(/tagged_product_ids\s+UUID\[\]\s+DEFAULT\s+'\{\}'::uuid\[\]\s+NOT\s+NULL/i);
    expect(sql).toMatch(/CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_videos_tagged_products\s+ON\s+public\.videos\s+USING\s+gin\s*\(\s*tagged_product_ids\s*\)/i);
  });

  it('extends product_tags with video_id foreign key and partial index', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    expect(sql).toMatch(/ALTER\s+TABLE\s+public\.product_tags/i);
    expect(sql).toMatch(/video_id\s+UUID\s+REFERENCES\s+public\.videos\s*\(\s*id\s*\)\s+ON\s+DELETE\s+CASCADE/i);
    expect(sql).toMatch(/CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_product_tags_video\s+ON\s+public\.product_tags\s*\(\s*video_id\s*\)\s+WHERE\s+video_id\s+IS\s+NOT\s+NULL/i);
  });

  it('extends orders table with seller_id, escrow status constraint, escrow timestamp and indexes', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    // Orders seller_id
    expect(sql).toMatch(/seller_id\s+UUID\s+REFERENCES\s+public\.profiles\s*\(\s*id\s*\)\s+ON\s+DELETE\s+SET\s+NULL/i);
    expect(sql).toMatch(/CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_orders_seller_id\s+ON\s+public\.orders\s*\(\s*seller_id\s*\)\s+WHERE\s+seller_id\s+IS\s+NOT\s+NULL/i);

    // Escrow columns and constraints
    expect(sql).toMatch(/escrow_status\s+VARCHAR\(24\)\s+DEFAULT\s+'held'\s+NOT\s+NULL/i);
    expect(sql).toMatch(/escrow_released_at\s+TIMESTAMPTZ/i);
    expect(sql).toMatch(/'held',\s*'releasing',\s*'released',\s*'refunded',\s*'disputed'/);
    expect(sql).toMatch(/CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_orders_escrow_status\s+ON\s+public\.orders\s*\(\s*escrow_status,\s*created_at\s+DESC\s*\)/i);
  });

  it('extends order_items with variant_id foreign key and index', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    expect(sql).toMatch(/variant_id\s+UUID\s+REFERENCES\s+public\.product_variants\s*\(\s*id\s*\)\s+ON\s+DELETE\s+SET\s+NULL/i);
    expect(sql).toMatch(/CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_order_items_variant\s+ON\s+public\.order_items\s*\(\s*variant_id\s*\)\s+WHERE\s+variant_id\s+IS\s+NOT\s+NULL/i);
  });

  it('extends storefront_configs with policies, currency, support_email and social_links', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    expect(sql).toMatch(/ALTER\s+TABLE\s+public\.storefront_configs/i);
    expect(sql).toContain('return_policy');
    expect(sql).toContain('shipping_policy');
    expect(sql).toMatch(/currency\s+VARCHAR\(3\)\s+DEFAULT\s+'USD'\s+NOT\s+NULL/i);
    expect(sql).toContain('support_email');
    expect(sql).toMatch(/social_links\s+JSONB\s+DEFAULT\s+'\{\}'::jsonb\s+NOT\s+NULL/i);
  });

  it('implements atomic RPC function place_order_with_escrow with security definer and inventory locking', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    // Function declaration and hardening
    expect(sql).toMatch(/CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.place_order_with_escrow/i);
    expect(sql).toContain('SECURITY DEFINER');
    expect(sql).toMatch(/SET\s+search_path\s*=\s*public,\s*pg_temp/i);

    // Authentication and authorization validation
    expect(sql).toMatch(/auth\.uid\(\)\s*=\s*p_buyer_id/i);

    // Idempotency safety
    expect(sql).toContain('idempotency_key');

    // Concurrency control: row locking for inventory protection
    expect(sql).toMatch(/FOR\s+UPDATE/i);
    expect(sql).toMatch(/inventory_count\s*<\s*v_qty/i);

    // Decrement inventory on product and variant
    expect(sql).toMatch(/UPDATE\s+public\.products\s+SET\s+inventory_count\s*=\s*inventory_count\s*-\s*v_qty/i);
    expect(sql).toMatch(/UPDATE\s+public\.product_variants\s+SET\s+inventory_count\s*=\s*inventory_count\s*-\s*v_qty/i);

    // Insert order and items
    expect(sql).toMatch(/INSERT\s+INTO\s+public\.orders/i);
    expect(sql).toMatch(/escrow_status/i);
    expect(sql).toMatch(/INSERT\s+INTO\s+public\.order_items/i);

    // Return JSON payload
    expect(sql).toMatch(/jsonb_build_object/i);
    expect(sql).toContain('order_id');
    expect(sql).toContain('held');

    // Explicit grant to authenticated users
    expect(sql).toMatch(/GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+public\.place_order_with_escrow.*TO\s+authenticated/i);
  });

  it('enforces RLS and security policies on commerce tables', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    expect(sql).toMatch(/ALTER\s+TABLE\s+public\.orders\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i);
    expect(sql).toMatch(/ALTER\s+TABLE\s+public\.order_items\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i);
    expect(sql).toMatch(/ALTER\s+TABLE\s+public\.product_tags\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i);
    expect(sql).toMatch(/ALTER\s+TABLE\s+public\.storefront_configs\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i);

    expect(sql).toMatch(/ALTER\s+TABLE\s+public\.orders\s+FORCE\s+ROW\s+LEVEL\s+SECURITY/i);
    expect(sql).toMatch(/ALTER\s+TABLE\s+public\.order_items\s+FORCE\s+ROW\s+LEVEL\s+SECURITY/i);
  });
});
