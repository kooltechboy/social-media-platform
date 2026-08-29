-- =============================================================================
-- Migration: 00030_purge_mock_events.sql
-- Description: Purges all mock/fake seed events to ensure production purity.
-- =============================================================================

DELETE FROM public.event_attendees
WHERE event_id IN (
    SELECT id FROM public.events
    WHERE host_id = 'a0000000-0000-4000-8000-000000000001'
       OR title IN (
           'Diaspora Meetup: Caribbean Food & Culture Night',
           'Ask Caribbean: Live AMA with the Builders',
           'Caribbean Creators Summit'
       )
);

DELETE FROM public.events
WHERE host_id = 'a0000000-0000-4000-8000-000000000001'
   OR title IN (
       'Diaspora Meetup: Caribbean Food & Culture Night',
       'Ask Caribbean: Live AMA with the Builders',
       'Caribbean Creators Summit'
   );
