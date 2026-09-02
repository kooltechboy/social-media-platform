-- Migration 00052: Sanitize Production Metrics & Enforce Zero-Mock Integrity
-- Author: TUKUBI Principal Engineering
-- Inviolable Rule: Zero Mock / Fake / Simulated Data across TUKUBI ecosystem.

DO $$
BEGIN
    -- 1. Reset all posts engagement counts to actual verified child row aggregates
    UPDATE public.posts p
    SET likes_count = COALESCE((
            SELECT COUNT(*)::INT
            FROM public.post_reactions pr
            WHERE pr.post_id = p.id
        ), 0),
        comments_count = COALESCE((
            SELECT COUNT(*)::INT
            FROM public.comments c
            WHERE c.post_id = p.id
        ), 0),
        shares_count = 0,
        updated_at = now()
    WHERE p.id = 'd23f3e75-0dfa-47c6-8df9-2c0fa299d7ff'
       OR p.likes_count > 0 
       OR p.comments_count > 0;

    -- 2. Recalculate profile_counts for all accounts based strictly on real social graph and post rows
    UPDATE public.profile_counts pc
    SET followers_count = COALESCE((
            SELECT COUNT(*)::INT
            FROM public.follows f
            WHERE f.following_id = pc.profile_id
        ), 0),
        following_count = COALESCE((
            SELECT COUNT(*)::INT
            FROM public.follows f
            WHERE f.follower_id = pc.profile_id
        ), 0),
        posts_count = COALESCE((
            SELECT COUNT(*)::INT
            FROM public.posts p
            WHERE p.author_id = pc.profile_id
        ), 0),
        likes_received_count = COALESCE((
            SELECT COUNT(*)::INT
            FROM public.post_reactions pr
            JOIN public.posts p ON p.id = pr.post_id
            WHERE p.author_id = pc.profile_id
        ), 0),
        updated_at = now();

    RAISE NOTICE 'Migration 00052: Production metrics sanitized to real organic counts with zero mock data.';
END $$;
