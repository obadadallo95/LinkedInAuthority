import { getAdminFirestore } from './firestoreAdmin';

export type UserTier = 'free' | 'pro';

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
    console.error('Entitlement lookup failed; defaulting to free tier.', error);
    return 'free';
  }
}
