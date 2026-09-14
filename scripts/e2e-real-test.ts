import { initializeApp, getApps } from 'firebase-admin/app';
import { getAdminFirestore } from '../server/services/firestoreAdmin';
import { execFileSync } from 'child_process';

const projectId = process.env.E2E_FIREBASE_PROJECT_ID?.trim();
const testUserId = process.env.E2E_TEST_USER_ID?.trim();
const repoOwner = process.env.E2E_REPO_OWNER?.trim();
const repoName = process.env.E2E_REPO_NAME?.trim();
const cronUrl = process.env.E2E_CRON_URL?.trim();
const cronSecretName = process.env.E2E_CRON_SECRET_NAME?.trim() || 'cron_secret';
const cronSecretVersion = process.env.E2E_CRON_SECRET_VERSION?.trim() || 'latest';

if (!projectId || !testUserId || !repoOwner || !repoName || !cronUrl) {
  throw new Error('Set E2E_FIREBASE_PROJECT_ID, E2E_TEST_USER_ID, E2E_REPO_OWNER, E2E_REPO_NAME, and E2E_CRON_URL before running this script.');
}

if (getApps().length === 0) {
  initializeApp({ projectId });
}

async function runE2E() {
  const db = getAdminFirestore();

  const now = new Date();
  const utcDay = now.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
  const utcHour = now.getUTCHours();
  const formattedHour = utcHour < 10 ? `0${utcHour}:00` : `${utcHour}:00`;

  console.log(`Setting up monitored project for ${testUserId} matching UTC server schedule: ${utcDay} at ${formattedHour}`);

  // 1. Create project & settings doc
  const userRef = db.collection('users').doc(testUserId);
  await userRef.collection('settings').doc('current').set({
    language: 'en'
  });

  const projectRef = userRef.collection('projects').doc(`${repoOwner}_${repoName}`);

  await projectRef.set({
    owner: repoOwner,
    repo: repoName,
    fullName: `${repoOwner}/${repoName}`,
    description: 'E2E verification repository',
    language: 'TypeScript',
    monitoringEnabled: true,
    monitoringConfig: {
      scheduleDay: utcDay,
      scheduleTime: formattedHour,
      intent: 'weekly_progress',
      targetAudience: 'tech_community'
    },
    updatedAt: new Date().toISOString()
  });

  console.log("Project configured in Firestore. Triggering production cron endpoint...");

  // 2. Call production cron endpoint using the secret
  const secret = execFileSync('gcloud', [
    'secrets', 'versions', 'access', cronSecretVersion,
    `--secret=${cronSecretName}`,
    `--project=${projectId}`
  ], { encoding: 'utf8' }).trim();

  const response = await fetch(cronUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json'
    }
  });
  const responseText = await response.text();

  let parsedRes: any;
  try {
    parsedRes = JSON.parse(responseText);
  } catch {
    throw new Error(`Cron endpoint returned a non-JSON response (HTTP ${response.status}).`);
  }

  if (!response.ok || !parsedRes.success || parsedRes.processed < 1) {
    throw new Error(`Cron processing did not process the project (HTTP ${response.status}).`);
  }

  // 3. Inspect the saved draft in Firestore
  console.log("Verifying draft in Firestore...");
  const draftsSnap = await userRef.collection('drafts').get();
  console.log(`Found ${draftsSnap.size} draft(s) in users/${testUserId}/drafts.`);

  if (draftsSnap.empty) {
    throw new Error("No draft was saved to Firestore!");
  }

  const draftDoc = draftsSnap.docs[0];
  const draftData = draftDoc.data();
  console.log("Draft Document ID:", draftDoc.id);
  console.log("Draft Title:", draftData.title);
  console.log("Draft Status:", draftData.status);
  console.log("Draft isAutomated:", draftData.isAutomated);
  console.log("Draft Type:", draftData.type);

  const parsedContent = JSON.parse(draftData.content);
  console.log("\n--- Generated Post ---");
  console.log(parsedContent.post);
  console.log("\n--- Suggested Comment ---");
  console.log(parsedContent.suggestedComment);

  // Validate fields expected by DraftsDashboard
  if (!parsedContent.post || typeof parsedContent.post !== 'string') {
    throw new Error("Draft content does not contain a valid 'post' string!");
  }
  if (!draftData.title || draftData.status !== 'draft') {
    throw new Error("Draft metadata does not conform to DraftData interface!");
  }

  console.log("\n✅ Real End-to-End Loop Validation SUCCEEDED!");
}

runE2E().catch(err => {
  console.error("❌ E2E Validation Failed:", err);
  process.exit(1);
});
