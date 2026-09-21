import { describe, expect, it } from 'vitest';
import { contentQualityCases, repoUrl } from '../fixtures/contentQualityCases';
import { evaluateDraftQuality } from '../../server/services/deepIntelligence/contentEvaluation';

describe('content quality golden/regression invariants', () => {
  for (const testCase of contentQualityCases) {
    it(`${testCase.id} (${testCase.category})`, () => {
      const result = evaluateDraftQuality({
        post: testCase.post,
        suggestedComment: testCase.suggestedComment,
        evidence: testCase.evidence,
        repoUrl,
        audience: 'tech_community',
        intent: 'weekly_progress',
        language: 'en',
      });

      expect(result.passed).toBe(testCase.expected.pass);
      if (testCase.expected.mustContainEvidenceId) {
        expect(result.claimAudit.claims.flatMap(claim => claim.supportingEvidence)).toContain(testCase.expected.mustContainEvidenceId);
      }
      if (testCase.expected.mustWarn) {
        expect(result.warnings.join(' ').toLowerCase()).toContain(testCase.expected.mustWarn);
      }
    });
  }

  it('rejects a URL in the post body and requires the exact CTA URL in the comment', () => {
    const result = evaluateDraftQuality({
      post: 'We shipped a grounded repository map. https://example.com/incorrect',
      suggestedComment: 'See the project here: https://github.com/example/other',
      evidence: [{ id: 'file:map.ts', sourceType: 'file', reference: 'map.ts', excerpt: 'Added a grounded repository map.' }],
      repoUrl,
    });

    expect(result.passed).toBe(false);
    expect(result.hardFailures).toEqual(expect.arrayContaining([
      'Draft body contains a URL; URLs belong in the suggested comment.',
      'Suggested comment does not contain the exact verified CTA URL.',
    ]));
  });

  it('uses quality invariants instead of exact wording for a valid regression variant', () => {
    const result = evaluateDraftQuality({
      post: 'Changed-file prioritization now guides repository analysis. This keeps the evidence pack focused on the engineering work that actually moved.',
      suggestedComment: `Explore the code: ${repoUrl}`,
      evidence: [{ id: 'file:map.ts', sourceType: 'file', reference: 'map.ts', excerpt: 'Changed-file prioritization now guides repository analysis. This keeps the evidence pack focused on the engineering work that actually moved.' }],
      repoUrl,
      audience: 'software engineers',
      intent: 'technical_deep_dive',
      language: 'en',
    });

    expect(result.passed).toBe(true);
    expect(result.metrics.factualGrounding).toBeGreaterThanOrEqual(0.8);
    expect(result.metrics.ctaCorrectness).toBe(1);
    expect(result.score).toBeGreaterThanOrEqual(0.7);
  });

  it('evaluates the selected product CTA instead of forcing the repository URL', () => {
    const productUrl = 'https://authority.example.com';
    const result = evaluateDraftQuality({
      post: 'Authority turns verified engineering changes into a clear product story. The evidence pack keeps the launch grounded in what the repository actually documents.',
      suggestedComment: `See the product: ${productUrl}`,
      evidence: [{ id: 'file:readme', sourceType: 'file', reference: 'README.md', excerpt: 'Authority turns verified engineering changes into a clear product story. The evidence pack keeps the launch grounded in what the repository actually documents.' }],
      repoUrl,
      ctaUrl: productUrl,
      audience: 'tech_community',
      intent: 'project_launch',
      language: 'en',
    });

    expect(result.passed).toBe(true);
    expect(result.metrics.ctaCorrectness).toBe(1);
    expect(result.hardFailures).not.toContain('Suggested comment does not contain the exact verified CTA URL.');
  });
});
