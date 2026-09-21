import { FieldValue } from 'firebase-admin/firestore';
import { getAdminFirestore } from './firestoreAdmin';
import { getGithubCredential, saveGithubCredential } from './githubCredentials';

export interface LegacyCredentialCandidate {
  userId: string;
  profile: { login?: string; avatar_url?: string; name?: string };
  hasLegacyCredential: boolean;
}

export interface LegacyCredentialMigrationResult {
  mode: 'dry-run' | 'commit';
  removeLegacy: boolean;
  scannedUsers: number;
  candidates: string[];
  migrated: string[];
  removedLegacy: string[];
  failures: Array<{ userId: string; reason: string }>;
}

/** Pure planning helper intentionally excludes the token value from output. */
export function buildLegacyCredentialMigrationPlan(
  users: Array<{ userId: string; settings?: Record<string, unknown> }>,
): LegacyCredentialCandidate[] {
  return users
    .filter(user => typeof user.settings?.githubToken === 'string' && Boolean(user.settings.githubToken.trim()))
    .map(user => ({
      userId: user.userId,
      profile: {
        login: typeof user.settings?.githubUsername === 'string' ? user.settings.githubUsername : undefined,
        avatar_url: typeof (user.settings?.githubProfile as any)?.avatar_url === 'string' ? (user.settings?.githubProfile as any).avatar_url : undefined,
        name: typeof (user.settings?.githubProfile as any)?.name === 'string' ? (user.settings?.githubProfile as any).name : undefined,
      },
      hasLegacyCredential: true,
    }));
}

/**
 * Reviewed migration path for old plaintext settings.githubToken records.
 * Dry-run is the default. Legacy fields are removed only when both commit and
 * removeLegacy are explicitly enabled, after encrypted storage is verified.
 */
export async function runLegacyCredentialMigration(options: {
  commit?: boolean;
  removeLegacy?: boolean;
} = {}): Promise<LegacyCredentialMigrationResult> {
  const commit = options.commit === true;
  const removeLegacy = options.removeLegacy === true;
  const db = getAdminFirestore();
  const users = await db.collection('users').get();
  const result: LegacyCredentialMigrationResult = {
    mode: commit ? 'commit' : 'dry-run',
    removeLegacy,
    scannedUsers: users.docs.length,
    candidates: [],
    migrated: [],
    removedLegacy: [],
    failures: [],
  };

  for (const userDoc of users.docs) {
    const settingsRef = userDoc.ref.collection('settings').doc('current');
    const settingsSnapshot = await settingsRef.get();
    const settings = settingsSnapshot.exists ? settingsSnapshot.data() || {} : {};
    const token = typeof settings.githubToken === 'string' ? settings.githubToken.trim() : '';
    if (!token) continue;
    result.candidates.push(userDoc.id);
    if (!commit) continue;

    try {
      await saveGithubCredential(userDoc.id, token, {
        login: settings.githubUsername,
        ...(settings.githubProfile as Record<string, unknown> || {}),
      });
      if ((await getGithubCredential(userDoc.id)) !== token) throw new Error('Encrypted credential verification failed');
      result.migrated.push(userDoc.id);
      if (removeLegacy) {
        await settingsRef.update({ githubToken: FieldValue.delete() });
        result.removedLegacy.push(userDoc.id);
      }
    } catch (error) {
      result.failures.push({ userId: userDoc.id, reason: error instanceof Error ? error.message : 'unknown error' });
    }
  }

  return result;
}
