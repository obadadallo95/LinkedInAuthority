import { initializeApp, getApps } from 'firebase-admin/app';
import { getAdminFirestore } from '../server/services/firestoreAdmin';

const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
const targetUid = process.argv[2]?.trim();
const targetPlan = process.argv[3] as 'free' | 'pro' | undefined;
const isFounderArg = process.argv[4];

if (!projectId || !targetUid || !targetPlan || !['free', 'pro'].includes(targetPlan)) {
  throw new Error('Usage: FIREBASE_PROJECT_ID=... tsx scripts/setUserEntitlement.ts <user-id> <free|pro> [true|false]');
}

if (getApps().length === 0) {
  initializeApp({ projectId });
}

export async function setUserEntitlement(userId: string, entitlement: {
  plan: 'free' | 'pro';
  isFounder?: boolean;
  isPaidSubscription?: boolean;
  role?: string;
}) {
  const db = getAdminFirestore();
  const settingsRef = db.collection('users').doc(userId).collection('settings').doc('current');
  
  await settingsRef.set(entitlement, { merge: true });
  console.log(`Successfully updated entitlements for user ${userId}:`, entitlement);
}

// Run if called directly
const isFounder = isFounderArg !== 'false';

setUserEntitlement(targetUid, {
  plan: targetPlan,
  isFounder: isFounder,
  isPaidSubscription: targetPlan === 'pro',
  role: isFounder ? 'founder' : 'user'
}).then(async () => {
  const db = getAdminFirestore();
  const docSnap = await db.collection('users').doc(targetUid).collection('settings').doc('current').get();
  console.log('Verification snapshot data:', docSnap.data());
  process.exit(0);
}).catch(err => {
  console.error('Failed to set entitlement:', err);
  process.exit(1);
});
