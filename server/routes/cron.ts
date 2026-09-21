import express from 'express';
import { getAdminFirestore } from '../services/firestoreAdmin';
import { performDeepScan, checkRepositoryActivityDelta, ActivityCheckOptions, ActivityCheckpoint } from '../services/deepIntelligence';
import { generateDeepPost } from '../services/deepIntelligence/deepPostGenerator';
import { getAutomationProjectLimit, getUserTier } from '../services/entitlements';
import { consumeAiCapability } from '../services/usageLedger';
import { getGithubCredentialForUser } from '../services/githubCredentials';
import { getLatestRepositorySnapshot, persistRepositorySnapshot } from '../services/repositoryIntelligence/snapshotStore';
import { acquireAutomationRun, buildAutomationRunId, finishAutomationRun, getAutomationRunRef, persistAutomationDraftOnce } from '../services/automationStore';
import { isExpiredOperationalRecord, type RetentionResource } from '../services/retentionPolicy';
import { recordProductEvent } from '../services/productTelemetry';

const router = express.Router();

function safeAutomationFailureReason(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error || '');
  if (/429|quota|resource_exhausted/i.test(message)) return 'AI usage limit or provider quota reached.';
  if (/503|high demand|temporarily unavailable/i.test(message)) return 'AI provider temporarily unavailable.';
  if (/github|repository|fetch/i.test(message)) return 'Repository data temporarily unavailable.';
  return 'Automation run failed.';
}

function authorizeCron(req: express.Request, res: express.Response): boolean {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader?.trim();
  if (!cronSecret) {
    res.status(503).json({ error: 'Cron service is not configured' });
    return false;
  }
  if (token !== cronSecret) {
    res.status(401).json({ error: 'Unauthorized cron request' });
    return false;
  }
  return true;
}

/**
 * Scheduled Automation Processor
 * 
 * NOTE: Triggered by an hourly heartbeat (e.g. GitHub Actions or Cloud Scheduler).
 * Evaluates each project's configured scheduleDay, scheduleTime, and timezone.
 * Uses an expiring lease as a best-effort guard against duplicate runs across cron triggers.
 */
