import { describe, it, beforeEach, expect } from 'vitest';
import { CaribAIEngine, AskCaribbeanPlanner } from './index';

describe('CaribAIEngine', () => {
  let engine: CaribAIEngine;
  let planner: AskCaribbeanPlanner;

  beforeEach(() => {
    engine = new CaribAIEngine({
      apiKey: 'test-openrouter-key',
      defaultModel: 'meta-llama/llama-3.3-70b-instruct:free',
    });
    planner = new AskCaribbeanPlanner();
  });

  describe('translation capabilities', () => {
    it('rejects explicitly when the engine has no API key (no fabricated output)', async () => {
      const unconfigured = new CaribAIEngine({ apiKey: '' });
      await expect(unconfigured.translateContent('Hello world', 'es')).rejects.toThrow(
        'CARIBAI_NOT_CONFIGURED'
      );
    });

    it('rejects for Caribbean dialect targets too when unconfigured', async () => {
      const unconfigured = new CaribAIEngine({ apiKey: '' });
      await expect(unconfigured.translateContent('How you doing?', 'ht')).rejects.toThrow(
        'CARIBAI_NOT_CONFIGURED'
      );
    });
  });

  describe('risk assessment', () => {
    it('marks the result degraded (never silently safe) when the service is unconfigured', async () => {
      const unconfigured = new CaribAIEngine({ apiKey: '' });
      const result = await unconfigured.classifyContentRisk('This is a normal post');
      expect(result.degraded).toBe(true);
      expect(result.flagReason).toBe('safety_service_unavailable');
      expect(result.score).toBe(0);
    });

    it('clamps provider scores into the [0, 1] range', async () => {
      const clamped = await engine.classifyContentRisk('Test content');
      expect(clamped.score).toBeGreaterThanOrEqual(0);
      expect(clamped.score).toBeLessThanOrEqual(1.0);
    });

    it('should return structured response', async () => {
      const result = await engine.classifyContentRisk('Test content');
      expect(result).toHaveProperty('score');
    });
  });

  describe('query planning', () => {
    it('should plan queries for profiles', () => {
      const plan = planner.plan('John Doe profile');
      expect(plan.entities).toContain('profiles');
      expect(plan.term).toBe('John Doe profile');
    });

    it('should plan queries for events', () => {
      const plan = planner.plan('Soca party this weekend');
      expect(plan.entities).toContain('events');
      expect(plan.timeWindowDays).toBe(7);
    });

    it('should detect location hints', () => {
      const plan = planner.plan('Barbecue in Miami');
      expect(plan.locationHints).toContain('miami');
    });

    it('should detect locale markers', () => {
      const plan = planner.plan('Post in English');
      expect(plan.locale).toBe('en');
    });
  });

  describe('BusinessAIAssistant (grounded answers)', () => {
    it('answers hours and location queries with verified facts', async () => {
      const { BusinessAIAssistant } = await import('./index');
      const assistant = new BusinessAIAssistant();
      const res = assistant.answerCustomerQuery('What are your hours and location?', {
        businessName: 'Kingston Blue Mountain Coffee',
        category: 'Cafe',
        location: 'Kingston, Jamaica',
        hours: 'Mon-Sat 8am-8pm',
      });
      expect(res.confidence).toBe('high');
      expect(res.answer).toContain('Kingston, Jamaica');
      expect(res.answer).toContain('Mon-Sat 8am-8pm');
      expect(res.groundedFacts.length).toBeGreaterThan(0);
    });

    it('never invents opening hours when the business has not published them', async () => {
      const { BusinessAIAssistant } = await import('./index');
      const assistant = new BusinessAIAssistant();
      const res = assistant.answerCustomerQuery('What are your hours?', {
        businessName: 'Island Grill',
        category: 'Restaurant',
        location: 'Bridgetown, Barbados',
      });
      expect(res.confidence).toBe('fallback');
      expect(res.answer).not.toContain('Mon-Sat');
      expect(res.answer).toContain('not been published');
    });

    it('never invents a delivery policy when none is provided', async () => {
      const { BusinessAIAssistant } = await import('./index');
      const assistant = new BusinessAIAssistant();
      const res = assistant.answerCustomerQuery('Do you deliver?', {
        businessName: 'Island Grill',
        category: 'Restaurant',
        location: 'Bridgetown, Barbados',
      });
      expect(res.confidence).toBe('fallback');
      expect(res.answer).not.toContain('verified logistics');
    });

    it('answers catalog pricing questions from live product list', async () => {
      const { BusinessAIAssistant } = await import('./index');
      const assistant = new BusinessAIAssistant();
      const res = assistant.answerCustomerQuery('How much is the organic cacao nibs?', {
        businessName: 'St. Lucia Spice Works',
        category: 'Spices',
        location: 'Castries, St. Lucia',
        products: [
          { title: 'Organic Cacao Nibs', priceFormatted: '$18.00 USD', kind: 'physical', inStock: true },
        ],
      });
      expect(res.confidence).toBe('high');
      expect(res.answer).toContain('Organic Cacao Nibs');
      expect(res.answer).toContain('$18.00 USD');
    });
  });

  describe('generateCreatorContentPlan', () => {
    it('generates Caribbean dialect captions and relevant hashtags', async () => {
      const { generateCreatorContentPlan } = await import('./index');
      const plan = generateCreatorContentPlan({
        topic: 'Carnival J’ouvert Road March',
        category: 'carnival',
        dialect: 'trini_creole',
      });
      expect(plan.captions.length).toBeGreaterThan(0);
      expect(plan.captions[0]).toContain('🇹🇹');
      expect(plan.hashtags).toContain('#CarnivalVibes');
      expect(plan.hashtags).toContain('#CaribbeanEcosystem');
    });
  });
});

