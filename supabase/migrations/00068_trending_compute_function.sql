-- supabase/migrations/00068_trending_compute_function.sql
-- Purpose: DB function to compute trending hashtags from recent public post activity
-- Call via: SELECT refresh_trending_signals(); from service_role context

-- Check if post_hashtags table exists (it may be named differently)
-- This function handles the case gracefully using dynamic SQL
CREATE OR REPLACE FUNCTION public.refresh_trending_signals()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
  v_has_hashtags boolean;
BEGIN
  -- Clear expired signals first
  DELETE FROM public.trending_signals WHERE expires_at < now();

  -- Check if post_hashtags table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'post_hashtags'
  ) INTO v_has_hashtags;

  IF v_has_hashtags THEN
    -- Compute trending hashtags from post_hashtags + posts join
    INSERT INTO public.trending_signals (
      territory_iso, signal_type, entity_id, entity_label,
      score, post_count_last_2h, post_count_last_24h, computed_at, expires_at
    )
    SELECT
      NULL::text                  AS territory_iso,
      'hashtag'                   AS signal_type,
      ph.hashtag                  AS entity_id,
      ph.hashtag                  AS entity_label,
      (COUNT(*) FILTER (WHERE p.created_at > now() - INTERVAL '2 hours') * 3
        + COUNT(*))               AS score,
      COUNT(*) FILTER (WHERE p.created_at > now() - INTERVAL '2 hours') AS post_count_last_2h,
      COUNT(*)                    AS post_count_last_24h,
      now()                       AS computed_at,
      now() + INTERVAL '6 hours'  AS expires_at
    FROM public.post_hashtags ph
    JOIN public.posts p ON p.id = ph.post_id
    WHERE p.created_at > now() - INTERVAL '24 hours'
      AND p.visibility = 'public'
    GROUP BY ph.hashtag
    HAVING COUNT(*) >= 1
    ORDER BY score DESC
    LIMIT 20
    ON CONFLICT DO NOTHING;

    GET DIAGNOSTICS v_count = ROW_COUNT;
  END IF;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_trending_signals() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.refresh_trending_signals() TO service_role;

COMMENT ON FUNCTION public.refresh_trending_signals() IS
  'Computes trending hashtags from recent public post activity. Call every 2 hours via pg_cron or Edge Function.';
