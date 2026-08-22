export type RiskDimension =
  | 'spam' | 'bot' | 'toxicity' | 'fraud' | 'maliciousUrl'
  | 'imageSafety' | 'videoSafety' | 'copyright' | 'accountRisk';

export interface ContentSignals {
  spam?: number;
  bot?: number;
  toxicity?: number;
  fraud?: number;
  maliciousUrl?: number;
  imageSafety?: number;
  videoSafety?: number;
  copyright?: number;
  accountRisk?: number;
}

export type ModerationDecision = 'allow' | 'review' | 'restrict';
export type ModerationPriority = 'critical' | 'high' | 'medium' | 'low';
export type ModeratorAction = 'remove' | 'restrict' | 'allow' | 'escalate';

export interface RiskEngineThresholds {
  reviewThreshold: number;
  restrictThreshold: number;
}

export const DEFAULT_THRESHOLDS: RiskEngineThresholds = {
  reviewThreshold: 0.5,
  restrictThreshold: 0.85,
};

export const AUTO_RESTRICT_DIMENSIONS: RiskDimension[] = ['imageSafety'];

export interface RiskEvaluation {
  decision: ModerationDecision;
  priority: ModerationPriority;
  maxDimension: RiskDimension | null;
  maxScore: number;
  autoRestricted: boolean;
}

export class ContentRiskEngine {
  private readonly thresholds: RiskEngineThresholds;

  public constructor(thresholds: RiskEngineThresholds = DEFAULT_THRESHOLDS) {
    if (thresholds.reviewThreshold >= thresholds.restrictThreshold) {
      throw new Error('reviewThreshold must be lower than restrictThreshold');
    }
    this.thresholds = thresholds;
  }

  public evaluate(signals: ContentSignals): RiskEvaluation {
    let maxDimension: RiskDimension | null = null;
    let maxScore = 0;
    (Object.keys(signals) as Array<keyof ContentSignals>).forEach((key) => {
      const score = signals[key];
      if (typeof score === 'number' && score > maxScore) {
        maxScore = score;
        maxDimension = key as RiskDimension;
      }
    });

    if (maxDimension && AUTO_RESTRICT_DIMENSIONS.includes(maxDimension) && maxScore >= this.thresholds.restrictThreshold) {
      return { decision: 'restrict', priority: 'critical', maxDimension, maxScore, autoRestricted: true };
    }

    if (maxScore >= this.thresholds.restrictThreshold) {
      return { decision: 'review', priority: maxScore >= 0.95 ? 'critical' : 'high', maxDimension, maxScore, autoRestricted: false };
    }
    if (maxScore >= this.thresholds.reviewThreshold) {
      return { decision: 'review', priority: 'medium', maxDimension, maxScore, autoRestricted: false };
    }
    return { decision: 'allow', priority: 'low', maxDimension, maxScore, autoRestricted: false };
  }
}

export type AppealState = 'submitted' | 'under_review' | 'upheld' | 'overturned';

export interface AppealRecord {
  id: string;
  caseId: string;
  appellantId: string;
  originalModeratorId: string;
  reviewModeratorId: string | null;
  state: AppealState;
}

export class AppealPolicy {
  public canAssignReviewer(appeal: AppealRecord, moderatorId: string): boolean {
    if (appeal.state !== 'submitted') return false;
    return moderatorId !== appeal.originalModeratorId;
  }

  public resolve(appeal: AppealRecord, overturn: boolean): AppealRecord {
    if (appeal.state !== 'under_review') {
      throw new Error('Appeal must be under_review to resolve');
    }
    return { ...appeal, state: overturn ? 'overturned' : 'upheld' };
  }
}

export type ReportReason =
  | 'spam' | 'harassment' | 'hate_speech' | 'scam_fraud' | 'misinformation'
  | 'impersonation' | 'self_harm' | 'child_safety' | 'copyright' | 'other';

export const REPORT_REASONS: ReportReason[] = [
  'spam', 'harassment', 'hate_speech', 'scam_fraud', 'misinformation',
  'impersonation', 'self_harm', 'child_safety', 'copyright', 'other',
];

export function priorityForReason(reason: ReportReason): ModerationPriority {
  switch (reason) {
    case 'child_safety':
    case 'self_harm':
      return 'critical';
    case 'hate_speech':
    case 'harassment':
    case 'scam_fraud':
    case 'impersonation':
      return 'high';
    case 'spam':
    case 'copyright':
    case 'misinformation':
      return 'medium';
    default:
      return 'low';
  }
}
