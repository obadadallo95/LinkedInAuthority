import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchGithubContext } from '../../server/services/github';

function mockGithubResponses() {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = String(input);
    if (url.endsWith('/languages')) {
      return new Response(JSON.stringify({ TypeScript: 100 }), { status: 200 });
    }
    if (url.endsWith('/contents')) {
      return new Response(JSON.stringify([]), { status: 200 });
    }
    if (url.endsWith('/readme')) {
      return new Response('A grounded repository README with enough detail for analysis.', { status: 200 });
    }
    return new Response(JSON.stringify({
      owner: { login: 'owner' },
      name: 'repo',
      default_branch: 'main',
      description: 'fixture',
    }), { status: 200 });
  });
}

describe('server GitHub context access scope', () => {
  afterEach(() => vi.restoreAllMocks());

  it('does not add an ambient authorization header to public-only context reads', async () => {
    const fetchSpy = mockGithubResponses();

    await fetchGithubContext('https://github.com/owner/repo');

    for (const [, init] of fetchSpy.mock.calls) {
      expect((init?.headers as Record<string, string>)?.Authorization).toBeUndefined();
    }
  });

  it('adds authorization only when a credential is passed explicitly', async () => {
    const fetchSpy = mockGithubResponses();

    await fetchGithubContext('https://github.com/owner/repo', 'ghp_explicit');

    expect(fetchSpy.mock.calls.every(([, init]) => (init?.headers as Record<string, string>)?.Authorization === 'token ghp_explicit')).toBe(true);
  });
});
