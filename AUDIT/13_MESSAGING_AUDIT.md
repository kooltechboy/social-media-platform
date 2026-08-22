# 13 — DIRECT & GROUP MESSAGING AUDIT

**Domain:** Realtime Chat, Group Conversations, Typing Indicators & Read Receipts  
**Auditor:** Principal Backend & Realtime Engineer  
**Status:** Good (Score: 80/100)

---

## 1. Data Model & Policies (`supabase/migrations/00008_messaging.sql`)

- **Conversations:** Supports `direct` and `group` conversation types.
- **Membership:** Tracks `joined_at`, `left_at`, `last_read_at`, and unread counters.
- **Messages:** Text body, media attachments (`message_attachments`), and delivery receipts (`message_receipts`).

---

## 2. Invariant & Security Checks

- **RLS Policy:** Users can only view messages for conversations where they are active members (`left_at IS NULL`).
- **System Welcome Automation:** New profiles receive an initial onboarding message from the verified Caribbean One platform bot via migration `00015_realtime_welcome.sql`.

---

## 3. UI Implementation (`apps/web/src/app/messages/page.tsx`)

- Split-pane layout with conversation list on left and active thread on right (`MessageThread` component).
- Realtime message insertion via Supabase Realtime channel subscription.
- Typing defect fix: Resolved PostgREST foreign key relationship typing in `apps/web/src/app/messages/page.tsx:45, 72`.
