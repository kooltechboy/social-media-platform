# Threat Model — TUKUBI

_Stride-based model. Maintained by the AppSec & Compliance Agent; reviewed per release._

## 1. Assets & Trust Boundaries

**Assets:** user PII (location, Caribbean identity, diaspora links), credentials/sessions, content, media, financial ledger & wallets, payout rails, moderation data, infrastructure secrets, recommendation signals.

**Trust boundaries:** Client (web/mobile) → Cloudflare edge → Vercel/Next.js → Supabase (Postgres RLS, Auth, Storage, Realtime, Edge Functions) → PSPs (Stripe/PayPal/Apple/Google) → OpenRouter (CaribAI) → Redis → Object storage/CDN.

**Rule zero:** the client is **hostile**. Frontend authorization is UI feedback only. Postgres RLS and server middleware are the enforcement boundary.

## 2. STRIDE Analysis

| Threat | Vector | Mitigation |
| :--- | :--- | :--- |
| **Spoofing** | Credential stuffing, session hijack, fake business/creator impersonation | Supabase Auth + MFA + passkeys; device/session management; server-side audit logging; verification workflow for business/creator; bot detection at edge. |
| **Tampering** | Client-side feed/authorization bypass; SQL injection; forged webhook from PSP | RLS on every table; parameterized queries only; webhook signature verification + replay protection; idempotency keys on all money endpoints. |
| **Repudiation** | Moderator/financial actions denied | Immutable `audit_logs`, `security_events`, append-only ledger; every moderation/financial action attributed to actor + timestamp. |
| **Information disclosure** | Private Caribbean identity/location leakage; leaked rows via missing RLS; media URL scraping | RLS tests mandatory; signed/expiring storage URLs; location visibility controls; inferred attributes never returned to clients. |
| **Denial of service** | Feed fan-out, chat floods, Live concurrent viewers, PSP outage | Cloudflare WAF/DDoS/bot rules; rate limiting (Redis); queue-backed fan-out; provider circuit breakers; graceful degradation modes. |
| **Elevation of privilege** | Forged JWT claims; community moderator → platform admin; SQL function `SECURITY DEFINER` abuse | Claims validated server-side; role hierarchy enforced in RLS + policies; every `SECURITY DEFINER` function reviewed and hardened; `search_path` pinned. |

## 3. Financial Threats (SpotPay)

| Threat | Control |
| :--- | :--- |
| Double-charge on retry | Idempotency keys unique per intent; DB-level uniqueness constraints. |
| Ledger drift | Double-entry sum-zero invariant enforced in Postgres constraint + verified by `tests/unit/ledger.test.ts` and reconciliation job. |
| Balance mutation outside ledger | Forbidden by AGENTS.md Mandate 3; no mutable balance columns. |
| Chargeback/fraud losses | Risk scores, payout holds, chargeback reserves, dispute workflow. |
| Payout to wrong/verified-payout-of-account | Payout requires completed identity verification (KYC) before ledger debit route is enabled. |
| Store policy evasion (Apple/Google) | Payment Policy Engine routes digital goods via IAP/Play Billing; never bypass (see PAYMENT-ARCHITECTURE.md). |

## 4. Trust & Safety Threats

Spam, bots, scams/phishing (prevalent in Caribbean diaspora communities), harassment, hate speech, CSAM, impersonation, coordinated manipulation, copyright abuse (music-heavy culture → high copyright surface). Mitigations in `TRUST-SAFETY.md`.

## 5. AI-Specific Threats

| Threat | Control |
| :--- | :--- |
| Prompt injection via user content into CaribAI | System/user separation; tool allow-lists; output sanitization. |
| Model exfiltrating PII to third-party providers | No PII in prompt payloads; provider data-retention reviewed; abstraction allows provider swap. |
| Hallucinated "facts" about people/businesses | Ask Caribbean answers grounded in retrieval with citations; never present inference as fact. |

## 6. Top Risks & Owners

1. Missing RLS test harness (Database Agent — Phase 1 blocker).
2. No CI security scanning (DevOps Agent — Phase 1).
3. Webhook endpoints not yet implemented → design signature verification before first PSP integration (SpotPay Agent).
4. Secrets currently in `.env.local` files: acceptable for local dev only; production uses platform secret stores; never committed (verified via `.gitignore` + scanning).
