import { describe, expect, it, beforeEach, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  fetchWithTimeout: vi.fn(),
  fetchGithubContext: vi.fn(),
}));

vi.mock('../../server/services/github', () => ({
  fetchWithTimeout: mocks.fetchWithTimeout,
  fetchGithubContext: mocks.fetchGithubContext,
  cleanText: (value: string, limit: number) => value.slice(0, limit),
}));

import { fetchDeepGithubContext } from '../../server/services/deepIntelligence/githubDeepFetcher';

function response(body: unknown, ok = true) {
  return {
    ok,
    status: ok ? 200 : 500,
    json: vi.fn().mockResolvedValue(body),
    text: vi.fn().mockResolvedValue(typeof body === 'string' ? body : JSON.stringify(body)),
  };
}

describe('incremental deep GitHub context', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.fetchGithubContext.mockResolvedValue({
      owner: 'owner',
      repo: 'repo',
      repoData: {
        name: 'repo',
        description: 'fixture',
        default_branch: 'main',
        homepage: undefined,
        topics: [],
      },
      languages: { TypeScript: 100 },
      readmeText: 'A sufficiently detailed README for the fixture repository.',
      manifestData: '--- package.json ---',
      hasWeakRepo: false,
    });
    mocks.fetchWithTimeout.mockImplementation(async (url: string) => {
      if (url.includes('/git/trees/')) {
        return response({
          sha: 'new',
          tree: [
            { path: 'package.json', type: 'blob', size: 100 },
            { path: 'src/new.ts', type: 'blob', size: 100 },
          ],
        });
      }
      if (url.includes('/compare/')) {
        return response({
          files: [{ filename: 'src/new.ts' }],
          commits: [{ sha: 'new', commit: { message: 'feat: new story', author: { date: '2026-09-21', name: 'new-author' } } }],
        });
      }
      if (url.includes('/commits?')) {
        return response([
          { sha: 'new', commit: { message: 'feat: new story', author: { date: '2026-09-21', name: 'new-author' } } },
          { sha: 'old', commit: { message: 'chore: old work', author: { date: '2026-09-19', name: 'old-author' } } },
        ]);
      }
      if (url.includes('/pulls?')) {
        return response([
          { title: 'New PR', body: 'new', merged_at: '2026-09-21T01:00:00Z', updated_at: '2026-09-21T01:00:00Z' },
          { title: 'Old PR', body: 'old', merged_at: '2026-09-19T01:00:00Z', updated_at: '2026-09-19T01:00:00Z' },
        ]);
      }
      if (url.includes('/issues?')) {
        return response([
          { title: 'New issue', body: 'new', updated_at: '2026-09-21T02:00:00Z', state: 'open' },
          { title: 'Old issue', body: 'old', updated_at: '2026-09-19T02:00:00Z', state: 'closed' },
        ]);
      }
      return response('export const changed = true;');
    });
  });

  it('passes only commit/PR/issue activity after the previous checkpoint', async () => {
    const context = await fetchDeepGithubContext(
      'https://github.com/owner/repo',
      undefined,
      { monitorCommits: true, monitorPullRequests: true, monitorIssues: true },
      {
        analyzedCommitSha: 'old',
        defaultBranch: 'main',
        pullRequestUpdatedAt: '2026-09-20T00:00:00Z',
        issueUpdatedAt: '2026-09-20T00:00:00Z',
      },
    );

    expect(context.commits.map(commit => commit.message)).toEqual(['feat: new story']);
    expect(context.pullRequests.map(pr => pr.title)).toEqual(['New PR']);
    expect(context.issues.map(issue => issue.title)).toEqual(['New issue']);
    expect(context.repositoryMap?.recentChangedFiles).toEqual(['src/new.ts']);
    expect(context.repositoryMap?.analyzedCommitSha).toBe('new');
    expect(mocks.fetchWithTimeout).toHaveBeenCalledWith(
      expect.stringContaining('/compare/old...new'),
      expect.anything(),
    );
  });

  it('reuses unchanged selected files from the previous snapshot during a successful delta', async () => {
    const context = await fetchDeepGithubContext(
      'https://github.com/owner/repo',
      undefined,
      { monitorCommits: true, monitorPullRequests: false, monitorIssues: false },
      {
        analyzedCommitSha: 'old',
        defaultBranch: 'main',
        selectedFiles: [{
          path: 'package.json',
          content: '{"name":"previous"}',
          source: 'github:file:package.json@old',
        }],
      },
    );

    const rawRequests = mocks.fetchWithTimeout.mock.calls
      .map(([url]) => String(url))
      .filter(url => url.includes('raw.githubusercontent.com'));
    expect(rawRequests.some(url => url.endsWith('/package.json'))).toBe(false);
    expect(rawRequests.filter(url => url.endsWith('/src/new.ts'))).toHaveLength(1);
    expect(context.repositoryMap?.selectedFiles).toContainEqual({
      path: 'package.json',
      content: '{"name":"previous"}',
      source: 'github:file:package.json@old',
    });
  });
});
