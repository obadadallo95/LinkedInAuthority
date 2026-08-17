import { initializeApp, getApps } from 'firebase-admin/app';
import { getAdminFirestore } from '../server/services/firestoreAdmin';

if (getApps().length === 0) {
  initializeApp({ projectId: 'linkedin-content-generat-71303' });
}

async function runE2E() {
  const db = getAdminFirestore();
  const testUserId = 'prod-e2e-verification-user';

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

  const projectRef = userRef.collection('projects').doc('obadadallo_KeyFixer');

  await projectRef.set({
    owner: 'obadadallo',
    repo: 'KeyFixer',
    fullName: 'obadadallo/KeyFixer',
    description: 'Automatic keyboard layout fixer',
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
  const { execSync } = await import('child_process');
  const secret = execSync('gcloud secrets versions access 2 --secret=cron_secret --project=linkedin-content-generat-71303').toString().trim();

  const response = execSync(`curl -s -X POST https://lgc-backend--linkedin-content-generat-71303.us-central1.hosted.app/api/cron/process-weekly -H "Authorization: Bearer ${secret}" -H "Content-Type: application/json"`).toString();

  console.log("Cron response:", response);
  const parsedRes = JSON.parse(response);

  if (!parsedRes.success || parsedRes.processed < 1) {
    throw new Error(`Cron processing did not process the project. Response: ${response}`);
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
