import { auditDraftClaims, ClaimAudit, EvidenceItem } from './claimAudit';

export type QualityMetricName =
  | 'factualGrounding'
  | 'specificity'
  | 'technicalCorrectness'
  | 'naturalTone'
  | 'audienceFit'
  | 'intentFit'
  | 'languageQuality'
  | 'ctaCorrectness';

export interface ContentQualityMetrics {
  factualGrounding: number;
  specificity: number;
  technicalCorrectness: number;
  naturalTone: number;
  audienceFit: number;
  intentFit: number;
  languageQuality: number;
  ctaCorrectness: number;
}

export interface ContentEvaluationInput {
  post: string;
  suggestedComment: string;
  evidence: EvidenceItem[];
  repoUrl: string;
  ctaUrl?: string;
  audience?: string;
  intent?: string;
  language?: string;
}

export interface ContentEvaluation {
  passed: boolean;
  score: number;
  metrics: ContentQualityMetrics;
  hardFailures: string[];
  warnings: string[];
  claimAudit: ClaimAudit;
}

const GENERIC_CLICHES = [
  'excited to announce',
  'game changer',
  'revolutionary',
  'unlock your potential',
  'in today\'s fast-paced world',
  'journey',
  'leverage the power of',
];

const URL_PATTERN = /https?:\/\/[^\s)]+/i;

function clamp(value: number): number {
  return Number(Math.max(0, Math.min(1, value)).toFixed(2));
}

function normalized(value: string): string {
  return value.trim().toLowerCase();
}

function hasTechnicalEvidence(evidence: EvidenceItem[]): boolean {
  return evidence.some(item => item.sourceType === 'file' || item.sourceType === 'commit' || item.sourceType === 'pull_request');
}

function specificityScore(post: string, evidence: EvidenceItem[], claimAudit: ClaimAudit): number {
  if (!post.trim() || evidence.length === 0) return 0;
  const supported = claimAudit.claims.filter(claim => claim.status === 'supported').length;
  const claimCoverage = claimAudit.claims.length === 0 ? 0 : supported / claimAudit.claims.length;
  const hasSourceSpecificDetail = evidence.some(item => {
    const tokens = item.excerpt.toLowerCase().match(/[a-z0-9+#.-]{4,}/g) || [];
    return tokens.some(token => post.toLowerCase().includes(token));
  });
  return clamp(claimCoverage * 0.7 + (hasSourceSpecificDetail ? 0.3 : 0));
}

function ctaScore(post: string, suggestedComment: string, ctaUrl: string): number {
  const exactUrl = normalized(ctaUrl);
  const commentHasExactUrl = normalized(suggestedComment).includes(exactUrl);
  const postHasUrl = URL_PATTERN.test(post);
  return clamp((commentHasExactUrl ? 0.7 : 0) + (postHasUrl ? 0 : 0.3));
}

export function evaluateDraftQuality(input: ContentEvaluationInput): ContentEvaluation {
  const claimAudit = auditDraftClaims(input.post, input.evidence);
  const post = normalized(input.post);
  const audience = normalized(input.audience || 'tech_community');
  const intent = normalized(input.intent || 'weekly_progress');
  const language = normalized(input.language || 'en');
  const verifiedCtaUrl = input.ctaUrl || input.repoUrl;
  const hardFailures: string[] = [];
  const warnings: string[] = [...claimAudit.warnings];

  if (!input.post.trim()) hardFailures.push('Draft body is empty.');
  if (input.evidence.length === 0) hardFailures.push('Draft has no evidence pack.');
  if (claimAudit.claims.some(claim => claim.status === 'unsupported')) {
    hardFailures.push('Draft contains unsupported factual claims.');
  }
  if (URL_PATTERN.test(input.post)) {
    hardFailures.push('Draft body contains a URL; URLs belong in the suggested comment.');
  }
  if (!normalized(input.suggestedComment).includes(normalized(verifiedCtaUrl))) {
    hardFailures.push('Suggested comment does not contain the exact verified CTA URL.');
  }

  const clichéCount = GENERIC_CLICHES.filter(cliché => post.includes(cliché)).length;
  const sentenceCount = input.post.split(/[.!?\n]+/).filter(Boolean).length;
  const technicalEvidence = hasTechnicalEvidence(input.evidence);
  const specificity = specificityScore(input.post, input.evidence, claimAudit);
  const metrics: ContentQualityMetrics = {
    factualGrounding: claimAudit.claims.length === 0
      ? 0
      : clamp(claimAudit.claims.filter(claim => claim.status === 'supported').length / claimAudit.claims.length),
    specificity,
    technicalCorrectness: clamp((technicalEvidence ? 0.6 : 0.2) + (claimAudit.passed ? 0.4 : 0)),
    naturalTone: clamp(1 - clichéCount * 0.25 - (sentenceCount > 18 ? 0.15 : 0)),
    audienceFit: audience.includes('technical') || audience.includes('engineer') || audience.includes('tech')
      ? clamp(technicalEvidence ? 1 : 0.4)
      : clamp(input.post.length >= 80 ? 0.9 : 0.5),
    intentFit: intent.includes('technical') || intent.includes('decision')
      ? clamp(technicalEvidence && sentenceCount >= 2 ? 1 : 0.4)
      : clamp(sentenceCount >= 2 ? 0.9 : 0.5),
    languageQuality: language === 'en' || language === 'de' || language === 'ar'
      ? clamp(input.post.length >= 40 && sentenceCount >= 2 ? 1 : 0.5)
      : 0.5,
    ctaCorrectness: ctaScore(input.post, input.suggestedComment, verifiedCtaUrl),
  };

  if (clichéCount > 0) warnings.push('Draft contains generic marketing language; review for a more specific engineering voice.');
  if (specificity < 0.6) warnings.push('Draft specificity is below the quality threshold.');

  const metricValues = Object.values(metrics);
  const score = clamp(metricValues.reduce((sum, value) => sum + value, 0) / metricValues.length);
  const passed = hardFailures.length === 0 && score >= 0.7 && metrics.factualGrounding >= 0.8 && metrics.ctaCorrectness === 1;
  return { passed, score, metrics, hardFailures, warnings, claimAudit };
}
