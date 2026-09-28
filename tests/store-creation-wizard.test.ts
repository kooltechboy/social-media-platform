import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { revalidatePath } from 'next/cache';
import type { SellerType } from '@caribbean/marketplace';
import type { StorefrontConfig, CreateStorefrontInput } from '../apps/web/src/lib/commerce/types';
import { getCurrentUser, createSupabaseServerClient } from '../apps/web/src/lib/supabase/server';
import {
  createOrUpdateStorefrontAction,
  fetchStorefrontConfigAction,
} from '../apps/web/src/lib/commerce/actions';
import StoreCreationWizard, {
  StoreCreationWizardProps,
  CARIBBEAN_FUTURISM_SWATCHES,
  CARIBBEAN_CURRENCIES,
} from '../apps/web/src/components/commerce/store-creation-wizard';

vi.mock('../apps/web/src/lib/supabase/server', () => ({
  getCurrentUser: vi.fn(),
  createSupabaseServerClient: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Task 6: Store Creation & Management Wizard and Server Actions', () => {
  const rootDir = process.cwd();
  const actionsFilePath = path.join(rootDir, 'apps/web/src/lib/commerce/actions.ts');
  const wizardFilePath = path.join(rootDir, 'apps/web/src/components/commerce/store-creation-wizard.tsx');

  const mockUser = {
    id: 'seller-carib-42',
    email: 'marina@crafts.bb',
    username: 'marina_crafts',
    displayName: 'Marina Bajan Crafts',
  };

  const mockDbStorefront = {
    id: 'cfg-101',
    seller_id: 'seller-carib-42',
    business_id: null,
    seller_type: 'merchant',
    headline: 'Bespoke Barbadian Pottery & Craft',
    hero_image_url: 'https://cdn.tukubi.com/stores/bajan-pottery.jpg',
    sections: [],
    brand_color: '#FF6B4A',
    policies: { countryIso: 'BRB' },
    return_policy: '30-Day TUKUBI Escrow Guarantee with full return protection.',
    shipping_policy: 'Caribbean express inter-island shipping in 3-5 days.',
    currency: 'BBD',
    support_email: 'marina@crafts.bb',
    social_links: { instagram: '@marinacrafts' },
    is_published: true,
    created_at: '2026-09-27T10:00:00.000Z',
    updated_at: '2026-09-27T10:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. File Existence & Export Contracts', () => {
    it('verifies actions.ts and store-creation-wizard.tsx exist on disk', () => {
      expect(fs.existsSync(actionsFilePath)).toBe(true);
      expect(fs.existsSync(wizardFilePath)).toBe(true);
    });

    it('exports required server actions and component constants', () => {
      expect(createOrUpdateStorefrontAction).toBeDefined();
      expect(typeof createOrUpdateStorefrontAction).toBe('function');
      expect(fetchStorefrontConfigAction).toBeDefined();
      expect(typeof fetchStorefrontConfigAction).toBe('function');

      expect(StoreCreationWizard).toBeDefined();
      expect(typeof StoreCreationWizard).toBe('function');
      expect(Array.isArray(CARIBBEAN_FUTURISM_SWATCHES)).toBe(true);
      expect(Array.isArray(CARIBBEAN_CURRENCIES)).toBe(true);
    });
  });

  describe('2. Server Actions: createOrUpdateStorefrontAction', () => {
    it('enforces authentication via getCurrentUser()', async () => {
      getCurrentUser.mockResolvedValueOnce(null);

      const result = await createOrUpdateStorefrontAction({
        headline: 'Authentic Spice Shop',
        sellerType: 'merchant',
        countryIso: 'GRD',
        currency: 'XCD',
      });

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/authenticat/i);
    });

    it('validates seller type against SELLER_TYPE_REGISTRY', async () => {
      getCurrentUser.mockResolvedValueOnce(mockUser);

      const result = await createOrUpdateStorefrontAction({
        headline: 'Unknown Vendor',
        sellerType: 'non_existent_type' as SellerType,
        countryIso: 'JAM',
        currency: 'JMD',
      });

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/seller type/i);
    });

    it('validates Caribbean country ISO', async () => {
      getCurrentUser.mockResolvedValueOnce(mockUser);

      const result = await createOrUpdateStorefrontAction({
        headline: 'Island Store',
        sellerType: 'merchant',
        countryIso: 'XYZ',
        currency: 'USD',
      });

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/country|iso/i);
    });

    it('validates supported Caribbean currency', async () => {
      getCurrentUser.mockResolvedValueOnce(mockUser);

      const result = await createOrUpdateStorefrontAction({
        headline: 'Island Store',
        sellerType: 'merchant',
        countryIso: 'TTO',
        currency: 'EUR', // Unsupported currency
      });

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/currency/i);
    });

    it('upserts storefront_configs on conflict (seller_id) and revalidates routes', async () => {
      getCurrentUser.mockResolvedValueOnce(mockUser);

      const mockUpsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockDbStorefront,
            error: null,
          }),
        }),
      });

      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'storefront_configs') {
            return {
              upsert: mockUpsert,
            };
          }
          return {};
        }),
      };

      createSupabaseServerClient.mockResolvedValueOnce(mockSupabase);

      const input: CreateStorefrontInput = {
        headline: 'Bespoke Barbadian Pottery & Craft',
        sellerType: 'merchant',
        countryIso: 'BRB',
        currency: 'BBD',
        heroImageUrl: 'https://cdn.tukubi.com/stores/bajan-pottery.jpg',
        brandColor: '#FF6B4A',
        shippingPolicy: 'Caribbean express inter-island shipping in 3-5 days.',
        returnPolicy: '30-Day TUKUBI Escrow Guarantee with full return protection.',
        supportEmail: 'marina@crafts.bb',
        isPublished: true,
      };

      const result = await createOrUpdateStorefrontAction(input);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.sellerId).toBe('seller-carib-42');
      expect(result.data?.headline).toBe('Bespoke Barbadian Pottery & Craft');

      // Check upsert payload contains seller_id
      expect(mockSupabase.from).toHaveBeenCalledWith('storefront_configs');
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          seller_id: 'seller-carib-42',
          seller_type: 'merchant',
          headline: 'Bespoke Barbadian Pottery & Craft',
          currency: 'BBD',
          brand_color: '#FF6B4A',
          is_published: true,
        }),
        expect.objectContaining({ onConflict: 'seller_id' })
      );

      // Verifies revalidation of storefront and marketplace routes in actions.ts source
      const actionsSource = fs.readFileSync(actionsFilePath, 'utf8');
      expect(actionsSource).toContain("revalidatePath('/marketplace')");
      expect(actionsSource).toContain("revalidatePath('/merchant')");
      expect(actionsSource).toMatch(/revalidatePath\(`\/store\//);
    });

    it('supports FormData input seamlessly', async () => {
      getCurrentUser.mockResolvedValueOnce(mockUser);

      const mockUpsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockDbStorefront,
            error: null,
          }),
        }),
      });

      createSupabaseServerClient.mockResolvedValueOnce({
        from: vi.fn().mockReturnValue({ upsert: mockUpsert }),
      });

      const formData = new FormData();
      formData.set('headline', 'Bespoke Barbadian Pottery & Craft');
      formData.set('sellerType', 'merchant');
      formData.set('countryIso', 'BRB');
      formData.set('currency', 'BBD');
      formData.set('supportEmail', 'marina@crafts.bb');

      const result = await createOrUpdateStorefrontAction(formData);
      expect(result.success).toBe(true);
    });
  });

  describe('3. Server Actions: fetchStorefrontConfigAction', () => {
    it('returns null if sellerId is missing', async () => {
      const result = await fetchStorefrontConfigAction('');
      expect(result).toBeNull();
    });

    it('returns null if storefront config does not exist', async () => {
      createSupabaseServerClient.mockResolvedValueOnce({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      });

      const result = await fetchStorefrontConfigAction('non-existent-seller');
      expect(result).toBeNull();
    });

    it('returns mapped StorefrontConfig when configuration exists', async () => {
      createSupabaseServerClient.mockResolvedValueOnce({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: mockDbStorefront, error: null }),
            }),
          }),
        }),
      });

      const result = await fetchStorefrontConfigAction('seller-carib-42');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('cfg-101');
      expect(result?.sellerId).toBe('seller-carib-42');
      expect(result?.sellerType).toBe('merchant');
      expect(result?.headline).toBe('Bespoke Barbadian Pottery & Craft');
      expect(result?.brandColor).toBe('#FF6B4A');
      expect(result?.currency).toBe('BBD');
      expect(result?.countryIso).toBe('BRB');
      expect(result?.isPublished).toBe(true);
    });
  });

  describe('4. StoreCreationWizard Component Architecture & WCAG 2.2 AA Compliance', () => {
    it('initializes with default step 1 and renders step progress indicators with ARIA attributes', () => {
      const vdom = StoreCreationWizard({});
      expect(vdom).not.toBeNull();
      const serialized = JSON.stringify(vdom);

      // Step indicators
      expect(serialized).toContain('Store Basics');
      expect(serialized).toContain('Branding');
      expect(serialized).toContain('Trust & Policies');
      expect(serialized).toContain('Review & Publish');
      expect(serialized).toContain('aria-current');
    });

    it('source file contains all 4 progressive onboarding steps', () => {
      const source = fs.readFileSync(wizardFilePath, 'utf8');

      // Step 1: Store Basics
      expect(source).toMatch(/Store Basics|Basic Information/i);
      expect(source).toContain('headline');
      expect(source).toContain('sellerType');
      expect(source).toContain('countryIso');
      expect(source).toContain('currency');

      // Step 2: Branding & Aesthetics
      expect(source).toMatch(/Branding & Aesthetics|Brand Identity/i);
      expect(source).toContain('heroImageUrl');
      expect(source).toContain('brandColor');
      expect(source).toContain('#FF6B4A'); // Sunset Coral
      expect(source).toContain('#F59E0B'); // Golden Hour
      expect(source).toContain('#06B6D4'); // Caribbean Sea
      expect(source).toContain('#8B5CF6'); // Twilight

      // Step 3: Policies & Customer Trust
      expect(source).toMatch(/Policies & Customer Trust|Buyer Protection/i);
      expect(source).toContain('shippingPolicy');
      expect(source).toContain('returnPolicy');
      expect(source).toContain('supportEmail');
      expect(source).toMatch(/30-Day Escrow|Escrow Guarantee/i);

      // Step 4: Review & Publish
      expect(source).toMatch(/Review & Publish|Storefront Summary/i);
      expect(source).toContain('isPublished');
    });

    it('enforces WCAG 2.2 AA minimum touch targets (>= 44px) and keyboard accessibility', () => {
      const source = fs.readFileSync(wizardFilePath, 'utf8');
      expect(source).toMatch(/min-h-\[44px\]|h-11|min-w-\[44px\]|w-11|p-3/);
      expect(source).toMatch(/role=["'](?:tablist|group|region)["']/);
      expect(source).toMatch(/aria-label=/);
    });

    it('renders initialConfig pre-filled values when provided', () => {
      const vdom = StoreCreationWizard({
        initialConfig: {
          headline: 'Trinidad Carnival Mas Camp',
          sellerType: 'cultural',
          countryIso: 'TTO',
          currency: 'TTD',
          brandColor: '#06B6D4',
        },
      });

      const serialized = JSON.stringify(vdom);
      expect(serialized).toContain('Trinidad Carnival Mas Camp');
    });

    it('incorporates Caribbean Futurism styling palette tokens', () => {
      const source = fs.readFileSync(wizardFilePath, 'utf8');
      expect(source).toContain('brand-dusk');
      expect(source).toContain('brand-sunriseCoral');
      expect(source).toContain('brand-goldenHour');
    });
  });
});
