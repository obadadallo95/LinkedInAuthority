import { describe, expect, it, vi } from 'vitest';

const mockSettingsGet = vi.fn();

vi.mock('../../server/services/firestoreAdmin', () => ({
  getAdminFirestore: vi.fn(() => ({
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        collection: vi.fn(() => ({
          doc: vi.fn(() => ({ get: mockSettingsGet })),
        })),
      })),
    })),
  })),
}));

import { EntitlementUnavailableError, getAutomationProjectLimit, getUserTier } from '../../server/services/entitlements';

describe('server-owned entitlement limits', () => {
  it('caps monitored projects by tier', () => {
    expect(getAutomationProjectLimit('free')).toBe(2);
    expect(getAutomationProjectLimit('pro')).toBe(30);
  });

  it('treats a missing user settings document as the free tier', async () => {
    mockSettingsGet.mockResolvedValueOnce({ exists: false });
    await expect(getUserTier('missing-user')).resolves.toBe('free');
  });

  it('fails closed when the entitlement datastore is unavailable', async () => {
    mockSettingsGet.mockRejectedValueOnce(new Error('Firestore unavailable'));
    await expect(getUserTier('user-a')).rejects.toBeInstanceOf(EntitlementUnavailableError);
  });
});
