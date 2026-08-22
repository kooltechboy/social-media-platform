# 11 — LIVE STREAMING AUDIT

**Domain:** Live Video Broadcasting, Live Chat, WebRTC/HLS Ingestion & Virtual Gifting  
**Auditor:** Principal Media Systems Engineer & Live Streaming Architect  
**Status:** Good (Score: 76/100)

---

## 1. Stream State Machine (`@caribbean/live`)

Livestreams follow strict state machine transitions:
- `scheduled → live → ended`
- `scheduled → cancelled`

### Access Control Rules
Streams support 4 permission scopes: `public`, `followers`, `subscribers`, `community`.

---

## 2. Virtual Gift Catalog

| Gift Key | Label | Price (Minor Units) | Cultural Meaning |
| :--- | :--- | :--- | :--- |
| `island_rose` | Island Rose | \$0.99 (99) | Micro-tip token of appreciation |
| `steel_pan` | Steel Pan | \$4.99 (499) | Musical celebration shoutout |
| `carnival_crown` | Carnival Crown | \$9.99 (999) | High-tier creator spotlight |
| `sunrise_fete` | Sunrise Fete | \$49.99 (4,999) | VIP broadcast sponsor pin |

---

## 3. Realtime Chat & Concurrency

- `apps/web/src/components/live-chat-client.tsx` manages optimistic message sending and websocket subscription via Supabase Realtime.
- **Architectural Recommendation for Scale:** For high-volume streams (>5,000 viewers), ingest RTMP/WHIP via Cloudflare Stream or AWS IVS, bypassing application servers for video transcoding.
