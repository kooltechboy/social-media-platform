-- Migration 00032: Security containment for privileged bootstrap and provider metadata.
-- Bootstrap is an operational action and must never be callable by public client roles.

REVOKE ALL ON FUNCTION public.bootstrap_super_admin(UUID, VARCHAR, VARCHAR, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bootstrap_super_admin(UUID, VARCHAR, VARCHAR, TEXT)
  TO service_role;

ALTER FUNCTION public.bootstrap_super_admin(UUID, VARCHAR, VARCHAR, TEXT)
  SET search_path = '';

DROP POLICY IF EXISTS "Public read payment providers" ON public.payment_providers;
CREATE POLICY "Authenticated read payment provider capabilities"
  ON public.payment_providers
  FOR SELECT
  TO authenticated
  USING (true);

REVOKE ALL ON TABLE public.payment_providers FROM anon;
GRANT SELECT ON TABLE public.payment_providers TO authenticated;
