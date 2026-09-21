import { describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

const mockGet = vi.fn();
const mockProjectGet = vi.fn();
const mockRecursiveDelete = vi.fn().mockResolvedValue(undefined);
const mockRunTransaction = vi.fn();
const mockProjectRef = { get: mockProjectGet };

vi.mock('../../server/services/firestoreAdmin', () => ({
  getAdminFirestore: vi.fn(() => ({
    recursiveDelete: mockRecursiveDelete,
    runTransaction: mockRunTransaction,
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        collection: vi.fn((name: string) => name === 'projects'
          ? { doc: vi.fn(() => mockProjectRef), get: mockGet, where: vi.fn() }
          : { get: mockGet }),
      })),
    })),
  })),
}));

vi.mock('../../server/services/entitlements', () => ({
  getAutomationProjectLimit: vi.fn(() => 2),
  getUserTier: vi.fn().mockResolvedValue('free'),
}));

import automationRouter from '../../server/routes/automation';

const app = express();
app.use(express.json());
app.use((req: any, _res, next) => { req.user = { uid: 'user-a' }; next(); });
app.use('/api/automation', automationRouter);

describe('automation history route', () => {
  it('returns only runs under the authenticated user project path', async () => {
    mockGet.mockResolvedValueOnce({
      docs: [{
        id: 'owner_repo',
        ref: { collection: vi.fn(() => ({ get: vi.fn().mockResolvedValue({ docs: [{ id: 'run-1', data: () => ({ status: 'draft_created', updatedAt: '2026-09-21T00:00:00Z' }) }] }) })) },
        exists: true,
      }],
    });

    const response = await request(app).get('/api/automation/runs?limit=10');
    expect(response.status).toBe(200);
    expect(response.body.runs).toEqual([{ id: 'run-1', projectId: 'owner_repo', status: 'draft_created', updatedAt: '2026-09-21T00:00:00Z' }]);
  });

  it('rejects requests without a verified user', async () => {
    const protectedApp = express();
    protectedApp.use('/api/automation', automationRouter);
    const response = await request(protectedApp).get('/api/automation/runs');
    expect(response.status).toBe(401);
  });

  it('recursively deletes only the authenticated user project and its run history', async () => {
    const response = await request(app).delete('/api/automation/projects/owner_repo');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ deleted: true, projectId: 'owner_repo' });
    expect(mockRecursiveDelete).toHaveBeenCalledWith(mockProjectRef);
  });

  it('rejects malformed project identifiers before touching Firestore', async () => {
    mockRecursiveDelete.mockClear();
    const response = await request(app).delete('/api/automation/projects/not-a-project');

    expect(response.status).toBe(400);
    expect(mockRecursiveDelete).not.toHaveBeenCalled();
  });

  it('rejects malformed automation configuration before touching Firestore', async () => {
    mockRunTransaction.mockClear();
    const response = await request(app)
      .post('/api/automation/projects')
      .send({ owner: 'owner', repo: 'repo', contentLanguage: 'fr' });

    expect(response.status).toBe(400);
    expect(mockRunTransaction).not.toHaveBeenCalled();
  });

  it('enforces the free-tier monitored-project limit inside a transaction', async () => {
    const transaction = {
      get: vi.fn()
        .mockResolvedValueOnce({ exists: false })
        .mockResolvedValueOnce({ size: 2 }),
      set: vi.fn(),
    };
    mockRunTransaction.mockImplementationOnce(async (callback: any) => callback(transaction));

    const response = await request(app)
      .post('/api/automation/projects')
      .send({ owner: 'owner', repo: 'repo', contentLanguage: 'en' });

    expect(response.status).toBe(403);
    expect(response.body.error).toContain('limit');
    expect(transaction.set).not.toHaveBeenCalled();
  });
});
