-- =============================================================================
-- Migration 00119: Community Member Count & Relief Campaign Ledger Triggers
-- Sub-Project 4: Community Relief, Events & Groups
-- =============================================================================
-- PURPOSE:
--   Replaces mutable application-layer counter increments with atomic, race-condition-free
--   server-side Postgres triggers for:
--     1. communities.member_count — recomputed on community_members INSERT/DELETE/UPDATE
--     2. relief_campaigns.raised_minor & donations_count — recomputed on relief_donations INSERT
--
-- SECURITY: Both trigger functions run as SECURITY DEFINER to bypass RLS for counter writes
--           while all SELECT queries are still scoped by the triggering row's IDs.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. community_members → communities.member_count trigger
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_sync_community_member_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_community_id uuid;
  v_active_count bigint;
BEGIN
  -- Determine which community changed
  IF TG_OP = 'DELETE' THEN
    v_community_id := OLD.community_id;
  ELSE
    v_community_id := NEW.community_id;
  END IF;

  -- Atomically recompute from source-of-truth rows (membership_status = 'active' only)
  SELECT COUNT(*)
    INTO v_active_count
    FROM community_members
   WHERE community_id = v_community_id
     AND membership_status = 'active';

  -- Write back to communities without risk of race-condition increment
  UPDATE communities
     SET member_count = v_active_count
   WHERE id = v_community_id;

  RETURN NULL; -- AFTER trigger, return value is ignored
END;
$$;

-- Drop existing trigger if it exists (idempotent re-run safety)
DROP TRIGGER IF EXISTS trg_sync_community_member_count ON community_members;

CREATE TRIGGER trg_sync_community_member_count
  AFTER INSERT OR UPDATE OR DELETE
  ON community_members
  FOR EACH ROW
  EXECUTE FUNCTION fn_sync_community_member_count();

-- ---------------------------------------------------------------------------
-- 2. relief_donations → relief_campaigns.raised_minor + donations_count trigger
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_sync_relief_campaign_raised()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_campaign_id uuid;
  v_raised_minor bigint;
  v_donations_count bigint;
BEGIN
  -- Only handle INSERT (donations are immutable — no UPDATE or DELETE permitted on ledger rows)
  v_campaign_id := NEW.campaign_id;

  -- Atomically recompute from source-of-truth rows
  SELECT
    COALESCE(SUM(amount_minor), 0),
    COUNT(*)
  INTO
    v_raised_minor,
    v_donations_count
  FROM relief_donations
  WHERE campaign_id = v_campaign_id;

  -- Write back atomically — no incremental mutation
  UPDATE relief_campaigns
     SET raised_minor     = v_raised_minor,
         donations_count  = v_donations_count,
         updated_at       = now()
   WHERE id = v_campaign_id;

  RETURN NULL; -- AFTER trigger
END;
$$;

-- Drop existing trigger if it exists (idempotent re-run safety)
DROP TRIGGER IF EXISTS trg_sync_relief_campaign_raised ON relief_donations;

CREATE TRIGGER trg_sync_relief_campaign_raised
  AFTER INSERT
  ON relief_donations
  FOR EACH ROW
  EXECUTE FUNCTION fn_sync_relief_campaign_raised();

-- ---------------------------------------------------------------------------
-- 3. Add unique constraint on relief_donations.idempotency_key (if not present)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conname = 'relief_donations_idempotency_key_key'
       AND conrelid = 'relief_donations'::regclass
  ) THEN
    ALTER TABLE relief_donations
      ADD CONSTRAINT relief_donations_idempotency_key_key
      UNIQUE (idempotency_key);
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. Backfill existing data to ensure counters are accurate post-migration
-- ---------------------------------------------------------------------------

-- Backfill communities.member_count
UPDATE communities c
   SET member_count = (
     SELECT COUNT(*)
       FROM community_members cm
      WHERE cm.community_id = c.id
        AND cm.membership_status = 'active'
   );

-- Backfill relief_campaigns raised totals
UPDATE relief_campaigns rc
   SET raised_minor    = COALESCE((
         SELECT SUM(amount_minor)
           FROM relief_donations rd
          WHERE rd.campaign_id = rc.id
       ), 0),
       donations_count = COALESCE((
         SELECT COUNT(*)
           FROM relief_donations rd
          WHERE rd.campaign_id = rc.id
       ), 0);

-- =============================================================================
-- ROLLBACK INSTRUCTIONS (run in reverse order if needed):
--   DROP TRIGGER IF EXISTS trg_sync_relief_campaign_raised ON relief_donations;
--   DROP FUNCTION IF EXISTS fn_sync_relief_campaign_raised();
--   DROP TRIGGER IF EXISTS trg_sync_community_member_count ON community_members;
--   DROP FUNCTION IF EXISTS fn_sync_community_member_count();
-- =============================================================================
