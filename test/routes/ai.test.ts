import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

const mockGetUserTier = vi.hoisted(() => vi.fn().mockResolvedValue('free'));

vi.mock('../../server/services/entitlements', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../server/services/entitlements')>();
  return {
    ...actual,
    getUserTier: mockGetUserTier,
  };
});

// These route fixtures use public repositories; private credential failure is
// covered by the dedicated credential and integration boundary suites.
vi.mock('../../server/services/githubCredentials', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../server/services/githubCredentials')>();
  return {
    ...actual,
    getGithubCredentialForUser: vi.fn().mockResolvedValue(undefined),
  };
});

import aiRouter from '../../server/routes/ai';

// Mock node-fetch
vi.mock('node-fetch', () => {
  return {
    default: vi.fn(),
  };
});
import fetch from 'node-fetch';

vi.mock('../../server/services/repositoryIntelligence/analyzeRepository', () => {
  return {
    analyzeRepositoryAngles: vi.fn().mockResolvedValue({
      repository: { name: 'testrepo' },
      angles: [{ id: '1', title: 'Test Angle', summary: 'Test Summary' }],
      atomicFacts: [],
      conflicts: []
    })
  };
});

vi.mock('../../server/services/github', () => {
  return {
    fetchGithubContext: vi.fn().mockResolvedValue({
      commits: [], readme: '', hasWeakRepo: false, repoData: { name: 'testrepo', description: 'test', owner: { login: 'testuser' } }, languages: {}, manifestData: '', readmeText: ''
    })
  };
});

// Mock @google/genai
vi.mock('@google/genai', () => {
  return {
    Type: { OBJECT: 'OBJECT', ARRAY: 'ARRAY', STRING: 'STRING' },
    GoogleGenAI: class {
      models = {
        generateContent: vi.fn().mockImplementation(async ({ model, contents, config }) => {
          if (config?.responseSchema?.properties?.optimizedText) {
            return {
              text: JSON.stringify({ optimizedText: 'Refined, evidence-preserving draft.' })
            };
          } else if (config?.responseSchema?.properties?.posts) {
            return {
              text: JSON.stringify({
                posts: [
                  {
                    text: 'Mocked AI Response',
                    cardConfig: {
                      colorTheme: 'indigo',
                      title: 'Test',
                      subtitle: 'Test sub',
                      metrics: '100% test'
                    }
                  }
                ]
              })
            };
          } else {
            return {
              text: JSON.stringify({
                hashtags: ['#test1', '#test2']
              })
            };
          }
        })
      };
    }
  };
});

const app = express();
app.use(express.json());
app.use((req: any, res, next) => {
  req.user = { uid: 'test-uid' };
  next();
});
app.use('/api', aiRouter);

describe('AI Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserTier.mockResolvedValue('free');
    process.env.GEMINI_API_KEY = 'test-key';
    process.env.ANALYSIS_SIGNING_SECRET = 'test-secret';
  });

  it('POST /api/analyze-repo fails if repo is missing', async () => {
    const res = await request(app).post('/api/analyze-repo').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Missing or invalid repository information');
  });

  it('POST /api/optimize-post refines bounded draft text through the low-cost route', async () => {
    const res = await request(app).post('/api/optimize-post').send({
      text: 'A verified technical change.',
      actionType: 'hook',
      lang: 'en'
    });
    expect(res.status).toBe(200);
    expect(res.body.optimizedText).toBe('Refined, evidence-preserving draft.');
  });

  it('POST /api/optimize-post rejects unsupported refinements before model use', async () => {
    const res = await request(app).post('/api/optimize-post').send({
      text: 'A verified technical change.',
      actionType: 'publish-to-linkedin',
      lang: 'en'
    });
    expect(res.status).toBe(400);
  });

  it('returns 503 and refuses AI work when entitlement storage is unavailable', async () => {
    mockGetUserTier.mockRejectedValueOnce({ code: 'ENTITLEMENTS_UNAVAILABLE' });
    const res = await request(app).post('/api/optimize-post').send({
      text: 'A verified technical change.',
      actionType: 'hook',
      lang: 'en'
    });
    expect(res.status).toBe(503);
    expect(res.body.error).toContain('Usage controls');
  });

  it('POST /api/analyze-repo handles successful analysis', async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        content: Buffer.from('mock readme').toString('base64'),
        encoding: 'base64',
        dependencies: {}
      })
    });

    const res = await request(app)
      .post('/api/analyze-repo')
      .send({
        username: 'testuser',
        repo: 'testrepo',
      });

    expect(res.status).toBe(200);
    expect(res.body.angles).toBeDefined();
    expect(res.body.angles[0].title).toBe('Test Angle');
  });

  it('POST /api/analyze-repo fails if repo name is invalid', async () => {
    const res = await request(app)
      .post('/api/analyze-repo')
      .send({
        username: 'testuser',
        repo: 'invalid repo name!',
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Missing or invalid repository information');
  });

  it('POST /api/analyze-repo fails if language or intent is unsupported', async () => {
    const res = await request(app)
      .post('/api/analyze-repo')
      .send({
        username: 'testuser',
        repo: 'testrepo',
        lang: 'fr', // unsupported
      });
    expect(res.status).toBe(400);

    const res2 = await request(app)
      .post('/api/analyze-repo')
      .send({
        username: 'testuser',
        repo: 'testrepo',
        lang: 'en',
        intent: 'invalid_intent'
      });
    expect(res2.status).toBe(400);
  });

  it('POST /api/generate-post fails with missing or invalid token', async () => {
    const res = await request(app)
      .post('/api/generate-post')
      .send({
        username: 'testuser',
        repo: 'testrepo',
        analysisToken: 'invalid_token',
        angleId: '1'
      });
    // With dummy verifyAnalysisToken it might throw or not, but in the route it's caught
    expect(res.status).toBe(403);
  });

  it('POST /api/generate-hashtags generates tags', async () => {
    const res = await request(app)
      .post('/api/generate-hashtags')
      .send({
        text: 'Hello world'
      });

    expect(res.status).toBe(200);
    expect(res.body.hashtags).toBeDefined();
    expect(res.body.hashtags).toEqual(['#test1', '#test2']);
  });

  it('rejects malformed commit payloads before any model call', async () => {
    const res = await request(app)
      .post('/api/analyze-commits')
      .send({ commits: [{ sha: 42, message: 'not a valid commit shape' }] });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Missing or invalid commits array');
  });

  it('rejects oversized hashtag input before any model call', async () => {
    const res = await request(app)
      .post('/api/generate-hashtags')
      .send({ text: 'x'.repeat(20001) });
    expect(res.status).toBe(400);
  });
});
