-- =============================================================================
-- Migration 00105: Explicit Row Level Security on Partition Child Tables
-- =============================================================================
-- Description:
--   Enforces explicit Row Level Security (RLS) on all PostgreSQL partition
--   child tables for analytics_events, feed_activity_timeline, and chat_messages.
--   Provides airtight defense-in-depth against direct partition queries.
-- =============================================================================

BEGIN;

-- 1. Analytics Events Partition Tables
DO $$
DECLARE
    tbl text;
    partitions text[] := ARRAY[
        'analytics_events_2026_01', 'analytics_events_2026_02', 'analytics_events_2026_03',
        'analytics_events_2026_04', 'analytics_events_2026_05', 'analytics_events_2026_06',
        'analytics_events_2026_07', 'analytics_events_2026_08', 'analytics_events_2026_09',
        'analytics_events_2026_10', 'analytics_events_2026_11', 'analytics_events_2026_12',
        'analytics_events_default'
    ];
BEGIN
    FOREACH tbl IN ARRAY partitions LOOP
        IF EXISTS (
            SELECT 1 FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public' AND c.relname = tbl
        ) THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
        END IF;
    END LOOP;
END $$;

-- 2. Feed Activity Timeline Partition Tables
DO $$
DECLARE
    tbl text;
    partitions text[] := ARRAY[
        'feed_activity_timeline_2026_08', 'feed_activity_timeline_2026_09',
        'feed_activity_timeline_2026_10', 'feed_activity_timeline_2026_11',
        'feed_activity_timeline_2026_12', 'feed_activity_timeline_default'
    ];
BEGIN
    FOREACH tbl IN ARRAY partitions LOOP
        IF EXISTS (
            SELECT 1 FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public' AND c.relname = tbl
        ) THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
        END IF;
    END LOOP;
END $$;

-- 3. Chat Messages Partitioned Shard Tables
DO $$
DECLARE
    tbl text;
    partitions text[] := ARRAY[
        'chat_messages_p0', 'chat_messages_p1', 'chat_messages_p2', 'chat_messages_p3',
        'chat_messages_p4', 'chat_messages_p5', 'chat_messages_p6', 'chat_messages_p7'
    ];
BEGIN
    FOREACH tbl IN ARRAY partitions LOOP
        IF EXISTS (
            SELECT 1 FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public' AND c.relname = tbl
        ) THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
        END IF;
    END LOOP;
END $$;

COMMIT;
