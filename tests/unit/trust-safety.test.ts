import { describe, it, expect } from 'vitest';
import {
  ContentRiskEngine,
  AppealPolicy,
  priorityForReason,
  DEFAULT_THRESHOLDS,
} from '../../packages/trust-safety/src/index';

describe('Content risk engine (human-in-the-loop)', () => {
  const engine = new ContentRiskEngine();

  it('allows clean content', () => {
    const evaluation = engine.evaluate({ spam: 0.05, toxicity: 0.02 });
    expect(evaluation.decision).toBe('allow');
  });

  it('routes mid-risk content to human review, never to auto-removal', () => {
    const evaluation = engine.evaluate({ spam: 0.7, toxicity: 0.4 });
    expect(evaluation.decision).toBe('review');
    expect(evaluation.autoRestricted).toBe(false);
  });

  it('auto-restricts only the defined high-confidence dimensions', () => {
    const evaluation = engine.evaluate({ imageSafety: 0.99 });
    expect(evaluation.decision).toBe('restrict');
    expect(evaluation.autoRestricted).toBe(true);
    expect(evaluation.priority).toBe('critical');
  });

  it('keeps other high-risk dimensions in human review even at extreme scores', () => {
    const evaluation = engine.evaluate({ fraud: 1.0 });
    expect(evaluation.decision).toBe('review');
    expect(evaluation.autoRestricted).toBe(false);
    expect(evaluation.priority).toBe('critical');
  });

  it('rejects inverted thresholds', () => {
    expect(() => new ContentRiskEngine({ reviewThreshold: 0.9, restrictThreshold: 0.5 })).toThrow(
      'reviewThreshold must be lower',
    );
  });

  it('uses default thresholds sanely', () => {
    expect(DEFAULT_THRESHOLDS.reviewThreshold).toBeLessThan(DEFAULT_THRESHOLDS.restrictThreshold);
  });
});

describe('Appeals policy (independent reviewer)', () => {
  const policy = new AppealPolicy();
  const appeal = {
    id: 'ap_1',
    caseId: 'case_1',
    appellantId: 'usr_1',
    originalModeratorId: 'mod_1',
    reviewModeratorId: null,
    state: 'submitted' as const,
  };

  it('blocks the original moderator from reviewing the appeal', () => {
    expect(policy.canAssignReviewer(appeal, 'mod_1')).toBe(false);
    expect(policy.canAssignReviewer(appeal, 'mod_2')).toBe(true);
  });

  it('resolves appeals only from under_review', () => {
    expect(() => policy.resolve(appeal, true)).toThrow('under_review');
    const assigned = { ...appeal, state: 'under_review' as const, reviewModeratorId: 'mod_2' };
    expect(policy.resolve(assigned, true).state).toBe('overturned');
    expect(policy.resolve(assigned, false).state).toBe('upheld');
  });
});

describe('Report prioritization', () => {
  it('escalates child safety and self harm to critical', () => {
    expect(priorityForReason('child_safety')).toBe('critical');
    expect(priorityForReason('self_harm')).toBe('critical');
  });

  it('treats hate speech and fraud as high priority', () => {
    expect(priorityForReason('hate_speech')).toBe('high');
    expect(priorityForReason('scam_fraud')).toBe('high');
  });
});
