import { describe, it, expect } from 'vitest';
import {
  ContentRiskEngine,
  AppealPolicy,
  priorityForReason,
  DEFAULT_THRESHOLDS,
  REPORT_REASONS,
  AUTO_RESTRICT_DIMENSIONS,
  type ReportReason,
  type AppealRecord,
} from '../../packages/trust-safety/src/index';

describe('Phase 9 — Trust & Safety, Moderation Pipeline & Content Risk Engine Certification', () => {
  // ===========================================================================
  // 1. Content Risk Engine & Automated Quarantine
  // ===========================================================================
  describe('1. Content Risk Engine & Quarantine Invariants', () => {
    const engine = new ContentRiskEngine();

    it('allows benign content with low risk scores across all dimensions', () => {
      const evalClean = engine.evaluate({
        spam: 0.05,
        toxicity: 0.02,
        bot: 0.01,
        imageSafety: 0.01,
      });

      expect(evalClean.decision).toBe('allow');
      expect(evalClean.priority).toBe('low');
      expect(evalClean.autoRestricted).toBe(false);
    });

    it('routes mid-risk content to human review with medium priority', () => {
      const evalMid = engine.evaluate({
        toxicity: 0.65,
        spam: 0.40,
      });

      expect(evalMid.decision).toBe('review');
      expect(evalMid.priority).toBe('medium');
      expect(evalMid.autoRestricted).toBe(false);
      expect(evalMid.maxDimension).toBe('toxicity');
      expect(evalMid.maxScore).toBe(0.65);
    });

    it('immediately auto-quarantines high-confidence unsafe imagery', () => {
      const evalImage = engine.evaluate({
        imageSafety: 0.96,
        toxicity: 0.10,
      });

      expect(evalImage.decision).toBe('restrict');
      expect(evalImage.priority).toBe('critical');
      expect(evalImage.autoRestricted).toBe(true);
      expect(evalImage.maxDimension).toBe('imageSafety');
    });

    it('keeps non-quarantine high-risk dimensions in human review queue (no accidental auto-censorship)', () => {
      const evalFraud = engine.evaluate({
        fraud: 0.98,
        maliciousUrl: 0.90,
      });

      expect(evalFraud.decision).toBe('review');
      expect(evalFraud.priority).toBe('critical'); // >= 0.95 priority critical
      expect(evalFraud.autoRestricted).toBe(false);
    });

    it('validates threshold boundaries and prevents invalid configurations', () => {
      expect(() => new ContentRiskEngine({ reviewThreshold: 0.8, restrictThreshold: 0.8 })).toThrow(
        'reviewThreshold must be lower than restrictThreshold'
      );
      expect(() => new ContentRiskEngine({ reviewThreshold: 0.9, restrictThreshold: 0.5 })).toThrow(
        'reviewThreshold must be lower than restrictThreshold'
      );
    });
  });

  // ===========================================================================
  // 2. Report Classification & SLA Prioritization
  // ===========================================================================
  describe('2. Report Classification & Emergency SLAs', () => {
    it('elevates existential and harm categories to critical emergency priority', () => {
      expect(priorityForReason('child_safety')).toBe('critical');
      expect(priorityForReason('self_harm')).toBe('critical');
    });

    it('assigns high priority to user safety risks: hate speech, harassment, fraud, impersonation', () => {
      expect(priorityForReason('hate_speech')).toBe('high');
      expect(priorityForReason('harassment')).toBe('high');
      expect(priorityForReason('scam_fraud')).toBe('high');
      expect(priorityForReason('impersonation')).toBe('high');
    });

    it('assigns medium priority to platform integrity and copyright concerns', () => {
      expect(priorityForReason('spam')).toBe('medium');
      expect(priorityForReason('copyright')).toBe('medium');
      expect(priorityForReason('misinformation')).toBe('medium');
    });

    it('assigns low priority to generic other reports', () => {
      expect(priorityForReason('other')).toBe('low');
    });

    it('verifies every registered REPORT_REASON produces a valid non-empty priority', () => {
      REPORT_REASONS.forEach((reason: ReportReason) => {
        const priority = priorityForReason(reason);
        expect(['critical', 'high', 'medium', 'low']).toContain(priority);
      });
    });
  });

  // ===========================================================================
  // 3. Appeals Policy & Independent Reviewer Separation of Concerns
  // ===========================================================================
  describe('3. Independent Reviewer Appeals & Governance', () => {
    const policy = new AppealPolicy();

    const sampleAppeal: AppealRecord = {
      id: 'appeal_001',
      caseId: 'case_999',
      appellantId: 'user_caribbean_creator',
      originalModeratorId: 'mod_alpha',
      reviewModeratorId: null,
      state: 'submitted',
    };

    it('strictly forbids the original decision-maker from presiding over the appeal (anti-bias gate)', () => {
      expect(policy.canAssignReviewer(sampleAppeal, 'mod_alpha')).toBe(false);
      expect(policy.canAssignReviewer(sampleAppeal, 'mod_beta')).toBe(true);
    });

    it('refuses reviewer assignment if the appeal is not in submitted state', () => {
      const activeAppeal: AppealRecord = {
        ...sampleAppeal,
        state: 'under_review',
        reviewModeratorId: 'mod_beta',
      };
      expect(policy.canAssignReviewer(activeAppeal, 'mod_gamma')).toBe(false);
    });

    it('refuses resolution attempts when appeal has not entered under_review', () => {
      expect(() => policy.resolve(sampleAppeal, true)).toThrow(
        'Appeal must be under_review to resolve'
      );
    });

    it('correctly transitions appeal state to overturned or upheld', () => {
      const underReviewAppeal: AppealRecord = {
        ...sampleAppeal,
        state: 'under_review',
        reviewModeratorId: 'mod_beta',
      };

      const overturned = policy.resolve(underReviewAppeal, true);
      expect(overturned.state).toBe('overturned');
      expect(overturned.reviewModeratorId).toBe('mod_beta');

      const upheld = policy.resolve(underReviewAppeal, false);
      expect(upheld.state).toBe('upheld');
      expect(upheld.reviewModeratorId).toBe('mod_beta');
    });
  });
});
