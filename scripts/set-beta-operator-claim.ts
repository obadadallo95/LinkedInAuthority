import fs from 'node:fs';
import path from 'node:path';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const uid = (process.env.BETA_OPERATOR_UID || '').trim();
const role = (process.env.BETA_OPERATOR_ROLE || 'admin').trim();
const commit = process.env.BETA_OPERATOR_COMMIT === 'true';

if (!/^[A-Za-z0-9_-]{1,128}$/.test(uid)) {
  throw new Error('BETA_OPERATOR_UID must be a valid Firebase Auth UID.');
}
if (role !== 'admin' && role !== 'founder') {
  throw new Error('BETA_OPERATOR_ROLE must be admin or founder.');
}

/**
 * This command is deliberately dry-run by default. It is an operator tool,
 * not an application route, and never prints existing claims or credentials.
 */
if (!commit) {
  console.log(`Operator claim plan: set role=${role} for the supplied Firebase user (dry-run; no change made).`);
  console.log('Set BETA_OPERATOR_COMMIT=true only after reviewing the target project and UID.');
  process.exit(0);
}

if (getApps().length === 0) {
  try {
    const config = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf8'));
    initializeApp({ projectId: config.projectId });
  } catch {
    initializeApp();
  }
}

const auth = getAuth();
const user = await auth.getUser(uid);
const existingClaims = user.customClaims || {};
await auth.setCustomUserClaims(uid, { ...existingClaims, role });
console.log(`Operator claim applied for Firebase user ${uid} with role ${role}. Ask the user to refresh their ID token before testing.`);
