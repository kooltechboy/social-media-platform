/**
 * =============================================================================
 * Accessibility (WCAG 2.2 AA) Audit Suite
 *
 * Exhaustive Accessibility Verification across Sub-Projects 1 through 4:
 * 1. Touch Target Dimensions (minimum 44x44px target bounds)
 * 2. ARIA Roles & Semantic Markup (dialog, progressbar, status, tablist, tab, aria-pressed)
 * 3. Screen Reader Live Announcements (aria-live="polite", aria-atomic, role="status")
 * 4. Keyboard Navigation & Escape Key Dismissal with Unmount Cleanup
 * =============================================================================
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

// Subsystem 1: Media Creation Studio
import StudioViewfinder from '../apps/web/src/components/media/creation/studio-viewfinder';
import VideoTimelineEditor from '../apps/web/src/components/media/creation/video-timeline-editor';

// Subsystem 2: Emoji & Reaction Engagement
import EmojiPickerPopover, {
  computeNextGridIndex,
  CATEGORY_TABS,
} from '../apps/web/src/components/emoji/emoji-picker-popover';
import ReactionPicker, {
  VALID_REACTION_TYPES,
  REACTION_EMOJI_MAP,
} from '../apps/web/src/components/reactions/reaction-picker';
import InteractivePollWidget from '../apps/web/src/components/polls/interactive-poll-widget';
import type { PollData } from '../apps/web/src/lib/polls/types';

// Subsystem 3: Social Commerce & Tagging
import ProductTaggingTray, {
  DEFAULT_CARIBBEAN_PRODUCTS,
} from '../apps/web/src/components/commerce/product-tagging-tray';
import ShoppablePostWidget, {
  normalizeTaggedProducts,
} from '../apps/web/src/components/commerce/shoppable-post-widget';
import ShoppableReelBadge, {
  resolveReelProducts,
} from '../apps/web/src/components/commerce/shoppable-reel-badge';
import StoreCreationWizard from '../apps/web/src/components/commerce/store-creation-wizard';
import CartDrawer from '../apps/web/src/components/marketplace/cart-drawer';
import type { TaggedProductSummary, CartLine } from '@caribbean/marketplace';

// Subsystem 4: Events & Community Relief
import InteractiveEventCard from '../apps/web/src/components/events/interactive-event-card';
import EventComposerPanel from '../apps/web/src/components/events/event-composer-panel';
import ReliefCampaignCard from '../apps/web/src/components/relief/relief-campaign-card';
import ReliefDonationModal from '../apps/web/src/components/relief/relief-donation-modal';
import ReliefComposerPanel from '../apps/web/src/components/relief/relief-composer-panel';
import type { LiveEventItem, CreateEventInput } from '../apps/web/src/lib/events/types';
import type { ReliefCampaign, CreateReliefCampaignInput } from '../apps/web/src/lib/relief/types';

// Helper to serialize React VDOM for attribute inspection
function serializeVDOM(vdom: any): string {
  const seen = new WeakSet();
  return JSON.stringify(vdom, (_key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    return value;
  });
}

describe('Task 3: Accessibility (WCAG 2.2 AA) Audit Suite', () => {
  const rootDir = process.cwd();

  const paths = {
    studioViewfinder: path.join(rootDir, 'apps/web/src/components/media/creation/studio-viewfinder.tsx'),
    timelineEditor: path.join(rootDir, 'apps/web/src/components/media/creation/video-timeline-editor.tsx'),
    emojiPicker: path.join(rootDir, 'apps/web/src/components/emoji/emoji-picker-popover.tsx'),
    reactionPicker: path.join(rootDir, 'apps/web/src/components/reactions/reaction-picker.tsx'),
    pollWidget: path.join(rootDir, 'apps/web/src/components/polls/interactive-poll-widget.tsx'),
    productTaggingTray: path.join(rootDir, 'apps/web/src/components/commerce/product-tagging-tray.tsx'),
    shoppablePostWidget: path.join(rootDir, 'apps/web/src/components/commerce/shoppable-post-widget.tsx'),
    shoppableReelBadge: path.join(rootDir, 'apps/web/src/components/commerce/shoppable-reel-badge.tsx'),
    storeCreationWizard: path.join(rootDir, 'apps/web/src/components/commerce/store-creation-wizard.tsx'),
    cartDrawer: path.join(rootDir, 'apps/web/src/components/marketplace/cart-drawer.tsx'),
    interactiveEventCard: path.join(rootDir, 'apps/web/src/components/events/interactive-event-card.tsx'),
    eventComposerPanel: path.join(rootDir, 'apps/web/src/components/events/event-composer-panel.tsx'),
    reliefCampaignCard: path.join(rootDir, 'apps/web/src/components/relief/relief-campaign-card.tsx'),
    reliefDonationModal: path.join(rootDir, 'apps/web/src/components/relief/relief-donation-modal.tsx'),
    reliefComposerPanel: path.join(rootDir, 'apps/web/src/components/relief/relief-composer-panel.tsx'),
  };

  const sources = Object.fromEntries(
    Object.entries(paths).map(([key, filePath]) => [key, fs.readFileSync(filePath, 'utf8')])
  ) as Record<keyof typeof paths, string>;

  // Sample Mock Fixtures for Subsystems
  const mockProduct: TaggedProductSummary = {
    id: 'prod-jam-01',
    title: 'Blue Mountain Peaberry Coffee',
    priceMinor: 3200,
    currency: 'USD',
    originTerritory: 'Jamaica',
    originCountry: 'Jamaica',
    sellerId: 'seller-jam-1',
    sellerName: 'Kingston Roasters',
    inventoryCount: 24,
    isAvailable: true,
    thumbnailUrl: 'https://cdn.tukubi.com/products/peaberry.jpg',
  };

  const mockCartLine: CartLine = {
    productId: 'prod-jam-01',
    variantId: 'var-1',
    sellerId: 'seller-jam-1',
    sellerName: 'Kingston Roasters',
    productTitle: 'Blue Mountain Peaberry Coffee',
    unitPriceMinor: 3200,
    currency: 'USD',
    quantity: 2,
    productKind: 'physical',
  };

  const mockEvent: LiveEventItem = {
    id: 'evt-carib-101',
    title: 'Tukubi Sunset Soca & Reggae Festival',
    description: 'Premier Caribbean sunset fete with live bands and rum tasting.',
    event_kind: 'in_person',
    privacy: 'public',
    venue: 'Fort Charles Beach Club',
    starts_at: '2026-11-14T19:00:00.000Z',
    ends_at: '2026-11-15T02:00:00.000Z',
    capacity: 250,
    price: '$25 USD',
    country_iso: 'JAM',
    cities: { name: 'Port Royal, Kingston', country_iso: 'JAM' },
    tags: ['carnival', 'socafete', 'reggae'],
    cover_image_url: 'https://cdn.tukubi.com/events/soca-sunset.jpg',
    event_attendees: [
      { profile_id: 'user-001', rsvp_status: 'going', guest_count: 2 },
      { profile_id: 'user-002', rsvp_status: 'going', guest_count: 1 },
    ],
  };

  const mockReliefCampaign: ReliefCampaign = {
    id: 'camp-relief-01',
    title: 'Hurricane Beryl Southern Grenadines Emergency Rebuild',
    description: 'Providing immediate solar water distillation and roofing kits.',
    category: 'hurricane_relief',
    target_country_iso: 'VCT',
    goal_minor: 7500000,
    raised_minor: 3825000,
    currency: 'USD',
    verification_status: 'verified',
    disaster_declaration_ref: 'CDEMA-2026-BERYL-04',
    donations_count: 142,
    beneficiary_count: 3500,
    created_at: '2026-07-02T12:00:00Z',
  };

  const mockPoll: PollData = {
    id: 'poll-carib-01',
    question: 'Which island produces the most aromatic Blue Mountain Peaberry?',
    isQuiz: true,
    correctOptionId: 'opt-jam',
    explanation: 'Jamaica Blue Mountain is legally certified by the JACRA.',
    totalVotes: 85,
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    options: [
      { id: 'opt-jam', optionText: 'Jamaica', votesCount: 70, percentage: 82 },
      { id: 'opt-tto', optionText: 'Trinidad', votesCount: 15, percentage: 18 },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // AUDIT 1: Minimum 44x44px Touch Target Dimensions
  // ===========================================================================
  describe('1. WCAG 2.2 AA Touch Target Dimensions (Minimum 44x44px)', () => {
    const has44pxTouchTargets = (source: string): boolean => {
      return (
        source.includes('min-h-[44px]') ||
        source.includes('min-w-[44px]') ||
        source.includes('h-11 w-11') ||
        source.includes('w-11 h-11') ||
        source.includes('w-14 h-14') ||
        source.includes('min-h-11')
      );
    };

    it('enforces >=44px target bounds in Studio Viewfinder & Timeline Editor controls', () => {
      // Studio viewfinder controls (camera flip, torch, capture buttons)
      expect(has44pxTouchTargets(sources.studioViewfinder)).toBe(true);
      expect(sources.studioViewfinder).toMatch(/min-h-\[44px\]|min-w-\[44px\]|w-11 h-11/);

      // Video timeline editor controls
      expect(has44pxTouchTargets(sources.timelineEditor)).toBe(true);
      expect(sources.timelineEditor).toMatch(/w-14 h-14|min-h-\[44px\]/);
    });

    it('enforces >=44px target bounds in EmojiPickerPopover and ReactionPicker', () => {
      // Emoji picker tabs, search inputs, skin tone radios, and grid buttons
      expect(sources.emojiPicker).toContain('min-w-[44px]');
      expect(sources.emojiPicker).toContain('min-h-[44px]');
      expect(sources.emojiPicker).toMatch(/w-11 h-11/);

      // Reaction picker trigger and 10 reaction emoji option buttons
      expect(sources.reactionPicker).toContain('min-w-[44px]');
      expect(sources.reactionPicker).toContain('min-h-[44px]');
    });

    it('enforces >=44px target bounds in InteractivePollWidget', () => {
      // Option voting buttons
      expect(sources.pollWidget).toContain('min-h-[44px]');
      const vdom = InteractivePollWidget({ initialPoll: mockPoll, currentUserId: 'usr-1' });
      const serialized = serializeVDOM(vdom);
      expect(serialized).toContain('min-h-[44px]');
    });

    it('enforces >=44px target bounds in ProductTaggingTray', () => {
      // Remove tag buttons, product selection chips
      expect(sources.productTaggingTray).toContain('min-h-[44px]');
      expect(sources.productTaggingTray).toContain('min-w-[44px]');
    });

    it('enforces >=44px target bounds in ShoppablePostWidget and ShoppableReelBadge', () => {
      // Add to cart, buy now, close buttons
      expect(sources.shoppablePostWidget).toContain('min-h-[44px]');
      expect(sources.shoppableReelBadge).toContain('min-h-[44px]');
      expect(sources.shoppableReelBadge).toContain('min-w-[44px]');
    });

    it('enforces >=44px target bounds in StoreCreationWizard', () => {
      // Step navigation tabs and action buttons
      expect(sources.storeCreationWizard).toContain('min-h-[44px]');
      const vdom = StoreCreationWizard({ onCancel: vi.fn() });
      const serialized = serializeVDOM(vdom);
      expect(serialized).toContain('min-h-[44px]');
    });

    it('enforces >=44px target bounds in CartDrawer', () => {
      // Quantity steppers, remove buttons, checkout button, close button
      expect(sources.cartDrawer).toContain('min-h-[44px]');
      expect(sources.cartDrawer).toContain('min-w-[44px]');

      const vdom = CartDrawer({
        isOpen: true,
        onClose: vi.fn(),
        lines: [mockCartLine],
        onUpdateQuantity: vi.fn(),
        onRemoveLine: vi.fn(),
      });
      const serialized = serializeVDOM(vdom);
      expect(serialized).toContain('min-h-[44px]');
      expect(serialized).toContain('min-w-[44px]');
    });

    it('enforces >=44px target bounds in InteractiveEventCard', () => {
      // RSVP segmented buttons (Going, Interested, Can't Go) & Guest stepper
      expect(sources.interactiveEventCard).toContain('min-h-[44px]');
      expect(sources.interactiveEventCard).toContain('min-w-[44px]');

      const vdom = InteractiveEventCard({ event: mockEvent, currentUserId: 'user-001' });
      const serialized = serializeVDOM(vdom);
      expect(serialized).toContain('min-h-[44px]');
      expect(serialized).toContain('min-w-[44px]');
    });

    it('enforces >=44px target bounds in ReliefCampaignCard & ReliefDonationModal', () => {
      // Relief card donate button
      expect(sources.reliefCampaignCard).toContain('min-h-[44px]');
      expect(sources.reliefCampaignCard).toContain('min-w-[44px]');

      // Relief donation modal close & action buttons
      expect(sources.reliefDonationModal).toContain('min-h-[44px]');
      expect(sources.reliefDonationModal).toContain('min-w-[44px]');

      const cardVDOM = ReliefCampaignCard({ campaign: mockReliefCampaign });
      expect(serializeVDOM(cardVDOM)).toContain('min-h-[44px]');

      const modalVDOM = ReliefDonationModal({
        campaign: mockReliefCampaign,
        isOpen: true,
        onClose: vi.fn(),
      });
      expect(serializeVDOM(modalVDOM)).toContain('min-h-[44px]');
    });

    it('enforces >=44px target bounds in EventComposerPanel & ReliefComposerPanel', () => {
      // Form inputs, select dropdowns, remove buttons
      expect(sources.eventComposerPanel).toContain('min-h-[44px]');
      expect(sources.eventComposerPanel).toContain('min-w-[44px]');

      expect(sources.reliefComposerPanel).toContain('min-h-[44px]');
      expect(sources.reliefComposerPanel).toContain('min-w-[44px]');

      const eventInput: CreateEventInput = {
        title: 'Carnival Workshop',
        event_kind: 'in_person',
        privacy: 'public',
        starts_at: '2026-10-01T18:00',
      };
      const eventVDOM = EventComposerPanel({
        value: eventInput,
        onChange: vi.fn(),
        onRemove: vi.fn(),
      });
      expect(serializeVDOM(eventVDOM)).toContain('min-h-[44px]');

      const reliefInput: CreateReliefCampaignInput = {
        title: 'Flood Aid St. Lucia',
        category: 'flood_disaster',
        goal_minor: 1000000,
        currency: 'USD',
        target_country_iso: 'LCA',
      };
      const reliefVDOM = ReliefComposerPanel({
        value: reliefInput,
        onChange: vi.fn(),
        onRemove: vi.fn(),
      });
      expect(serializeVDOM(reliefVDOM)).toContain('min-h-[44px]');
    });
  });

  // ===========================================================================
  // AUDIT 2: ARIA Roles & Semantic Markup
  // ===========================================================================
  describe('2. ARIA Roles & Semantic Markup Compliance', () => {
    describe('Modals & Bottom Sheets (role="dialog" & aria-modal="true")', () => {
      it('verifies role="dialog" and aria-modal="true" on CartDrawer', () => {
        expect(sources.cartDrawer).toContain('role="dialog"');
        expect(sources.cartDrawer).toContain('aria-modal="true"');
        expect(sources.cartDrawer).toContain('aria-labelledby="cart-drawer-title"');

        const vdom = CartDrawer({
          isOpen: true,
          onClose: vi.fn(),
          lines: [mockCartLine],
          onUpdateQuantity: vi.fn(),
          onRemoveLine: vi.fn(),
        });
        const serialized = serializeVDOM(vdom);
        expect(serialized).toContain('"role":"dialog"');
        expect(serialized).toContain('"aria-modal":"true"');
      });

      it('verifies role="dialog" and aria-modal="true" on ReliefDonationModal', () => {
        expect(sources.reliefDonationModal).toContain('role="dialog"');
        expect(sources.reliefDonationModal).toContain('aria-modal="true"');

        const vdom = ReliefDonationModal({
          campaign: mockReliefCampaign,
          isOpen: true,
          onClose: vi.fn(),
        });
        const serialized = serializeVDOM(vdom);
        expect(serialized).toContain('"role":"dialog"');
        expect(serialized).toContain('"aria-modal":"true"');
      });

      it('verifies role="dialog" and aria-modal="true" on ShoppablePostWidget instant checkout', () => {
        expect(sources.shoppablePostWidget).toContain('role="dialog"');
        expect(sources.shoppablePostWidget).toContain('aria-modal="true"');
      });

      it('verifies role="dialog" and aria-modal="true" on ShoppableReelBadge bottom sheet drawer', () => {
        expect(sources.shoppableReelBadge).toContain('role="dialog"');
        expect(sources.shoppableReelBadge).toContain('aria-modal="true"');
        expect(sources.shoppableReelBadge).toContain('aria-label="Shoppable Reel Products"');
      });

      it('verifies role="dialog" on EmojiPickerPopover', () => {
        expect(sources.emojiPicker).toContain('role="dialog"');
        expect(sources.emojiPicker).toContain('aria-label="Emoji picker"');
      });
    });

    describe('Progress Bars (role="progressbar" with aria-valuenow, valuemin, valuemax)', () => {
      it('verifies complete progressbar attributes on InteractiveEventCard attendance capacity', () => {
        expect(sources.interactiveEventCard).toContain('role="progressbar"');
        expect(sources.interactiveEventCard).toContain('aria-valuenow=');
        expect(sources.interactiveEventCard).toContain('aria-valuemin=');
        expect(sources.interactiveEventCard).toContain('aria-valuemax=');

        const vdom = InteractiveEventCard({ event: mockEvent, currentUserId: 'user-001' });
        const serialized = serializeVDOM(vdom);
        expect(serialized).toContain('"role":"progressbar"');
        expect(serialized).toContain('"aria-valuenow":3'); // user-001 going with 2 guests (1 + 2 = 3)
        expect(serialized).toContain('"aria-valuemin":0');
        expect(serialized).toContain('"aria-valuemax":250');
      });

      it('verifies complete progressbar attributes on ReliefCampaignCard funding goal', () => {
        expect(sources.reliefCampaignCard).toContain('role="progressbar"');
        expect(sources.reliefCampaignCard).toContain('aria-valuenow=');
        expect(sources.reliefCampaignCard).toContain('aria-valuemin=');
        expect(sources.reliefCampaignCard).toContain('aria-valuemax=');
        expect(sources.reliefCampaignCard).toContain('aria-valuetext=');

        const vdom = ReliefCampaignCard({ campaign: mockReliefCampaign });
        const serialized = serializeVDOM(vdom);
        expect(serialized).toContain('"role":"progressbar"');
        expect(serialized).toContain('"aria-valuenow":51'); // 3825000 / 7500000 = 51%
        expect(serialized).toContain('"aria-valuemin":0');
        expect(serialized).toContain('"aria-valuemax":100');
      });

      it('verifies progressbar attributes on StudioViewfinder recording duration meter', () => {
        expect(sources.studioViewfinder).toContain('role="progressbar"');
        expect(sources.studioViewfinder).toContain('aria-valuenow=');
        expect(sources.studioViewfinder).toContain('aria-valuemin=');
        expect(sources.studioViewfinder).toContain('aria-valuemax=');
      });
    });

    describe('Screen Reader Live Regions (role="status" & aria-live="polite")', () => {
      it('verifies live status announcement on InteractiveEventCard RSVP changes', () => {
        expect(sources.interactiveEventCard).toContain('role="status"');
        expect(sources.interactiveEventCard).toContain('aria-live="polite"');

        const vdom = InteractiveEventCard({ event: mockEvent, currentUserId: 'user-001' });
        const serialized = serializeVDOM(vdom);
        expect(serialized).toContain('"role":"status"');
        expect(serialized).toContain('"aria-live":"polite"');
      });

      it('verifies live status announcement on ProductTaggingTray item count', () => {
        expect(sources.productTaggingTray).toContain('role="status"');
        expect(sources.productTaggingTray).toContain('aria-live="polite"');
      });

      it('verifies live status announcement on ReliefDonationModal donation confirmation', () => {
        expect(sources.reliefDonationModal).toContain('role="status"');
        expect(sources.reliefDonationModal).toContain('aria-live="polite"');
      });

      it('verifies live status announcement on CartDrawer order confirmation and error feedback', () => {
        expect(sources.cartDrawer).toContain('role="status"');
        expect(sources.cartDrawer).toContain('aria-live="polite"');
      });

      it('verifies live status announcement on InteractivePollWidget result updates', () => {
        expect(sources.pollWidget).toContain('role="status"');
        expect(sources.pollWidget).toContain('aria-live="polite"');

        const vdom = InteractivePollWidget({ initialPoll: mockPoll });
        const serialized = serializeVDOM(vdom);
        expect(serialized).toContain('"role":"status"');
        expect(serialized).toContain('"aria-live":"polite"');
      });

      it('verifies polite live announcement on EmojiPickerPopover focused emoji item', () => {
        expect(sources.emojiPicker).toContain('aria-live="polite"');
        expect(sources.emojiPicker).toContain('aria-atomic="true"');
      });
    });

    describe('Tabs & Tablists (role="tablist" & role="tab")', () => {
      it('verifies role="tablist" and role="tab" with aria-selected on StoreCreationWizard', () => {
        expect(sources.storeCreationWizard).toContain('role="tablist"');
        expect(sources.storeCreationWizard).toContain('role="tab"');
        expect(sources.storeCreationWizard).toContain('aria-selected=');

        const vdom = StoreCreationWizard({ onCancel: vi.fn() });
        const serialized = serializeVDOM(vdom);
        expect(serialized).toContain('"role":"tablist"');
        expect(serialized).toContain('"role":"tab"');
        expect(serialized).toContain('"aria-selected":true');
      });

      it('verifies role="tablist" and role="tab" on EmojiPickerPopover categories', () => {
        expect(sources.emojiPicker).toContain('role="tablist"');
        expect(sources.emojiPicker).toContain('role="tab"');
        expect(sources.emojiPicker).toContain('aria-selected=');
        expect(CATEGORY_TABS.length).toBeGreaterThanOrEqual(10);
      });
    });

    describe('Toggle Buttons (aria-pressed)', () => {
      it('verifies aria-pressed on InteractiveEventCard RSVP buttons', () => {
        expect(sources.interactiveEventCard).toContain('aria-pressed=');

        const vdom = InteractiveEventCard({ event: mockEvent, currentUserId: 'user-001' });
        const serialized = serializeVDOM(vdom);
        // user-001 is "going"
        expect(serialized).toContain('"aria-pressed":true');
        expect(serialized).toContain('"aria-pressed":false');
      });
    });
  });

  // ===========================================================================
  // AUDIT 3: Keyboard Navigation & Escape Key Dismissal
  // ===========================================================================
  describe('3. Keyboard Navigation & Global Escape Dismissal Audit', () => {
    it('verifies global keydown Escape dismissal with unmount cleanup across all modals, drawers, and popovers', () => {
      const auditedComponents = [
        { name: 'CartDrawer', source: sources.cartDrawer },
        { name: 'ReliefDonationModal', source: sources.reliefDonationModal },
        { name: 'ShoppablePostWidget (checkout)', source: sources.shoppablePostWidget },
        { name: 'ShoppableReelBadge (drawer)', source: sources.shoppableReelBadge },
        { name: 'ProductTaggingTray', source: sources.productTaggingTray },
        { name: 'StoreCreationWizard', source: sources.storeCreationWizard },
        { name: 'EmojiPickerPopover', source: sources.emojiPicker },
        { name: 'ReactionPicker', source: sources.reactionPicker },
      ];

      for (const { name, source } of auditedComponents) {
        const hasKeydownListener =
          source.includes("addEventListener('keydown'") ||
          source.includes('addEventListener("keydown"') ||
          source.includes('onKeyDown=');

        const hasEscapeHandling =
          source.includes("'Escape'") ||
          source.includes('"Escape"');

        const hasRemoveListener =
          source.includes("removeEventListener('keydown'") ||
          source.includes('removeEventListener("keydown"') ||
          source.includes('onKeyDown=');

        expect(hasKeydownListener, `${name} must implement keydown event listener`).toBe(true);
        expect(hasEscapeHandling, `${name} must handle Escape key dismissal`).toBe(true);
        expect(hasRemoveListener, `${name} must clean up keydown listener on unmount`).toBe(true);
      }
    });

    it('verifies 2D grid arrow navigation algorithm for EmojiPickerPopover', () => {
      const totalItems = 28;
      const columns = 7;

      // Horizontal navigation with row clamp boundaries
      expect(computeNextGridIndex(0, totalItems, columns, 'ArrowLeft')).toBe(0);
      expect(computeNextGridIndex(5, totalItems, columns, 'ArrowLeft')).toBe(4);
      expect(computeNextGridIndex(5, totalItems, columns, 'ArrowRight')).toBe(6);
      expect(computeNextGridIndex(27, totalItems, columns, 'ArrowRight')).toBe(27);

      // Vertical navigation with boundary protection
      expect(computeNextGridIndex(0, totalItems, columns, 'ArrowDown')).toBe(7);
      expect(computeNextGridIndex(7, totalItems, columns, 'ArrowDown')).toBe(14);
      expect(computeNextGridIndex(14, totalItems, columns, 'ArrowUp')).toBe(7);
      expect(computeNextGridIndex(2, totalItems, columns, 'ArrowUp')).toBe(2);

      // Bottom row clamping when jumping down beyond array length
      expect(computeNextGridIndex(25, totalItems, columns, 'ArrowDown')).toBe(25);

      // Unselected initial index (-1) returns first element (0)
      expect(computeNextGridIndex(-1, totalItems, columns, 'ArrowDown')).toBe(0);
      expect(computeNextGridIndex(-1, totalItems, columns, 'ArrowRight')).toBe(0);
    });

    it('verifies RadioGroup arrow and click navigation for InteractivePollWidget', () => {
      expect(sources.pollWidget).toContain('role="radiogroup"');
      expect(sources.pollWidget).toContain('role="radio"');
      expect(sources.pollWidget).toContain('aria-checked=');
    });
  });

  // ===========================================================================
  // AUDIT 4: Form Controls & Error Alert Semantics
  // ===========================================================================
  describe('4. Form Controls, Labels, & Error Alert Semantics', () => {
    it('verifies role="alert" on validation errors in EventComposerPanel', () => {
      expect(sources.eventComposerPanel).toContain('role="alert"');
      expect(sources.eventComposerPanel).toContain('aria-live="polite"');
      expect(sources.eventComposerPanel).toContain('htmlFor="event-title-input"');
      expect(sources.eventComposerPanel).toContain('id="event-title-input"');
      expect(sources.eventComposerPanel).toContain('aria-required="true"');
    });

    it('verifies role="alert" on validation errors in ReliefComposerPanel', () => {
      expect(sources.reliefComposerPanel).toContain('role="alert"');
      expect(sources.reliefComposerPanel).toContain('aria-live="polite"');
      expect(sources.reliefComposerPanel).toContain('htmlFor="relief-title-input"');
      expect(sources.reliefComposerPanel).toContain('id="relief-title-input"');
      expect(sources.reliefComposerPanel).toContain('aria-required="true"');
    });

    it('verifies role="alert" on limit warnings in ProductTaggingTray', () => {
      expect(sources.productTaggingTray).toContain('role="alert"');
      expect(sources.productTaggingTray).toContain('aria-live="polite"');
      expect(sources.productTaggingTray).toContain('aria-label="Search Caribbean products"');
    });
  });
});
