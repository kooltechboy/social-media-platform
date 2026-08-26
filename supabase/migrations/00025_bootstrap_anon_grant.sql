-- Migration 00025: Grant bootstrap_super_admin execution to anon role for unauthenticated initial setup
GRANT EXECUTE ON FUNCTION public.bootstrap_super_admin(UUID, VARCHAR, VARCHAR, TEXT) TO anon, authenticated, service_role;
