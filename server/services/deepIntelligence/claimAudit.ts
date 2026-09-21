export interface EvidenceItem {
  id: string;
  sourceType: 'readme' | 'manifest' | 'file' | 'commit' | 'pull_request' | 'issue' | 'metadata';
  reference: string;
  excerpt: string;
}

export interface AuditedClaim {
  claim: string;
  status: 'supported' | 'needs_review' | 'unsupported';
  confidence: number;
  supportingEvidence: string[];
  reason: string;
}

export interface ClaimAudit {
  claims: AuditedClaim[];
  warnings: string[];
  passed: boolean;
}

const STOP_WORDS = new Set('the a an and or but for with from into this that was were are is to of in on it its our we you they their have has had will can may not only than then what when where how من و أو لكن مع من إلى هذا هذه ذلك كان كانت هو هي في على عن نحن هم همّ قد سوف يمكن ليس فقط ثم ماذا متى أين كيف تم'.split(' '));

// These words widen a claim beyond the concrete change described by most
// repository evidence. They need explicit support; lexical overlap alone is
// not enough to let an absolute promise pass the audit.
const ABSOLUTE_OR_PROMISE_TERMS = new Set([
  'all', 'every', 'always', 'never', 'guarantee', 'guarantees', 'guaranteed',
  'zero', '100%', 'كل', 'دائماً', 'دائمًا', 'أبداً', 'أبدًا', 'يضمن', 'ضمان', 'صفر',
]);

// Outcome language is a semantic expansion beyond merely describing a code
// change. It must appear in the evidence too; otherwise a claim such as
// “added retries, making the service reliable” would be allowed by sharing
// only the noun “retries”. This is deliberately an explainable guard, not a
// claim that deterministic matching replaces natural-language entailment.
const OUTCOME_TERMS = new Set([
  'faster', 'fast', 'slower', 'reliable', 'reliability', 'secure', 'security',
  'safer', 'scalable', 'scalability', 'stable', 'stability', 'performance',
  'latency', 'outage', 'outages', 'prevents', 'prevent', 'avoids', 'avoid',
  'improves', 'improve', 'improved', 'reduces', 'reduce', 'reduced',
  'أسرع', 'سرعة', 'موثوق', 'موثوقية', 'آمن', 'أمان', 'قابلية', 'الأداء',
  'زمن', 'يمنع', 'منع', 'يتجنب', 'تجنب', 'يحسن', 'حسن', 'يقلل', 'خفض',
  'schneller', 'zuverlässig', 'sicherheit', 'sicher', 'skalierbar',
  'leistung', 'latenz', 'verhindert', 'verbessert', 'reduziert',
]);

// A claim must not pass merely because it repeats the same nouns as evidence
// when the direction of the change is opposite. This is intentionally small
// and deterministic: it is a safety guard, not an attempt to replace a full
// semantic evaluator.
const CONTRASTING_ACTION_GROUPS: Array<[string[], string[]]> = [
  [['add', 'added', 'introduce', 'introduced', 'implement', 'implemented', 'create', 'created', 'built', 'build', 'أضفنا', 'أضف', 'أنشأنا', 'أنشأ', 'نفذنا', 'نفذ', 'entwickelt', 'entwickelte', 'hinzugefügt'], ['remove', 'removed', 'delete', 'deleted', 'deprecate', 'deprecated', 'removed', 'حذفنا', 'حذف', 'أزلنا', 'أزال', 'entfernt', 'gelöscht']],
  [['fix', 'fixed', 'resolve', 'resolved', 'repair', 'repaired', 'أصلحنا', 'أصلح', 'حللنا', 'حل', 'behoben', 'repariert'], ['break', 'broke', 'broken', 'cause', 'caused', 'introduced a bug', 'كسرنا', 'تسببنا', 'verursacht']],
  [['reduce', 'reduced', 'improve', 'improved', 'faster', 'optimized', 'optimize', 'خفضنا', 'خفض', 'حسنّا', 'حسّنا', 'حسّن', 'schneller', 'optimiert'], ['increase', 'increased', 'worsen', 'worsened', 'slower', 'regressed', 'زاد', 'زدنا', 'ساء', 'بطّأنا', 'verlangsamt', 'verschlechtert']],
  [['enable', 'enabled', 'support', 'supports', 'supported', 'يسمح', 'يدعم', 'يدعم', 'ermöglicht', 'unterstützt'], ['disable', 'disabled', 'block', 'blocked', 'منع', 'يعطل', 'عطّل', 'deaktiviert', 'blockiert']],
];

