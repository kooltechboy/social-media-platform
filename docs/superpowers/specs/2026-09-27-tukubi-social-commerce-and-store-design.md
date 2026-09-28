# TUKUBI Social Commerce & Store Ecosystem Specification
## Sub-Project 3: Store Creation, Catalog & Inventory, Social Product Tagging, Shoppable Overlays & Escrow Checkout

## 1. Executive Summary & Objective
This specification defines the production implementation of the **TUKUBI Social Commerce & Store Ecosystem** (Sub-Project 3 of the 100% Production Maturity Master Plan). 

It converges social media interaction, media capture, and Caribbean digital commerce into a unified, server-authoritative marketplace experience:
1. **Island Storefront Creation & Management**:
   - Seller onboarding wizard with verified island business profiles, Caribbean territories, branding tokens, custom modular sections, and dispute/return policies.
   - Database backing in `storefront_configs` with RLS protecting merchant modifications while granting public read access to active storefronts.
2. **Product Catalog & Variant Inventory Engine**:
   - Multi-variant management (SKU, color/size options matrix, minor unit pricing, comparative pricing, stock counts, and gallery images).
   - Atomic inventory validation preventing overselling with transactional consistency.
3. **Seamless Social Product Tagging Tray**:
   - Native tagging tray integrated into `UniversalComposer` and `TukubiCreationStudio`.
   - Allows creators and merchants to search their own store catalog or verified partner catalogs and attach up to 5 tagged products to Posts, Videos, and Reels.
   - Dual-mode persistence: Fast GIN-indexed `tagged_product_ids UUID[]` on `posts` and `videos` for zero-overhead feed joins, plus relational `product_tags` records.
4. **Interactive Shoppable Post & Reel Overlays**:
   - `ShoppablePostWidget`: Embedded feed post card showing product details, island origin badge, pricing, and 1-click buy/add-to-cart actions.
   - `ShoppableReelBadge`: Floating, non-intrusive interactive shopping pill overlaid on `reels-feed-viewer` with animated tap-to-expand details sheet.
5. **Real Cart Drawer, Multi-Seller Split Totals & Escrow Order Tracking**:
   - Persistent client-side cart drawer with multi-vendor subtotal/processing fee breakdowns.
   - Order placement pipeline writing to `orders` and `order_items` with initial `escrow_status = 'held'`.
   - Buyer protection status bar showing escrow holding period (30-day Caribbean Escrow Guarantee) and delivery tracking status.

---

## 2. Architecture & File Structure

```
supabase/migrations/
└── 00102_social_commerce_and_product_tagging.sql   # Schema migration: tagged_product_ids, video tagging, escrow columns, RLS

packages/marketplace/src/
├── types.ts                                        # Extended Storefront, ProductVariant, and Tagging interfaces
├── index.ts                                        # Barrel exports & calculations (order totals, multi-vendor splits)
└── tagging.ts                                      # Product tagging validation, serialization & lookup helpers

apps/web/src/lib/commerce/
├── types.ts                                        # Commerce client types, store profiles, tagged items
├── actions.ts                                      # Server actions: createStorefrontAction, updateStorefrontAction, tagProductsAction, createOrderWithEscrowAction
└── cart-store.ts                                   # Persistent LocalStorage cart store with event subscriptions

apps/web/src/components/commerce/
├── store-creation-wizard.tsx                       # Full merchant onboarding and storefront customization wizard
├── product-tagging-tray.tsx                        # Product search & multi-select tagging tray for Composer & Studio
├── shoppable-post-widget.tsx                       # Redesigned shoppable card for feed posts
├── shoppable-reel-badge.tsx                        # Floating shoppable badge & bottom sheet for Reels
└── order-escrow-badge.tsx                          # Escrow status, dispute window, and verification badge

apps/web/src/components/universal-composer.tsx       # Wire native ProductTaggingTray & tagged_product_ids
apps/web/src/components/media/creation/
└── tukubi-creation-studio.tsx                      # Add product tagging trigger & review summary
apps/web/src/components/reels/
└── reels-feed-viewer.tsx                           # Render ShoppableReelBadge when reel has tagged products
```

---

## 3. Database Schema & Migration (`00102`)

### 3.1 Migration Specifications
1. **Extend `public.posts`**:
   - `tagged_product_ids UUID[] DEFAULT '{}'::uuid[] NOT NULL`
   - GIN Index `idx_posts_tagged_products ON public.posts USING gin (tagged_product_ids)`
2. **Extend `public.videos`**:
   - `tagged_product_ids UUID[] DEFAULT '{}'::uuid[] NOT NULL`
   - GIN Index `idx_videos_tagged_products ON public.videos USING gin (tagged_product_ids)`
3. **Extend `public.product_tags`**:
   - `video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE`
   - Partial index: `CREATE INDEX idx_product_tags_video ON public.product_tags(video_id) WHERE video_id IS NOT NULL`
   - Check constraint: `CHECK (post_id IS NOT NULL OR video_id IS NOT NULL)`
4. **Extend `public.orders`**:
   - `seller_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL`
   - `escrow_status VARCHAR(24) DEFAULT 'held' NOT NULL CHECK (escrow_status IN ('held', 'releasing', 'released', 'refunded', 'disputed'))`
   - `escrow_released_at TIMESTAMPTZ`
   - Index: `CREATE INDEX idx_orders_escrow_status ON public.orders(escrow_status, created_at DESC)`
5. **Extend `public.order_items`**:
   - `variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL`
   - Index: `CREATE INDEX idx_order_items_variant ON public.order_items(variant_id) WHERE variant_id IS NOT NULL`
