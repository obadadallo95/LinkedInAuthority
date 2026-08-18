import express from 'express';
import { getAdminFirestore } from '../services/firestoreAdmin';
import { performDeepScan, checkRepositoryActivityDelta, ActivityCheckOptions, ActivityCheckpoint } from '../services/deepIntelligence';
import { generateDeepPost } from '../services/deepIntelligence/deepPostGenerator';

const router = express.Router();

/**
 * Scheduled Automation Processor
 * 
 * NOTE: Triggered by an hourly heartbeat (e.g. GitHub Actions or Cloud Scheduler).
 * Evaluates each project's configured scheduleDay, scheduleTime, and timezone.
 * Concurrency-safe: acquires an expiring lease to prevent duplicate runs across parallel cron triggers.
 */
router.post("/process-weekly", async (req, res) => {
  // 1. Authorization check
  const authHeader = req.headers.authorization;
  const CRON_SECRET = process.env.CRON_SECRET?.trim() || (process.env.NODE_ENV === 'production' ? '' : 'dev-secret-key');
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : authHeader?.trim();
  
  if (!CRON_SECRET || token !== CRON_SECRET) {
    return res.status(401).json({ error: "Unauthorized cron request" });
  }

  console.log("Running scheduled repository automation heartbeat...");
  
  try {
    const db = getAdminFirestore();
    const usersSnapshot = await db.collection('users').get();
    
    let processedCount = 0;
    let skippedCount = 0;
    const errors: any[] = [];

    for (const userDoc of usersSnapshot.docs) {
      const projectsSnapshot = await userDoc.ref.collection('projects').get();
      if (projectsSnapshot.empty) continue;

      for (const projectDoc of projectsSnapshot.docs) {
        const data = projectDoc.data();
        
        if (data.monitoringEnabled !== true) {
          continue;
        }
        const config = data.monitoringConfig;
        if (!config || !config.scheduleDay || !config.scheduleTime) {
          continue;
        }
        
        // 2. Timezone-aware schedule matching
        const userTimezone = config.timezone || 'UTC';
        let currentDay: string;
        let currentHour: number;
        
        try {
          const nowInTz = new Date();
          const dayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: userTimezone });
          const hourFormatter = new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: userTimezone });
          currentDay = dayFormatter.format(nowInTz);
          currentHour = parseInt(hourFormatter.format(nowInTz), 10);
        } catch {
          // Fallback if timezone string is invalid
          currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
          currentHour = new Date().getHours();
        }

        const scheduledHour = parseInt(config.scheduleTime.split(':')[0], 10);

        if (config.scheduleDay !== currentDay || scheduledHour !== currentHour) {
          continue;
        }

        console.log(`[Automation Due] Project ${data.fullName || data.repo} in user ${userDoc.id}`);

        // 3. Concurrency Protection: Lease Acquisition
        const now = Date.now();
        const existingLeaseExpiry = data.processingLease?.expiresAt 
          ? new Date(data.processingLease.expiresAt).getTime() 
          : 0;

        if (data.processingLease && existingLeaseExpiry > now) {
          console.log(`[Concurrency] Project ${data.fullName} is currently locked by active lease until ${data.processingLease.expiresAt}. Skipping.`);
          continue;
        }

        const leaseExpiresAt = new Date(now + 10 * 60 * 1000).toISOString();
        try {
          await projectDoc.ref.update({
            processingLease: {
              lockedAt: new Date(now).toISOString(),
              expiresAt: leaseExpiresAt
            }
          });
        } catch (leaseErr: any) {
          console.warn(`Failed to acquire lease for ${data.fullName}:`, leaseErr.message);
          continue;
        }

        let isSuccess = false;
        try {
          // 4. Fetch User Settings & GitHub Token
          const userId = userDoc.id;
          const userSettingsRef = userDoc.ref.collection('settings').doc('current');
          const settingsSnap = await userSettingsRef.get();
          const settings = settingsSnap.exists ? settingsSnap.data() : null;
          const githubToken = settings?.githubToken;

          const repoUrl = `https://github.com/${data.fullName || `${data.owner}/${data.repo}`}`;

          // 5. Configured Monitored Sources
          const sourceOptions: ActivityCheckOptions = {
            monitorCommits: config.monitorCommits !== false,
            monitorPullRequests: config.monitorPullRequests === true,
            monitorIssues: config.monitorIssues === true,
          };

          // 6. Existing Activity Checkpoint (with backwards compatibility)
          const lastCheckpoint: ActivityCheckpoint = {
            commitSha: data.lastProcessed?.commitSha || data.lastProcessedCommit,
            pullRequestUpdatedAt: data.lastProcessed?.pullRequestUpdatedAt,
            issueUpdatedAt: data.lastProcessed?.issueUpdatedAt,
            processedAt: data.lastProcessed?.processedAt || data.lastProcessedAt
          };

          // 7. Lightweight Activity Delta Check (Zero AI calls if no new activity)
          const deltaResult = await checkRepositoryActivityDelta(
            data.fullName || `${data.owner}/${data.repo}`,
            sourceOptions,
            lastCheckpoint,
            githubToken
          );

          if (!deltaResult.hasNewActivity) {
            console.log(`[No Activity] No new activity across monitored sources for ${data.fullName}. Skipping AI calls.`);
            skippedCount++;
            await projectDoc.ref.update({ processingLease: null });
            continue;
          }

          console.log(`[Activity Detected] Reasons for ${data.fullName}:`, deltaResult.reasons);

          // 8. Grounded Deep Scan (Stable Identity Context + Monitored Streams)
          const scanResult = await performDeepScan(repoUrl, githubToken, sourceOptions);

          if (!scanResult.synthesizedContext.hasMeaningfulContent) {
            console.log(`[Insufficient Substance] Observed changes for ${data.fullName} are trivial/noise. Skipping post generation.`);
            skippedCount++;
            await projectDoc.ref.update({ processingLease: null });
            continue;
          }

          // 9. Independent Content Language (Strictly decoupled from UI language)
          const contentLanguage = config.contentLanguage || settings?.defaultContentLanguage || 'en';

          // 10. Generate Grounded Deep Post
          const finalPost = await generateDeepPost(
            scanResult.synthesizedContext,
            repoUrl,
            contentLanguage,
            {
              intent: config.intent || 'weekly_progress',
              targetAudience: config.targetAudience || 'tech_community',
              repoIdentity: scanResult.githubContext.repoIdentity
            }
          );

          // 11. Save Draft to users/{uid}/drafts
          const projectId = projectDoc.id || `${data.owner}_${data.repo}`;
          const draftTitle = config.intent === 'technical_deep_dive'
            ? `Deep Dive: ${data.fullName || data.repo}`
            : `Weekly Update: ${data.fullName || data.repo}`;

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
            title: draftTitle,
            content: draftContent,
            status: 'draft',
            isAutomated: true,
            metadata: {
              intent: config.intent || 'weekly_progress',
              targetAudience: config.targetAudience || 'tech_community',
              contentLanguage,
              monitoredSources: {
                commits: sourceOptions.monitorCommits,
                pullRequests: sourceOptions.monitorPullRequests,
                issues: sourceOptions.monitorIssues
              },
              activityReasons: deltaResult.reasons
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });

          // 12. Advance Checkpoint ONLY after successful draft persistence
          const updatedCheckpoint: ActivityCheckpoint = {
            commitSha: deltaResult.latestCommit?.sha || lastCheckpoint.commitSha,
            pullRequestUpdatedAt: deltaResult.latestPrUpdatedAt || lastCheckpoint.pullRequestUpdatedAt,
            issueUpdatedAt: deltaResult.latestIssueUpdatedAt || lastCheckpoint.issueUpdatedAt,
            processedAt: new Date().toISOString()
          };

          await projectDoc.ref.update({
            lastProcessed: updatedCheckpoint,
            lastProcessedCommit: updatedCheckpoint.commitSha || null,
            lastProcessedAt: updatedCheckpoint.processedAt,
            processingLease: null,
            updatedAt: new Date().toISOString()
          });

          isSuccess = true;
          processedCount++;
          console.log(`[Success] Automation draft created and checkpoint advanced for ${data.fullName}`);

        } catch (err: any) {
          console.error(`[Error] Automation error for ${data.fullName}:`, err.message);
          errors.push({ repo: data.fullName, error: err.message });
        } finally {
          // Always release lease if not already released
          if (!isSuccess) {
            await projectDoc.ref.update({ processingLease: null }).catch(() => {});
          }
        }
      }
    }

    return res.json({ 
      success: true, 
      processed: processedCount,
      skipped: skippedCount,
      errors: errors.length > 0 ? errors : undefined 
    });

  } catch (error: any) {
    console.error("Scheduled Automation Processor Failed:", error);
    return res.status(500).json({ error: "Scheduled Automation Processor Failed" });
  }
});

export default router;
