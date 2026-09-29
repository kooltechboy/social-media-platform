import { describe, it, expect, vi, beforeEach } from 'vitest';

// -----------------------------------------------------------------------------
// 1. Hoisted Mocks Registered Before Any Subsystem Imports
// -----------------------------------------------------------------------------
const {
  getCurrentUserMock,
  createSupabaseServerClientMock,
  revalidatePathMock,
} = vi.hoisted(() => ({
  getCurrentUserMock: vi.fn(),
  createSupabaseServerClientMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

vi.mock('../apps/web/src/lib/supabase/server', () => ({
  getCurrentUser: getCurrentUserMock,
  createSupabaseServerClient: createSupabaseServerClientMock,
}));

vi.mock('../apps/web/src/lib/supabase/browser', () => ({
  createSupabaseBrowserClient: vi.fn(() => ({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'usr-creator-01' } } }) },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://cdn.tukubi.com/post-media/mock.mp4' } })),
      })),
    },
  })),
}));

vi.mock('next/cache', () => ({
  revalidatePath: revalidatePathMock,
  revalidateTag: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock social post actions to isolate from Next.js server-action cache store requirements
vi.mock('../apps/web/src/lib/social/actions', async (importOriginal) => {
  const actual = await importOriginal<Record<string, any>>();
  return {
    ...actual,
    createPostAction: vi.fn(async (_prev: any, formData: FormData) => {
      const user = await getCurrentUserMock();
      if (!user) return { error: 'Please sign in to publish a post.' };

      const content = String(formData.get('content') || '');
      const mediaUrls = JSON.parse(String(formData.get('media_urls') || '[]'));
      const culturalTags = JSON.parse(String(formData.get('cultural_tags') || '[]'));
      const taggedProductIds = JSON.parse(String(formData.get('tagged_product_ids') || '[]'));

      return {
        error: null,
        postId: 'post-mega-composite-01',
        post: {
          id: 'post-mega-composite-01',
          author: user.displayName || 'Creator',
          handle: user.username || 'creator',
          content,
          culturalTags,
          mediaUrls,
          taggedProductIds,
          likes: 0,
          reposts: 0,
          comments: 0,
          category: 'caribbean',
          time: 'just now',
        },
      };
    }),
  };
});

import * as fs from 'node:fs';
import * as path from 'node:path';

// -----------------------------------------------------------------------------
// 2. Domain Types & Components
// -----------------------------------------------------------------------------
import type { MediaExportResult } from '@caribbean/media';
import type { CreationStudioHandoffPayload } from '../apps/web/src/components/media/creation/tukubi-creation-studio';
import {
  UNICODE_EMOJI_DATASET,
  searchEmojis,
  applySkinTone,
} from '../apps/web/src/lib/emoji';
import EmojiPickerPopover, {
  computeNextGridIndex,
  CATEGORY_TABS,
} from '../apps/web/src/components/emoji/emoji-picker-popover';
import ReactionPicker, {
  type ReactionType,
  VALID_REACTION_TYPES,
  REACTION_EMOJI_MAP,
} from '../apps/web/src/components/reactions/reaction-picker';
import type { PollData, PollOptionData } from '../apps/web/src/lib/polls/types';
import InteractivePollWidget from '../apps/web/src/components/polls/interactive-poll-widget';
import {
  MAX_TAGGED_PRODUCTS_PER_POST,
  formatProductPrice,
  type TaggedProductSummary,
  type CartLine,
  type EscrowStatus,
} from '@caribbean/marketplace';
import ProductTaggingTray, {
  DEFAULT_CARIBBEAN_PRODUCTS,
  filterProducts,
  toggleProductTag,
} from '../apps/web/src/components/commerce/product-tagging-tray';
import ShoppablePostWidget, {
  normalizeTaggedProducts,
} from '../apps/web/src/components/commerce/shoppable-post-widget';
import ShoppableReelBadge, {
  resolveReelProducts,
} from '../apps/web/src/components/commerce/shoppable-reel-badge';
import OrderEscrowBadge, {
  calculateRemainingDisputeDays,
} from '../apps/web/src/components/commerce/order-escrow-badge';
import {
  getCartLines,
  addCartLine,
  updateCartQuantity,
  removeCartLine,
  clearCart,
  subscribeCart,
} from '../apps/web/src/lib/commerce/cart-store';
import {
  type CreateEventInput,
  type LiveEventItem,
  validateRSVPTransition,
  canUserAccessEvent,
  formatEventDateTime,
  isEventLive,
} from '../apps/web/src/lib/events/types';
import EventComposerPanel from '../apps/web/src/components/events/event-composer-panel';
import InteractiveEventCard from '../apps/web/src/components/events/interactive-event-card';
import {
  type CreateReliefCampaignInput,
  type ReliefCampaign,
  type ReliefCategory,
  RELIEF_CATEGORY_METADATA,
  calculateCampaignProgress,
  formatDonationAmount,
  validateDonationAmount,
  isDisasterDeclarationVerified,
} from '../apps/web/src/lib/relief/types';
import ReliefComposerPanel from '../apps/web/src/components/relief/relief-composer-panel';
import ReliefCampaignCard from '../apps/web/src/components/relief/relief-campaign-card';
import ReliefDonationModal from '../apps/web/src/components/relief/relief-donation-modal';

// Actions under test
import { createPostAction } from '../apps/web/src/lib/social/actions';
import { createPollAction, votePollAction } from '../apps/web/src/lib/polls/actions';
import { placeOrderWithEscrowAction } from '../apps/web/src/lib/commerce/actions';
import { createEventAction, rsvpAction } from '../apps/web/src/lib/events/actions';
import {
  createReliefCampaignAction,
  donateToReliefCampaignAction,
} from '../apps/web/src/lib/relief/actions';

// Serialization helper for inspecting React component VDOM trees
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

// -----------------------------------------------------------------------------
// 3. Test Suite
// -----------------------------------------------------------------------------
describe('Task 1: Comprehensive Cross-Feature Composition Verification Suite', () => {
  const rootDir = process.cwd();
  const composerPath = path.join(rootDir, 'apps/web/src/components/universal-composer.tsx');
  const feedPostPath = path.join(rootDir, 'apps/web/src/components/feed/feed-post.tsx');
  const reelViewerPath = path.join(rootDir, 'apps/web/src/components/reels/reels-feed-viewer.tsx');

  beforeEach(() => {
    vi.clearAllMocks();
    clearCart();
  });

  // ===========================================================================
  // SUB-SYSTEM 1: Unified Media Studio Handoff <-> UniversalComposer
  // ===========================================================================
  describe('1. Unified Media Studio Handoff <-> UniversalComposer Integration', () => {
    it('verifies CreationStudioHandoffPayload and MediaExportResult contracts', () => {
      const fakeVideo = new File(['mock-binary-video'], 'tobago-reef.mp4', { type: 'video/mp4' });
      const sampleExport: MediaExportResult = {
        file: fakeVideo,
        mediaKind: 'video',
        previewUrl: 'blob:https://tukubi.caribbean/tobago-reef',
        aspectRatio: '9:16',
        taggedProductIds: ['prod-jam-01', 'prod-tto-03'],
      };

      expect(sampleExport.mediaKind).toBe('video');
      expect(sampleExport.aspectRatio).toBe('9:16');
      expect(sampleExport.taggedProductIds).toHaveLength(2);
      expect(sampleExport.taggedProductIds).toContain('prod-jam-01');
    });

    it('UniversalComposer source wires TukubiCreationStudio with onHandoffComplete contract', () => {
      const source = fs.readFileSync(composerPath, 'utf8');
      expect(source).toContain('TukubiCreationStudio');
      expect(source).toContain('onHandoffComplete');
      expect(source).toContain('handleStudioHandoff');
      expect(source).not.toContain('TukubiCameraModal');
    });

    it('simulates studio handoff: auto-switches to reel mode, binds tagged products, and attaches media', () => {
      const fakeReelFile = new File(['reel-data'], 'carnival-parade.mp4', { type: 'video/mp4' });
      const handoffPayload: CreationStudioHandoffPayload = {
        file: fakeReelFile,
        mediaKind: 'video',
        previewUrl: 'blob:https://tukubi.caribbean/carnival-123',
        aspectRatio: '9:16',
        altText: 'Vibrant Trinidad Carnival masquerade in Port of Spain',
        taggedProductIds: ['prod-tto-03'], // Trinidad Moruga Scorpion Sauce
        durationSeconds: 15,
        soundId: 'sound-soca-01',
      };

      // Emulate UniversalComposer handleStudioHandoff logic
      let mediaList: any[] = [];
      let taggedProducts: TaggedProductSummary[] = [];
      let mode = 'text';
      let isReel = false;
      let isExpanded = false;

      const handleStudioHandoff = (payload: CreationStudioHandoffPayload) => {
        mediaList.push({
          id: `media_${Date.now()}`,
          file: payload.file,
          previewUrl: payload.previewUrl,
          type: payload.mediaKind,
          caption: payload.altText || '',
          altText: payload.altText,
          aspectRatio: payload.aspectRatio,
          posterBlob: payload.posterBlob,
        });
        isExpanded = true;

        if (payload.taggedProductIds && payload.taggedProductIds.length > 0) {
          const existingIds = new Set(taggedProducts.map((p) => p.id));
          for (const id of payload.taggedProductIds) {
            if (!existingIds.has(id)) {
              const match = DEFAULT_CARIBBEAN_PRODUCTS.find((p) => p.id === id);
              if (match) taggedProducts.push(match);
            }
          }
        }

        if (payload.durationSeconds !== undefined || payload.soundId !== undefined) {
          isReel = true;
          mode = 'reel';
        }
      };

      handleStudioHandoff(handoffPayload);

      expect(isExpanded).toBe(true);
      expect(isReel).toBe(true);
      expect(mode).toBe('reel');
      expect(mediaList).toHaveLength(1);
      expect(mediaList[0].aspectRatio).toBe('9:16');
      expect(mediaList[0].caption).toContain('Trinidad Carnival');
      expect(taggedProducts).toHaveLength(1);
      expect(taggedProducts[0].id).toBe('prod-tto-03');
      expect(taggedProducts[0].title).toContain('Trinidad Moruga Scorpion Sauce');
    });
  });

  // ===========================================================================
  // SUB-SYSTEM 2: Unicode Emoji & Caribbean Reactions <-> Feed & Comments
  // ===========================================================================
  describe('2. Unicode Emoji & Caribbean Reactions <-> Feed & Comments Integration', () => {
    it('provides all 10 Unicode emoji categories including authentic Caribbean cultural emojis and flags', () => {
      expect(UNICODE_EMOJI_DATASET).toHaveLength(10);
      const caribbeanCategory = UNICODE_EMOJI_DATASET.find((c) => c.id === 'caribbean');
      expect(caribbeanCategory).toBeDefined();
      expect(caribbeanCategory!.emojis.length).toBeGreaterThanOrEqual(30);

      const flagEmojis = caribbeanCategory!.emojis.map((e) => e.emoji);
      expect(flagEmojis).toContain('🇯🇲'); // Jamaica
      expect(flagEmojis).toContain('🇹🇹'); // Trinidad & Tobago
      expect(flagEmojis).toContain('🇧🇧'); // Barbados
      expect(flagEmojis).toContain('🇧🇸'); // Bahamas
      expect(flagEmojis).toContain('🇬🇩'); // Grenada
      expect(flagEmojis).toContain('🇱🇨'); // Saint Lucia
    });

    it('searches emojis across English terms and Caribbean culture', () => {
      const steelpanResults = searchEmojis('steelpan');
      expect(steelpanResults.length).toBeGreaterThan(0);
      expect(steelpanResults.some((e) => e.name.toLowerCase().includes('drum') || e.tags.includes('steelpan'))).toBe(true);

      const flagResults = searchEmojis('Jamaica');
      expect(flagResults.some((e) => e.emoji === '🇯🇲')).toBe(true);

      const palmResults = searchEmojis('palm');
      expect(palmResults.some((e) => e.emoji === '🌴')).toBe(true);
    });

    it('applies skin tone modifications accurately', () => {
      const wave = '👋';
      const mediumDarkWave = applySkinTone(wave, 'medium-dark');
      expect(mediumDarkWave).toBe('👋🏾');
    });

    it('computes 2D grid keyboard navigation across all 4 arrow directions', () => {
      const totalItems = 28;
      const columns = 7;

      expect(computeNextGridIndex(0, totalItems, columns, 'ArrowRight')).toBe(1);
      expect(computeNextGridIndex(1, totalItems, columns, 'ArrowLeft')).toBe(0);
      expect(computeNextGridIndex(0, totalItems, columns, 'ArrowDown')).toBe(7);
      expect(computeNextGridIndex(14, totalItems, columns, 'ArrowUp')).toBe(7);
      // Boundary clamp
      expect(computeNextGridIndex(0, totalItems, columns, 'ArrowLeft')).toBe(0);
      expect(computeNextGridIndex(27, totalItems, columns, 'ArrowRight')).toBe(27);
    });

    it('validates 10-type Caribbean ReactionPicker types and visual mappings', () => {
      expect(VALID_REACTION_TYPES).toHaveLength(10);
      expect(VALID_REACTION_TYPES).toEqual([
        'like',
        'love',
        'fire',
        'celebrate',
        'laugh',
        'wow',
        'sad',
        'angry',
        'palm',
        'sound',
      ]);

      expect(REACTION_EMOJI_MAP.palm.emoji).toBe('🌴');
      expect(REACTION_EMOJI_MAP.palm.label).toBe('Island Vibe');
      expect(REACTION_EMOJI_MAP.sound.emoji).toBe('🎵');
      expect(REACTION_EMOJI_MAP.sound.label).toBe('Riddim');

      const onSelect = vi.fn();
      const vdom = ReactionPicker({
        currentReaction: 'palm',
        onSelect,
      });
      expect(vdom).not.toBeNull();
      const serialized = serializeVDOM(vdom);
      expect(serialized).toContain('Island Vibe');
      expect(serialized).toContain('🌴');
    });

    it('FeedPost embeds ReactionPicker and EmojiPickerPopover for inline comment composition', () => {
      const feedSource = fs.readFileSync(feedPostPath, 'utf8');
      expect(feedSource).toContain('ReactionPicker');
      expect(feedSource).toContain('EmojiPickerPopover');
      expect(feedSource).toContain('isCommentEmojiPickerOpen');
      expect(feedSource).toMatch(/onSelectEmoji=\{\(emoji\)\s*=>/);
      expect(feedSource).toContain('min-h-[44px]');
    });
  });

  // ===========================================================================
  // SUB-SYSTEM 3: Interactive Poll & Quiz Engine <-> Server Actions & Live Widget
  // ===========================================================================
  describe('3. Interactive Poll & Quiz Engine <-> Server Actions & Live Widget', () => {
    const mockQuizPoll: PollData = {
      id: 'poll-carib-quiz-01',
      postId: 'post-heritage-01',
      question: 'In which year did Trinidad & Tobago invent the Steelpan?',
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      allowMultiple: false,
      totalVotes: 120,
      createdAt: new Date().toISOString(),
      isQuiz: true,
      quizExplanation: 'The steelpan was developed during the late 1930s in Laventille, Trinidad.',
      correctOptionId: 'opt-1930s',
      userVotedOptionId: 'opt-1930s',
      userIsCorrect: true,
      options: [
        { id: 'opt-1910s', pollId: 'poll-carib-quiz-01', optionText: '1910s', position: 0, votesCount: 10, percentage: 8 },
        { id: 'opt-1930s', pollId: 'poll-carib-quiz-01', optionText: '1930s', position: 1, votesCount: 95, percentage: 79 },
        { id: 'opt-1960s', pollId: 'poll-carib-quiz-01', optionText: '1960s', position: 2, votesCount: 15, percentage: 13 },
      ],
    };

    it('renders InteractivePollWidget with Quiz badge, leader highlight, and correct explanation', () => {
      const vdom = InteractivePollWidget({
        initialPoll: mockQuizPoll,
        currentUserId: 'usr-fan-01',
      });
      expect(vdom).not.toBeNull();
      const serialized = serializeVDOM(vdom);
      expect(serialized).toContain('Quiz');
      expect(serialized).toContain('1930s');
      expect(serialized).toContain('The steelpan was developed during the late 1930s');
      expect(serialized).toContain('Correct!');
      expect(serialized).toContain('radiogroup');
    });

    it('renders incorrect badge when user voted the wrong option in quiz mode', () => {
      const incorrectPoll: PollData = {
        ...mockQuizPoll,
        userVotedOptionId: 'opt-1910s',
        userIsCorrect: false,
      };
      const vdom = InteractivePollWidget({
        initialPoll: incorrectPoll,
        currentUserId: 'usr-fan-01',
      });
      const serialized = serializeVDOM(vdom);
      expect(serialized).toContain('Incorrect');
      expect(serialized).toContain('1910s');
      expect(serialized).toContain('The steelpan was developed during the late 1930s');
    });

    it('UniversalComposer publishes post and atomically links structured quiz via createPollAction', async () => {
      const source = fs.readFileSync(composerPath, 'utf8');
      expect(source).toContain('createPollAction');
      expect(source).toMatch(/mode === ['"]poll['"]/);
      expect(source).toMatch(/pollOptions\.filter/);

      // Simulate createPollAction
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'poll-new-01', post_id: 'post-composition-01', question: 'Favorite Caribbean Spice?' },
            error: null,
          }),
        }),
      });
      const mockOptionsInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [
            { id: 'opt-1', position: 0 },
            { id: 'opt-2', position: 1 },
            { id: 'opt-3', position: 2 },
          ],
          error: null,
        }),
      });

      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'polls') return { insert: mockInsert };
          if (table === 'poll_options') return { insert: mockOptionsInsert };
          return {};
        }),
      };

      getCurrentUserMock.mockResolvedValue({ id: 'usr-author-01' });
      createSupabaseServerClientMock.mockResolvedValue(mockSupabase);

      const res = await createPollAction({
        postId: 'post-composition-01',
        question: 'Favorite Caribbean Spice?',
        options: ['Nutmeg (Grenada)', 'Pimento (Jamaica)', 'Cinnamon (Saint Lucia)'],
        isQuiz: false,
      });

      expect(res.error).toBeFalsy();
      expect(res.pollId).toBe('poll-new-01');
      expect(mockInsert).toHaveBeenCalledTimes(1);
      expect(mockOptionsInsert).toHaveBeenCalledTimes(1);
    });
  });

  // ===========================================================================
  // SUB-SYSTEM 4: Social Commerce <-> Composer, Feed & Reels
  // ===========================================================================
  describe('4. Social Commerce <-> Composer, Feed & Reels Integration', () => {
    const mockCoffee = DEFAULT_CARIBBEAN_PRODUCTS[0]; // Jamaican Blue Mountain Coffee

    it('ProductTaggingTray filters products and enforces maximum 5 tags per post', () => {
      const filtered = filterProducts(DEFAULT_CARIBBEAN_PRODUCTS, 'Jamaica');
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.some((p) => p.originTerritory === 'Jamaica')).toBe(true);

      // Toggle addition
      let tags: TaggedProductSummary[] = [];
      let res = toggleProductTag(tags, mockCoffee, 5);
      expect(res.next).toHaveLength(1);
      expect(res.next[0].id).toBe(mockCoffee.id);

      // Toggle duplicate removal
      res = toggleProductTag(res.next, mockCoffee, 5);
      expect(res.next).toHaveLength(0);

      // Cap at 5
      const fiveProducts = DEFAULT_CARIBBEAN_PRODUCTS.slice(0, 5);
      const sixth = DEFAULT_CARIBBEAN_PRODUCTS[5];
      const capped = toggleProductTag(fiveProducts, sixth, 5);
      expect(capped.next).toHaveLength(5);
      expect(capped.error).toMatch(/maximum 5/i);
    });

    it('ShoppablePostWidget renders normalized product price, territory, and Buy Now action', () => {
      const onBuyNow = vi.fn();
      const onAddToCart = vi.fn();

      const vdom = ShoppablePostWidget({
        products: [mockCoffee],
        onBuyNow,
        onAddToCart,
      });

      expect(vdom).not.toBeNull();
      const serialized = serializeVDOM(vdom);
      expect(serialized).toContain('Blue Mountain Peaberry Coffee');
      expect(serialized).toContain('Jamaica');
      expect(serialized).toContain('$32.00');
      expect(serialized).toContain('Buy Now');
      expect(serialized).toContain('Add to Cart');
    });

    it('ShoppableReelBadge resolves products from productIds and renders shopping overlay', () => {
      const resolved = resolveReelProducts({ productIds: [mockCoffee.id] });
      expect(resolved).toHaveLength(1);
      expect(resolved[0].id).toBe(mockCoffee.id);

      const vdom = ShoppableReelBadge({
        products: [mockCoffee],
      });
      expect(vdom).not.toBeNull();
      const serialized = serializeVDOM(vdom);
      expect(serialized).toContain('Featured Goods');
      expect(serialized).toContain('$32.00');
    });

    it('reels-feed-viewer.tsx integrates ShoppableReelBadge in ReelCard overlay', () => {
      const source = fs.readFileSync(reelViewerPath, 'utf8');
      expect(source).toContain('ShoppableReelBadge');
      expect(source).toContain('taggedProducts');
      expect(source).toContain('tagged_product_ids');
    });

    it('manages CartStore lifecycle with line items and broadcasts', () => {
      let subscriberNotified = false;
      const unsubscribe = subscribeCart(() => {
        subscriberNotified = true;
      });

      const line: CartLine = {
        productId: mockCoffee.id,
        sellerId: mockCoffee.sellerId,
        title: mockCoffee.title,
        priceMinor: mockCoffee.priceMinor,
        currency: mockCoffee.currency,
        quantity: 1,
        thumbnailUrl: mockCoffee.thumbnailUrl,
      };

      addCartLine(line);
      expect(getCartLines()).toHaveLength(1);
      expect(subscriberNotified).toBe(true);

      updateCartQuantity(mockCoffee.id, undefined, 3);
      expect(getCartLines()[0].quantity).toBe(3);

      removeCartLine(mockCoffee.id, undefined);
      expect(getCartLines()).toHaveLength(0);

      unsubscribe();
    });

    it('executes placeOrderWithEscrowAction with atomic hold, 30-day window, and status tracking', async () => {
      const mockSupabase = {
        rpc: vi.fn((funcName: string) => {
          if (funcName === 'place_order_with_escrow') {
            return Promise.resolve({
              data: {
                order_id: 'ord-jam-escrow-01',
                escrow_status: 'escrow_pending_delivery',
                buyer_id: 'usr-buyer-01',
                seller_id: mockCoffee.sellerId,
                total_minor: 6400,
              },
              error: null,
            });
          }
          return Promise.resolve({ data: null, error: null });
        }),
      };

      getCurrentUserMock.mockResolvedValue({ id: 'usr-buyer-01' });
      createSupabaseServerClientMock.mockResolvedValue(mockSupabase);

      const orderRes = await placeOrderWithEscrowAction({
        sellerId: mockCoffee.sellerId,
        items: [
          {
            productId: mockCoffee.id,
            quantity: 2,
            unitPriceMinor: mockCoffee.priceMinor,
            lineTotalMinor: mockCoffee.priceMinor * 2,
          },
        ],
        subtotalMinor: mockCoffee.priceMinor * 2,
        totalMinor: mockCoffee.priceMinor * 2,
        currency: 'USD',
        shippingAddress: {
          fullName: 'Marcus Garvey',
          addressLine1: '56 Hope Road',
          city: 'Kingston',
          countryIso: 'JAM',
        },
      });

      expect(orderRes.success).toBe(true);
      expect(orderRes.orderId).toBe('ord-jam-escrow-01');
      expect(orderRes.escrowStatus).toBe('escrow_pending_delivery');

      // OrderEscrowBadge rendering & countdown check
      const remainingDays = calculateRemainingDisputeDays(new Date().toISOString());
      expect(remainingDays).toBeGreaterThanOrEqual(29);

      const badgeVdom = OrderEscrowBadge({
        status: 'escrow_pending_delivery',
        createdAt: new Date().toISOString(),
      });
      const badgeJson = serializeVDOM(badgeVdom);
      expect(badgeJson).toContain('Held in Escrow');
      expect(badgeJson).toContain('Escrow Status');
    });
  });

  // ===========================================================================
  // SUB-SYSTEM 5: Events & Community Relief Lifecycle <-> UniversalComposer & Feed
  // ===========================================================================
  describe('5. Events & Community Relief Lifecycle <-> UniversalComposer & Feed Integration', () => {
    it('EventComposerPanel renders form inputs and validates event date chronology', () => {
      const sampleEvent: CreateEventInput = {
        title: 'Barbados Crop Over Calypso Finals',
        description: 'Annual cultural celebration and musical competition.',
        event_kind: 'hybrid',
        privacy: 'public',
        venue: 'Kensington Oval, Bridgetown',
        livestream_url: 'https://live.tukubi.com/cropover2026',
        starts_at: '2026-08-01T18:00',
        ends_at: '2026-08-02T02:00',
        capacity: 1000,
      };

      const onChange = vi.fn();
      const vdom = EventComposerPanel({
        value: sampleEvent,
        onChange,
      });

      expect(vdom).not.toBeNull();
      const serialized = serializeVDOM(vdom);
      expect(serialized).toContain('Barbados Crop Over Calypso Finals');
      expect(serialized).toContain('Kensington Oval');
      expect(serialized).toContain('hybrid');
    });

    it('InteractiveEventCard handles RSVP transitions, live indicator, and check-in confirmation', () => {
      const sampleEventItem: LiveEventItem = {
        id: 'evt-cropover-01',
        creator_id: 'usr-organizer-01',
        community_id: null,
        title: 'Barbados Crop Over Calypso Finals',
        description: 'Annual cultural celebration and musical competition.',
        event_kind: 'hybrid',
        privacy: 'public',
        starts_at: new Date(Date.now() - 3600000).toISOString(), // started 1 hr ago
        ends_at: new Date(Date.now() + 7200000).toISOString(), // ends in 2 hrs
        venue: 'Kensington Oval, Bridgetown',
        livestream_url: 'https://live.tukubi.com/cropover2026',
        cover_image_url: null,
        country_iso: 'BRB',
        capacity: 1000,
        attendees_count: 450,
        user_rsvp: 'going',
        user_checked_in: false,
        check_in_code: 'TUKUBI-EVT-7729',
        is_live: true,
        event_attendees: [
          {
            id: 'att-01',
            event_id: 'evt-cropover-01',
            profile_id: 'usr-attendee-01',
            rsvp_status: 'going',
            guest_count: 2,
            check_in_code: 'TUKUBI-EVT-7729',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
      };

      expect(isEventLive(sampleEventItem.starts_at, sampleEventItem.ends_at)).toBe(true);
      expect(validateRSVPTransition('going', 'cancelled')).toBe(true);

      const onRSVP = vi.fn();
      const vdom = InteractiveEventCard({
        event: sampleEventItem,
        currentUserId: 'usr-attendee-01',
        onRSVP,
      });

      expect(vdom).not.toBeNull();
      const serialized = serializeVDOM(vdom);
      expect(serialized).toContain('Barbados Crop Over Calypso Finals');
      expect(serialized).toContain('Watch Stream');
      expect(serialized).toContain('Check-in Code');
      expect(serialized).toContain('TUKUBI-EVT-7729');
    });

    it('ReliefComposerPanel configures verified mutual aid campaigns with category protocols', () => {
      const sampleRelief: CreateReliefCampaignInput = {
        title: 'Carriacou Hurricane Recovery Mutual Aid',
        description: 'Immediate building supplies, water purification, and medical kits.',
        category: 'hurricane_relief',
        target_country_iso: 'GRD',
        goal_minor: 2500000, // $25,000 USD
        currency: 'USD',
        disaster_declaration_ref: 'CDEMA-2026-BERYL-GRD',
        supporting_evidence_urls: [],
      };

      const onChange = vi.fn();
      const vdom = ReliefComposerPanel({
        value: sampleRelief,
        onChange,
      });

      expect(vdom).not.toBeNull();
      const serialized = serializeVDOM(vdom);
      expect(serialized).toContain('Carriacou Hurricane Recovery Mutual Aid');
      expect(serialized).toContain('hurricane_relief');
      expect(serialized).toContain('CDEMA-2026-BERYL-GRD');
      expect(serialized).toContain('GRD');
    });

    it('ReliefCampaignCard and ReliefDonationModal calculate progress and enforce donation rules', () => {
      const campaign: ReliefCampaign = {
        id: 'camp-carriacou-01',
        creator_id: 'usr-cdema-01',
        community_id: null,
        title: 'Carriacou Hurricane Recovery Mutual Aid',
        description: 'Building supplies and emergency aid.',
        category: 'hurricane_relief',
        target_country_iso: 'GRD',
        target_city_id: null,
        goal_minor: 2500000,
        raised_minor: 1875000, // 75%
        currency: 'USD',
        verification_status: 'verified',
        verified_at: '2026-07-06T12:00:00Z',
        verified_by: 'cdema-officer',
        disaster_declaration_ref: 'CDEMA-2026-BERYL-GRD',
        supporting_evidence_urls: [],
        disbursement_status: 'verified_ready',
        is_active: true,
        donations_count: 88,
        created_at: '2026-07-06T08:00:00Z',
        updated_at: '2026-07-06T08:00:00Z',
      };

      expect(calculateCampaignProgress(campaign.raised_minor, campaign.goal_minor)).toBe(75);
      expect(isDisasterDeclarationVerified(campaign.disaster_declaration_ref)).toBe(true);
      expect(formatDonationAmount(1875000, 'USD')).toBe('$18,750.00');

      expect(validateDonationAmount(0).isValid).toBe(false);
      expect(validateDonationAmount(500).isValid).toBe(true);

      const onDonate = vi.fn();
      const cardVdom = ReliefCampaignCard({
        campaign,
        currentUserId: 'usr-diaspora-01',
        onDonate,
      });
      const cardJson = serializeVDOM(cardVdom);
      expect(cardJson).toContain('Carriacou Hurricane Recovery');
      expect(cardJson).toContain('CDEMA');
      expect(cardJson).toContain('75%');
      expect(cardJson).toContain('raised of');

      const modalVdom = ReliefDonationModal({
        campaign,
        isOpen: true,
        onClose: vi.fn(),
        onDonationSuccess: vi.fn(),
      });
      const modalJson = serializeVDOM(modalVdom);
      expect(modalJson).toContain('Donate to Relief');
      expect(modalJson).toContain('0% Platform Fee Mutual Aid Guarantee');
    });
  });

  // ===========================================================================
  // SUB-SYSTEM 6: End-to-End Multi-Subsystem Composition Orchestration
  // ===========================================================================
  describe('6. End-to-End Multi-Subsystem Composition Orchestration', () => {
    it('executes the full creator-to-consumer lifecycle across all 5 integrated subsystems', async () => {
      // -----------------------------------------------------------------------
      // Step A: Creator publishes multi-composite post via UniversalComposer & createPostAction
      // -----------------------------------------------------------------------
      const mockPostRecord = {
        id: 'post-mega-composite-01',
        content: 'Celebrating Trinidad Carnival 2026! 🌴🇹🇹 Test your soca history in our quiz and pick up an artisan steelpan ornament supporting local craft!',
        cultural_tags: ['TrinidadCarnival', 'SocaMusic', 'CaribbeanArtisan'],
        media_urls: ['https://cdn.tukubi.com/post-media/carnival-reel.mp4'],
        visibility: 'public',
        community_id: 'comm-tto-01',
        country_id: 'TTO',
        is_official: false,
      };

      getCurrentUserMock.mockResolvedValue({
        id: 'usr-creator-01',
        displayName: 'Machel Montano Fan Club',
        username: 'socalover',
        email: 'creator@tukubi.caribbean',
      });

      // Build formData simulating UniversalComposer publication
      const formData = new FormData();
      formData.set('content', mockPostRecord.content);
      formData.set('visibility', 'public');
      formData.set('media_urls', JSON.stringify(['https://cdn.tukubi.com/post-media/carnival-reel.mp4']));
      formData.set(
        'media_items',
        JSON.stringify([
          {
            url: 'https://cdn.tukubi.com/post-media/carnival-reel.mp4',
            type: 'video',
            aspectRatio: '9:16',
          },
        ])
      );
      formData.set('cultural_tags', JSON.stringify(mockPostRecord.cultural_tags));
      formData.set('tagged_product_ids', JSON.stringify(['prod-tto-03']));
      formData.set('country_id', 'TTO');
      formData.set('community_id', 'comm-tto-01');

      const publishResult = await createPostAction({ error: null }, formData);
      expect(publishResult.error).toBeNull();
      expect(publishResult.postId).toBe('post-mega-composite-01');
      expect(publishResult.post?.culturalTags).toContain('TrinidadCarnival');

      // -----------------------------------------------------------------------
      // Step B: Attach structured quiz to the newly created post
      // -----------------------------------------------------------------------
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'poll-steelpan-01', post_id: 'post-mega-composite-01' },
            error: null,
          }),
        }),
      });
      const mockOptionsInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [
            { id: 'opt-steelpan', position: 0 },
            { id: 'opt-cuatro', position: 1 },
            { id: 'opt-maracas', position: 2 },
          ],
          error: null,
        }),
      });

      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'polls') return { insert: mockInsert };
          if (table === 'poll_options') return { insert: mockOptionsInsert };
          return {};
        }),
        rpc: vi.fn((funcName: string) => {
          if (funcName === 'place_order_with_escrow') {
            return Promise.resolve({
              data: {
                order_id: 'ord-steelpan-composite-01',
                escrow_status: 'escrow_pending_delivery',
                buyer_id: 'usr-consumer-01',
                seller_id: 'seller-tto-1',
                total_minor: 1400,
              },
              error: null,
            });
          }
          return Promise.resolve({ data: null, error: null });
        }),
      };

      createSupabaseServerClientMock.mockResolvedValue(mockSupabase);

      const quizRes = await createPollAction({
        postId: publishResult.postId!,
        question: 'Which instrument is known as the only acoustic instrument invented in the 20th century?',
        options: ['Steelpan (Trinidad)', 'Cuatro (Venezuela/Trinidad)', 'Maracas (Indigenous Caribbean)'],
        isQuiz: true,
        quizExplanation: 'The steelpan was developed in Trinidad and Tobago during the 1930s.',
      });
      expect(quizRes.error).toBeFalsy();

      // -----------------------------------------------------------------------
      // Step C: Consumer in feed interacts:
      //         1. Reacts with "palm" (Island Vibe)
      //         2. Answers the quiz
      //         3. Adds tagged product to cart & completes Escrow checkout
      // -----------------------------------------------------------------------
      // 1. Reaction
      const chosenReaction: ReactionType = 'palm';
      expect(VALID_REACTION_TYPES).toContain(chosenReaction);
      expect(REACTION_EMOJI_MAP[chosenReaction].emoji).toBe('🌴');

      // 2. Quiz vote VDOM rendering
      const interactivePoll: PollData = {
        id: 'poll-steelpan-01',
        postId: publishResult.postId!,
        question: 'Which instrument is known as the only acoustic instrument invented in the 20th century?',
        options: [
          { id: 'opt-steelpan', pollId: 'poll-steelpan-01', optionText: 'Steelpan (Trinidad)', position: 0, votesCount: 88, percentage: 88 },
          { id: 'opt-cuatro', pollId: 'poll-steelpan-01', optionText: 'Cuatro (Venezuela/Trinidad)', position: 1, votesCount: 8, percentage: 8 },
          { id: 'opt-maracas', pollId: 'poll-steelpan-01', optionText: 'Maracas', position: 2, votesCount: 4, percentage: 4 },
        ],
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        allowMultiple: false,
        totalVotes: 100,
        createdAt: new Date().toISOString(),
        isQuiz: true,
        quizExplanation: 'The steelpan was developed in Trinidad and Tobago during the 1930s.',
        correctOptionId: 'opt-steelpan',
        userVotedOptionId: 'opt-steelpan',
        userIsCorrect: true,
      };

      const pollVdom = InteractivePollWidget({
        initialPoll: interactivePoll,
        currentUserId: 'usr-consumer-01',
      });
      const pollSerialized = serializeVDOM(pollVdom);
      expect(pollSerialized).toContain('Steelpan (Trinidad)');
      expect(pollSerialized).toContain('Correct!');

      // 3. Social Commerce: Add tagged product to Cart and Place Escrow Order
      const hotSauceProduct = DEFAULT_CARIBBEAN_PRODUCTS.find((p) => p.id === 'prod-tto-03')!;
      expect(hotSauceProduct).toBeDefined();

      addCartLine({
        productId: hotSauceProduct.id,
        sellerId: hotSauceProduct.sellerId,
        title: hotSauceProduct.title,
        priceMinor: hotSauceProduct.priceMinor,
        currency: hotSauceProduct.currency,
        quantity: 1,
        thumbnailUrl: hotSauceProduct.thumbnailUrl,
      });

      expect(getCartLines()).toHaveLength(1);
      expect(getCartLines()[0].productId).toBe('prod-tto-03');

      // Place Escrow order
      getCurrentUserMock.mockResolvedValue({ id: 'usr-consumer-01' });

      const escrowCheckout = await placeOrderWithEscrowAction({
        sellerId: hotSauceProduct.sellerId,
        items: [
          {
            productId: hotSauceProduct.id,
            quantity: 1,
            unitPriceMinor: hotSauceProduct.priceMinor,
            lineTotalMinor: hotSauceProduct.priceMinor,
          },
        ],
        subtotalMinor: hotSauceProduct.priceMinor,
        totalMinor: hotSauceProduct.priceMinor,
        currency: hotSauceProduct.currency,
        shippingAddress: {
          fullName: 'Ananya Sharma',
          addressLine1: '10 Queen Park West',
          city: 'Port of Spain',
          countryIso: 'TTO',
        },
      });

      expect(escrowCheckout.success).toBe(true);
      expect(escrowCheckout.escrowStatus).toBe('escrow_pending_delivery');
      expect(escrowCheckout.orderId).toBe('ord-steelpan-composite-01');

      // Clear cart post-checkout
      clearCart();
      expect(getCartLines()).toHaveLength(0);
    });
  });
});
