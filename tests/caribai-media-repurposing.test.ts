import { describe, it, expect } from 'vitest';
import {
  OPENROUTER_FREE_MODELS,
  ModelRouter,
  repurposeContent,
  type RepurposeInput,
  type RepurposedContentBundle,
} from '../packages/ai/src/index';

describe('Phase 6: CaribAI Assistant & Media Repurposing Pipeline Suite', () => {
  // =========================================================================
  // 1. OpenRouter Model Fallback Chain
  // =========================================================================
  describe('1. OpenRouter Free Model Routing & Resilience', () => {
    it('contains a prioritized array of verified free models', () => {
      expect(OPENROUTER_FREE_MODELS.length).toBeGreaterThanOrEqual(3);
      expect(OPENROUTER_FREE_MODELS[0]).toBe('meta-llama/llama-3.3-70b-instruct:free');
      expect(OPENROUTER_FREE_MODELS).toContain('deepseek/deepseek-r1:free');
      expect(OPENROUTER_FREE_MODELS).toContain('qwen/qwen-2.5-coder-32b-instruct:free');
    });

    it('falls back to local deterministic synthesis when API key is missing without crashing', async () => {
      const router = new ModelRouter({ apiKey: '' });
      const result = await router.executePrompt('Summarize Caribbean carnival traditions');

      expect(result).toBeDefined();
      expect(result.source).toBe('local_fallback');
      expect(result.content.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // 2. Media Repurposing Pipeline Engine
  // =========================================================================
  describe('2. Media Repurposing Pipeline', () => {
    const sampleArticle = `
      Port of Spain, Trinidad — The energy of Carnival 2026 is sweeping through the islands.
      From steelpan yards in Woodbrook to the mas camps preparing hand-crafted costumes,
      artisans and musicians are bringing traditional Jouvert masquerade into the digital age.
      Young designers are utilizing eco-friendly materials and digital sound stems to share
      our heritage with the global diaspora in Brooklyn, Toronto, and London.
    `;

    it('repurposes long-form content into a complete multi-format creator bundle', () => {
      const input: RepurposeInput = {
        sourceText: sampleArticle,
        title: 'Trinidad Carnival Jouvert Evolution',
        category: 'carnival',
        dialect: 'trini_creole',
      };

      const bundle: RepurposedContentBundle = repurposeContent(input);

      // 1. Reel Script
      expect(bundle.reelScript).toBeDefined();
      expect(bundle.reelScript.hook.length).toBeGreaterThan(0);
      expect(bundle.reelScript.scenes.length).toBeGreaterThanOrEqual(3);
      expect(bundle.reelScript.cta.length).toBeGreaterThan(0);
      expect(bundle.reelScript.estimatedSeconds).toBeLessThanOrEqual(60);

      // 2. Carousel Brief
      expect(bundle.carousel).toBeDefined();
      expect(bundle.carousel.length).toBeGreaterThanOrEqual(3);
      expect(bundle.carousel[0].slideNumber).toBe(1);
      expect(bundle.carousel[0].headline.length).toBeGreaterThan(0);
      expect(bundle.carousel[0].bodyText.length).toBeGreaterThan(0);

      // 3. Community Prompt
      expect(bundle.communityPrompt).toBeDefined();
      expect(bundle.communityPrompt.question).toContain('?');
      expect(bundle.communityPrompt.debateAngles.length).toBeGreaterThanOrEqual(2);
      expect(bundle.communityPrompt.hashtags.length).toBeGreaterThanOrEqual(3);

      // 4. Audio Note
      expect(bundle.audioNote).toBeDefined();
      expect(bundle.audioNote.text.length).toBeGreaterThan(0);
      expect(bundle.audioNote.suggestedTone.length).toBeGreaterThan(0);
    });

    it('infuses Jamaican Patois dialect nuances when selected', () => {
      const input: RepurposeInput = {
        sourceText: 'Kingston dubplate culture and sound systems are redefining global bass music.',
        title: 'Dubplate Sound System Heritage',
        category: 'music',
        dialect: 'jamaican_patois',
      };

      const bundle = repurposeContent(input);

      expect(bundle.reelScript.hook).toMatch(/(yuh|vibes|kingston|wi|inna)/i);
      expect(bundle.communityPrompt.hashtags).toContain('#SoundSystemCulture');
    });

    it('infuses Haitian Kreyol dialect nuances when selected', () => {
      const input: RepurposeInput = {
        sourceText: 'Celebrating traditional Haitian Rara music and community gatherings across Ayiti and the diaspora.',
        title: 'Rara Music Traditions',
        category: 'music',
        dialect: 'haitian_kreyol',
      };

      const bundle = repurposeContent(input);

      expect(bundle.reelScript.hook).toMatch(/(nou|kreyòl|ayiti|dyaspora)/i);
    });

    it('rejects empty or whitespace-only source text', () => {
      expect(() =>
        repurposeContent({
          sourceText: '   ',
          title: 'Empty',
          category: 'social',
        })
      ).toThrow('Source content cannot be empty');
    });
  });
});