type ActionRelation = 'matching' | 'opposing' | 'missing' | 'not_applicable';

type ObjectRelation = 'matching' | 'missing' | 'not_applicable';

const ALL_ACTION_TERMS = new Set(CONTRASTING_ACTION_GROUPS.flatMap(([positive, negative]) => [...positive, ...negative]).map(term => term.toLowerCase()));

function actionRelation(claim: string, evidence: EvidenceItem): ActionRelation {
  const evidenceValue = evidenceText(evidence);
  let claimHasAction = false;

  for (const [positive, negative] of CONTRASTING_ACTION_GROUPS) {
    const claimPositive = containsAction(claim, positive);
    const claimNegative = containsAction(claim, negative);
    const evidencePositive = containsAction(evidenceValue, positive);
    const evidenceNegative = containsAction(evidenceValue, negative);

    if (!claimPositive && !claimNegative) continue;
    claimHasAction = true;

    const claimDirection = claimPositive && !claimNegative ? 'positive' : claimNegative && !claimPositive ? 'negative' : 'mixed';
    const evidenceDirection = evidencePositive && !evidenceNegative ? 'positive' : evidenceNegative && !evidencePositive ? 'negative' : 'mixed';
    if (claimDirection === evidenceDirection && claimDirection !== 'mixed') return 'matching';
    if ((claimDirection === 'positive' && evidenceDirection === 'negative') || (claimDirection === 'negative' && evidenceDirection === 'positive')) {
      return 'opposing';
    }
  }

  return claimHasAction ? 'missing' : 'not_applicable';
}

function objectTerms(value: string): Set<string> {
  return new Set([...terms(value)].filter(term => !ALL_ACTION_TERMS.has(term)));
}

function objectRelation(claim: string, evidence: EvidenceItem): ObjectRelation {
  const claimHasAction = CONTRASTING_ACTION_GROUPS.some(([positive, negative]) => containsAction(claim, [...positive, ...negative]));
  if (!claimHasAction) return 'not_applicable';

  const evidenceValue = evidenceText(evidence);
  const evidenceHasAction = CONTRASTING_ACTION_GROUPS.some(([positive, negative]) => containsAction(evidenceValue, [...positive, ...negative]));
  if (!evidenceHasAction) return 'missing';

  const claimObjects = objectTerms(claim);
  const evidenceObjects = objectTerms(evidenceValue);
  if (claimObjects.size === 0 || evidenceObjects.size === 0) return 'missing';

  const overlap = [...claimObjects].filter(term => evidenceObjects.has(term)).length;
  // This is deliberately a conservative object-coverage check. It catches a
  // claim that reuses an action verb but swaps in a different changed object;
  // it does not pretend to solve full natural-language entailment.
  return overlap / claimObjects.size >= 0.65 ? 'matching' : 'missing';
}

