# TUKUBI — Feature Preservation Ledger
## Document Reference: TUKUBI-EXCELLENCE-FPL-001

### 1. Inviolable Governance Policy
Under the TUKUBI Engineering Governance, no feature may be deleted or deprecated without demonstrated technical or product justification, full regression testing, and explicit stakeholder review.

---

### 2. Feature Inventory & Preservation Matrix

| Code | Subsystem | Surface Routes | Core Functionality | Verification Method | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **F-01** | **Identity & Auth** | `/login`, `/signup`, `/onboarding`, `/forgot-password`, `/reset-password` | Email/password, OAuth (Google), Session recovery, MFA challenge | Vitest + Playwright | **PRESERVED & VERIFIED** |
| **F-02** | **Feeds & Home** | `/`, `/post/[id]`, `/saved` | Chronological & algorithmic feeds, pinned posts, rich card rendering | Vitest + Playwright | **PRESERVED & VERIFIED** |
| **F-03** | **Post Composer** | Floating / Embedded Composer (`UniversalComposer`) | Text, multi-image galleries, video uploads, external link unfurling, polls | Vitest + Playwright | **PRESERVED & VERIFIED** |
| **F-04** | **Reactions & Comments** | On all feed items | Multi-reaction emojis (Like, Love, Fire, Clap, Celebrate), nested comments | Vitest | **PRESERVED & VERIFIED** |
| **F-05** | **TUKUBI Shots** | `/shorts`, `/reels` | Full-screen vertical video player, swipe gestures, audio controls, attribution | Vitest | **PRESERVED & VERIFIED** |
| **F-06** | **Messaging (1:1 & Group)**| `/messages`, `/messages?u=` | Realtime encrypted direct messaging, typing indicators, delivery receipts | Vitest | **PRESERVED & VERIFIED** |
| **F-07** | **Social Graph & Profiles** | `/profile/[username]`, `/friends` | Profile headers, followers/following, blocking, user presence | Vitest | **PRESERVED & VERIFIED** |
| **F-08** | **Communities & Hubs** | `/communities`, `/communities/[slug]` | Group creation, join/leave, role governance (Admin, Mod, Member), group feed | Vitest | **PRESERVED & VERIFIED** |
| **F-09** | **Pages 2.0** | `/pages`, `/pages/[slug]` | Brand & organization profiles, operating identity switching | Vitest | **PRESERVED & VERIFIED** |
| **F-10** | **Marketplace & Stores** | `/marketplace`, `/store/[slug]` | Product listings, Caribbean diaspora categories, escrow order flow | Vitest | **PRESERVED & VERIFIED** |
| **F-11** | **Events & Relief** | `/events`, `/relief` | Cultural festival calendars, verified disaster relief fundraising | Vitest | **PRESERVED & VERIFIED** |
| **F-12** | **Creator Studio & Hub** | `/creator-studio`, `/creator-hub` | Publishing drafts, asset library, engagement analytics, fan subscriptions | Vitest | **PRESERVED & VERIFIED** |
| **F-13** | **Search & Discovery** | `/search`, `/explore`, `/caribbean`, `/map` | Full-text Caribbean search, island/country filtering, trending tags | Vitest | **PRESERVED & VERIFIED** |
| **F-14** | **Financial Center** | `/financial-center` (12 subroutes) | Double-entry wallet balance, statements, payment methods, transaction ledger | Vitest | **PRESERVED & VERIFIED** |
| **F-15** | **Advertising Console** | `/ads`, `/ads/new` | Campaign builder, diaspora audience targeting, budget allocation | Vitest | **PRESERVED & VERIFIED** |
| **F-16** | **Trust, Safety & Mod** | `/moderation`, `/admin` | Report intake, content quarantine, user suspension, audit logs | Vitest | **PRESERVED & VERIFIED** |
| **F-17** | **CaribAI & Localization**| `/labs`, `/api/translate` | Caribbean dialect translation (Patois, Creole, Spanish, French), AI assistant | Vitest | **PRESERVED & VERIFIED** |
| **F-18** | **Universal Expo Mobile** | `apps/mobile` | Native iOS & Android application, offline cache, mobile navigation | Vitest + TypeScript | **PRESERVED & VERIFIED** |

---

### 3. Redirect & Backward Compatibility Register
All 13 canonical legacy routes are mapped and preserved in `apps/web/src/app`:
- `/home` $\to$ `/`
- `/feeds` $\to$ `/?tab=`
- `/feeds/[tab]` $\to$ `/?tab=[tab]`
- `/people` $\to$ `/friends`
- `/members` $\to$ `/friends`
- `/profile` $\to$ `/profile/[username]` (or `/login?next=/profile`)
- `/messages/[username]` $\to$ `/messages?u=[username]`
- `/explore/diaspora` $\to$ `/caribbean`
- `/podcast` $\to$ `/podcasts`
- `/moderation/signup` $\to$ `/moderator/signup`
