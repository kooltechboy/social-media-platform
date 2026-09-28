import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { MediaExportResult } from '@caribbean/media';
import UniversalComposer from '../apps/web/src/components/universal-composer';
import TukubiCreationStudio from '../apps/web/src/components/media/creation/tukubi-creation-studio';
import ProductTaggingTray, {
  DEFAULT_CARIBBEAN_PRODUCTS,
} from '../apps/web/src/components/commerce/product-tagging-tray';
import type { TaggedProductSummary } from '@caribbean/marketplace';

describe('Task 4: Wire Product Tagging Tray into UniversalComposer and TukubiCreationStudio', () => {
  const rootDir = process.cwd();
  const typesPath = path.join(rootDir, 'packages/media/src/creation/types.ts');
  const composerPath = path.join(rootDir, 'apps/web/src/components/universal-composer.tsx');
  const studioPath = path.join(
    rootDir,
    'apps/web/src/components/media/creation/tukubi-creation-studio.tsx'
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Media Core Types (MediaExportResult)', () => {
    it('declares MediaExportResult with taggedProductIds in packages/media/src/creation/types.ts', () => {
      const typesSource = fs.readFileSync(typesPath, 'utf8');
      expect(typesSource).toContain('export interface MediaExportResult');
      expect(typesSource).toMatch(/taggedProductIds\?:?\s*string\[\]/);
    });

    it('type-checks MediaExportResult with taggedProductIds array', () => {
      const sampleExport: MediaExportResult = {
        file: new File(['video-data'], 'reel.mp4', { type: 'video/mp4' }),
        mediaKind: 'video',
        previewUrl: 'blob:reel-preview',
        aspectRatio: '9:16',
        taggedProductIds: ['prod-jam-01', 'prod-slu-02'],
      };
      expect(sampleExport.taggedProductIds).toHaveLength(2);
      expect(sampleExport.taggedProductIds?.[0]).toBe('prod-jam-01');
    });
  });

  describe('2. UniversalComposer Product Tagging Integration', () => {
    it('imports ProductTaggingTray and removes legacy plain text product inputs', () => {
      const composerSource = fs.readFileSync(composerPath, 'utf8');
      expect(composerSource).toContain('ProductTaggingTray');
      expect(composerSource).not.toMatch(/placeholder="Product Name \(e\.g\./);
      expect(composerSource).not.toMatch(/placeholder="Price \(\$ USD on TUKUBI\)"/);
    });

    it('manages taggedProducts state and appends tagged_product_ids to formData on post submission', () => {
      const composerSource = fs.readFileSync(composerPath, 'utf8');
      expect(composerSource).toMatch(/taggedProducts/);
      expect(composerSource).toMatch(/formData\.(set|append)\(\s*['"]tagged_product_ids['"],\s*JSON\.stringify/);
    });

    it('validates hasProduct check against taggedProducts.length > 0', () => {
      const composerSource = fs.readFileSync(composerPath, 'utf8');
      expect(composerSource).toMatch(/hasProduct\s*=\s*(taggedProducts\.length\s*>\s*0|mode\s*===\s*['"]product['"]\s*&&\s*taggedProducts\.length\s*>\s*0)/);
    });

    it('populates taggedProductIds into state when receiving handoff from TukubiCreationStudio', () => {
      const composerSource = fs.readFileSync(composerPath, 'utf8');
      expect(composerSource).toMatch(/handleStudioHandoff/);
      expect(composerSource).toMatch(/payload\.taggedProductIds|result\.taggedProductIds/);
    });

    it('renders ProductTaggingTray in product mode', () => {
      const composerSource = fs.readFileSync(composerPath, 'utf8');
      expect(composerSource).toContain('<ProductTaggingTray');
      expect(composerSource).toMatch(/selectedProducts=\{\s*taggedProducts\s*\}/);
      expect(composerSource).toMatch(/onTagsChange=\{/);
    });

    it('renders tagged product chips in composer preview with removal controls', () => {
      const composerSource = fs.readFileSync(composerPath, 'utf8');
      // Composer preview should render tagged product chips with remove buttons
      expect(composerSource).toMatch(/Tagged Caribbean Products|Featured Products/i);
      expect(composerSource).toMatch(/aria-label=\{?`?Remove \$\{/i);
    });
  });

  describe('3. TukubiCreationStudio Product Tagging Integration', () => {
    it('imports ProductTaggingTray and exports MediaExportResult compatibility', () => {
      const studioSource = fs.readFileSync(studioPath, 'utf8');
      expect(studioSource).toContain('ProductTaggingTray');
      expect(studioSource).toMatch(/taggedProductIds/);
    });

    it('provides a "Tag Products for Caribbean Shop" button with ShoppingBag icon in Review & Export stage', () => {
      const studioSource = fs.readFileSync(studioPath, 'utf8');
      expect(studioSource).toContain('Tag Products for Caribbean Shop');
      expect(studioSource).toContain('ShoppingBag');
    });

    it('renders Review & Export stage with product tagging button when stage is review', () => {
      const vdom = TukubiCreationStudio({
        isOpen: true,
        initialMode: 'reel',
        initialStage: 'review',
        initialClips: [
          {
            id: 'c1',
            blob: new Blob(['video']),
            previewUrl: 'blob:clip1',
            durationMs: 5000,
            trimStartMs: 0,
            trimEndMs: 5000,
            speed: 1,
            order: 0,
          },
        ],
        onClose: vi.fn(),
        onHandoffComplete: vi.fn(),
      });

      expect(vdom).not.toBeNull();
      const serialized = JSON.stringify(vdom);
      expect(serialized).toContain('Tag Products for Caribbean Shop');
    });

    it('includes taggedProductIds in the returned handoff result', () => {
      const studioSource = fs.readFileSync(studioPath, 'utf8');
      expect(studioSource).toMatch(/taggedProductIds:\s*(taggedProducts\.map|taggedProductIds)/);
    });

    it('renders preview chips of tagged items in TukubiCreationStudio', () => {
      const sampleTagged: TaggedProductSummary[] = [
        DEFAULT_CARIBBEAN_PRODUCTS[0],
        DEFAULT_CARIBBEAN_PRODUCTS[1],
      ];

      const vdom = TukubiCreationStudio({
        isOpen: true,
        initialMode: 'reel',
        initialStage: 'review',
        initialTaggedProducts: sampleTagged,
        onClose: vi.fn(),
        onHandoffComplete: vi.fn(),
      });

      const serialized = JSON.stringify(vdom);
      expect(serialized).toContain('Blue Mountain Peaberry Coffee');
      expect(serialized).toContain('St. Lucian Organic Cocoa Sticks');
    });
  });
});
