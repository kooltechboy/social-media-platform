# 15 — BUSINESS PROFILES & EVENTS AUDIT

**Domain:** Business Directory, Verification, Operating Hours, Event Ticketing & Cultural Fetes  
**Auditor:** Principal Marketplace Architect & Business Development Executive  
**Status:** Good (Score: 82/100)

---

## 1. Business Directory & Verification (`@caribbean/business`)

- Models business entities across the Caribbean and global diaspora hubs (Toronto, Brooklyn, Miami, London, Montreal).
- Tracks physical addresses, geocoordinates, verified badges, opening hours, and customer reviews with rating aggregates.

---

## 2. Event Ticketing & RSVP Engine (`supabase/migrations/00012_business_events_marketplace.sql`)

- Supports `in_person`, `livestream`, and `hybrid` event formats.
- Tracks attendee RSVP status (`going`, `interested`, `cancelled`) and capacity limits.
- Server Action: `apps/web/src/lib/events/actions.ts` provides `createEventAction` and `rsvpAction`.
