# Technical Specification: TUKUBI Universal Rich Media Engine

**Status:** Approved  
**Author:** Principal Software Architecture & Engineering Organization  
**Date:** 2026-10-12  
**Target Platform:** TUKUBI (Caribbean Connected Social Ecosystem)  

---

## 1. Executive Summary & Problem Statement

TUKUBI requires a world-class, provider-neutral **Universal Rich Media Engine** capable of intelligently handling external media and content URLs from virtually any source on the Internet. 

Historically, web platforms (and previous iterations of TUKUBI) suffered from brittle embed paradigms:
1. **Blind IFrame Rendering:** When a user clicked play on a video (e.g. YouTube), the thumbnail was unconditionally swapped with a raw `<iframe>`. If the video creator disabled embedding (YouTube error 101/150), if age restrictions applied, or if network/sandboxing policies blocked it, the iframe rendered an unrecoverable browser or provider error ("Video unavailable", empty gray/black box).
2. **Preview Destruction on Playback Failure:** Failing embeds destroyed good previews, leaving the user with an ugly, broken post.
3. **URL Fragmentation & Duplicate Caching:** URLs such as `https://youtu.be/IIQ3mIGKquc?si=faAZYkCPvSl1iH44` and `https://www.youtube.com/watch?v=IIQ3mIGKquc` were treated as distinct, creating duplicate database cache rows and fragmented records.
4. **Post Creation Blocking Vulnerability:** If a user submitted a post with an external link before client-side preview resolution finished, the server action synchronously awaited external metadata resolution, risking 15+ second timeouts and potential post creation failure.
5. **Feed Realtime & Ranking Hydration Gaps:** Realtime feed subscriptions and ranking queries did not consistently select multi-link preview arrays (`link_previews`), resulting in missing preview cards until manual page refreshes.

This specification defines the universal architecture, provider registry, security model, controlled player state machine, non-blocking post publication pipeline, and fallback experiences that eliminate broken states permanently.

---

## 2. Inviolable Architectural Principles

1. **Post Creation Must Never Depend on External Media Resolution (Mandate P0):**
   A TUKUBI post publication request **always succeeds** first. Third-party latency, network timeouts, rate-limits, or metadata errors must never cause a user's post to fail or block the UI.
2. **Recognition $\neq$ Metadata $\neq$ Embeddability $\neq$ Playability:**
   These concepts are strictly decoupled:
   - *Recognition:* Can TUKUBI identify what this URL is?
   - *Metadata Resolution:* Can TUKUBI retrieve title, description, thumbnail, and author safely?
   - *Embeddability:* Does the provider support safe and legal iframe embedding?
   - *Playability:* Can the embedded or native player actually stream the media in the client?
   If playability fails, the preview card remains 100% intact and functional.
3. **Zero Broken States (Mandate P0):**
   No raw broken HTML, empty iframes, gray rectangles, endless spinners, or browser crash screens may ever be shown to users. Any failure gracefully transitions to a branded preview with a "Watch on [Provider]" action button.
4. **Strict SSRF & Security Defense-in-Depth:**
   No arbitrary iframe URLs. Only approved provider origins may be embedded. All server-side metadata fetching runs through `assertSafeUrl` and `safeFetch`, blocking loopback, private IPv4/IPv6, cloud metadata endpoints, DNS rebinding, and dangerous redirects.
5. **Design System & Caribbean Futurism:**
   All cards adhere to Tukubi design tokens (`@caribbean/design-system`), responsive containment, zero cumulative layout shift (CLS), and WCAG 2.2 AA accessibility standards.

---

## 3. Architecture & Component Hierarchy

```
                            [ USER PASTES / SUBMITS URL ]
                                          │
                                          ▼
                                [ URL PARSER ENGINE ]
                                          │
                                          ▼
                                 [ SSRF PRE-FLIGHT ]
                                          │
                                          ▼
                          [ CANONICALIZATION REGISTRY ]
                                          │
                                          ▼
                             [ PROVIDER DETECTION ]
                                          │
                                          ▼
                        [ RESOLUTION & CAPABILITY MATRIX ]
                                          │
                   ┌──────────────────────┴──────────────────────┐
                   │                                             │
                   ▼                                             ▼
        [ SPECIALIZED PROVIDER ]                        [ GENERIC WEB FALLBACK ]
     (YouTube, Spotify, Vimeo, etc.)                   (OpenGraph, Twitter, LD-JSON)
                   │                                             │
                   └──────────────────────┬──────────────────────┘
                                          │
                                          ▼
                             [ RICH MEDIA METADATA ]
                                          │
                                          ▼
                             [ UNIVERSAL CONTENT CARD ]
                                          │
                                          ▼
                     [ CONTROLLED PLAYER STATE MACHINE ]
                  (Idle -> Loading -> Playing | Fallback)
```

---

## 4. Provider Registry & Capability Matrix

The registry is managed via `ContentResolverEngine`. Each provider implements `ContentProvider` and declares explicit capabilities.

