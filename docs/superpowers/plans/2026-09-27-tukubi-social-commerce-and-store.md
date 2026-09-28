# TUKUBI Social Commerce & Store Ecosystem Implementation Plan
## Sub-Project 3: Store Creation, Catalog & Inventory, Social Product Tagging, Shoppable Overlays & Escrow Checkout

> **Mandate**: 100% production-ready, zero mock data, zero dead user-facing controls, complete database/RLS enforcement, and cross-platform convergence.

---

### Task 1: Database Migration 00102 for Social Commerce, Product Tagging, Escrow Columns & Atomic Checkout RPC
- **Files**:
  - `supabase/migrations/00102_social_commerce_and_product_tagging.sql`
  - `tests/migration-00102.test.ts`
- **Scope**:
  - Add `tagged_product_ids UUID[] DEFAULT '{}'::uuid[] NOT NULL` to `posts` and `videos` with GIN indexes.
  - Extend `product_tags` with `video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE`.
  - Extend `orders` with `seller_id`, `escrow_status VARCHAR(24) DEFAULT 'held' NOT NULL`, `escrow_released_at TIMESTAMPTZ`.
  - Extend `order_items` with `variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL`.
  - Extend `storefront_configs` with `return_policy`, `shipping_policy`, `currency`, `support_email`, `social_links`.
  - Implement atomic RPC `public.place_order_with_escrow` for single/multi-item inventory validation, order placement, and escrow status reservation.
- **Verification**: `npx vitest run tests/migration-00102.test.ts`.

---

### Task 2: Marketplace Domain Extensions & Product Tagging Primitives
- **Files**:
  - `packages/marketplace/src/tagging.ts`
  - `packages/marketplace/src/types.ts`
  - `packages/marketplace/src/index.ts`
  - `apps/web/src/lib/commerce/types.ts`
  - `tests/commerce-tagging-primitives.test.ts`
- **Scope**:
  - Add tagged product validation, max-5-tag limits, thumbnail resolution, and Caribbean currency formatting.
  - Define EscrowStatus type (`held`, `releasing`, `released`, `refunded`, `disputed`) and validation rules.
  - Provide helper functions for parsing and indexing tagged products for posts and video feeds.
- **Verification**: `npx vitest run tests/commerce-tagging-primitives.test.ts`.

---

### Task 3: Product Tagging Tray UI Component
- **Files**:
  - `apps/web/src/components/commerce/product-tagging-tray.tsx`
  - `tests/product-tagging-tray.test.ts`
- **Scope**:
  - Build searchable, keyboard-navigable product tagging tray.
  - Search across active merchant products with debounced queries.
  - Display product pills with image thumbnail, title, price, origin territory, and stock status.
  - Enforce maximum 5 tagged products limit with visual counter and accessibility feedback.
- **Verification**: `npx vitest run tests/product-tagging-tray.test.ts`.

---

### Task 4: Wire Product Tagging Tray into UniversalComposer and TukubiCreationStudio
- **Files**:
  - `apps/web/src/components/universal-composer.tsx`
  - `apps/web/src/components/media/creation/tukubi-creation-studio.tsx`
  - `packages/media/src/creation/types.ts`
  - `tests/composer-studio-product-tagging.test.ts`
- **Scope**:
  - In `UniversalComposer`: Replace legacy text-only product inputs with `ProductTaggingTray`. Attach `tagged_product_ids` to post creation payload.
  - In `TukubiCreationStudio`: Add product tagging trigger & review step for reels/videos; pass `taggedProductIds` in `MediaExportResult`.
- **Verification**: `npx vitest run tests/composer-studio-product-tagging.test.ts` and `pnpm --filter caribbean-web typecheck`.

---

### Task 5: Shoppable Post Widget & Shoppable Reel Badge Overlays
- **Files**:
  - `apps/web/src/components/commerce/shoppable-post-widget.tsx`
  - `apps/web/src/components/commerce/shoppable-reel-badge.tsx`
  - `apps/web/src/components/reels/reels-feed-viewer.tsx`
  - `tests/shoppable-overlays.test.ts`
- **Scope**:
  - Modernize `shoppable-post-widget.tsx` with responsive product cards, Caribbean currency support, and dual "Buy Now" (modal) / "Add to Cart" triggers.
  - Build `shoppable-reel-badge.tsx` for floating reel pill and animated bottom sheet modal with full item details.
  - Wire `shoppable-reel-badge.tsx` into `reels-feed-viewer.tsx`.
- **Verification**: `npx vitest run tests/shoppable-overlays.test.ts`.

---

### Task 6: Store Creation & Management Wizard
- **Files**:
  - `apps/web/src/components/commerce/store-creation-wizard.tsx`
  - `apps/web/src/lib/commerce/actions.ts`
  - `tests/store-creation-wizard.test.ts`
- **Scope**:
  - Build multi-step merchant onboarding wizard: Store Info & Territory, Visual Branding & Palette, Policies & Support, Review & Publish.
  - Server actions for creating/updating `storefront_configs` with RLS validation and profile synchronizations.
- **Verification**: `npx vitest run tests/store-creation-wizard.test.ts`.

---

### Task 7: Escrow Order Pipeline, Cart Store & Escrow Status Tracking
- **Files**:
  - `apps/web/src/lib/commerce/cart-store.ts`
  - `apps/web/src/components/commerce/order-escrow-badge.tsx`
  - `apps/web/src/components/marketplace/cart-drawer.tsx`
  - `tests/escrow-order-pipeline.test.ts`
- **Scope**:
  - Implement client-side `cart-store.ts` with local storage persistence and change broadcasts.
  - Build `order-escrow-badge.tsx` indicating protection level, dispute period, and release stages.
  - Connect `CartDrawer` with checkout actions and atomic escrow order creation.
- **Verification**: `npx vitest run tests/escrow-order-pipeline.test.ts`.

---

### Task 8: End-to-End Suite & Acceptance Verification for Sub-Project 3
- **Files**:
  - `tests/unified-social-commerce.test.ts`
- **Scope**:
  - Comprehensive e2e integration testing covering migration 00102, tagging primitives, composer/studio handoff, shoppable post/reel overlays, store wizard, and escrow orders.
  - Run all 8 Sub-Project 3 Vitest suites.
  - Validate monorepo typecheck (31 packages, 0 errors).
- **Verification**: `npx vitest run tests/unified-social-commerce.test.ts` and `pnpm typecheck`.
