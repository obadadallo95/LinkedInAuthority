import express from 'express';
import { getAdminFirestore } from '../services/firestoreAdmin';
import { performDeepScan } from '../services/deepIntelligence';
import { generateDeepPost } from '../services/deepIntelligence/deepPostGenerator';

const router = express.Router();

// This endpoint should be triggered by a Cloud Scheduler or GitHub Actions
// It scans all projects for active automations that match the current time
router.post("/process-weekly", async (req, res) => {
  // 1. Verify a secret token from headers to ensure only trusted schedulers can trigger this
  const authHeader = req.headers.authorization;
  const CRON_SECRET = process.env.CRON_SECRET || 'dev-secret-key';
  
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized cron request" });
  }

  console.log("Running weekly automation check...");
  
  try {
    const db = getAdminFirestore();
    
    console.log("Fetching users...");
    const usersSnapshot = await db.collection('users').get();
    console.log(`Fetched ${usersSnapshot.size} users.`);
    
    const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const currentHour = new Date().getHours();
    
    let processedCount = 0;
    const errors: any[] = [];

    for (const userDoc of usersSnapshot.docs) {
      console.log(`Fetching projects for user ${userDoc.id}...`);
      const projectsSnapshot = await userDoc.ref.collection('projects').get();
        
      console.log(`User ${userDoc.id} has ${projectsSnapshot.size} projects.`);
      if (projectsSnapshot.empty) continue;

      for (const doc of projectsSnapshot.docs) {
        const data = doc.data();
        
        if (data.monitoringEnabled !== true) {
          continue;
        }
        const config = data.monitoringConfig;
        
        // Basic scheduling check
        if (!config || !config.scheduleDay || !config.scheduleTime) {
          continue;
        }
      
      const scheduledHour = parseInt(config.scheduleTime.split(':')[0], 10);
      
      // Check if this project is scheduled for today and this hour
      // (For this MVP, we use simple hour matching)
      if (config.scheduleDay === currentDay && scheduledHour === currentHour) {
        console.log(`Processing automation for ${data.fullName}`);
        
        try {
          // 1. Get the user's Github token
          const userId = userDoc.id;

          const userSettingsRef = userDoc.ref.collection('settings').doc('current');
          const settingsSnap = await userSettingsRef.get();
          
          if (!settingsSnap.exists) {
            console.log(`No settings found for user ${userId}, skipping ${data.fullName}`);
            continue;
          }
          
          const settings = settingsSnap.data();
          const token = settings?.githubToken;
          
          if (!token) {
            console.log(`No Github token found for user ${userId}, skipping ${data.fullName}`);
            continue;
          }

          const repoUrl = `https://github.com/${data.fullName}`;
          
          // 2. Perform deep scan (or standard scan based on config)
          const scanResult = await performDeepScan(repoUrl, token);
          
          // 3. Generate the post using Gemini
          // Map targetAudience/intent to the generated post language if needed, but for now we default to EN or AR based on user preference
          // (Let's assume 'en' for now, or fetch from settings)
          const lang = settings?.language || 'en';
          
          const finalPost = await generateDeepPost(scanResult.synthesizedContext, repoUrl, lang);
          
          // 4. Save the drafted post back to Firestore in the drafts collection for the user to review
          const projectId = doc.id || (data.owner && data.repo ? `${data.owner}_${data.repo}` : data.fullName);
          const draftContent = JSON.stringify({
            post: finalPost.post,
            suggestedComment: finalPost.suggestedComment,
            synthesizedContext: scanResult.synthesizedContext,
            repository: {
              owner: data.owner,
              name: data.repo || data.fullName,
            }
          });

          const draftsRef = db.collection('users').doc(userId).collection('drafts');
          await draftsRef.add({
            projectId,
            type: 'repo_analysis',
            title: `Weekly Automation: ${data.fullName || data.repo || 'Repository'}`,
            content: draftContent,
            status: 'draft',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isAutomated: true
          });
          
          processedCount++;
          console.log(`Successfully generated draft for ${data.fullName}`);
          
        } catch (err: any) {
          console.error(`Error processing ${data.fullName}:`, err.message);
          errors.push({ repo: data.fullName, error: err.message });
        }
      }
    } // close inner for
    } // close outer for

    if (processedCount === 0 && errors.length === 0) {
        console.log("No active automations matched the current time.");
    }

    return res.json({ 
      success: true, 
      processed: processedCount, 
      errors: errors.length > 0 ? errors : undefined 
    });

  } catch (error: any) {
    console.error("Cron Process Error:", error);
    return res.status(500).json({ error: "Cron Process Failed" });
  }
});

export default router;
