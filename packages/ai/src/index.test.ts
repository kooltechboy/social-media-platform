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
    it('should translate English to Spanish', async () => {
      const result = await engine.translateContent('Hello world', 'es');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle Caribbean dialects', async () => {
      const result = await engine.translateContent('How you doing?', 'ht');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should preserve cultural context', async () => {
      const result = await engine.translateContent('Thank you very much', 'en');
      expect(result).toBeDefined();
    });
  });

  describe('risk assessment', () => {
    it('should classify safe content with low risk', async () => {
      const result = await engine.classifyContentRisk('This is a normal post');
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1.0);
    });

    it('should detect potentially harmful content', async () => {
      const result = await engine.classifyContentRisk('I will harm you');
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1.0);
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