6. **Extend `public.storefront_configs`**:
   - `return_policy TEXT`
   - `shipping_policy TEXT`
   - `currency VARCHAR(3) DEFAULT 'USD' NOT NULL`
   - `support_email TEXT`
   - `social_links JSONB DEFAULT '{}'::jsonb NOT NULL`
7. **Atomic Helper RPC `public.place_order_with_escrow`**:
   - Accepts buyer_id, seller_id, items jsonb, subtotal_minor, platform_fee_minor, total_minor, currency, shipping_address jsonb.
   - Inserts into `orders` with `status = 'paid'`, `escrow_status = 'held'`.
   - Inserts all `order_items` with line items and variant IDs.
   - Decrements `inventory_count` on `products` and `product_variants` atomically.
   - Rejects if any product or variant has insufficient inventory (`inventory_count < quantity`).

---

## 4. Component Details & UX Specifications

### 4.1 Product Tagging Tray (`product-tagging-tray.tsx`)
- Search bar with debounced query over seller's active products and general verified marketplace catalog.
- Selected products preview pills (max 5 tagged products per post/reel).
- Shows thumbnail, title, price in currency, stock indicator (`In Stock` / `X left`), and island origin badge.
- One-click remove or add.
- Emits `onTagsChange(products: TaggedProductSummary[])`.

### 4.2 Integration with `UniversalComposer` & `TukubiCreationStudio`
- `UniversalComposer`:
  - When user clicks "Feature a Store Product", opens the `ProductTaggingTray`.
  - Selected products appear in a horizontal scroll strip above the action bar with price tags.
  - On submit, appends `tagged_product_ids` to `formData` and saves both to `posts.tagged_product_ids` and `product_tags`.
- `TukubiCreationStudio`:
  - Step 3 (Review & Export): Adds "Tag Products for Caribbean Shop" button.
  - Allows tagging products before exporting Reel or Video.
  - Returns `taggedProductIds` in `MediaExportResult`.

### 4.3 Shoppable Post Widget (`shoppable-post-widget.tsx`)
- Displayed below post content when `tagged_product_ids.length > 0`.
- Renders responsive product card or multi-product carousel.
- Details: Title, Merchant name with verified badge, currency-formatted price, Island badge (e.g. `🇯🇲 Kingston, Jamaica`).
- Actions: "Buy Now" (opens 1-click checkout modal) and "Add to Cart" (dispatches to cart store and opens `CartDrawer`).

### 4.4 Shoppable Reel Badge & Bottom Sheet (`shoppable-reel-badge.tsx`)
- Floating frosted pill positioned on the lower left of `reels-feed-viewer.tsx` above caption.
- Badge: `🛍️ Featured Goods (N) • From $XX.XX`.
- On click: Expands a smooth bottom sheet / slide-over presenting all tagged products.
- Each item has an instant "Add to Cart" or "Buy Now" button with immediate feedback.

### 4.5 Store Creation Wizard (`store-creation-wizard.tsx`)
- Step-by-step onboarding for merchants & creators:
  - Step 1: Store Basics (Name, slug, category, Caribbean country ISO, currency, seller type).
  - Step 2: Branding & Visuals (Hero banner, brand accent color, avatar/logo).
  - Step 3: Policies & Support (Shipping guidelines, return policy, customer support email).
  - Step 4: Review & Publish.
- Backed by `createOrUpdateStorefrontAction`.

### 4.6 Escrow Status & Order Lifecycle (`order-escrow-badge.tsx`)
- Visual trust indicator on order cards and checkout confirmation:
  - `Held in Escrow`: "Protected by TUKUBI 30-Day Escrow Guarantee. Funds released upon verified delivery or confirmation."
  - `Releasing`: "Delivery confirmed. Escrow payout processing."
  - `Released`: "Completed & funds settled to merchant wallet."
  - `Disputed`: "Under Caribbean mediation review."

---

## 5. Security, Accessibility & Performance Gates

### 5.1 Security
- Strict RLS on all queries:
  - Only authenticated sellers can create/update their own `storefront_configs` and `products`.
  - Buyers can only read their own `orders` and `order_items`.
  - RPC `place_order_with_escrow` executes with `SECURITY DEFINER` and enforces `auth.uid() = buyer_id`.
- Zero mock payment data; strictly handles ledger idempotency and escrow constraints.

### 5.2 Accessibility (WCAG 2.2 AA)
- Touch targets $\ge 44 \times 44\text{ px}$.
- Accessible ARIA labels on all modal triggers, product cards, and quantity controls.
- Keyboard navigation (Tab, Enter, Escape) on Tagging Tray, Cart Drawer, and Shoppable Bottom Sheet.

### 5.3 Performance
- GIN index on `tagged_product_ids` ensures queries for shoppable content take $<2\text{ms}$.
- Cart store utilizes debounced localStorage writes and selective Zustand/event-emitter updates to prevent unnecessary re-renders.

---

## 6. Acceptance Criteria
1. Migration `00102` applies cleanly and defines all required columns, indexes, constraints, and atomic RPC.
2. `ProductTaggingTray` allows searching, selecting, and deselecting up to 5 products with live badges.
3. `UniversalComposer` and `TukubiCreationStudio` cleanly save `tagged_product_ids` on post/reel creation.
4. `ShoppablePostWidget` and `ShoppableReelBadge` display real product information and support both 1-click checkout and Add to Cart.
5. `CartDrawer` accurately computes multi-vendor totals and transitions to checkout.
6. `StoreCreationWizard` enables complete seller onboarding with verified branding and policies.
7. Full Vitest test suite passes and monorepo typecheck reports 0 errors.
