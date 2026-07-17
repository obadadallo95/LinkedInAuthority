import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import linkedinRouter from '../../server/routes/linkedin';

// Mock node-fetch
vi.mock('node-fetch', () => {
  return {
    default: vi.fn(),
  };
});
import fetch from 'node-fetch';

const app = express();
app.use(express.json());
app.use('/api', linkedinRouter);

describe('LinkedIn Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.LINKEDIN_CLIENT_ID = 'client-id';
    process.env.LINKEDIN_CLIENT_SECRET = 'client-secret';
  });

  it('GET /api/auth/linkedin redirects to LinkedIn OAuth', async () => {
    const res = await request(app).get('/api/auth/linkedin');
    expect(res.status).toBe(302);
    expect(res.header.location).toContain('https://www.linkedin.com/oauth/v2/authorization');
  });

  it('GET /api/auth/linkedin/callback fails without code', async () => {
    const res = await request(app).get('/api/auth/linkedin/callback');
    expect(res.status).toBe(400);
    expect(res.text).toBe('Authorization code is missing');
  });

  it('GET /api/auth/linkedin/callback completes OAuth flow', async () => {
    (fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'mock-token' })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sub: 'mock-id', name: 'Mock User' })
      });

    const res = await request(app).get('/api/auth/linkedin/callback?code=mock-code');
    expect(res.status).toBe(200);
    expect(res.text).toContain('LINKEDIN_AUTH_SUCCESS');
    expect(res.text).toContain('mock-token');
  });

  it('POST /api/publish-post fails without token', async () => {
    const res = await request(app).post('/api/publish-post').send({ text: 'Hello' });
    expect(res.status).toBe(401);
  });

  it('POST /api/publish-post fails without text', async () => {
    const res = await request(app).post('/api/publish-post').send({ token: 'mock-token' });
    expect(res.status).toBe(400);
  });

  it('POST /api/publish-post publishes successfully', async () => {
    (fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'mock-id' })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'mock-post-id' })
      });

    const res = await request(app).post('/api/publish-post').send({ token: 'mock-token', text: 'Hello LinkedIn' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.postId).toBe('mock-post-id');
  });

  it('POST /api/analytics fails without token', async () => {
    const res = await request(app).post('/api/analytics').send({ postIds: ['id1'] });
    expect(res.status).toBe(401);
  });

  it('POST /api/analytics retrieves metrics successfully', async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        likesSummary: { totalLikes: 5 },
        commentsSummary: { totalFirstLevelComments: 2 }
      })
    });

    const res = await request(app).post('/api/analytics').send({ token: 'mock-token', postIds: ['id1', 'id2'] });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data['id1']).toEqual({ likes: 5, comments: 2, success: true });
    expect(res.body.data['id2']).toEqual({ likes: 5, comments: 2, success: true });
  });
});