router.post("/process-weekly", async (req, res) => {
  // 1. Authorization check
  if (!authorizeCron(req, res)) return;

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

      const userTier = await getUserTier(userDoc.id);
      const maxAutomationProjects = getAutomationProjectLimit(userTier);
      let enabledAutomationProjects = 0;
      const orderedProjects = [...projectsSnapshot.docs].sort((a: any, b: any) => a.id.localeCompare(b.id));

      for (const projectDoc of orderedProjects) {
        const data = projectDoc.data();
        
        if (data.monitoringEnabled !== true) {
          continue;
        }
        enabledAutomationProjects += 1;
        if (enabledAutomationProjects > maxAutomationProjects) {
          console.warn(`[Automation Limit] Skipping ${data.fullName || data.repo}: ${userTier} tier allows ${maxAutomationProjects} monitored projects.`);
          skippedCount++;
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

        // 3. Concurrency Protection: Transactional lease + idempotent run record
        const now = Date.now();
        const projectId = projectDoc.id || `${data.owner}_${data.repo}`;
        const scheduledWindow = `${currentDay}:${scheduledHour}:${userTimezone}:${new Date().toISOString().slice(0, 10)}`;
        const checkpointForRun = {
          commitSha: data.lastObservedActivity?.commitSha || data.lastProcessed?.commitSha || data.lastProcessedCommit || null,
          pullRequestUpdatedAt: data.lastObservedActivity?.pullRequestUpdatedAt || data.lastProcessed?.pullRequestUpdatedAt || null,
          issueUpdatedAt: data.lastObservedActivity?.issueUpdatedAt || data.lastProcessed?.issueUpdatedAt || null,
        };
        const runId = buildAutomationRunId({ userId: userDoc.id, projectId, scheduledWindow, checkpoint: checkpointForRun });
        const runRef = typeof projectDoc.ref.collection === 'function'
          ? getAutomationRunRef(projectDoc.ref, runId)
          : null;
        const existingLeaseExpiry = data.processingLease?.expiresAt
          ? new Date(data.processingLease.expiresAt).getTime()
          : 0;
        if (existingLeaseExpiry > now) {
          console.log(`[Concurrency] Project ${data.fullName} has an active automation lease until ${data.processingLease.expiresAt}. Skipping.`);
          skippedCount++;
          continue;
        }
        const leaseExpiresAt = new Date(now + 10 * 60 * 1000).toISOString();
        try {
          const acquisition = await acquireAutomationRun(
            db,
            projectDoc.ref,
            runRef,
            {
              runId,
              now: new Date(now).toISOString(),
              leaseExpiresAt,
              repo: data.fullName || data.repo,
              checkpoint: checkpointForRun,
            },
          );
          if (acquisition === 'duplicate') {
            console.log(`[Idempotency] Run ${runId} already completed for ${data.fullName}. Skipping.`);
            skippedCount++;
            continue;
          }
          if (acquisition === 'leased') {
            console.log(`[Concurrency] Project ${data.fullName} has an active automation lease. Skipping.`);
            skippedCount++;
            continue;
          }
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
          const githubToken = await getGithubCredentialForUser(userId);

          const repoUrl = `https://github.com/${data.fullName || `${data.owner}/${data.repo}`}`;

          // 5. Configured Monitored Sources
          const sourceOptions: ActivityCheckOptions = {
            monitorCommits: config.monitorCommits !== false,
            monitorPullRequests: config.monitorPullRequests === true,
            monitorIssues: config.monitorIssues === true,
          };

          // 6. Existing Activity Checkpoint (with backwards compatibility)
          const lastCheckpoint: ActivityCheckpoint = {
            commitSha: data.lastObservedActivity?.commitSha || data.lastProcessed?.commitSha || data.lastProcessedCommit,
            pullRequestUpdatedAt: data.lastObservedActivity?.pullRequestUpdatedAt || data.lastProcessed?.pullRequestUpdatedAt,
            issueUpdatedAt: data.lastObservedActivity?.issueUpdatedAt || data.lastProcessed?.issueUpdatedAt,
            processedAt: data.lastObservedActivity?.processedAt || data.lastProcessed?.processedAt || data.lastProcessedAt
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
            await finishAutomationRun(db, projectDoc.ref, runRef, {
              status: 'no_activity',
              now: new Date().toISOString(),
              observedCheckpoint: {
                commitSha: deltaResult.latestCommit?.sha || lastCheckpoint.commitSha,
                pullRequestUpdatedAt: deltaResult.latestPrUpdatedAt || lastCheckpoint.pullRequestUpdatedAt,
                issueUpdatedAt: deltaResult.latestIssueUpdatedAt || lastCheckpoint.issueUpdatedAt,
                processedAt: new Date().toISOString(),
              },
            });
            void recordProductEvent(userDoc.id, 'automation_checked', { status: 'no_activity', mode: 'automation' });
            continue;
          }

          console.log(`[Activity Detected] Reasons for ${data.fullName}:`, deltaResult.reasons);

          const automationTier = userTier;
          const automationAllowed = await consumeAiCapability(userId, 'automation.enabled', automationTier);
          if (!automationAllowed) {
            const reason = 'Automation usage limit reached';
            console.warn(`[Automation Limit] ${data.fullName}: ${reason}`);
            skippedCount++;
            await finishAutomationRun(db, projectDoc.ref, runRef, {
              status: 'failed',
              now: new Date().toISOString(),
              failureReason: reason,
            });
            void recordProductEvent(userDoc.id, 'automation_checked', { status: 'not_meaningful', mode: 'automation' });
            continue;
          }

          // 8. Grounded Deep Scan (Stable Identity Context + Monitored Streams)
          const previousSnapshotBase = await getLatestRepositorySnapshot(userId, data.owner, data.repo || data.fullName?.split('/')[1]);
          // A project checkpoint is still a safe incremental anchor when the
          // richer snapshot pointer is unavailable. This avoids treating every
          // automation run as a first scan and sending stable repository
          // context to the model again. A brand-new project has no checkpoint
          // and keeps the normal initial-scan behavior.
          const previousSnapshot = (previousSnapshotBase || lastCheckpoint.commitSha)
            ? {
              ...(previousSnapshotBase || {
                analyzedCommitSha: lastCheckpoint.commitSha,
                defaultBranch: data.defaultBranch || 'main',
              }),
              pullRequestUpdatedAt: lastCheckpoint.pullRequestUpdatedAt,
              issueUpdatedAt: lastCheckpoint.issueUpdatedAt,
            }
            : undefined;
          const scanResult = await performDeepScan(repoUrl, githubToken, sourceOptions, automationTier, previousSnapshot, {
            userId,
            feature: 'deep_scan',
            repository: data.fullName || data.repo,
            isAutomated: true,
          });
          await persistRepositorySnapshot(userId, scanResult.githubContext, scanResult.synthesizedContext);

          if (!scanResult.synthesizedContext.hasMeaningfulContent) {
            console.log(`[Insufficient Substance] Observed changes for ${data.fullName} are trivial/noise. Skipping post generation.`);
            skippedCount++;
            await finishAutomationRun(db, projectDoc.ref, runRef, {
              status: 'not_meaningful',
              now: new Date().toISOString(),
              // Consume the observed noise so the next scheduled window does
              // not re-analyse the same commits/PRs/issues indefinitely.
              observedCheckpoint: {
                commitSha: deltaResult.latestCommit?.sha || lastCheckpoint.commitSha,
                pullRequestUpdatedAt: deltaResult.latestPrUpdatedAt || lastCheckpoint.pullRequestUpdatedAt,
                issueUpdatedAt: deltaResult.latestIssueUpdatedAt || lastCheckpoint.issueUpdatedAt,
                processedAt: new Date().toISOString(),
              },
            });
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
              repoIdentity: scanResult.githubContext.repoIdentity,
              userId,
              isAutomated: true,
            },
            automationTier
          );

          // 11. Save Draft to users/{uid}/drafts
          const draftTitle = config.intent === 'technical_deep_dive'
            ? `Deep Dive: ${data.fullName || data.repo}`
            : `Weekly Update: ${data.fullName || data.repo}`;

          const draftContent = JSON.stringify({
            post: finalPost.post,
            suggestedComment: finalPost.suggestedComment,
            claimAudit: finalPost.claimAudit,
            qualityEvaluation: finalPost.qualityEvaluation,
            synthesizedContext: scanResult.synthesizedContext,
            repository: {
              owner: data.owner,
              name: data.repo || data.fullName,
            }
          });

          const draft = {
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
              activityReasons: deltaResult.reasons,
              claimAuditPassed: finalPost.claimAudit?.passed ?? false,
              claimAuditWarnings: finalPost.claimAudit?.warnings || [],
              qualityEvaluationPassed: finalPost.qualityEvaluation?.passed ?? false,
              qualityScore: finalPost.qualityEvaluation?.score ?? 0,
              qualityWarnings: finalPost.qualityEvaluation?.warnings || [],
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          const draftsRef = db.collection('users').doc(userId).collection('drafts');
          const draftPersisted = await persistAutomationDraftOnce(db, draftsRef, runRef, {
            draftId: `automation-${runId}`,
            draft,
            now: new Date().toISOString(),
          });
          if (!draftPersisted) {
            skippedCount++;
            continue;
          }

          // 12. Advance Checkpoint ONLY after successful draft persistence
          const updatedCheckpoint: ActivityCheckpoint = {
            commitSha: deltaResult.latestCommit?.sha || lastCheckpoint.commitSha,
            pullRequestUpdatedAt: deltaResult.latestPrUpdatedAt || lastCheckpoint.pullRequestUpdatedAt,
            issueUpdatedAt: deltaResult.latestIssueUpdatedAt || lastCheckpoint.issueUpdatedAt,
            processedAt: new Date().toISOString()
          };

          await finishAutomationRun(db, projectDoc.ref, runRef, {
            status: 'draft_created',
            now: new Date().toISOString(),
            observedCheckpoint: updatedCheckpoint as Record<string, unknown>,
            generatedCheckpoint: updatedCheckpoint as Record<string, unknown>,
          });

          isSuccess = true;
          processedCount++;
          void recordProductEvent(userDoc.id, 'automation_draft_generated', { status: 'draft_created', mode: 'automation' });
          console.log(`[Success] Automation draft created and checkpoint advanced for ${data.fullName}`);

        } catch (err: any) {
          console.error(`[Error] Automation error for ${data.fullName}:`, err instanceof Error ? err.name : 'unknown error');
          errors.push({ repo: data.fullName, error: 'Automation run failed.' });
          void recordProductEvent(userDoc.id, 'automation_failed', { status: 'failed', mode: 'automation' });
          await finishAutomationRun(db, projectDoc.ref, runRef, {
            status: 'failed',
            now: new Date().toISOString(),
            failureReason: safeAutomationFailureReason(err),
          }).catch(() => {});
        } finally {
          // Fallback test doubles and legacy adapters do not have a transactional run record.
          if (!isSuccess && !runRef) {
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
    console.error("Scheduled Automation Processor Failed:", error instanceof Error ? error.name : "unknown");
    return res.status(500).json({ error: "Scheduled Automation Processor Failed" });
  }
});

/**
 * Removes only expired operational records. User-authored drafts, projects,
 * settings, snapshots' current pointers, and private credentials are never
 * part of this job. Missing timestamps are retained by the policy module.
 */
router.post('/retention', async (req, res) => {
  if (!authorizeCron(req, res)) return;

  try {
    const db = getAdminFirestore();
    const now = new Date();
    let deleted = 0;
    let scanned = 0;

    const deleteExpired = async (snapshot: any, resource: RetentionResource) => {
      for (const doc of snapshot.docs || []) {
        scanned++;
        if (!isExpiredOperationalRecord(resource, doc.data() || {}, now, doc.id)) continue;
        await doc.ref.delete();
        deleted++;
      }
    };

    await deleteExpired(await db.collection('rate_limits').get(), 'rate_limits');
    const usersSnapshot = await db.collection('users').get();
    for (const userDoc of usersSnapshot.docs) {
      await deleteExpired(await userDoc.ref.collection('usageLedger').get(), 'usageLedger');
      await deleteExpired(await userDoc.ref.collection('productMetrics').get(), 'productMetrics');

      const projectsSnapshot = await userDoc.ref.collection('projects').get();
      for (const projectDoc of projectsSnapshot.docs) {
        await deleteExpired(await projectDoc.ref.collection('automationRuns').get(), 'automationRuns');
      }

      const repositoriesSnapshot = await userDoc.ref.collection('repositorySnapshots').get();
      for (const repositoryDoc of repositoriesSnapshot.docs) {
        await deleteExpired(await repositoryDoc.ref.collection('versions').get(), 'repositorySnapshotVersions');
      }
    }

    return res.json({ success: true, scanned, deleted, ranAt: now.toISOString() });
  } catch (error) {
    console.error('Retention cleanup failed:', error instanceof Error ? error.message : 'unknown error');
    return res.status(503).json({ error: 'Retention cleanup is temporarily unavailable.' });
  }
});

export default router;