| Provider | Media Type | Canonical URL Format | Embed Supported | Fallback Action |
| :--- | :--- | :--- | :--- | :--- |
| **YouTube** | Video / Shorts | `https://www.youtube.com/watch?v=ID` | Yes (Controlled IFrame) | "Watch on YouTube" |
| **Vimeo** | Video | `https://vimeo.com/ID` | Yes (Player IFrame) | "Watch on Vimeo" |
| **Dailymotion** | Video | `https://www.dailymotion.com/video/ID` | Yes (Geo-dependent) | "Watch on Dailymotion" |
| **Twitch** | Video / Stream | `https://www.twitch.tv/CHANNEL` | Yes (Parent domain) | "Watch on Twitch" |
| **Loom** | Video | `https://www.loom.com/share/ID` | Yes (Embed URL) | "Watch on Loom" |
| **TikTok** | Video | `https://www.tiktok.com/@user/video/ID`| Provider-dependent | "Watch on TikTok" |
| **Instagram** | Video / Image | `https://www.instagram.com/p/ID/` | No (Walled garden) | "Open on Instagram" |
| **Facebook** | Video / Post | `https://www.facebook.com/...` | No (Meta policy) | "View on Facebook" |
| **X / Twitter** | Social Post | `https://x.com/user/status/ID` | Provider-dependent | "Open on X" |
| **Reddit** | Social Post | `https://www.reddit.com/r/...` | No (API/Auth policy) | "Open on Reddit" |
| **Threads** | Social Post | `https://www.threads.net/@user/post/ID`| No | "Open on Threads" |
| **LinkedIn** | Article / Post | `https://www.linkedin.com/posts/...` | No | "View on LinkedIn" |
| **Spotify** | Audio / Podcast| `https://open.spotify.com/track/ID` | Yes (Compact widget)| "Listen on Spotify" |
| **SoundCloud** | Audio | `https://soundcloud.com/user/track` | Yes (Widget IFrame) | "Listen on SoundCloud" |
| **Apple Podcasts**| Podcast | `https://podcasts.apple.com/...` | Yes (Apple widget) | "Listen on Apple Podcasts" |
| **Direct Media** | MP4, MP3, etc. | Direct URL (HTTPS) | Native HTML5 Audio/Video | Download / Open Media |
| **Generic Web** | Website / Article | Canonical URL / Og:url | No (Safe preview card)| "Visit Website" |

---

## 5. Controlled Player State Machine

To eliminate broken iframe states permanently, `RichMediaPlayer` executes an explicit state machine:

```
  [ IDLE ]
     │ User taps Play
     ▼
  [ LOADING ] ────(Watchdog timeout > 4000ms or postMessage error)───┐
     │                                                               │
     │ Provider onReady / playing event received                     │
     ▼                                                               ▼
  [ PLAYING ] ────────────────(Playback runtime error)──────────▶ [ FALLBACK ]
     │                                                               │
     │ User pauses                                                   │ User taps "Watch on [Provider]"
     ▼                                                               ▼
  [ PAUSED ]                                                  [ EXTERNAL TAB OPEN ]
```

### PostMessage & Watchdog Error Trap:
1. For YouTube:
   - Embed URL includes `enablejsapi=1&origin=${window.location.origin}`.
   - Component listens to `window.addEventListener('message')`.
   - YouTube postMessage events with `event: 'onError'` (codes `101`, `150`, `100`, `2`, `5`) immediately trigger the state transition to `fallback`.
2. For all iframes:
   - A 4.0-second watchdog timer starts on transition to `loading`.
   - If the player fails to confirm playback before the watchdog expires, it automatically transitions to `fallback`.
   - In `fallback` state:
     - The high-resolution thumbnail and gradient overlay are preserved.
     - A banner displays: *"Playback isn't available inside TUKUBI."*
     - A prominent, accessible button displays: *"Watch on [Provider]"* with an `ExternalLink` icon.
     - A *"Retry"* button is available to reset to `idle`.

---

## 6. Non-Blocking Post Creation Decoupling

In `apps/web/src/lib/social/actions.ts`:
1. `createPostAction` inspects `formData` for pre-resolved `link_preview` and `link_previews`.
2. If available: attached directly to post record insert.
3. If NOT available (e.g., user pasted a link and clicked Post immediately):
   - Post creation **does NOT await external network resolution**.
   - The post is created immediately with `link_preview: null`.
   - The post returns successfully in $<150$ms.
   - An asynchronous non-blocking task triggers background resolution and updates `posts.link_preview` and `public.post_external_media` without blocking the client.

---

## 7. Database & Hydration Specifications

1. **`url_metadata_cache`**:
   - Cache key: `hashUrlSync(canonicalUrl)` (SHA-256).
   - TTL: 7 days.
   - Status: `resolved` | `partial` | `fallback` | `failed` | `blocked`.
2. **`post_external_media`**:
   - Cascades on post deletion (`ON DELETE CASCADE`).
   - RLS: Public read, post author manage policy.
3. **Feed Realtime & Ranking Queries**:
   - `feed-stream.tsx` (realtime): Update `.select(...)` to include `link_preview, link_previews`.
   - `ranking.ts`: Update `.select(...)` to include `link_previews`.
   - `page.tsx` (official post query): Include `link_preview, link_previews`.

---

## 8. Verification & Quality Assurance Strategy

1. **Unit Testing (`tests/unit/`)**:
   - Canonicalization across YouTube, youtu.be, Spotify, Vimeo, TikTok, X, Dailymotion, Twitch, Loom.
   - SSRF guard blocking private IP ranges, loopback, cloud metadata, and DNS rebinding.
   - Capability matrix verification for each provider.
   - Direct media MIME and extension validation.
2. **Integration Testing**:
   - Composer paste $\to$ preview resolution $\to$ publish $\to$ feed display $\to$ fallback on error.
   - Non-blocking post creation with unresolvable or slow URLs.
3. **E2E Browser Testing (`tests/e2e/`)**:
   - Problematic test URL: `https://youtu.be/IIQ3mIGKquc?si=faAZYkCPvSl1iH44`.
   - Verify thumbnail display, play trigger, controlled iframe load, graceful fallback if restricted, and "Watch on YouTube" button.
   - Desktop and mobile viewport testing.
4. **Accessibility (WCAG 2.2 AA)**:
   - Full keyboard navigation (Space/Enter to play, Tab to external button).
   - ARIA labels and roles on player controls.
   - Reduced motion preferences honored.
