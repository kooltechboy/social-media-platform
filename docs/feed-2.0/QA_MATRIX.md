# TUKUBI FEED 2.0 — QA MATRIX & ACCEPTANCE GATES
**Project:** TUKUBI — The Caribbean Connected  
**Standard:** Enterprise Mobile & Desktop Validation  

---

## 1. 30 Required End-to-End Scenarios

| # | Scenario Description | Viewport | Target Component | Expected Result | Pass/Fail |
|---|---|---|---|---|---|
| 1 | Unauthenticated user visits `/` | All | `RootPage` / `PublicFrontDoor` | Clean gateway with auth prompt; zero feed data leakage | PASS |
| 2 | Authenticated user signs in | Mobile & Desktop | `RootPage` / `HomeDashboard` | Direct redirect to authorized Home Stream | PASS |
| 3 | User switches between all 4 primary tabs (`For You`, `Following`, `Caribbean`, `Communities`) | Mobile & Desktop | `HomeDashboard` / `FeedTabs` | Instant cached transition or loader; URL updates to `/?tab=...` | PENDING |
| 4 | Feed pagination loads without duplicates | Mobile & Desktop | `FeedStream` / `ranking.ts` | Cursor-based load more appends next 30 posts without duplicate IDs | PENDING |
| 5 | User scrolls through mixed content (text, image, video, poll, link) | Mobile & Desktop | `FeedPost` | Smooth 60fps scrolling; stable image dimensions | PENDING |
| 6 | User opens a profile and navigates back | Mobile & Desktop | Browser History / App Router | Restores exact scroll coordinates in feed | PENDING |
| 7 | User publishes a text post | Mobile & Desktop | `UniversalComposer` | Immediately visible at top of stream; draft cleared | PENDING |
| 8 | User publishes a photo post | Mobile & Desktop | `UniversalComposer` | Photo compressed, uploaded, rendered with rounded corners | PENDING |
| 9 | User publishes a supported video post | Mobile & Desktop | `UniversalComposer` | Video uploaded, rendered with inline player and controls | PENDING |
| 10 | User publishes a valid external link | Mobile & Desktop | `MultiLinkContainer` | Safe oEmbed card rendered with title, thumbnail, source | PENDING |
| 11 | User creates and votes in an interactive poll | Mobile & Desktop | `InteractivePollWidget` | Instant vote percentage update; single vote enforcement | PENDING |
| 12 | User saves and discards draft | Mobile & Desktop | `draft-manager.ts` | Discard removes localStorage key; banner vanishes | PENDING |
| 13 | User publishes as an authorized page | Mobile & Desktop | `IdentitySwitcher` | Post marked as `publisher_type: 'page'` with page badge | PENDING |
| 14 | Unauthorized user cannot publish as another page | API / Server | RLS / `createPostAction` | Server rejects unauthorized page post attempt | PENDING |
| 15 | User likes and unlikes a post | Mobile & Desktop | `ReactionPicker` | Instant optimistic counter change; reconciled with DB | PENDING |
| 16 | User opens comments on mobile | Mobile (<768px) | `MobileCommentsSheet` | Opens bottom sheet; feed position preserved | PENDING |
| 17 | User submits comment and nested reply | Mobile & Desktop | `MobileCommentsSheet` | Added to thread; comment count incremented | PENDING |
| 18 | User saves / unsaves post (bookmark) | Mobile & Desktop | `FeedPost` | Bookmark icon fills teal; saved posts updated | PENDING |
| 19 | User shares or reposts content | Mobile & Desktop | Share Modal / Repost Action | Repost created with author commentary or link copied | PENDING |
| 20 | User translates post where supported | Mobile & Desktop | Translation Service | Translation rendered inline; toggle show original | PENDING |
| 21 | User watches and exits Reel | Mobile & Desktop | `/reels` | Clean navigation between feed and immersive reel player | PENDING |
| 22 | User opens external link preview | Mobile & Desktop | `UniversalContentCard` | Opens external URL in safe new tab | PENDING |
| 23 | Transient network error recovery | Mobile & Desktop | Error Boundary / Toast | Graceful error banner with retry button | PENDING |
| 24 | Moderation / Report post | Mobile & Desktop | Report Modal | Report stored in database; confirmation toast | PENDING |
| 25 | Desktop keyboard navigation | Desktop (>1024px) | `KeyboardShortcutsProvider` | Focus rings visible; Tab, Enter, Space navigate feed | PENDING |
| 26 | Mobile touch gestures & safe area | Mobile (iOS/Android) | `AppShell` / `MobileNav` | Bottom nav clears home indicator / notch cleanly | PENDING |
| 27 | Reduced motion & large text settings | Mobile & Desktop | CSS Media Queries | Respects `prefers-reduced-motion` and font scaling | PENDING |
| 28 | Empty Following feed state | Mobile & Desktop | `HomeDashboard` | Friendly Caribbean-first empty state with "Discover Creators" CTA | PENDING |
| 29 | Video autoplay and pause behavior | Mobile & Desktop | `TukubiVideoPlayer` | Only 1 video autoplays; pauses when scrolled out of view | PENDING |
| 30 | Zero production mock content | All | DB & Feeds | All users, posts, media come from real authorized tables | PASS |

---

## 2. Device & Viewport Matrix

- **Small Android (360x640 / 360x780):** Header, tabs, composer, single-column post, bottom nav.
- **Modern iPhone (390x844 / 393x852):** Safe area padding, notch clearance, dynamic island tolerance.
- **Large iPhone / Phablet (428x926 / 430x932):** Proportional touch targets, readable captions.
- **Tablet Portrait (768x1024):** Compact sidebar rail, comfortable feed width.
- **Desktop Standard (1280x800):** 3-column layout (Left nav 240px, Center feed 720px, Right rail 320px).
- **Desktop Wide (1920x1080 / 2560x1440):** Centered workspace canvas, sticky sidebars.
