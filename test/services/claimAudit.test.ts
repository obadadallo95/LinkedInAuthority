import { describe, expect, it } from 'vitest';
import { auditDraftClaims } from '../../server/services/deepIntelligence/claimAudit';

describe('claim audit', () => {
  const evidence = [{
    id: 'file:src/fix.ts',
    sourceType: 'file' as const,
    reference: 'github:file:src/fix.ts@abc',
    excerpt: 'Added keyboard layout detection and fixed UTF-8 conversion for Arabic text.',
  }];

  it('links a grounded claim to evidence and passes it', () => {
    const audit = auditDraftClaims('We added keyboard layout detection and fixed UTF-8 conversion for Arabic text.', evidence);
    expect(audit.passed).toBe(true);
    expect(audit.claims[0].supportingEvidence).toContain('file:src/fix.ts');
    expect(audit.claims[0].reason).toContain('evidence item');
  });

  it('does not treat an unsupported numeric claim as grounded', () => {
    const audit = auditDraftClaims('The release reduced latency by 99% across every production deployment.', evidence);
    expect(audit.passed).toBe(false);
    expect(audit.claims[0].status).not.toBe('supported');
    expect(audit.claims[0].reason).toBeTruthy();
  });

  it('does not let lexical overlap prove an unsupported absolute promise', () => {
    const audit = auditDraftClaims('We added keyboard layout detection and guarantee zero data loss in every production deployment.', evidence);
    expect(audit.passed).toBe(false);
    expect(audit.claims[0].status).not.toBe('supported');
    expect(audit.claims[0].reason).toContain('qualifier');
  });

  it('uses an evidence reference as an additional grounding signal', () => {
    const referencedEvidence = [{
      id: 'file:src/reliability.ts',
      sourceType: 'file' as const,
      reference: 'src/reliability.ts',
      excerpt: 'Added a bounded retry policy for transient failures.',
    }];
    const audit = auditDraftClaims('The reliability.ts module now has a bounded retry policy for transient failures.', referencedEvidence);
    expect(audit.passed).toBe(true);
    expect(audit.claims[0].supportingEvidence).toContain('file:src/reliability.ts');
  });

  it('audits Arabic claims using the same evidence grounding rules', () => {
    const arabicEvidence = [{
      id: 'file:src/arabic.ts',
      sourceType: 'file' as const,
      reference: 'github:file:src/arabic.ts@abc',
      excerpt: 'أضفنا اكتشاف تخطيط لوحة المفاتيح وأصلحنا تحويل UTF-8 للنص العربي.',
    }];
    const audit = auditDraftClaims('أضفنا اكتشاف تخطيط لوحة المفاتيح وأصلحنا تحويل UTF-8 للنص العربي.', arabicEvidence);
    expect(audit.passed).toBe(true);
    expect(audit.claims[0].status).toBe('supported');
    expect(audit.claims[0].supportingEvidence).toContain('file:src/arabic.ts');
  });

  it('rejects a claim that reverses the evidence change direction', () => {
    const performanceEvidence = [{
      id: 'commit:performance',
      sourceType: 'commit' as const,
      reference: 'commit:performance',
      excerpt: 'Reduced latency by removing a blocking database call.',
    }];
    const audit = auditDraftClaims('We increased latency by removing a blocking database call.', performanceEvidence);
    expect(audit.passed).toBe(false);
    expect(audit.claims[0].status).not.toBe('supported');
    expect(audit.claims[0].reason).toContain('direction');
  });

  it('does not pass noun overlap when the evidence omits the claimed change relation', () => {
    const evidenceWithoutChange = [{
      id: 'file:cache.ts',
      sourceType: 'file' as const,
      reference: 'src/cache.ts',
      excerpt: 'The cache module is documented for the repository architecture.',
    }];
    const audit = auditDraftClaims('We added a cache module for faster repository reads.', evidenceWithoutChange);
    expect(audit.passed).toBe(false);
    expect(audit.claims[0].status).not.toBe('supported');
  });

  it('does not pass when the action matches but the changed object is different', () => {
    const audit = auditDraftClaims(
      'We added a queue scheduler for repository reads.',
      [{
        id: 'file:cache.ts',
        sourceType: 'file' as const,
        reference: 'src/cache.ts',
        excerpt: 'Added a cache module for repository reads.',
      }],
    );
    expect(audit.passed).toBe(false);
    expect(audit.claims[0].status).not.toBe('supported');
    expect(audit.claims[0].reason).toContain('changed object');
  });

  it('does not hide an unsupported second clause behind a grounded first clause', () => {
    const audit = auditDraftClaims(
      'We added a bounded retry policy for transient failures and eliminated every production outage for all customers.',
      [{
        id: 'file:retry.ts',
        sourceType: 'file' as const,
        reference: 'src/retry.ts',
        excerpt: 'Added a bounded retry policy for transient failures.',
      }],
    );
    expect(audit.passed).toBe(false);
    expect(audit.claims[0].status).not.toBe('supported');
    expect(audit.claims[0].reason).toContain('qualifier');
  });

  it('does not let a short factual statement bypass the audit', () => {
    const audit = auditDraftClaims('We shipped v2.', evidence);
    expect(audit.claims).toHaveLength(1);
    expect(audit.claims[0].status).not.toBe('supported');
    expect(audit.passed).toBe(false);
  });

  it('does not infer an outcome from a related implementation noun', () => {
    const audit = auditDraftClaims(
      'We added bounded retries, making the service reliable.',
      [{
        id: 'file:retry.ts',
        sourceType: 'file' as const,
        reference: 'src/retry.ts',
        excerpt: 'Added bounded retries for transient failures.',
      }],
    );
    expect(audit.passed).toBe(false);
    expect(audit.claims[0].status).not.toBe('supported');
    expect(audit.claims[0].reason).toContain('outcome');
  });

  it('requires exact numeric evidence instead of substring matches', () => {
    const audit = auditDraftClaims(
      'The service handled 10 requests.',
      [{
        id: 'commit:load',
        sourceType: 'commit' as const,
        reference: 'commit:load',
        excerpt: 'The service handled 100 requests during the fixture run.',
      }],
    );
    expect(audit.passed).toBe(false);
    expect(audit.claims[0].status).not.toBe('supported');
  });
});
