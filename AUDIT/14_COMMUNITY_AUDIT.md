# 14 — COMMUNITIES & SOCIAL HUBS AUDIT

**Domain:** Diaspora & Regional Community Hubs, Role Hierarchies & Join Policies  
**Auditor:** Social Platforms Architect  
**Status:** Excellent (Score: 86/100)

---

## 1. Join Policies & Role Hierarchy (`@caribbean/communities`)

- **Join Policies:** `public` (open to all), `private` (requires approved invite/request), `invite_only`.
- **Role Hierarchy:**
  - `owner` (Level 3): Full administrative, role assignment, settings, and deletion authority.
  - `moderator` (Level 2): Content moderation, post removal, member invitation & ejection.
  - `member` (Level 1): Standard posting, commenting, and reaction rights.

---

## 2. RLS Recursion Fix (`supabase/migrations/00014_fix_community_rls_recursion.sql`)

- An initial draft of community RLS introduced recursive subqueries between `communities` and `community_members`.
- Migration `00014` successfully fixed this issue using security-definer helper functions and flattened role checks.

---

## 3. Web UI & Server Actions

- Page: `apps/web/src/app/communities/page.tsx`
- Component: `apps/web/src/components/create-community-form.tsx` and `community-join-button.tsx`.
- Server Action Fix: In `apps/web/src/lib/communities/actions.ts`, instantiate `CommunityPolicy` correctly and invoke instance methods.
