import { getAdminFirestore } from './firestoreAdmin';

export type UserTier = 'free' | 'pro';

/**
 * The entitlement source is part of the AI cost boundary. A missing user
 * document means the user is on the free tier; an unavailable datastore means
 * we cannot safely decide whether a request is allowed and must fail closed.
 */
export class EntitlementUnavailableError extends Error {
  code = 'ENTITLEMENTS_UNAVAILABLE' as const;

  constructor() {
    super('Entitlement source is unavailable.');
    this.name = 'EntitlementUnavailableError';
  }
}

/** Server-owned beta limits. These are deliberately independent from browser settings. */
export function getAutomationProjectLimit(tier: UserTier): number {
  return tier === 'pro' ? 30 : 2;
}

/**
 * Resolve entitlements from the Admin SDK so browser-controlled settings never
 * decide which server-side model or quota is used. Firestore client rules block
 * ordinary users from creating or changing these fields.
 */
export async function getUserTier(userId: string): Promise<UserTier> {
  try {
    const snapshot = await getAdminFirestore()
      .collection('users')
      .doc(userId)
      .collection('settings')
      .doc('current')
      .get();

    const data = snapshot.exists ? snapshot.data() : undefined;
    const isPro = data?.isFounder === true
      || data?.plan === 'pro'
      || data?.isPaidSubscription === true
      || data?.role === 'admin'
      || data?.role === 'founder';

    return isPro ? 'pro' : 'free';
  } catch (error) {
    console.error('Entitlement lookup failed; denying cost-bearing request.', error instanceof Error ? error.message : 'unknown error');
    throw new EntitlementUnavailableError();
  }
}
