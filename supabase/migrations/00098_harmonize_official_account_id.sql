-- Migration: 00098_harmonize_official_account_id.sql
-- Description: Harmonizes official_account_id() function to return the canonical TUKUBI platform UUID
-- (ff1e8b1f-7796-4424-b341-3b39e1c993bd) as defined in official_account.sql and production seeds,
-- removing the obsolete placeholder UUID (a0000000-0000-4000-8000-000000000001).

CREATE OR REPLACE FUNCTION public.official_account_id()
RETURNS uuid
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $function$
    SELECT 'ff1e8b1f-7796-4424-b341-3b39e1c993bd'::uuid;
$function$;

COMMENT ON FUNCTION public.official_account_id() IS 'Returns the canonical immutable UUID for the official TUKUBI platform account (@tukubi).';
