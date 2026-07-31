import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
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
          if (config?.responseSchema?.properties?.posts) {
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
app.use('/api', aiRouter);

describe('AI Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = 'test-key';
    process.env.ANALYSIS_SIGNING_SECRET = 'test-secret';
  });

  it('POST /api/analyze-repo fails if repo is missing', async () => {
    const res = await request(app).post('/api/analyze-repo').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Missing or invalid repository information');
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
});
