# 07 — API ENDPOINTS & CONTRACTS AUDIT

**Domain:** HTTP REST Endpoints, RSS Feeds & API Route Handlers  
**Auditor:** Principal Backend Engineer & API Architect  
**Status:** Good (Score: 84/100)

---

## 1. API Route Inventory (`apps/web/src/app/api/`)

| Method | Endpoint | Purpose | Authentication | Output Format |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/health` | System Liveness & Database Health Check | Public | JSON `{ status: 'ok', timestamp }` |
| `POST`| `/api/v1/ask` | Natural Language Query over Caribbean Graph | Public / Rate-limited | JSON `{ query, plan, results, grounded }` |
| `POST`| `/api/v1/ai` | Multi-Dialect Translation & Content Moderation | Service / Auth | JSON `{ score, flagReason, translated }` |
| `GET` | `/api/v1/podcasts/[id]/rss`| Standard RSS 2.0 / iTunes XML Feed | Public | XML (`application/rss+xml`) |
| `GET` | `/auth/callback` | OAuth & Magic Link Exchange Handler | Public | Redirect to intended destination |

---

## 2. API Contract & Validation Review

1. **Ask Caribbean API (`/api/v1/ask`):**
   - Utilizes `AskCaribbeanPlanner` from `@caribbean/ai` to extract entities (events, businesses, communities, posts, podcasts).
   - Generates retrieval-grounded results with verifiable citations.
   - Prevents AI hallucinations by falling back to indexed Postgres records.

2. **Podcast RSS 2.0 Feed (`/api/v1/podcasts/[id]/rss`):**
   - Generates fully compliant iTunes / Apple Podcasts & Spotify XML with `<enclosure>`, `<itunes:duration>`, and `<itunes:image>` tags.
   - Sanitizes XML entity escapes (`&`, `<`, `>`, `"`, `'`) via `escapeXml()`.

3. **Rate Limiting & Abuse Prevention:**
   - Recommendations: Implement token-bucket rate limiting via Upstash Redis middleware on public AI and search endpoints before production scale.
