import { describe, expect, it, beforeEach, vi } from 'vitest';

let settingsData: Record<string, unknown> | undefined;
let credentialData: Record<string, unknown> | undefined;
const credentialDelete = vi.fn();
const settingsSet = vi.fn();

vi.mock('../../server/services/firestoreAdmin', () => ({
  getAdminFirestore: () => ({
    collection: () => ({
      doc: () => ({
        collection: (name: string) => ({
          doc: () => ({
            get: vi.fn().mockResolvedValue({
              exists: name === 'settings' ? Boolean(settingsData) : Boolean(credentialData),
              data: () => name === 'settings' ? settingsData : credentialData,
            }),
            delete: credentialDelete,
            set: settingsSet,
          }),
        }),
      }),
    }),
  }),
}));

import { decryptGithubToken, encryptGithubToken, getGithubCredentialForUser, deleteGithubCredential, GithubCredentialUnavailableError } from '../../server/services/githubCredentials';

describe('GitHub credential encryption', () => {
  beforeEach(() => {
    process.env.GITHUB_CREDENTIAL_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');
    settingsData = undefined;
    credentialData = undefined;
    credentialDelete.mockReset();
    settingsSet.mockReset();
  });

  it('encrypts and decrypts without storing plaintext', () => {
    const encrypted = encryptGithubToken('ghp_test_secret');
    expect(encrypted.ciphertext).not.toContain('ghp_test_secret');
    expect(decryptGithubToken(encrypted)).toBe('ghp_test_secret');
  });

  it('rejects tampered credentials', () => {
    const encrypted = encryptGithubToken('ghp_test_secret');
    const tampered = { ...encrypted, ciphertext: Buffer.from('tampered').toString('base64') };
    expect(decryptGithubToken(tampered)).toBeUndefined();
  });

  it('does not use a stored credential while the access scope is public-only', async () => {
    settingsData = { githubPermissions: 'public' };
    credentialData = { credential: encryptGithubToken('ghp_private_secret') };

    await expect(getGithubCredentialForUser('user-a')).resolves.toBeUndefined();
  });

  it('uses the stored credential only after private access is explicitly enabled', async () => {
    settingsData = { githubPermissions: 'all' };
    credentialData = { credential: encryptGithubToken('ghp_private_secret') };

    await expect(getGithubCredentialForUser('user-a')).resolves.toBe('ghp_private_secret');
  });

  it('fails closed when private access is enabled but the credential is missing or invalid', async () => {
    settingsData = { githubPermissions: 'all' };
    credentialData = undefined;

    await expect(getGithubCredentialForUser('user-a')).rejects.toBeInstanceOf(GithubCredentialUnavailableError);

    credentialData = { credential: { version: 1, algorithm: 'aes-256-gcm', iv: 'bad', ciphertext: 'bad', authTag: 'bad' } };
    await expect(getGithubCredentialForUser('user-a')).rejects.toBeInstanceOf(GithubCredentialUnavailableError);
  });

  it('removes both encrypted and legacy credentials on explicit disconnect', async () => {
    await deleteGithubCredential('user-a');

    expect(credentialDelete).toHaveBeenCalledOnce();
    expect(settingsSet).toHaveBeenCalledWith(
      {
        githubToken: expect.anything(),
        githubUsername: '',
        githubProfile: null,
        githubPermissions: 'public',
      },
      { merge: true },
    );
  });
});
