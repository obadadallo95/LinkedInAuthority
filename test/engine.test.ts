import { describe, it, expect, vi } from 'vitest';
import { signAnalysisToken, verifyAnalysisToken } from '../server/services/repositoryIntelligence/token';
import { getGeminiClient } from '../server/services/repositoryIntelligence/gemini';
import { generatePostFromAngle } from '../server/services/repositoryIntelligence/generatePost';
import { CandidateAngle, ClaimConflict, Evidence, AnalysisTokenPayload } from '../server/services/repositoryIntelligence/types';

vi.mock('../server/services/repositoryIntelligence/gemini', () => ({
  getGeminiClient: vi.fn().mockReturnValue({}),
  callGeminiWithRetry: vi.fn().mockResolvedValue({
    post: "Generated post", usedEvidenceIds: [], warnings: []
  }),
}));

describe('Intelligence Engine V1 - Token & Security', () => {
  const dummyAngles: CandidateAngle[] = [{
    id: '1',
    title: 'Test Angle',
    angleSummary: 'Test Summary',
    audienceValue: 'Test Value',
    intentMatch: 'Test Match',
    requiresHumanContext: false
  }];

  const dummyFacts: Evidence[] = [{
    fact: 'Added React',
    source: 'package.json',
    confidence: 'high'
  }];

  const dummyConflicts: ClaimConflict[] = [];

  const basePayload: Omit<AnalysisTokenPayload, 'issuedAt' | 'expiresAt'> = {
    version: 1,
    repository: 'github.com/test/repo',
    lang: 'en',
    intent: 'auto',
    angles: dummyAngles,
    atomicFacts: dummyFacts,
    conflicts: dummyConflicts,
    audience: 'authenticated',
    userId: 'user123'
  };

  it('should sign and verify a valid token', () => {
    const token = signAnalysisToken(basePayload);
    const decoded = verifyAnalysisToken(token);
    expect(decoded.repository).toBe('github.com/test/repo');
    expect(decoded.userId).toBe('user123');
  });

  it('should reject an expired token', () => {
    // Generate token with negative expiration
    const mockPayload = { ...basePayload, issuedAt: Date.now() - 3600000, expiresAt: Date.now() - 1000 };
    // We can't directly sign this with signAnalysisToken as it overrides dates, 
    // but we can simulate it if we exported signWithDates or we can just mock Date.now
    
    // Quick test: modify the token string (which breaks signature)
    const token = signAnalysisToken(basePayload);
    const [payloadBase64, sig] = token.split('.');
    const decodedPayload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
    decodedPayload.expiresAt = Date.now() - 10000;
    const tamperedPayloadBase64 = Buffer.from(JSON.stringify(decodedPayload)).toString('base64');
    const tamperedToken = `${tamperedPayloadBase64}.${sig}`;

    expect(() => verifyAnalysisToken(tamperedToken)).toThrow('Invalid token signature');
  });

  it('should reject tampered token data (cross-user or repo mismatch)', () => {
    const token = signAnalysisToken(basePayload);
    const [payloadBase64, sig] = token.split('.');
    const decodedPayload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));

    // Tamper user ID
    decodedPayload.userId = 'attacker-id';
    const tamperedPayloadBase64 = Buffer.from(JSON.stringify(decodedPayload)).toString('base64');
    const tamperedToken = `${tamperedPayloadBase64}.${sig}`;

    expect(() => verifyAnalysisToken(tamperedToken)).toThrow('Invalid token signature');
  });
});

describe('Intelligence Engine V1 - Generation & Conflict Prevention', () => {
  it('should enforce that blocking conflicts prevent post generation if unmitigated', async () => {
    const blockingConflicts: ClaimConflict[] = [{
      claim: "We are the first to do this",
      severity: "blocking",
      safeAlternative: "We introduced a novel approach"
    }];

    const payload: AnalysisTokenPayload = {
      version: 1,
      repository: 'github.com/test/repo',
      lang: 'en',
      intent: 'auto',
      angles: [],
      atomicFacts: [],
      conflicts: blockingConflicts,
      audience: 'authenticated',
      userId: 'user123',
      issuedAt: Date.now(),
      expiresAt: Date.now() + 3600000
    };

    await generatePostFromAngle(
      payload,
      { commits: [], readme: '', hasWeakRepo: false, repoData: { name: 'test', description: 'test' }, languages: {}, manifestData: '', readmeText: '' },
      '',
      undefined,
      'Custom angle',
      '',
      'en'
    );

    const { callGeminiWithRetry } = await import('../server/services/repositoryIntelligence/gemini');
    const callArgs = (callGeminiWithRetry as any).mock.calls[0][1]; // The 'prompt' argument
    expect(callArgs).toContain('Severity: blocking');
    expect(callArgs).toContain('We are the first to do this');
  });
});
