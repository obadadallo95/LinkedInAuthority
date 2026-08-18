import { describe, it, expect, vi, beforeEach } from 'vitest';
import { performDeepScan } from '../../server/services/deepIntelligence';
import { generateDeepPost } from '../../server/services/deepIntelligence/deepPostGenerator';
import * as geminiModule from '../../server/services/repositoryIntelligence/gemini';

vi.mock('../../server/services/deepIntelligence/githubDeepFetcher', () => ({
  fetchDeepGithubContext: vi.fn().mockResolvedValue({
    owner: 'obadadallo',
    repo: 'KeyFixer',
    commits: [
      { message: 'feat: add auto layout detection', author: 'obadadallo', date: '2026-08-16', url: 'https://github.com/obadadallo/KeyFixer/commit/123' }
    ],
    pullRequests: []
  })
}));

describe('Deep Intelligence - Scan & Post Generation Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(geminiModule, 'getGeminiClient').mockReturnValue({} as any);
  });

  it('performs deep scan and synthesizes context via Gemini', async () => {
    vi.spyOn(geminiModule, 'callGeminiWithRetry').mockResolvedValueOnce({
      technicalDecisions: ['Adopted native keyboard event interception'],
      challengesSolved: ['Resolved race condition on quick layout switch'],
      newFeatures: ['Auto layout detection per application window'],
      summary: 'Delivered automatic application-specific keyboard switching.'
    });

    const scanResult = await performDeepScan('https://github.com/obadadallo/KeyFixer');

    expect(scanResult.githubContext.owner).toBe('obadadallo');
    expect(scanResult.githubContext.repo).toBe('KeyFixer');
    expect(scanResult.synthesizedContext.technicalDecisions).toContain('Adopted native keyboard event interception');
    expect(scanResult.synthesizedContext.summary).toContain('keyboard switching');
  });

  it('generates an evidence-based LinkedIn post draft from synthesized context', async () => {
    const mockSynthesizedContext = {
      hasMeaningfulContent: true,
      technicalDecisions: ['Adopted native keyboard event interception'],
      challengesSolved: ['Resolved race condition on quick layout switch'],
      newFeatures: ['Auto layout detection per application window'],
      summary: 'Delivered automatic application-specific keyboard switching.'
    };

    vi.spyOn(geminiModule, 'callGeminiWithRetry').mockResolvedValueOnce({
      post: 'Building KeyFixer: Solving OS keyboard layout race conditions.',
      suggestedComment: 'Read the full source on GitHub: https://github.com/obadadallo/KeyFixer'
    });

    const generated = await generateDeepPost(mockSynthesizedContext, 'https://github.com/obadadallo/KeyFixer', 'en');

    expect(generated.post).toContain('Building KeyFixer');
    expect(generated.suggestedComment).toContain('https://github.com/obadadallo/KeyFixer');
  });
});
