# Domain Architecture — CARIBBEAN ONE

## 1. Modular Monolith with Extraction Boundaries (ADR-003)

The application is a **modular monolith**: one deployable domain layer, event-driven internally, with explicitly marked extraction seams. No microservices until load evidence demands it.

## 2. Domain Map

| Domain | Owns | Phase |
| :--- | :--- | :--- |
| `identity` | auth, sessions, devices, account lifecycle, deletion/export | 1 |
| `profiles` | personal/business/creator/org profiles, verification | 1–2 |
| `social-graph` | follows, friends, close friends, blocks, mutes | 2 |
| `posts` | posts, media, mentions, hashtags, polls | 2 |
| `comments` / `reactions` | threading, votes, reactions | 2 |
| `feeds` | fan-out, ranking, feed modes | 2 |
| `stories` | ephemeral content, views | 4 |
| `reels` / `videos` | short-form + long-form video | 4–5 |
| `media` | upload, processing, transcoding, CDN, lifecycle | 2 |
| `messaging` | conversations, messages, presence, calls (arch.) | 3 |
| `communities` | communities, members, roles, moderation | 2 |
| `events` | events, RSVPs, tickets | 7 |
| `businesses` | business profiles, reviews, offers, bookings | 7 |
| `marketplace` | listings, carts, orders, disputes | 7+ |
| `notifications` | push/email/in-app fan-out | 2 |
| `search` | indexing + retrieval abstraction | 2 |
| `recommendations` | candidate retrieval, ranking signals | 4 |
| `creator` | creator accounts, subscriptions, revenue | 4–6 |
| `live` | ingestion, chat, gifts, replays | 5 |
| `podcasts` | shows, episodes, RSS, analytics | 5 |
| `payments` (SpotPay) | ledger, intents, providers, payouts | 6 |
| `advertising` | campaigns, targeting, delivery, metrics | 8 |
| `moderation` / `trust-safety` | reports, cases, risk engine | 2 |
| `analytics` | event pipeline, dashboards | 1 (pipeline) |
| `ai` (CaribAI) | search, translation, moderation assist, tools | 8 |

## 3. Domain Rules

1. **Each domain owns its tables.** Cross-domain access goes through domain services or published events — never foreign keys joined across ownership lines in ad-hoc query code.
2. **No shared "utils dumping ground."** Shared code lives in typed packages with a defined owner.
3. **Events, not calls, for side effects.** `POST_CREATED` fans out to feeds, notifications, search indexing, moderation, analytics as async consumers.
4. **Extraction seams** (candidates to become services when load evidence exists): messaging, media processing, feed ranking, search indexing, notifications, payments/webhooks, analytics ingestion.

## 4. Dependency Rule

```
apps → packages → domain logic → database
```
Zero circular dependencies (enforced by Chief Architect review). UI components never contain business rules; API routes are thin adapters over domain services.
