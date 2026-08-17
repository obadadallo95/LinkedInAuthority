import { initializeApp, getApps } from 'firebase-admin/app';
import { getAdminFirestore } from '../server/services/firestoreAdmin';

if (getApps().length === 0) {
  initializeApp({ projectId: 'linkedin-content-generat-71303' });
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
const targetUid = process.argv[2] || 'oeKiP9rkLOXf3Ub9M0gBSAEvfHO2';
const targetPlan = (process.argv[3] || 'pro') as 'free' | 'pro';
const isFounder = process.argv[4] !== 'false';

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
