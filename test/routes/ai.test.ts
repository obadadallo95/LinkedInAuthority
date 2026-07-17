import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import aiRouter, { getGeminiClient } from '../../server/routes/ai';

// Mock node-fetch
vi.mock('node-fetch', () => {
  return {
    default: vi.fn(),
  };
});
import fetch from 'node-fetch';

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
  });

  it('POST /api/analyze-repo fails if repo is missing', async () => {
    const res = await request(app).post('/api/analyze-repo').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Missing repository name parameter');
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
    expect(res.body.posts).toBeDefined();
    expect(res.body.posts[0].text).toBe('Mocked AI Response');
    expect(fetch).toHaveBeenCalled();
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
