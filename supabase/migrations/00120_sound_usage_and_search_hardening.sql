-- =============================================================================
-- Migration 00120: Sound Usage Atomic Counter & Search Index Hardening
-- Sub-Project 6: Discovery, Search, AI Repurposing & Caribbean Sounds
-- =============================================================================
-- PURPOSE:
--   Modernizes sound usage counter tracking to use atomic, race-condition-free
--   COUNT(*) recomputations from source-of-truth rows on public.sound_usage,
--   matching the NASA-grade counter standards set in Migration 00119.
--
-- SECURITY: The trigger function executes as SECURITY DEFINER to bypass RLS
--           for internal counter maintenance.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.sync_sound_usage_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sound_id uuid;
  v_actual_count bigint;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    v_sound_id := OLD.sound_id;
  ELSE
    v_sound_id := NEW.sound_id;
  END IF;

  -- Atomic source-of-truth recomputation
  SELECT COUNT(*)
    INTO v_actual_count
    FROM public.sound_usage
   WHERE sound_id = v_sound_id;

  UPDATE public.sounds
     SET usage_count = v_actual_count,
         updated_at = now()
   WHERE id = v_sound_id;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sound_usage_count ON public.sound_usage;
CREATE TRIGGER trg_sound_usage_count
  AFTER INSERT OR DELETE ON public.sound_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_sound_usage_count();

-- Composite index for sound usage lookups and trending calculations
CREATE INDEX IF NOT EXISTS idx_sound_usage_composite
  ON public.sound_usage (sound_id, created_at DESC);

-- Backfill sounds.usage_count to ensure accuracy
UPDATE public.sounds s
   SET usage_count = (
     SELECT COUNT(*)
       FROM public.sound_usage su
      WHERE su.sound_id = s.id
   );

-- =============================================================================
-- ROLLBACK INSTRUCTIONS:
--   DROP TRIGGER IF EXISTS trg_sound_usage_count ON public.sound_usage;
--   DROP FUNCTION IF EXISTS public.sync_sound_usage_count();
--   DROP INDEX IF EXISTS public.idx_sound_usage_composite;
-- =============================================================================