function terms(value: string): Set<string> {
  return new Set((value.toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}+#.-]{2,}/gu) || [])
    .map(term => term.replace(/^[+#.-]+|[+#.-]+$/g, ''))
    .filter(term => term.length >= 3)
    .filter(term => !STOP_WORDS.has(term)));
}

function evidenceText(evidence: EvidenceItem): string {
  return `${evidence.excerpt} ${evidence.reference}`;
}

function unsupportedQualifiers(claim: string, evidence: EvidenceItem): string[] {
  const claimTerms = terms(claim);
  const evidenceTerms = terms(evidenceText(evidence));
  return [...claimTerms].filter(term => ABSOLUTE_OR_PROMISE_TERMS.has(term) && !evidenceTerms.has(term));
}

function unsupportedOutcomeTerms(claim: string, evidence: EvidenceItem): string[] {
  const claimTerms = terms(claim);
  const evidenceTerms = terms(evidenceText(evidence));
  return [...claimTerms].filter(term => OUTCOME_TERMS.has(term) && !evidenceTerms.has(term));
}

function unsupportedNumbers(claim: string, evidence: EvidenceItem): string[] {
  const claimNumbers = claim.match(/\b\d+(?:\.\d+)?%?\b/g) || [];
  const evidenceNumbers = evidenceText(evidence).match(/\b\d+(?:\.\d+)?%?\b/g) || [];
  return claimNumbers.filter(number => !evidenceNumbers.includes(number));
}

function containsAction(value: string, actions: string[]): boolean {
  const lower = value.toLowerCase();
  return actions.some(action => lower.includes(action.toLowerCase()));
}

function contradictoryAction(claim: string, evidence: EvidenceItem): string | undefined {
  const evidenceValue = evidenceText(evidence);
  for (const [positive, negative] of CONTRASTING_ACTION_GROUPS) {
    if (containsAction(claim, positive) && containsAction(evidenceValue, negative)) return 'change direction';
    if (containsAction(claim, negative) && containsAction(evidenceValue, positive)) return 'change direction';
  }
  return undefined;
}

function splitClaims(post: string): string[] {
  return post
    .split(/\n+|(?<=[.!?])\s+/)
    .map(part => part.replace(/^[-*•\d.)\s]+/, '').trim())
    // Short factual statements still need review. Only discard fragments that
    // are too small to be a sentence at all; otherwise a concise claim such as
    // "We shipped v2." could bypass the evidence audit entirely.
    .filter(part => part.length >= 8 && !/^https?:\/\//i.test(part) && !/^#/.test(part));
}

function scoreClaim(claim: string, evidence: EvidenceItem): number {
  const claimTerms = terms(claim);
  const evidenceTerms = terms(evidenceText(evidence));
  if (claimTerms.size === 0 || evidenceTerms.size === 0) return 0;
  const overlap = [...claimTerms].filter(term => evidenceTerms.has(term)).length;
  // Score coverage across the entire claim. Capping the denominator at a small
  // number lets a long claim append unsupported facts while repeating a few
  // nouns from the evidence. Those extra facts must lower confidence and move
  // the claim to human review instead of being hidden by lexical overlap.
  const overlapScore = overlap / Math.max(1, claimTerms.size);
  const numericGaps = unsupportedNumbers(claim, evidence);
  const numericSupport = numericGaps.length === 0 ? 0.2 : -0.35;
  const qualifierGaps = unsupportedQualifiers(claim, evidence);
  const qualifierSupport = qualifierGaps.length === 0 ? 0.05 : -0.45;
  const outcomeGaps = unsupportedOutcomeTerms(claim, evidence);
  const outcomeSupport = outcomeGaps.length === 0 ? 0.05 : -0.35;
  const contradictionPenalty = contradictoryAction(claim, evidence) ? -0.55 : 0;
  // A noun match is not enough: “added cache” must be supported by evidence
  // describing an addition, not merely mentioning the cache. This remains a
  // deterministic guard and intentionally escalates ambiguous language to a
  // human instead of pretending to perform full natural-language entailment.
  const relation = actionRelation(claim, evidence);
  const semanticRelationScore = relation === 'matching' ? 0.12 : relation === 'opposing' ? -0.45 : relation === 'missing' ? -0.18 : 0;
  const objectSemanticRelation = objectRelation(claim, evidence);
  const objectRelationScore = objectSemanticRelation === 'matching' ? 0.08 : objectSemanticRelation === 'missing' ? -0.24 : 0;
  const sourceWeight = evidence.sourceType === 'file' || evidence.sourceType === 'commit' ? 0.15 : 0.05;
  return Math.max(0, Math.min(1, overlapScore * 0.6 + numericSupport + qualifierSupport + outcomeSupport + contradictionPenalty + semanticRelationScore + objectRelationScore + sourceWeight));
}

export function auditDraftClaims(post: string, evidence: EvidenceItem[]): ClaimAudit {
  const claims = splitClaims(post).map(claim => {
    const candidates = evidence
      .map(item => ({ item, score: scoreClaim(claim, item) }))
      .sort((a, b) => b.score - a.score);
    const ranked = candidates.filter(result => result.score >= 0.2).slice(0, 3);
    const confidence = ranked[0]?.score || 0;
    const supportingEvidence = ranked.map(result => result.item.id);
    const qualifierGap = ranked[0]
      ? unsupportedQualifiers(claim, ranked[0].item)
      : [...terms(claim)].filter(term => ABSOLUTE_OR_PROMISE_TERMS.has(term));
    const outcomeGap = ranked[0]
      ? unsupportedOutcomeTerms(claim, ranked[0].item)
      : [...terms(claim)].filter(term => OUTCOME_TERMS.has(term));
    const strongestEvidence = ranked[0]?.item;
    const claimTerms = terms(claim);
    const evidenceTerms = strongestEvidence ? terms(evidenceText(strongestEvidence)) : new Set<string>();
    const uncoveredTerms = [...claimTerms].filter(term => !evidenceTerms.has(term));
    const contradiction = (ranked[0] || candidates[0]) ? contradictoryAction(claim, (ranked[0] || candidates[0]).item) : undefined;
    const objectRelationGap = ranked[0]
      ? objectRelation(claim, ranked[0].item) === 'missing'
      : false;
    const numericGap = ranked[0]
      ? unsupportedNumbers(claim, ranked[0].item)
      : [...(claim.match(/\b\d+(?:\.\d+)?%?\b/g) || [])];
    const safetyGap = qualifierGap.length > 0 || outcomeGap.length > 0 || numericGap.length > 0 || Boolean(contradiction) || objectRelationGap;
    const status: AuditedClaim['status'] = !safetyGap && confidence >= 0.62
      ? 'supported'
      : confidence >= 0.35 ? 'needs_review' : 'unsupported';
    const reason = status === 'supported'
      ? `Matched ${supportingEvidence.length} evidence item${supportingEvidence.length === 1 ? '' : 's'} with sufficient lexical, numeric, qualifier, and source support.`
      : status === 'needs_review'
        ? contradiction
          ? 'The claim appears to reverse the direction of change described by the strongest evidence item; human review is required.'
          : qualifierGap.length > 0
          ? `Evidence overlaps with this claim, but does not explicitly support the qualifier${qualifierGap.length === 1 ? '' : 's'}: ${qualifierGap.join(', ')}.`
          : outcomeGap.length > 0
          ? `Evidence describes the change but does not explicitly support the outcome term${outcomeGap.length === 1 ? '' : 's'}: ${outcomeGap.join(', ')}.`
          : numericGap.length > 0
          ? `Evidence does not contain the exact numeric value${numericGap.length === 1 ? '' : 's'}: ${numericGap.join(', ')}.`
          : objectRelationGap
          ? 'The evidence mentions a related action, but does not cover the changed object described by this claim. Human review is required.'
          : uncoveredTerms.length > 0
          ? `Evidence supports part of this claim, but these terms are not grounded by the strongest source: ${uncoveredTerms.slice(0, 5).join(', ')}. Human review is required.`
          : 'Evidence partially overlaps with this claim, but a human should confirm the wording before copying or publishing.'
        : qualifierGap.length > 0
          ? `No evidence item met the minimum support threshold, and the claim contains unsupported qualifier${qualifierGap.length === 1 ? '' : 's'}: ${qualifierGap.join(', ')}.`
          : contradiction
            ? 'The claim reverses the direction of change described by the strongest evidence item.'
          : outcomeGap.length > 0
            ? `The strongest evidence does not support these outcome terms: ${outcomeGap.slice(0, 5).join(', ')}.`
          : numericGap.length > 0
            ? `The strongest evidence does not contain the exact numeric value${numericGap.length === 1 ? '' : 's'}: ${numericGap.join(', ')}.`
          : objectRelationGap
            ? 'The strongest evidence does not cover the changed object described by this claim.'
          : uncoveredTerms.length > 0
            ? `The strongest evidence does not ground these claim terms: ${uncoveredTerms.slice(0, 5).join(', ')}.`
          : 'No evidence item met the minimum support threshold for this claim.';
    return {
      claim,
      status,
      confidence: Number(confidence.toFixed(2)),
      supportingEvidence,
      reason,
    };
  });
  const warnings = claims
    .filter(claim => claim.status !== 'supported')
    .map(claim => claim.status === 'unsupported'
      ? `Unsupported factual claim requires removal or human context; human review required: ${claim.claim}`
      : `Claim requires human review before publishing: ${claim.claim}`);
  return { claims, warnings, passed: warnings.length === 0 };
}
