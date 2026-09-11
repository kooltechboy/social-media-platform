-- Migration: 00066_reactions_multitype.sql
-- Purpose: Expand post_reactions.reaction_type from single-value to 8-type Caribbean reaction system.
-- Strategy: DROP existing constraint if it exists, recreate with expanded CHECK, add unique + type indexes.

-- 1. Ensure the column default is 'like'
ALTER TABLE public.post_reactions
  ALTER COLUMN reaction_type SET DEFAULT 'like';

-- 2. Drop old CHECK constraint if it exists (name may vary by how it was originally created)
DO $$
DECLARE
  v_conname text;
BEGIN
  SELECT conname INTO v_conname
  FROM pg_constraint
  WHERE conrelid = 'public.post_reactions'::regclass
    AND contype = 'c'
    AND conname LIKE '%reaction_type%'
  LIMIT 1;
  IF v_conname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.post_reactions DROP CONSTRAINT %I', v_conname);
  END IF;
END;
$$;

-- 3. Add new expanded CHECK constraint
ALTER TABLE public.post_reactions
  ADD CONSTRAINT post_reactions_reaction_type_check
  CHECK (reaction_type IN ('like','love','fire','celebrate','laugh','wow','sad','angry'));

-- 4. Ensure unique-per-user-per-post index exists (enables ON CONFLICT upsert in application layer)
DROP INDEX IF EXISTS public.idx_post_reactions_unique_user;
CREATE UNIQUE INDEX idx_post_reactions_unique_user
  ON public.post_reactions(post_id, profile_id);

-- 5. Add index for reaction type aggregation queries
CREATE INDEX IF NOT EXISTS idx_post_reactions_type
  ON public.post_reactions(post_id, reaction_type);

-- RLS: existing policies from earlier migrations already use (SELECT auth.uid()) form — no changes needed.

COMMENT ON COLUMN public.post_reactions.reaction_type IS
  'Caribbean reaction types: like | love | fire | celebrate | laugh | wow | sad | angry';
