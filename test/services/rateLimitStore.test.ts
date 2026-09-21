import { describe, expect, it, vi } from 'vitest';

const mockGetAdminFirestore = vi.hoisted(() => vi.fn());

vi.mock('../../server/services/firestoreAdmin', () => ({
  getAdminFirestore: mockGetAdminFirestore,
}));

import { FirestoreRateLimitStore, MemoryRateLimitStore } from '../../server/services/rateLimitStore';

describe('rate limit cost boundary', () => {
  it('denies requests when the Firestore-backed limiter is unavailable', async () => {
    mockGetAdminFirestore.mockImplementationOnce(() => {
      throw new Error('Firestore unavailable');
    });

    const store = new FirestoreRateLimitStore();

    await expect(store.checkAndIncrement('hashed-ip', 'analyze', 3, 60_000)).resolves.toBe(false);
  });

  it('keeps the in-memory store deterministic for local test and E2E fixtures', async () => {
    const store = new MemoryRateLimitStore();

    await expect(store.checkAndIncrement('fixture', 'generate', 1, 60_000)).resolves.toBe(true);
    await expect(store.checkAndIncrement('fixture', 'generate', 1, 60_000)).resolves.toBe(false);
  });
});
