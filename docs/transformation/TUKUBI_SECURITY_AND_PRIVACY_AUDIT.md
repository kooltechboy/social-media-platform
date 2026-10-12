# TUKUBI Security & Privacy Audit (`TUKUBI_SECURITY_AND_PRIVACY_AUDIT.md`)

**Program:** `TUKUBI-RTP-001` (Phase 1 Forensic Security & Privacy Audit)  
**Date:** 2026-10-12  
**Mandates:** `AGENTS.md` Mandate 2 (*RLS*), Mandate 3 (*Ledger Safety*), Mandate 4 (*Security & Secrets*), Mandate 8 (*Privacy of Caribbean Identity*)

---

## 1. Secret & Service-Role Key Hygiene Verification

- **Client Bundle Verification (`apps/web/src/lib/supabase/browser.ts:6-13`):**
  - Uses only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
  - Across all 83 occurrences of Supabase client creation in `apps/web/src`, `createServiceSupabaseClient()` (`apps/web/src/lib/supabase/server.ts:27-34`) is **never** imported in any `'use client'` module.
- **Tracked Backup File Inspection (`.agents/backup-legacy-posts-2026-09-01.json`):**
  - Inspected lines 1–122: contains only 5 public welcome posts and 3 public translation strings (`welcome_banner`, `trending_header`, `island_vibes`). Zero passwords, emails, API keys, or financial records exist.

---

## 2. Application & Infrastructure Security Findings

| ID | Severity | Component / File | Finding | Phase 2 Remediation |
| :--- | :---: | :--- | :--- | :--- |
| **SEC-P0-01** | **P0** | `apps/web/next.config.js:21, 107` | `TUKUBI_CSP` `frame-src` omits `ALLOWED_EMBED_ORIGINS`, blocking all YouTube/Vimeo/TikTok/Spotify embeds; `X-Frame-Options: DENY` on `/(.*)` blocks `/embed/[type]/[id]`. | Add `ALLOWED_EMBED_ORIGINS` to `frame-src`, add `i.ytimg.com` / `img.youtube.com` to `img-src` and `images.remotePatterns`, and allow framing on `/embed/:path*`. |
| **SEC-P0-02** | **P0** | `supabase/migrations/00102` & `00103` | `place_order_with_escrow` and `relief_donations` allow direct client execution/insertion without payment settlement verification. | Restrict both to `service_role` and enforce server-side price lookup in `00108_phase2_security_rls_and_publishing_lifecycle.sql`. |
| **SEC-P1-01** | **P1** | `apps/web/src/middleware.ts:188` & `apps/web/src/lib/supabase/server.ts:74` | `PLAYWRIGHT_TEST === '1'` trusts unsigned `tukubi_user_session` JSON cookie without checking `process.env.NODE_ENV !== 'production'`. | Add `process.env.NODE_ENV !== 'production'` guard around all `PLAYWRIGHT_TEST === '1'` checks in `middleware.ts` and `server.ts`. |
| **SEC-P1-02** | **P1** | `apps/web/src/lib/social/actions.ts:198, 288` | `publishAsIdRaw` from `FormData` is interpolated into `.or(\`id.eq.${publishAsIdRaw},profile_id.eq.${publishAsIdRaw}\`)` before UUID validation. | Validate `publishAsIdRaw` against strict UUID regex (`/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`) before query construction. |
| **SEC-P1-03** | **P1** | `supabase/migrations/00097:299-444` | `get_available_identities(p_user_id)` lacks caller identity check (`p_user_id = auth.uid()`), creating an IDOR for enumerating another user's managed pages/businesses. | Enforce `p_user_id = auth.uid()` (unless `service_role`) in migration `00108`. |
| **SEC-P2-01** | **P2** | `apps/web/src/components/media/rich-media-player.tsx:194` & `universal-content-card.tsx:218` | Third-party embed `<iframe>` elements have `sandbox` and `loading="lazy"`, but omit explicit `referrerPolicy="strict-origin-when-cross-origin"`. | Add `referrerPolicy="strict-origin-when-cross-origin"` to both `<iframe>` elements. |

---

## 3. Privacy of Caribbean Identity (`AGENTS.md` Mandate 8)

- Cultural and geographic identity fields (`profile_identity`, country of origin, current diaspora hub, heritage islands, languages) remain strictly optional during onboarding (`/signup/caribbean`) and editable in `/settings`.
- Inferred recommendation signals are never displayed as profile facts, and users control visibility of their identity badges.
