import crypto from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminFirestore } from './firestoreAdmin';

const ALGORITHM = 'aes-256-gcm';
const VERSION = 1;

export class GithubCredentialUnavailableError extends Error {
  code = 'GITHUB_CREDENTIAL_UNAVAILABLE' as const;

  constructor() {
    super('Private GitHub access is unavailable.');
    this.name = 'GithubCredentialUnavailableError';
  }
}

function getKey(): Buffer {
  const raw = process.env.GITHUB_CREDENTIAL_ENCRYPTION_KEY;
  if (!raw) throw new Error('GitHub credential encryption is not configured');
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) throw new Error('GITHUB_CREDENTIAL_ENCRYPTION_KEY must be a base64-encoded 32-byte key');
  return key;
}

export function encryptGithubToken(token: string) {
  if (!token || token.length > 512) throw new Error('Invalid GitHub credential');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  return {
    version: VERSION,
    algorithm: ALGORITHM,
    iv: iv.toString('base64'),
    ciphertext: ciphertext.toString('base64'),
    authTag: cipher.getAuthTag().toString('base64'),
    updatedAt: new Date().toISOString(),
  };
}

export function decryptGithubToken(value: any): string | undefined {
  if (!value || value.version !== VERSION || value.algorithm !== ALGORITHM) return undefined;
  try {
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      getKey(),
      Buffer.from(value.iv, 'base64'),
    );
    decipher.setAuthTag(Buffer.from(value.authTag, 'base64'));
    return Buffer.concat([
      decipher.update(Buffer.from(value.ciphertext, 'base64')),
      decipher.final(),
    ]).toString('utf8');
  } catch {
    return undefined;
  }
}

export async function saveGithubCredential(userId: string, token: string, profile: Record<string, unknown>) {
  await getAdminFirestore().collection('users').doc(userId).collection('privateCredentials').doc('github').set({
    credential: encryptGithubToken(token),
    profile: { login: profile.login, avatar_url: profile.avatar_url, name: profile.name },
    updatedAt: new Date().toISOString(),
  });
}

export async function getGithubCredential(userId: string): Promise<string | undefined> {
  try {
    const snap = await getAdminFirestore().collection('users').doc(userId).collection('privateCredentials').doc('github').get();
    return snap.exists ? decryptGithubToken(snap.data()?.credential) : undefined;
  } catch (error) {
    // Treat an unavailable credential store as no credential. Public repositories
    // remain usable; private access must never fall back to a client token.
    console.error('GitHub credential lookup unavailable:', error instanceof Error ? error.message : 'unknown error');
    return undefined;
  }
}

async function readGithubCredentialStrict(userId: string): Promise<string | undefined> {
  const snap = await getAdminFirestore().collection('users').doc(userId).collection('privateCredentials').doc('github').get();
  if (!snap.exists) return undefined;
  const token = decryptGithubToken(snap.data()?.credential);
  if (!token) throw new GithubCredentialUnavailableError();
  return token;
}

/**
 * Private-repository access is an explicit user choice. The default is
 * public-only, so a stored credential is never used merely because it exists.
 * Keep this check server-side; browser-controlled settings must not decide
 * whether a privileged token is sent to GitHub.
 */
export async function getGithubCredentialForUser(userId: string): Promise<string | undefined> {
  try {
    const settings = await getAdminFirestore()
      .collection('users')
      .doc(userId)
      .collection('settings')
      .doc('current')
      .get();
    if (!settings.exists || settings.data()?.githubPermissions !== 'all') return undefined;
  } catch (error) {
    console.error('GitHub access-scope lookup unavailable:', error instanceof Error ? error.message : 'unknown error');
    throw new GithubCredentialUnavailableError();
  }

  try {
    const token = await readGithubCredentialStrict(userId);
    if (!token) throw new GithubCredentialUnavailableError();
    return token;
  } catch (error) {
    if (error instanceof GithubCredentialUnavailableError) throw error;
    console.error('Private GitHub credential lookup unavailable:', error instanceof Error ? error.message : 'unknown error');
    throw new GithubCredentialUnavailableError();
  }
}

export async function deleteGithubCredential(userId: string) {
  const userRef = getAdminFirestore().collection('users').doc(userId);
  await userRef.collection('privateCredentials').doc('github').delete();
  // Disconnect is an explicit user action. Remove the old plaintext field too,
  // so a legacy record cannot continue to authorize private access or survive
  // a reconnect/disconnect cycle until the reviewed migration runs.
  await userRef.collection('settings').doc('current').set({
    githubToken: FieldValue.delete(),
  }, { merge: true });
}
