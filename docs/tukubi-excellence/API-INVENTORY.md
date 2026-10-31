# TUKUBI — API Inventory & Interface Specifications
## Document Reference: TUKUBI-EXCELLENCE-API-001

### 1. API Architecture Overview
TUKUBI provides a unified internal and external API layer structured under `apps/web/src/app/api`. All mutating endpoints enforce:
1. Supabase JWT Authentication (`createSupabaseServerClient`).
2. Sliding-window rate limiting (`@caribbean/api` rate-limiter).
3. Strict schema validation with Zod.
4. Input sanitization to prevent XSS, SQL injection, and SSRF attacks.

---

### 2. Comprehensive Endpoint Matrix

| Method | Endpoint Path | Subsystem | Auth Level | Description & Protection |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/health` | Infrastructure | Public | Healthcheck returning service state, uptime, and database ping |
| **POST** | `/api/v1/media/resolve-url` | Media | Authenticated | SSRF-guarded universal link resolver & OpenGraph extractor |
| **GET** | `/api/oembed` | Media | Public | Standard oEmbed endpoint for Tukubi content embeds |
| **POST** | `/api/v1/forge/publish` | Media & Publishing | Authenticated | Media processing and publishing dispatch |
| **GET** | `/api/discovery/search` | Discovery | Public | Global Caribbean search across people, posts, and communities |
| **GET** | `/api/discovery/recommendations` | Discovery | Authenticated | Real-data social graph recommendations |
| **POST** | `/api/discovery/feedback` | Discovery | Authenticated | Telemetry on discovery card clicks |
| **GET** | `/api/v1/notifications` | Notifications | Authenticated | Paginated user notification stream |
| **POST** | `/api/translate` | CaribAI | Authenticated | Multilingual Caribbean translation engine |
| **POST** | `/api/v1/ai` | CaribAI | Authenticated | Vercel AI SDK chat interface with CaribAI |
| **POST** | `/api/payments/checkout` | Payments | Authenticated | Order initiation and escrow allocation |
| **POST** | `/api/payments/paypal/capture` | Payments | Authenticated | Server-side PayPal Orders v2 capture & verification |
| **POST** | `/api/payments/webhooks/paypal` | Payments | Webhook HMAC | Webhook handler with idempotency checking |
| **POST** | `/api/webhooks/stripe` | Payments | Webhook HMAC | Stripe Connect webhook handler |
| **POST** | `/api/webhooks/carriers` | Logistics | Webhook HMAC | Shipping carrier tracking update webhooks |
| **POST** | `/api/ads/impression` | Advertising | Public (Rate-limited)| Ad impression telemetry logging |
| **POST** | `/api/ads/click` | Advertising | Public (Rate-limited)| Ad click telemetry logging with fraud filtering |
| **GET** | `/api/v1/podcasts/[id]/rss` | Podcasts | Public | Dynamic XML RSS 2.0 feed generator for Apple/Spotify |
| **POST** | `/api/v1/help/feedback` | Support | Public | User feedback collection on help articles |

---

### 3. Rate Limiting Policy
- **Public Endpoints (`/api/discovery/search`, `/api/ads/*`):** 60 requests/minute per IP.
- **Authenticated Mutating Endpoints (`/api/v1/media/resolve-url`, `/api/translate`):** 30 requests/minute per User ID.
- **Payment Endpoints (`/api/payments/*`):** 10 requests/minute per User ID to mitigate brute-force and carding attacks.
