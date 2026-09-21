import { describe, expect, it, vi } from 'vitest';

const { mockGetAdminFirestore, mockSaveGithubCredential, mockGetGithubCredential } = vi.hoisted(() => ({
  mockGetAdminFirestore: vi.fn(),
  mockSaveGithubCredential: vi.fn(),
  mockGetGithubCredential: vi.fn(),
}));

vi.mock('../../server/services/firestoreAdmin', () => ({ getAdminFirestore: mockGetAdminFirestore }));
vi.mock('../../server/services/githubCredentials', () => ({
  saveGithubCredential: mockSaveGithubCredential,
  getGithubCredential: mockGetGithubCredential,
}));

import { buildLegacyCredentialMigrationPlan, runLegacyCredentialMigration } from '../../server/services/legacyCredentialMigration';

describe('legacy GitHub credential migration planning', () => {
  it('finds legacy credentials without exposing token values', () => {
    const plan = buildLegacyCredentialMigrationPlan([
      { userId: 'u1', settings: { githubToken: 'secret-token', githubUsername: 'octocat', githubProfile: { name: 'Octo' } } },
      { userId: 'u2', settings: { githubToken: '   ' } },
      { userId: 'u3', settings: { githubUsername: 'public-only' } },
    ]);

    expect(plan).toEqual([{
      userId: 'u1',
      profile: { login: 'octocat', avatar_url: undefined, name: 'Octo' },
      hasLegacyCredential: true,
    }]);
    expect(JSON.stringify(plan)).not.toContain('secret-token');
  });

  it('keeps dry-run read-only and redacted', async () => {
    const update = vi.fn();
    mockGetAdminFirestore.mockReturnValue({
      collection: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({
          docs: [{
            id: 'u1',
            ref: { collection: vi.fn().mockReturnValue({ doc: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue({ exists: true, data: () => ({ githubToken: 'secret-token', githubUsername: 'octocat' }) }), update }) }) },
          }],
        }),
      }),
    });

    const result = await runLegacyCredentialMigration();
    expect(result.mode).toBe('dry-run');
    expect(result.candidates).toEqual(['u1']);
    expect(result.migrated).toEqual([]);
    expect(result.removedLegacy).toEqual([]);
    expect(JSON.stringify(result)).not.toContain('secret-token');
    expect(mockSaveGithubCredential).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });
});
