-- Migration 00072: Creator Team Collaboration, Delegation & Role-Based Access Control
-- Description: Enables professional Caribbean creators, media houses, and podcasters to delegate
--              studio management to editors, publishers, moderators, and analysts without credential sharing.

CREATE TABLE IF NOT EXISTS public.creator_team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    member_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'editor', 'publisher', 'analyst', 'moderator')),
    permissions JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (creator_id, member_id)
);

-- Indexing for fast RLS evaluation
CREATE INDEX IF NOT EXISTS idx_creator_team_creator_role ON public.creator_team_members(creator_id, role);
CREATE INDEX IF NOT EXISTS idx_creator_team_member ON public.creator_team_members(member_id);

-- Enable RLS
ALTER TABLE public.creator_team_members ENABLE ROW LEVEL SECURITY;

-- Helper function: check if a user has a specific role on a creator team
CREATE OR REPLACE FUNCTION public.has_creator_team_role(
    p_creator_id UUID,
    p_member_id UUID,
    p_required_roles TEXT[]
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.creator_team_members
        WHERE creator_id = p_creator_id
          AND member_id = p_member_id
          AND role = ANY(p_required_roles)
    );
$$;

GRANT EXECUTE ON FUNCTION public.has_creator_team_role(UUID, UUID, TEXT[]) TO authenticated;

-- Policies on creator_team_members
DROP POLICY IF EXISTS "Creator owner manages team" ON public.creator_team_members;
CREATE POLICY "Creator owner manages team" ON public.creator_team_members
    FOR ALL
    USING (creator_id = auth.uid())
    WITH CHECK (creator_id = auth.uid());

DROP POLICY IF EXISTS "Team members read own membership" ON public.creator_team_members;
CREATE POLICY "Team members read own membership" ON public.creator_team_members
    FOR SELECT
    USING (member_id = auth.uid());

-- Extend draft management policies so editors and admins can collaborate on drafts
DROP POLICY IF EXISTS "Team members manage assigned drafts" ON public.creator_content_drafts;
CREATE POLICY "Team members manage assigned drafts" ON public.creator_content_drafts
    FOR ALL
    USING (
        creator_id = auth.uid()
        OR public.has_creator_team_role(creator_id, auth.uid(), ARRAY['admin', 'editor', 'publisher'])
    )
    WITH CHECK (
        creator_id = auth.uid()
        OR public.has_creator_team_role(creator_id, auth.uid(), ARRAY['admin', 'editor', 'publisher'])
    );
