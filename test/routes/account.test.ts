import { describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

const mockDeleteUser = vi.fn().mockResolvedValue(undefined);
const mockRecursiveDelete = vi.fn().mockResolvedValue(undefined);
const mockListCollections = vi.fn();
const mockUserRef = { listCollections: mockListCollections };
const mockDraftRef = {};
(mockUserRef as any).collection = vi.fn(() => ({ doc: vi.fn(() => mockDraftRef) }));

vi.mock('firebase-admin/auth', () => ({
  getAuth: vi.fn(() => ({ deleteUser: mockDeleteUser })),
}));

vi.mock('../../server/services/firestoreAdmin', () => ({
  getAdminFirestore: vi.fn(() => ({
    collection: vi.fn(() => ({ doc: vi.fn(() => mockUserRef) })),
    recursiveDelete: mockRecursiveDelete,
  })),
}));

import accountRouter from '../../server/routes/account';

const app = express();
app.use(express.json());
app.use((req: any, _res, next) => {
  req.user = { uid: 'account-user' };
  next();
});
app.use('/api/account', accountRouter);

describe('account lifecycle routes', () => {
  it('exports user-owned collections without private credentials', async () => {
    const nestedDoc = {
      id: 'd1',
      data: () => ({ content: 'draft', githubToken: 'legacy-token', nested: { linkedinToken: 'legacy-linkedin-token' } }),
      ref: {
        listCollections: vi.fn().mockResolvedValue([
          { id: 'versions', get: vi.fn().mockResolvedValue({ docs: [{ id: '2', data: () => ({ revision: 2 }) }] }) },
          { id: 'privateCredentials', get: vi.fn() },
        ]),
      },
    };
    mockListCollections.mockResolvedValue([
      { id: 'drafts', get: vi.fn().mockResolvedValue({ docs: [nestedDoc] }) },
      { id: 'privateCredentials', get: vi.fn() },
    ]);

    const response = await request(app).get('/api/account/export');

    expect(response.status).toBe(200);
    expect(response.body.data.drafts[0]).toMatchObject({ id: 'd1', content: 'draft' });
    expect(response.body.data.drafts[0].githubToken).toBeUndefined();
    expect(response.body.data.drafts[0].nested.linkedinToken).toBeUndefined();
    expect(response.body.data.drafts[0].subcollections.versions).toEqual([{ id: '2', revision: 2 }]);
    expect(response.body.data.drafts[0].subcollections.privateCredentials).toBeUndefined();
    expect(response.body.data.privateCredentials).toBeUndefined();
  });

  it('deletes the user document tree and Firebase Auth identity', async () => {
    const response = await request(app).delete('/api/account');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ deleted: true });
    expect(mockRecursiveDelete).toHaveBeenCalledWith(mockUserRef);
    expect(mockDeleteUser).toHaveBeenCalledWith('account-user');
  });

  it('treats an already-deleted Auth identity as a successful retry', async () => {
    mockDeleteUser.mockRejectedValueOnce({ code: 'auth/user-not-found' });

    const response = await request(app).delete('/api/account');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ deleted: true });
    expect(mockRecursiveDelete).toHaveBeenCalledWith(mockUserRef);
  });

  it('recursively deletes a draft and its nested version history', async () => {
    const response = await request(app).delete('/api/account/drafts/draft-123');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ deleted: true, draftId: 'draft-123' });
    expect(mockRecursiveDelete).toHaveBeenCalledWith(mockDraftRef);
  });

  it('rejects malformed draft identifiers before touching Firestore', async () => {
    mockRecursiveDelete.mockClear();
    const response = await request(app).delete('/api/account/drafts/bad%20id');

    expect(response.status).toBe(400);
    expect(mockRecursiveDelete).not.toHaveBeenCalled();
  });
});
