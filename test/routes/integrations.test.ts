import { beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

const { mockFetch, mockGetCredential, mockSaveCredential, mockDeleteCredential, MockGithubCredentialUnavailableError } = vi.hoisted(() => ({
  mockFetch: vi.fn(),
  mockGetCredential: vi.fn().mockResolvedValue(undefined),
  mockSaveCredential: vi.fn(),
  mockDeleteCredential: vi.fn(),
  MockGithubCredentialUnavailableError: class extends Error {},
}));

vi.mock('../../server/services/githubCredentials', () => ({
  getGithubCredentialForUser: mockGetCredential,
  GithubCredentialUnavailableError: MockGithubCredentialUnavailableError,
  saveGithubCredential: mockSaveCredential,
  deleteGithubCredential: mockDeleteCredential,
}));

vi.mock('../../server/services/productTelemetry', () => ({
  recordProductEvent: vi.fn(),
}));

import integrationRouter from '../../server/routes/integrations';

const app = express();
app.use(express.json());
app.use((req: any, _res, next) => {
  req.user = { uid: 'integration-user' };
  next();
});
app.use('/api/integrations', integrationRouter);

function githubResponse(body: unknown) {
  return { ok: true, status: 200, json: async () => body };
}

describe('GitHub integration boundary', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockGetCredential.mockResolvedValue(undefined);
    vi.stubGlobal('fetch', mockFetch);
  });

  it('serves public repository details through the server and caches the five upstream reads', async () => {
    mockFetch
      .mockResolvedValueOnce(githubResponse({ name: 'fixture', default_branch: 'main' }))
      .mockResolvedValueOnce(githubResponse([{ sha: 'abc', commit: { message: 'feat: evidence' } }]))
      .mockResolvedValueOnce(githubResponse([{ name: 'main' }]))
      .mockResolvedValueOnce(githubResponse([{ name: 'README.md', type: 'file' }]))
      .mockResolvedValueOnce(githubResponse({ content: Buffer.from('# fixture').toString('base64') }));

    const first = await request(app).get('/api/integrations/github/repository/owner/fixture');
    const second = await request(app).get('/api/integrations/github/repository/owner/fixture');

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(5);
    expect(mockFetch.mock.calls.every(([url, options]) => {
      return String(url).startsWith('https://api.github.com/')
        && !(options?.headers || {}).Authorization
        && options?.signal instanceof AbortSignal;
    })).toBe(true);
  });

  it('rejects malformed repository identifiers before any upstream request', async () => {
    const response = await request(app).get('/api/integrations/github/repository/owner/bad%20repo');
    expect(response.status).toBe(400);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns a recoverable 503 when opted-in private access is unavailable', async () => {
    mockGetCredential.mockRejectedValueOnce(new MockGithubCredentialUnavailableError());

    const response = await request(app).get('/api/integrations/github/repos?username=owner');

    expect(response.status).toBe(503);
    expect(response.body.error).toContain('Private GitHub access is unavailable');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('shares an in-flight repository read across concurrent callers', async () => {
    mockFetch.mockImplementation(async (url: string) => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      if (url.endsWith('/readme')) return githubResponse({ content: Buffer.from('# concurrent').toString('base64') });
      if (url.endsWith('/commits?per_page=5')) return githubResponse([]);
      if (url.endsWith('/branches')) return githubResponse([]);
      if (url.endsWith('/contents')) return githubResponse([]);
      return githubResponse({ name: 'concurrent', default_branch: 'main' });
    });

    const [first, second] = await Promise.all([
      request(app).get('/api/integrations/github/repository/owner/concurrent'),
      request(app).get('/api/integrations/github/repository/owner/concurrent'),
    ]);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(5);
  });
});
